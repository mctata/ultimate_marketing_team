import json
import time
import hashlib
import inspect
import functools
import logging
from typing import Any, Optional, Dict, Union, List, Callable, TypeVar, cast
from redis import Redis
from src.core.settings import settings

# Type definitions for function decorators
F = TypeVar('F', bound=Callable[..., Any])
T = TypeVar('T')

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


def generate_cache_key(func: Callable, args: tuple, kwargs: dict) -> str:
    """Generate a unique cache key based on function name and arguments."""
    # Get function module and name
    module = func.__module__
    name = func.__qualname__
    
    # Convert args and kwargs to strings for hashing
    args_str = ','.join(str(arg) for arg in args)
    kwargs_str = ','.join(f"{k}={v}" for k, v in sorted(kwargs.items()))
    
    # Create a unique key
    key_components = [module, name, args_str, kwargs_str]
    key_base = ':'.join(key_components)
    
    # Hash the key to ensure reasonable length
    key_hash = hashlib.md5(key_base.encode()).hexdigest()
    
    return f"cache:{name}:{key_hash}"


def cached(ttl: int = 3600) -> Callable[[F], F]:
    """
    Cache decorator for functions.
    
    Args:
        ttl: Time to live in seconds (default: 1 hour)
        
    Returns:
        Decorated function that caches results
    """
    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Handle cache busting with a special kwarg
            skip_cache = kwargs.pop('_skip_cache', False)
            
            # Generate unique cache key
            cache_key = generate_cache_key(func, args, kwargs)
            
            # Try to get from cache first if not skipping cache
            if not skip_cache:
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    return cached_result
            
            # Execute function if not in cache or skipping cache
            result = func(*args, **kwargs)
            
            # Cache the result
            if not skip_cache:
                try:
                    cache.set(cache_key, result, expire=ttl)
                except Exception as e:
                    logging.warning(f"Failed to cache result for {func.__name__}: {e}")
            
            return result
        
        # Add a method to invalidate cache for this function
        def invalidate_cache(*args: Any, **kwargs: Any) -> None:
            cache_key = generate_cache_key(func, args, kwargs)
            cache.delete(cache_key)
        
        wrapper.invalidate_cache = invalidate_cache  # type: ignore
        
        return cast(F, wrapper)
    
    return decorator


def method_cached(ttl: int = 3600) -> Callable[[F], F]:
    """
    Cache decorator for class methods.
    Same as @cached but skips the first argument (self) when generating cache key.
    
    Args:
        ttl: Time to live in seconds (default: 1 hour)
        
    Returns:
        Decorated method that caches results
    """
    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(self: Any, *args: Any, **kwargs: Any) -> Any:
            # Handle cache busting with a special kwarg
            skip_cache = kwargs.pop('_skip_cache', False)
            
            # Generate unique cache key (skipping self)
            cache_key = generate_cache_key(func, args, kwargs)
            
            # Try to get from cache first if not skipping cache
            if not skip_cache:
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    return cached_result
            
            # Execute function if not in cache or skipping cache
            result = func(self, *args, **kwargs)
            
            # Cache the result
            if not skip_cache:
                try:
                    cache.set(cache_key, result, expire=ttl)
                except Exception as e:
                    logging.warning(f"Failed to cache result for {func.__name__}: {e}")
            
            return result
        
        # Add a method to invalidate cache for this method
        def invalidate_cache(self: Any, *args: Any, **kwargs: Any) -> None:
            cache_key = generate_cache_key(func, args, kwargs)
            cache.delete(cache_key)
        
        wrapper.invalidate_cache = invalidate_cache  # type: ignore
        
        return cast(F, wrapper)
    
    return decorator


def bulk_invalidate_cache(pattern: str) -> int:
    """
    Invalidate all cache keys matching a pattern.
    
    Args:
        pattern: Redis key pattern (e.g., "cache:get_brands:*")
        
    Returns:
        Number of invalidated keys
    """
    keys = cache.client.keys(pattern)
    if keys:
        return cache.client.delete(*keys)
    return 0
