"""
Caching Utility for Serviceflow Pro using Redis.
Provides simple get/set/delete interface for API caching.
"""
import json
from typing import Any, Optional, Union
import redis
from .config import settings
from .logging import get_logger

logger = get_logger("cache")

class CacheService:
    def __init__(self):
        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL, 
                decode_responses=True,
                socket_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            logger.info("Connected to Redis successfully", url=settings.REDIS_URL)
        except Exception as e:
            logger.error("Failed to connect to Redis", error=str(e))
            self.redis_client = None

    def get(self, key: str) -> Optional[Any]:
        """Retrieve data from cache."""
        if not self.redis_client:
            return None
        
        try:
            data = self.redis_client.get(key)
            if data:
                logger.debug("Cache hit", key=key)
                return json.loads(data)
            logger.debug("Cache miss", key=key)
            return None
        except Exception as e:
            logger.error("Error getting from cache", key=key, error=str(e))
            return None

    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Store data in cache with TTL (default 5 minutes)."""
        if not self.redis_client:
            return False
        
        try:
            serialized_value = json.dumps(value)
            self.redis_client.setex(key, ttl, serialized_value)
            logger.debug("Cache set", key=key, ttl=ttl)
            return True
        except Exception as e:
            logger.error("Error setting cache", key=key, error=str(e))
            return False

    def delete(self, key: str) -> bool:
        """Remove data from cache."""
        if not self.redis_client:
            return False
            
        try:
            self.redis_client.delete(key)
            logger.debug("Cache delete", key=key)
            return True
        except Exception as e:
            logger.error("Error deleting from cache", key=key, error=str(e))
            return False

# Singleton instance
cache = CacheService()
