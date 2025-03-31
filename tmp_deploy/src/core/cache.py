import json
import time
import hashlib
import inspect
import functools
import logging
from enum import Enum
from typing import Any, Optional, Dict, Union, List, Callable, TypeVar, cast, Set
from redis import Redis
from src.core.settings import settings

# Type definitions for function decorators
F = TypeVar('F', bound=Callable[..., Any])
T = TypeVar('T')

# Cache categories for better organization and invalidation
class CacheCategory(str, Enum):
    """Cache categories for organizing cached data."""
    CONTENT = "content"
    BRAND = "brand"
    PROJECT = "project"
    CAMPAIGN = "campaign"
    USER = "user"
    ANALYTICS = "analytics"
    INTEGRATION = "integration"
    TEMPLATE = "template"
    SYSTEM = "system"
    
    @classmethod
    def prefix(cls, category: 'CacheCategory', key: str) -> str:
        """Generate a prefixed cache key within a category."""
        return f"{category}:{key}"

class RedisCache:
    """Redis cache client for storing and retrieving data with enhanced functionality."""
    
    def __init__(self):
        self._client = None
        self._default_ttl = 3600  # Default TTL: 1 hour
        self._key_prefix = "umt:"  # Prefix for all keys in this application
        self._monitor_keys = set()  # Set to track keys for monitoring
    
    @property
    def client(self) -> Redis:
        """Get or create Redis client with connection pooling."""
        if self._client is None:
            # Parse connection pool settings from URL or use defaults
            self._client = Redis.from_url(
                str(settings.REDIS_URL),
                decode_responses=False,  # We'll handle decoding manually
                socket_timeout=5.0,      # Socket timeout in seconds
                socket_connect_timeout=3.0, # Connection timeout
                health_check_interval=30,  # Health check every 30 seconds
                retry_on_timeout=True,     # Retry on timeout
                max_connections=20         # Max connections in pool
            )
        return self._client
    
    def _prefix_key(self, key: str) -> str:
        """Add application prefix to all keys for namespace isolation."""
        if key.startswith(self._key_prefix):
            return key
        return f"{self._key_prefix}{key}"
    
    def get(self, key: str, default: Any = None) -> Optional[Any]:
        """Get a value from the cache with default fallback."""
        prefixed_key = self._prefix_key(key)
        try:
            value = self.client.get(prefixed_key)
            if value is None:
                return default
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value.decode()
        except Exception as e:
            logging.warning(f"Redis get error for key {key}: {e}")
            return default
    
    def set(
        self, key: str, value: Any, expire: Optional[int] = None, 
        nx: bool = False, xx: bool = False, keep_ttl: bool = False
    ) -> bool:
        """
        Set a value in the cache with enhanced options.
        
        Args:
            key: The cache key 
            value: The value to store
            expire: TTL in seconds
            nx: Only set if key doesn't exist
            xx: Only set if key already exists
            keep_ttl: Keep the existing TTL when updating value
            
        Returns:
            bool: Success status
        """
        prefixed_key = self._prefix_key(key)
        ttl = expire if expire is not None else self._default_ttl
        
        try:
            # Track this key for monitoring if requested
            if settings.CACHE_MONITORING_ENABLED:
                self._monitor_keys.add(prefixed_key)
            
            # Serialize the value if it's not already a string or bytes
            serialized = (
                json.dumps(value) 
                if not isinstance(value, (str, bytes)) 
                else value
            )
            
            # Set with options
            result = self.client.set(
                prefixed_key, 
                serialized,
                ex=ttl if not keep_ttl else None,
                nx=nx,
                xx=xx,
                keepttl=keep_ttl
            )
            return bool(result)
        except Exception as e:
            logging.warning(f"Redis set error for key {key}: {e}")
            return False
    
    def mget(self, keys: List[str]) -> List[Optional[Any]]:
        """Get multiple keys at once."""
        prefixed_keys = [self._prefix_key(key) for key in keys]
        try:
            values = self.client.mget(prefixed_keys)
            result = []
            for value in values:
                if value is None:
                    result.append(None)
                else:
                    try:
                        result.append(json.loads(value))
                    except json.JSONDecodeError:
                        result.append(value.decode())
            return result
        except Exception as e:
            logging.warning(f"Redis mget error: {e}")
            return [None] * len(keys)
    
    def mset(self, mapping: Dict[str, Any], expire: Optional[int] = None) -> bool:
        """Set multiple keys at once with optional expiry."""
        if not mapping:
            return True
            
        # Prefix all keys and serialize values
        serialized_mapping = {}
        for key, value in mapping.items():
            prefixed_key = self._prefix_key(key)
            serialized_value = (
                json.dumps(value) 
                if not isinstance(value, (str, bytes)) 
                else value
            )
            serialized_mapping[prefixed_key] = serialized_value
        
        try:
            # Set all keys
            result = self.client.mset(serialized_mapping)
            
            # Set expiry for each key if specified
            if expire is not None and result:
                pipeline = self.client.pipeline()
                for key in serialized_mapping.keys():
                    pipeline.expire(key, expire)
                pipeline.execute()
                
            return result
        except Exception as e:
            logging.warning(f"Redis mset error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete a key from the cache."""
        prefixed_key = self._prefix_key(key)
        try:
            result = self.client.delete(prefixed_key)
            return result > 0
        except Exception as e:
            logging.warning(f"Redis delete error for key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching a pattern."""
        prefixed_pattern = self._prefix_key(pattern)
        try:
            keys = self.client.keys(prefixed_pattern)
            if not keys:
                return 0
            return self.client.delete(*keys)
        except Exception as e:
            logging.warning(f"Redis delete_pattern error for pattern {pattern}: {e}")
            return 0
    
    def delete_category(self, category: CacheCategory) -> int:
        """Delete all keys in a specific category."""
        pattern = f"{self._prefix_key(category)}:*"
        return self.delete_pattern(pattern)
    
    def exists(self, key: str) -> bool:
        """Check if a key exists in the cache."""
        prefixed_key = self._prefix_key(key)
        try:
            return bool(self.client.exists(prefixed_key))
        except Exception as e:
            logging.warning(f"Redis exists error for key {key}: {e}")
            return False
    
    def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment a key in the cache."""
        prefixed_key = self._prefix_key(key)
        try:
            return self.client.incr(prefixed_key, amount)
        except Exception as e:
            logging.warning(f"Redis increment error for key {key}: {e}")
            return None
    
    def decrement(self, key: str, amount: int = 1) -> Optional[int]:
        """Decrement a key in the cache."""
        prefixed_key = self._prefix_key(key)
        try:
            return self.client.decr(prefixed_key, amount)
        except Exception as e:
            logging.warning(f"Redis decrement error for key {key}: {e}")
            return None
    
    def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on a key."""
        prefixed_key = self._prefix_key(key)
        try:
            return bool(self.client.expire(prefixed_key, seconds))
        except Exception as e:
            logging.warning(f"Redis expire error for key {key}: {e}")
            return False
    
    def ttl(self, key: str) -> int:
        """Get time to live for a key."""
        prefixed_key = self._prefix_key(key)
        try:
            return self.client.ttl(prefixed_key)
        except Exception as e:
            logging.warning(f"Redis ttl error for key {key}: {e}")
            return -1
    
    def clear(self) -> bool:
        """Clear all keys in this application's namespace."""
        try:
            keys = self.client.keys(f"{self._key_prefix}*")
            if keys:
                self.client.delete(*keys)
            return True
        except Exception as e:
            logging.warning(f"Redis clear error: {e}")
            return False
            
    def clear_all(self) -> bool:
        """Clear all keys in the database (use with caution)."""
        try:
            self.client.flushdb()
            return True
        except Exception as e:
            logging.warning(f"Redis flushdb error: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics and monitoring information."""
        try:
            info = self.client.info()
            keys_total = self.client.dbsize()
            keys_app = len(self.client.keys(f"{self._key_prefix}*"))
            
            # Get hit/miss stats if monitoring is enabled
            hits = 0
            misses = 0
            if settings.CACHE_MONITORING_ENABLED:
                hits = info.get('keyspace_hits', 0)
                misses = info.get('keyspace_misses', 0)
            
            return {
                "total_keys": keys_total,
                "app_keys": keys_app,
                "hits": hits,
                "misses": misses,
                "hit_ratio": hits / (hits + misses) if hits + misses > 0 else 0,
                "memory_used": info.get('used_memory_human', 'N/A'),
                "connected_clients": info.get('connected_clients', 0)
            }
        except Exception as e:
            logging.warning(f"Redis stats error: {e}")
            return {}


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


def generate_cache_key(
    func: Callable, 
    args: tuple, 
    kwargs: dict, 
    category: Optional[CacheCategory] = None,
    prefix: Optional[str] = None
) -> str:
    """
    Generate a unique cache key based on function name and arguments.
    
    Args:
        func: The function being cached
        args: Positional arguments
        kwargs: Keyword arguments
        category: Optional cache category for better organization
        prefix: Optional custom prefix
        
    Returns:
        A unique cache key string
    """
    # Get function module and name
    module = func.__module__
    name = func.__qualname__
    
    # Convert args and kwargs to strings for hashing
    # Handle common Python objects specially
    converted_args = []
    for arg in args:
        if hasattr(arg, 'id') and callable(getattr(arg, 'id', None)):
            # For objects with ID (like DB models)
            converted_args.append(f"{arg.__class__.__name__}:{arg.id}")
        else:
            converted_args.append(str(arg))
    
    args_str = ','.join(converted_args)
    
    # Sort kwargs for consistent ordering and handle special object types
    converted_kwargs = []
    for k, v in sorted(kwargs.items()):
        if hasattr(v, 'id') and callable(getattr(v, 'id', None)):
            # For objects with ID (like DB models)
            converted_kwargs.append(f"{k}={v.__class__.__name__}:{v.id}")
        else:
            converted_kwargs.append(f"{k}={v}")
    
    kwargs_str = ','.join(converted_kwargs)
    
    # Create a unique key
    key_components = [module, name, args_str, kwargs_str]
    key_base = ':'.join(key_components)
    
    # Hash the key to ensure reasonable length
    key_hash = hashlib.md5(key_base.encode()).hexdigest()
    
    # Build the final key with optional category and prefix
    if category:
        return f"{category}:{prefix or name}:{key_hash}"
    elif prefix:
        return f"cache:{prefix}:{key_hash}"
    else:
        return f"cache:{name}:{key_hash}"


def cached(
    ttl: int = 3600,
    category: Optional[CacheCategory] = None,
    key_prefix: Optional[str] = None,
    cache_null: bool = False,
    cache_falsey: bool = True,
    cache_errors: bool = False
) -> Callable[[F], F]:
    """
    Enhanced cache decorator for functions with better control options.
    
    Args:
        ttl: Time to live in seconds (default: 1 hour)
        category: Optional cache category for better organization
        key_prefix: Optional custom prefix for the key
        cache_null: Whether to cache None results (default: False)
        cache_falsey: Whether to cache falsey results like empty lists (default: True)
        cache_errors: Whether to cache error results (default: False)
        
    Returns:
        Decorated function that caches results
    """
    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Handle cache control kwargs
            skip_cache = kwargs.pop('_skip_cache', False)
            force_refresh = kwargs.pop('_force_refresh', False)
            local_ttl = kwargs.pop('_ttl', ttl)
            
            # Generate unique cache key
            cache_key = generate_cache_key(func, args, kwargs, category, key_prefix)
            
            # Try to get from cache first if not skipping cache
            if not skip_cache and not force_refresh:
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    # Check if this is a cached error or None
                    if isinstance(cached_result, dict) and '_cache_error' in cached_result:
                        if cache_errors:
                            error_class = cached_result.get('_error_class')
                            error_msg = cached_result.get('_error_message', 'Unknown error')
                            if error_class:
                                try:
                                    error_cls = __import__(error_class.rsplit('.', 1)[0], fromlist=[error_class.rsplit('.', 1)[1]])
                                    raise getattr(error_cls, error_class.rsplit('.', 1)[1])(error_msg)
                                except (ImportError, AttributeError):
                                    raise Exception(error_msg)
                            raise Exception(error_msg)
                    elif cached_result is None and not cache_null:
                        pass  # Don't return cached None if cache_null is False
                    elif not cached_result and not cache_falsey:
                        pass  # Don't return cached falsey value if cache_falsey is False
                    else:
                        return cached_result
            
            # Execute function if not in cache or skipping cache
            try:
                result = func(*args, **kwargs)
                
                # Cache the result based on settings
                if not skip_cache:
                    if result is None and not cache_null:
                        # Skip caching None results unless explicitly enabled
                        pass
                    elif not result and not cache_falsey:
                        # Skip caching falsey results unless explicitly enabled
                        pass
                    else:
                        try:
                            cache.set(cache_key, result, expire=local_ttl)
                        except Exception as e:
                            logging.warning(f"Failed to cache result for {func.__name__}: {e}")
                
                return result
                
            except Exception as e:
                if cache_errors:
                    # Cache the error if requested
                    error_data = {
                        '_cache_error': True,
                        '_error_class': f"{e.__class__.__module__}.{e.__class__.__name__}",
                        '_error_message': str(e),
                        '_error_raised_at': time.time()
                    }
                    try:
                        cache.set(cache_key, error_data, expire=local_ttl)
                    except Exception as ce:
                        logging.warning(f"Failed to cache error for {func.__name__}: {ce}")
                raise
        
        # Add methods to manipulate cache for this function
        def invalidate_cache(*args: Any, **kwargs: Any) -> bool:
            """Invalidate the cache for specific arguments."""
            cache_key = generate_cache_key(func, args, kwargs, category, key_prefix)
            return cache.delete(cache_key)
        
        def invalidate_all() -> int:
            """Invalidate all caches for this function regardless of arguments."""
            if category:
                pattern = f"{category}:{key_prefix or func.__qualname__}:*"
            else:
                pattern = f"cache:{key_prefix or func.__qualname__}:*"
            return cache.delete_pattern(pattern)
        
        def refresh_cache(*args: Any, **kwargs: Any) -> Any:
            """Force refresh the cache for specific arguments."""
            kwargs['_force_refresh'] = True
            return wrapper(*args, **kwargs)
        
        # Attach cache management methods to the wrapped function
        wrapper.invalidate_cache = invalidate_cache  # type: ignore
        wrapper.invalidate_all = invalidate_all  # type: ignore
        wrapper.refresh_cache = refresh_cache  # type: ignore
        
        return cast(F, wrapper)
    
    return decorator


def method_cached(
    ttl: int = 3600,
    category: Optional[CacheCategory] = None,
    key_prefix: Optional[str] = None,
    cache_null: bool = False,
    cache_falsey: bool = True,
    cache_errors: bool = False
) -> Callable[[F], F]:
    """
    Enhanced cache decorator for class methods.
    Same as @cached but handles 'self' parameter specially.
    
    Args:
        ttl: Time to live in seconds (default: 1 hour)
        category: Optional cache category for better organization
        key_prefix: Optional custom prefix for the key
        cache_null: Whether to cache None results (default: False)
        cache_falsey: Whether to cache falsey results like empty lists (default: True)
        cache_errors: Whether to cache error results (default: False)
        
    Returns:
        Decorated method that caches results with proper handling of self
    """
    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(self: Any, *args: Any, **kwargs: Any) -> Any:
            # Handle cache control kwargs
            skip_cache = kwargs.pop('_skip_cache', False)
            force_refresh = kwargs.pop('_force_refresh', False)
            local_ttl = kwargs.pop('_ttl', ttl)
            
            # Use class name and optional ID in the cache key
            class_key = self.__class__.__name__
            if hasattr(self, 'id') and self.id:
                class_key = f"{class_key}:{self.id}"
            
            # Generate unique cache key (with self info)
            custom_prefix = f"{key_prefix or class_key}.{func.__name__}"
            cache_key = generate_cache_key(func, args, kwargs, category, custom_prefix)
            
            # Try to get from cache first if not skipping cache
            if not skip_cache and not force_refresh:
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    # Check if this is a cached error or None
                    if isinstance(cached_result, dict) and '_cache_error' in cached_result:
                        if cache_errors:
                            error_class = cached_result.get('_error_class')
                            error_msg = cached_result.get('_error_message', 'Unknown error')
                            if error_class:
                                try:
                                    error_cls = __import__(error_class.rsplit('.', 1)[0], fromlist=[error_class.rsplit('.', 1)[1]])
                                    raise getattr(error_cls, error_class.rsplit('.', 1)[1])(error_msg)
                                except (ImportError, AttributeError):
                                    raise Exception(error_msg)
                            raise Exception(error_msg)
                    elif cached_result is None and not cache_null:
                        pass  # Don't return cached None if cache_null is False
                    elif not cached_result and not cache_falsey:
                        pass  # Don't return cached falsey value if cache_falsey is False
                    else:
                        return cached_result
            
            # Execute function if not in cache or skipping cache
            try:
                result = func(self, *args, **kwargs)
                
                # Cache the result based on settings
                if not skip_cache:
                    if result is None and not cache_null:
                        # Skip caching None results unless explicitly enabled
                        pass
                    elif not result and not cache_falsey:
                        # Skip caching falsey results unless explicitly enabled
                        pass
                    else:
                        try:
                            cache.set(cache_key, result, expire=local_ttl)
                        except Exception as e:
                            logging.warning(f"Failed to cache result for {func.__name__}: {e}")
                
                return result
                
            except Exception as e:
                if cache_errors:
                    # Cache the error if requested
                    error_data = {
                        '_cache_error': True,
                        '_error_class': f"{e.__class__.__module__}.{e.__class__.__name__}",
                        '_error_message': str(e),
                        '_error_raised_at': time.time()
                    }
                    try:
                        cache.set(cache_key, error_data, expire=local_ttl)
                    except Exception as ce:
                        logging.warning(f"Failed to cache error for {func.__name__}: {ce}")
                raise
        
        # Add methods to manipulate cache for this method
        def invalidate_cache(self: Any, *args: Any, **kwargs: Any) -> bool:
            """Invalidate the cache for specific arguments."""
            # Use class name and optional ID in the cache key
            class_key = self.__class__.__name__
            if hasattr(self, 'id') and self.id:
                class_key = f"{class_key}:{self.id}"
            
            custom_prefix = f"{key_prefix or class_key}.{func.__name__}"
            cache_key = generate_cache_key(func, args, kwargs, category, custom_prefix)
            return cache.delete(cache_key)
        
        def invalidate_all_for_instance(self: Any) -> int:
            """Invalidate all caches for this method on this instance."""
            class_key = self.__class__.__name__
            if hasattr(self, 'id') and self.id:
                class_key = f"{class_key}:{self.id}"
            
            custom_prefix = f"{key_prefix or class_key}.{func.__name__}"
            if category:
                pattern = f"{category}:{custom_prefix}:*"
            else:
                pattern = f"cache:{custom_prefix}:*"
            return cache.delete_pattern(pattern)
        
        def invalidate_all_for_class(cls: Any) -> int:
            """Invalidate all caches for this method across all instances of the class."""
            class_key = cls.__name__
            custom_prefix = f"{key_prefix or class_key}.{func.__name__}"
            if category:
                pattern = f"{category}:{custom_prefix}:*"
            else:
                pattern = f"cache:{custom_prefix}:*"
            return cache.delete_pattern(pattern)
        
        def refresh_cache(self: Any, *args: Any, **kwargs: Any) -> Any:
            """Force refresh the cache for specific arguments."""
            kwargs['_force_refresh'] = True
            return wrapper(self, *args, **kwargs)
        
        # Attach cache management methods to the wrapped function
        wrapper.invalidate_cache = invalidate_cache  # type: ignore
        wrapper.invalidate_all_for_instance = invalidate_all_for_instance  # type: ignore
        wrapper.invalidate_all_for_class = invalidate_all_for_class  # type: ignore
        wrapper.refresh_cache = refresh_cache  # type: ignore
        
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
    return cache.delete_pattern(pattern)


def invalidate_category(category: CacheCategory) -> int:
    """
    Invalidate all cache keys in a specific category.
    
    Args:
        category: The cache category to invalidate
        
    Returns:
        Number of invalidated keys
    """
    return cache.delete_category(category)
