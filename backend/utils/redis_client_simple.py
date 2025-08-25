"""
Simple Redis client configuration compatible with Python 3.12
"""
import os
import logging
from typing import Optional, Any, Dict
import asyncio
from contextlib import asynccontextmanager

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

logger = logging.getLogger(__name__)

class MockRedisClient:
    """Mock Redis client for development without Redis"""
    
    def __init__(self):
        self._data = {}
        logger.info("Using mock Redis client (Redis not available)")
    
    def get(self, key: str) -> Optional[str]:
        return self._data.get(key)
    
    def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        self._data[key] = value
        return True
    
    def setex(self, key: str, time: int, value: str) -> bool:
        self._data[key] = value
        return True
    
    def delete(self, *keys) -> int:
        count = 0
        for key in keys:
            if key in self._data:
                del self._data[key]
                count += 1
        return count
    
    def exists(self, key: str) -> int:
        return 1 if key in self._data else 0
    
    def keys(self, pattern: str = "*") -> list:
        return list(self._data.keys())
    
    def ping(self) -> bool:
        return True
    
    def lpush(self, key: str, *values) -> int:
        if key not in self._data:
            self._data[key] = []
        for value in values:
            self._data[key].insert(0, value)
        return len(self._data[key])
    
    def lrange(self, key: str, start: int, end: int) -> list:
        if key not in self._data:
            return []
        return self._data[key][start:end+1 if end != -1 else None]
    
    def llen(self, key: str) -> int:
        if key not in self._data:
            return 0
        return len(self._data[key])
    
    def expire(self, key: str, time: int) -> bool:
        return True
    
    def info(self) -> Dict[str, Any]:
        return {
            "connected_clients": 1,
            "used_memory": 1024,
            "keyspace_hits": 100,
            "keyspace_misses": 10
        }

class MockAsyncRedisClient:
    """Mock async Redis client for development without Redis"""
    
    def __init__(self):
        self._data = {}
        logger.info("Using mock async Redis client (Redis not available)")
    
    async def get(self, key: str) -> Optional[str]:
        return self._data.get(key)
    
    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        self._data[key] = value
        return True
    
    async def setex(self, key: str, time: int, value: str) -> bool:
        self._data[key] = value
        return True
    
    async def delete(self, *keys) -> int:
        count = 0
        for key in keys:
            if key in self._data:
                del self._data[key]
                count += 1
        return count
    
    async def exists(self, key: str) -> int:
        return 1 if key in self._data else 0
    
    async def keys(self, pattern: str = "*") -> list:
        return list(self._data.keys())
    
    async def ping(self) -> bool:
        return True
    
    async def lpush(self, key: str, *values) -> int:
        if key not in self._data:
            self._data[key] = []
        for value in values:
            self._data[key].insert(0, value)
        return len(self._data[key])
    
    async def lrange(self, key: str, start: int, end: int) -> list:
        if key not in self._data:
            return []
        return self._data[key][start:end+1 if end != -1 else None]
    
    async def llen(self, key: str) -> int:
        if key not in self._data:
            return 0
        return len(self._data[key])
    
    async def expire(self, key: str, time: int) -> bool:
        return True
    
    async def info(self) -> Dict[str, Any]:
        return {
            "connected_clients": 1,
            "used_memory": 1024,
            "keyspace_hits": 100,
            "keyspace_misses": 10
        }

class SimpleRedisClient:
    """Simple Redis client with basic functionality"""
    
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._sync_client = None
        self._async_client = None
        
    def get_sync_client(self):
        """Get synchronous Redis client"""
        if not REDIS_AVAILABLE:
            return MockRedisClient()
        
        if not self._sync_client:
            try:
                self._sync_client = redis.from_url(
                    self.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                # Test connection
                self._sync_client.ping()
                logger.info(f"Redis sync client connected to {self.redis_url}")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
                self._sync_client = MockRedisClient()
        
        return self._sync_client
    
    async def get_async_client(self):
        """Get asynchronous Redis client (mock for now)"""
        # For now, return mock client to avoid aioredis compatibility issues
        if not self._async_client:
            self._async_client = MockAsyncRedisClient()
        return self._async_client

# Global Redis client instance
redis_client = SimpleRedisClient()

# Convenience functions
def get_redis():
    """Get synchronous Redis client"""
    return redis_client.get_sync_client()

async def get_async_redis():
    """Get asynchronous Redis client"""
    return await redis_client.get_async_client()

@asynccontextmanager
async def async_redis_client():
    """Context manager for async Redis client"""
    client = await get_async_redis()
    try:
        yield client
    finally:
        # No cleanup needed for mock client
        pass
