import json
import time
from typing import Any, Optional, Dict, Union, List
from redis import Redis
from src.ultimate_marketing_team.core.settings import settings

class RedisCache:
    """Redis cache client for storing and retrieving data."""
    
    def __init__(self):
        self._client = None
    
    @property
    def client(self) -> Redis:
        """Get or create Redis client."""
        if self._client is None:
            self._client = Redis.from_url(str(settings.REDIS_URL))
        return self._client
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache."""
        value = self.client.get(key)
        if value is None:
            return None
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value.decode()
    
    def set(
        self, key: str, value: Any, expire: Optional[int] = None
    ) -> None:
        """Set a value in the cache with optional expiration."""
        serialized = json.dumps(value) if not isinstance(value, (str, bytes)) else value
        if expire is not None:
            self.client.setex(key, expire, serialized)
        else:
            self.client.set(key, serialized)
    
    def delete(self, key: str) -> None:
        """Delete a key from the cache."""
        self.client.delete(key)
    
    def exists(self, key: str) -> bool:
        """Check if a key exists in the cache."""
        return bool(self.client.exists(key))
    
    def increment(self, key: str, amount: int = 1) -> int:
        """Increment a key in the cache."""
        return self.client.incr(key, amount)
    
    def decrement(self, key: str, amount: int = 1) -> int:
        """Decrement a key in the cache."""
        return self.client.decr(key, amount)
    
    def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on a key."""
        return bool(self.client.expire(key, seconds))
    
    def ttl(self, key: str) -> int:
        """Get time to live for a key."""
        return self.client.ttl(key)
    
    def clear(self) -> None:
        """Clear all keys in the cache."""
        self.client.flushdb()


class RateLimiter:
    """Rate limiter implementation using Redis."""
    
    def __init__(self, prefix: str = "ratelimit:"):
        self.cache = RedisCache()
        self.prefix = prefix
    
    def is_rate_limited(
        self, key: str, max_requests: int, window_seconds: int
    ) -> bool:
        """Check if a key is rate limited.
        
        Args:
            key: The key to check
            max_requests: Maximum number of requests allowed
            window_seconds: Time window in seconds
            
        Returns:
            True if rate limited, False otherwise
        """
        cache_key = f"{self.prefix}{key}"
        current_time = int(time.time())
        window_start_time = current_time - window_seconds
        
        # Add current timestamp to sorted set
        self.cache.client.zadd(cache_key, {str(current_time): current_time})
        
        # Remove timestamps outside the window
        self.cache.client.zremrangebyscore(cache_key, 0, window_start_time)
        
        # Set expiry on the sorted set
        self.cache.expire(cache_key, window_seconds * 2)
        
        # Count requests in the current window
        request_count = self.cache.client.zcard(cache_key)
        
        return request_count > max_requests


# Create global instances
cache = RedisCache()
rate_limiter = RateLimiter()
