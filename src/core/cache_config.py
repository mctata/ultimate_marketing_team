"""
Redis cache configuration module for optimal Redis performance.

This module configures Redis with appropriate settings for production use.
It sets up memory limits, eviction policies, persistence, and performance optimizations.
"""

import logging
from typing import Dict, Any, Optional

from redis import Redis

from src.core.settings import settings

logger = logging.getLogger(__name__)

def configure_redis_instance(redis_client: Redis) -> bool:
    """
    Configure Redis instance with optimized settings.
    
    Args:
        redis_client: Redis client instance
        
    Returns:
        bool: True if configuration was successful
    """
    try:
        # Get Redis info to check if we can configure it
        info = redis_client.info()
        
        # Check if Redis version supports our commands
        redis_version = info.get('redis_version', '')
        if not redis_version:
            logger.warning("Could not determine Redis version, skipping configuration")
            return False
            
        version_parts = [int(x) for x in redis_version.split('.')]
        if version_parts[0] < 4:
            logger.warning(f"Redis version {redis_version} is too old for some optimizations")
            
        # Set memory limit if configured
        if settings.CACHE_MAX_MEMORY_MB > 0:
            redis_client.config_set('maxmemory', f"{settings.CACHE_MAX_MEMORY_MB}mb")
            
        # Set eviction policy
        redis_client.config_set('maxmemory-policy', settings.CACHE_EVICTION_POLICY)
        
        # Performance optimizations
        
        # 1. Disable AOF persistence for cache-only Redis (improves performance)
        # Only do this if we're using a dedicated Redis for caching
        if not settings.REDIS_PERSISTENCE_ENABLED:
            redis_client.config_set('appendonly', 'no')
        
        # 2. Optimize for speed if using Redis >= 5
        if version_parts[0] >= 5:
            # Set active defrag if we have enough memory
            if settings.CACHE_MAX_MEMORY_MB > 500:
                redis_client.config_set('activedefrag', 'yes')
            
            # Set lazy freeing for large objects
            redis_client.config_set('lazyfree-lazy-eviction', 'yes')
            redis_client.config_set('lazyfree-lazy-expire', 'yes')
            
        # 3. Set optimal client output buffer for our use case
        redis_client.config_set('client-output-buffer-limit', 'normal 0 0 0')
        
        # 4. Set faster key expiration checks
        redis_client.config_set('hz', '20')  # Increase from default 10
        
        # 5. Configure compression if enabled
        if settings.CACHE_ENABLE_COMPRESSION:
            try:
                # Only available in Redis 6+
                if version_parts[0] >= 6:
                    redis_client.config_set('compression-threshold', '5000')  # 5KB threshold
            except Exception as e:
                logger.warning(f"Could not configure compression: {e}")
        
        # Verify our configuration was applied
        new_config = {
            'maxmemory': redis_client.config_get('maxmemory').get('maxmemory', 'not set'),
            'maxmemory-policy': redis_client.config_get('maxmemory-policy').get('maxmemory-policy', 'not set'),
            'hz': redis_client.config_get('hz').get('hz', 'not set'),
        }
        
        logger.info(f"Redis configured successfully with: {new_config}")
        return True
    
    except Exception as e:
        logger.warning(f"Failed to configure Redis: {e}")
        return False


def get_redis_health() -> Dict[str, Any]:
    """
    Get Redis health metrics.
    
    Returns:
        Dict with health metrics
    """
    from src.core.cache import cache
    
    try:
        # Get Redis info
        info = cache.client.info()
        
        # Extract useful metrics
        used_memory = int(info.get('used_memory', 0))
        used_memory_peak = int(info.get('used_memory_peak', 0))
        memory_fragmentation_ratio = float(info.get('mem_fragmentation_ratio', 0))
        connected_clients = int(info.get('connected_clients', 0))
        blocked_clients = int(info.get('blocked_clients', 0))
        evicted_keys = int(info.get('evicted_keys', 0))
        expired_keys = int(info.get('expired_keys', 0))
        
        # Get hit rate metrics
        keyspace_hits = int(info.get('keyspace_hits', 0))
        keyspace_misses = int(info.get('keyspace_misses', 0))
        hit_rate = 0
        if (keyspace_hits + keyspace_misses) > 0:
            hit_rate = keyspace_hits / (keyspace_hits + keyspace_misses)
        
        # Calculate memory usage percentage if max memory is set
        memory_limit = info.get('maxmemory', 0)
        memory_usage_pct = 0
        if memory_limit and int(memory_limit) > 0:
            memory_usage_pct = (used_memory / int(memory_limit)) * 100
        
        return {
            'status': 'up',
            'memory': {
                'used_bytes': used_memory,
                'peak_bytes': used_memory_peak,
                'fragmentation_ratio': memory_fragmentation_ratio,
                'usage_percent': memory_usage_pct
            },
            'clients': {
                'connected': connected_clients,
                'blocked': blocked_clients
            },
            'keys': {
                'total': cache.client.dbsize(),
                'evicted': evicted_keys,
                'expired': expired_keys
            },
            'performance': {
                'hit_rate': hit_rate,
                'hits': keyspace_hits,
                'misses': keyspace_misses,
                'commands_processed': info.get('total_commands_processed', 0)
            },
            'uptime_seconds': info.get('uptime_in_seconds', 0)
        }
    except Exception as e:
        logger.error(f"Failed to get Redis health: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }


def setup_redis_cache():
    """Initialize and configure Redis cache on application startup."""
    from src.core.cache import cache
    
    try:
        # Test connection
        ping_response = cache.client.ping()
        if ping_response:
            logger.info("Redis connection successful")
            
            # Configure Redis
            configure_redis_instance(cache.client)
            
            # Register cache invalidation for models
            from src.core.cache_invalidation import register_common_models
            register_common_models()
            
            # Set default key prefixes
            cache._key_prefix = "umt:"
            cache._default_ttl = settings.CACHE_DEFAULT_TTL
            
            # Log Redis stats
            stats = get_redis_health()
            logger.info(f"Redis ready with hit rate: {stats['performance']['hit_rate']:.2f}, "
                        f"memory usage: {stats['memory']['used_bytes'] / (1024*1024):.2f}MB")
        else:
            logger.warning("Redis ping failed")
    except Exception as e:
        logger.error(f"Redis initialization failed: {e}")


def flush_all_caches():
    """Flush all caches - use with caution, only for maintenance or emergency."""
    from src.core.cache import cache
    
    try:
        # Get cache stats before flushing
        keys_before = cache.client.dbsize()
        
        # Flush the application namespace only
        keys_deleted = cache.clear()
        
        logger.warning(f"Cleared {keys_deleted} keys from Redis cache (out of {keys_before} total keys)")
        return True
    except Exception as e:
        logger.error(f"Failed to flush caches: {e}")
        return False