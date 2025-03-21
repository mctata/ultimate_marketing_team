"""
Rate limiting implementation using token bucket algorithm.
"""

import time
import json
from typing import Dict, Any, Optional, Set, Tuple, List
from enum import Enum

from src.core.cache import RedisCache
from src.core.settings import settings


class RateLimitCategory(Enum):
    """Rate limit categories for different levels of protection."""
    
    # Regular API endpoints with basic limits
    DEFAULT = "default"
    
    # Authentication and security-related endpoints
    SECURITY = "security"
    
    # Sensitive data access endpoints
    SENSITIVE = "sensitive"
    
    # Public endpoints with more lenient limits
    PUBLIC = "public"
    
    # API endpoints used by our own frontend
    FRONTEND = "frontend"


class RateLimitViolation(Enum):
    """Types of rate limit violations for monitoring."""
    
    EXCEEDED_LIMIT = "exceeded_limit"
    BURST_TRAFFIC = "burst_traffic"
    IP_ROTATION = "ip_rotation"
    SUSPICIOUS_PATTERN = "suspicious_pattern"


class CircuitState(Enum):
    """Circuit breaker states."""
    
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Circuit is open, rejecting requests
    HALF_OPEN = "half_open"  # Testing if system has recovered


class TokenBucketRateLimiter:
    """
    Token bucket rate limiter implementation using Redis.
    
    The token bucket algorithm works as follows:
    - Each client has a bucket that holds tokens
    - Tokens are added to the bucket at a constant rate (refill_rate)
    - Each request consumes tokens from the bucket
    - If the bucket contains enough tokens, the request is allowed
    - If not, the request is rejected
    
    This implementation stores the following in Redis:
    - Last update time
    - Current token count
    - Additional metadata for rate limiting decisions
    """
    
    def __init__(
        self, 
        prefix: str = "ratelimit:"
    ):
        self.cache = RedisCache()
        self.prefix = prefix
        
        # Block list for IPs that have violated rate limits repeatedly
        self.block_list_key = f"{prefix}blocklist"
        
        # Circuit breaker state
        self.circuit_key = f"{prefix}circuit"
        
        # Initialize circuit breaker if not exists
        if not self.cache.exists(self.circuit_key):
            self._set_circuit_state(CircuitState.CLOSED)
        
        # Configure default rate limits
        self.default_limits = {
            RateLimitCategory.DEFAULT.value: {
                "tokens_per_interval": settings.RATE_LIMIT_MAX_REQUESTS,
                "interval_seconds": settings.RATE_LIMIT_WINDOW_MS // 1000,
                "burst_limit": settings.RATE_LIMIT_MAX_REQUESTS * 2,
                "cost_per_request": 1
            },
            RateLimitCategory.SECURITY.value: {
                "tokens_per_interval": 20,
                "interval_seconds": 60,
                "burst_limit": 30,
                "cost_per_request": 2
            },
            RateLimitCategory.SENSITIVE.value: {
                "tokens_per_interval": 50,
                "interval_seconds": 60,
                "burst_limit": 60,
                "cost_per_request": 1
            },
            RateLimitCategory.PUBLIC.value: {
                "tokens_per_interval": 200,
                "interval_seconds": 60,
                "burst_limit": 300,
                "cost_per_request": 1
            },
            RateLimitCategory.FRONTEND.value: {
                "tokens_per_interval": 300,
                "interval_seconds": 60,
                "burst_limit": 500,
                "cost_per_request": 1
            }
        }
        
        # Special endpoint costs for expensive operations
        self.endpoint_costs = {
            "/api/v1/content/generate": 5,
            "/api/v1/analytics/report/generate": 10,
            "/api/v1/users/bulk-import": 20,
            "/api/v1/content/upload-image": 3
        }
    
    def allow_request(
        self,
        key: str,
        category: RateLimitCategory = RateLimitCategory.DEFAULT,
        endpoint: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        ip_address: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if a request should be allowed based on rate limits.
        
        Args:
            key: The client identifier (typically IP address or API key)
            category: The rate limit category for this request
            endpoint: The API endpoint being accessed
            headers: Request headers for additional context
            ip_address: Client IP address for additional checks
            
        Returns:
            A tuple of (allowed, context) where allowed is a boolean and context
            contains information about the rate limiting decision
        """
        # Check if the IP is blocked
        if ip_address and self._is_ip_blocked(ip_address):
            return False, {
                "reason": "IP address blocked due to suspicious activity",
                "retry_after": 3600  # 1 hour
            }
        
        # Check circuit breaker state
        circuit_state = self._get_circuit_state()
        if circuit_state == CircuitState.OPEN:
            return False, {
                "reason": "Service protection circuit breaker engaged",
                "retry_after": 30  # 30 seconds
            }
        
        # Determine cost for this request
        cost = self._get_request_cost(category, endpoint)
        
        # Get rate limit parameters for this category
        limits = self.default_limits.get(
            category.value, 
            self.default_limits[RateLimitCategory.DEFAULT.value]
        )
        
        # Format the key with prefix and category
        cache_key = f"{self.prefix}{category.value}:{key}"
        
        # Get current time
        now = time.time()
        
        # Get current bucket state or create a new one
        bucket = self.cache.get(cache_key)
        if not bucket:
            # Initialize a new bucket
            bucket = {
                "tokens": limits["burst_limit"],  # Start with full bucket
                "last_update": now,
                "request_count": 0,
                "blocked_until": 0
            }
        else:
            # Convert from JSON if needed
            if isinstance(bucket, str):
                bucket = json.loads(bucket)
        
        # Check if request is temporarily blocked
        if bucket.get("blocked_until", 0) > now:
            retry_after = int(bucket["blocked_until"] - now)
            return False, {
                "reason": "Too many requests",
                "retry_after": retry_after
            }
        
        # Calculate token refill
        time_passed = now - bucket["last_update"]
        token_refill = time_passed * (limits["tokens_per_interval"] / limits["interval_seconds"])
        
        # Update token count
        new_token_count = min(
            bucket["tokens"] + token_refill,
            limits["burst_limit"]
        )
        
        # Check if bucket has enough tokens
        if new_token_count < cost:
            # Calculate when enough tokens will be available
            time_until_refill = (cost - new_token_count) * (
                limits["interval_seconds"] / limits["tokens_per_interval"]
            )
            retry_after = int(time_until_refill) + 1  # Round up
            
            # Update bucket with refilled tokens but don't consume
            bucket["tokens"] = new_token_count
            bucket["last_update"] = now
            
            # Check for suspicious patterns
            request_count = bucket.get("request_count", 0) + 1
            bucket["request_count"] = request_count
            
            # If client is repeatedly hitting limits, enforce a cooldown
            if request_count > limits["burst_limit"] * 2:
                # Block for progressively longer periods
                block_duration = min(60 * (2 ** ((request_count // limits["burst_limit"]) - 1)), 3600)
                bucket["blocked_until"] = now + block_duration
                
                # Log the violation for analysis
                self._record_violation(
                    key, 
                    ip_address,
                    RateLimitViolation.BURST_TRAFFIC,
                    {"request_count": request_count}
                )
                
                retry_after = block_duration
            
            # Save updated bucket
            self.cache.set(cache_key, bucket, expire=limits["interval_seconds"] * 2)
            
            return False, {
                "reason": "Rate limit exceeded",
                "retry_after": retry_after,
                "limit": limits["tokens_per_interval"],
                "remaining": 0,
                "reset": int(now + time_until_refill)
            }
        
        # Consume tokens and update bucket
        bucket["tokens"] = new_token_count - cost
        bucket["last_update"] = now
        bucket["request_count"] = bucket.get("request_count", 0) + 1
        
        # Save updated bucket
        self.cache.set(cache_key, bucket, expire=limits["interval_seconds"] * 2)
        
        # Return success with rate limit headers
        tokens_remaining = int(bucket["tokens"] // cost)
        return True, {
            "limit": limits["tokens_per_interval"],
            "remaining": tokens_remaining,
            "reset": int(now + (limits["burst_limit"] - bucket["tokens"]) * 
                       (limits["interval_seconds"] / limits["tokens_per_interval"]))
        }
    
    def _get_request_cost(
        self, 
        category: RateLimitCategory,
        endpoint: Optional[str]
    ) -> int:
        """Calculate the cost for a request based on endpoint and category."""
        # Base cost from category
        base_cost = self.default_limits.get(
            category.value, 
            self.default_limits[RateLimitCategory.DEFAULT.value]
        )["cost_per_request"]
        
        # Add endpoint-specific cost if applicable
        if endpoint and endpoint in self.endpoint_costs:
            return base_cost + self.endpoint_costs[endpoint]
        
        return base_cost
    
    def _is_ip_blocked(self, ip_address: str) -> bool:
        """Check if an IP address is blocked."""
        blocked_ips = self.cache.get(self.block_list_key) or []
        if isinstance(blocked_ips, str):
            blocked_ips = json.loads(blocked_ips)
        
        return ip_address in blocked_ips
    
    def block_ip(self, ip_address: str, duration: int = 3600) -> None:
        """
        Block an IP address for suspicious activity.
        
        Args:
            ip_address: The IP address to block
            duration: Duration to block in seconds (default: 1 hour)
        """
        blocked_ips = self.cache.get(self.block_list_key) or []
        if isinstance(blocked_ips, str):
            blocked_ips = json.loads(blocked_ips)
        
        if ip_address not in blocked_ips:
            blocked_ips.append(ip_address)
            self.cache.set(self.block_list_key, blocked_ips, expire=86400)  # 24-hour list
        
        # Set individual IP block with expiry
        self.cache.set(
            f"{self.prefix}block:{ip_address}", 
            {"blocked_at": time.time()},
            expire=duration
        )
    
    def unblock_ip(self, ip_address: str) -> bool:
        """
        Unblock an IP address.
        
        Args:
            ip_address: The IP address to unblock
            
        Returns:
            True if the IP was unblocked, False if it wasn't blocked
        """
        blocked_ips = self.cache.get(self.block_list_key) or []
        if isinstance(blocked_ips, str):
            blocked_ips = json.loads(blocked_ips)
        
        if ip_address in blocked_ips:
            blocked_ips.remove(ip_address)
            self.cache.set(self.block_list_key, blocked_ips, expire=86400)
            self.cache.delete(f"{self.prefix}block:{ip_address}")
            return True
        
        return False
    
    def _record_violation(
        self, 
        key: str, 
        ip_address: Optional[str],
        violation_type: RateLimitViolation,
        context: Dict[str, Any]
    ) -> None:
        """Record a rate limit violation for monitoring and analysis."""
        violation_key = f"{self.prefix}violations:{key}"
        
        violation_data = {
            "timestamp": time.time(),
            "type": violation_type.value,
            "ip": ip_address,
            "context": context
        }
        
        # Add to violations list with expiry
        self.cache.client.lpush(violation_key, json.dumps(violation_data))
        self.cache.client.ltrim(violation_key, 0, 99)  # Keep last 100 violations
        self.cache.expire(violation_key, 86400)  # 24-hour history
        
        # Increment violation counter
        count_key = f"{self.prefix}violation_count:{key}"
        count = self.cache.increment(count_key)
        self.cache.expire(count_key, 3600)  # 1-hour counter
        
        # If too many violations, block the IP
        if ip_address and count > 10:
            self.block_ip(ip_address)
            
            # Also update circuit breaker metrics
            self._increment_error_count()
    
    def _get_circuit_state(self) -> CircuitState:
        """Get the current circuit breaker state."""
        circuit_data = self.cache.get(self.circuit_key)
        if not circuit_data:
            return CircuitState.CLOSED
            
        if isinstance(circuit_data, str):
            circuit_data = json.loads(circuit_data)
            
        return CircuitState(circuit_data.get("state", CircuitState.CLOSED.value))
    
    def _set_circuit_state(self, state: CircuitState) -> None:
        """Set the circuit breaker state."""
        circuit_data = {
            "state": state.value,
            "updated_at": time.time(),
            "error_count": 0,
            "success_count": 0
        }
        self.cache.set(self.circuit_key, circuit_data, expire=86400)
    
    def _increment_error_count(self) -> None:
        """Increment the error count for circuit breaker evaluation."""
        circuit_data = self.cache.get(self.circuit_key)
        if not circuit_data:
            circuit_data = {
                "state": CircuitState.CLOSED.value,
                "updated_at": time.time(),
                "error_count": 0,
                "success_count": 0
            }
        
        if isinstance(circuit_data, str):
            circuit_data = json.loads(circuit_data)
        
        circuit_data["error_count"] = circuit_data.get("error_count", 0) + 1
        circuit_data["updated_at"] = time.time()
        
        # Update circuit breaker state based on error threshold
        if (circuit_data["state"] == CircuitState.CLOSED.value and 
                circuit_data["error_count"] >= settings.CIRCUIT_BREAKER_ERROR_THRESHOLD):
            circuit_data["state"] = CircuitState.OPEN.value
            circuit_data["tripped_at"] = time.time()
        
        self.cache.set(self.circuit_key, circuit_data, expire=86400)
    
    def _increment_success_count(self) -> None:
        """Increment the success count for circuit breaker evaluation."""
        circuit_data = self.cache.get(self.circuit_key)
        if not circuit_data:
            return
            
        if isinstance(circuit_data, str):
            circuit_data = json.loads(circuit_data)
        
        circuit_data["success_count"] = circuit_data.get("success_count", 0) + 1
        
        # If in half-open state and enough successes, close the circuit
        if (circuit_data["state"] == CircuitState.HALF_OPEN.value and 
                circuit_data["success_count"] >= settings.CIRCUIT_BREAKER_SUCCESS_THRESHOLD):
            circuit_data["state"] = CircuitState.CLOSED.value
            circuit_data["error_count"] = 0
            circuit_data["success_count"] = 0
        
        self.cache.set(self.circuit_key, circuit_data, expire=86400)
    
    def check_and_update_circuit_breaker(self) -> None:
        """Check and update circuit breaker state based on time elapsed."""
        circuit_data = self.cache.get(self.circuit_key)
        if not circuit_data:
            return
            
        if isinstance(circuit_data, str):
            circuit_data = json.loads(circuit_data)
            
        # If circuit is open and recovery timeout has elapsed, set to half-open
        if (circuit_data["state"] == CircuitState.OPEN.value and 
                time.time() - circuit_data.get("tripped_at", 0) > settings.CIRCUIT_BREAKER_TIMEOUT):
            circuit_data["state"] = CircuitState.HALF_OPEN.value
            circuit_data["success_count"] = 0
            circuit_data["updated_at"] = time.time()
            self.cache.set(self.circuit_key, circuit_data, expire=86400)
    
    def record_request_result(self, success: bool) -> None:
        """Record the result of a request for circuit breaker purposes."""
        if success:
            self._increment_success_count()
        else:
            self._increment_error_count()


# Create global instance
rate_limiter = TokenBucketRateLimiter()