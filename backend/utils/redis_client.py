"""
Redis client configuration and connection pooling for scalability
"""
import os
import redis
from typing import Optional
import logging
from contextlib import asynccontextmanager

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    aioredis = None

logger = logging.getLogger(__name__)

class RedisClient:
    """Redis client with connection pooling for high-performance caching and job queues"""
    
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.pool: Optional[redis.ConnectionPool] = None
        self.async_pool: Optional[aioredis.ConnectionPool] = None
        self.client: Optional[redis.Redis] = None
        self.async_client: Optional[aioredis.Redis] = None
        
    def initialize_sync_client(self) -> redis.Redis:
        """Initialize synchronous Redis client with connection pooling"""
        try:
            self.pool = redis.ConnectionPool.from_url(
                self.redis_url,
                max_connections=20,  # Pool size for concurrent connections
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={},
                health_check_interval=30
            )
            
            self.client = redis.Redis(
                connection_pool=self.pool,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            
            # Test connection
            self.client.ping()
            logger.info("Redis sync client initialized successfully")
            return self.client
            
        except Exception as e:
            logger.error(f"Failed to initialize Redis sync client: {e}")
            # Return a mock client for development
            return self._get_mock_client()
    
    async def initialize_async_client(self) -> aioredis.Redis:
        """Initialize asynchronous Redis client with connection pooling"""
        try:
            self.async_pool = aioredis.ConnectionPool.from_url(
                self.redis_url,
                max_connections=20,
                retry_on_timeout=True,
                health_check_interval=30
            )
            
            self.async_client = aioredis.Redis(
                connection_pool=self.async_pool,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            
            # Test connection
            await self.async_client.ping()
            logger.info("Redis async client initialized successfully")
            return self.async_client
            
        except Exception as e:
            logger.error(f"Failed to initialize Redis async client: {e}")
            # Return a mock client for development
            return self._get_mock_async_client()
    
    def _get_mock_client(self) -> redis.Redis:
        """Mock Redis client for development when Redis is not available"""
        class MockRedis:
            def ping(self): return True
            def set(self, key, value, ex=None): return True
            def get(self, key): return None
            def delete(self, key): return True
            def exists(self, key): return False
            def incr(self, key): return 1
            def expire(self, key, time): return True
            def hset(self, name, mapping): return True
            def hget(self, name, key): return None
            def hgetall(self, name): return {}
            def lpush(self, name, *values): return len(values)
            def rpop(self, name): return None
            def llen(self, name): return 0
            
        logger.warning("Using mock Redis client - Redis server not available")
        return MockRedis()
    
    def _get_mock_async_client(self) -> aioredis.Redis:
        """Mock async Redis client for development when Redis is not available"""
        class MockAsyncRedis:
            async def ping(self): return True
            async def set(self, key, value, ex=None): return True
            async def get(self, key): return None
            async def delete(self, key): return True
            async def exists(self, key): return False
            async def incr(self, key): return 1
            async def expire(self, key, time): return True
            async def hset(self, name, mapping): return True
            async def hget(self, name, key): return None
            async def hgetall(self, name): return {}
            async def lpush(self, name, *values): return len(values)
            async def rpop(self, name): return None
            async def llen(self, name): return 0
            async def close(self): pass
            
        logger.warning("Using mock async Redis client - Redis server not available")
        return MockAsyncRedis()
    
    @asynccontextmanager
    async def get_async_client(self):
        """Context manager for async Redis client"""
        if not self.async_client:
            await self.initialize_async_client()
        try:
            yield self.async_client
        finally:
            # Connection is managed by pool, no need to close individual connections
            pass
    
    def get_sync_client(self) -> redis.Redis:
        """Get synchronous Redis client"""
        if not self.client:
            self.initialize_sync_client()
        return self.client
    
    async def close(self):
        """Close Redis connections"""
        if self.async_client:
            await self.async_client.close()
        if self.async_pool:
            await self.async_pool.disconnect()

# Global Redis client instance
redis_client = RedisClient()

# Convenience functions
def get_redis() -> redis.Redis:
    """Get synchronous Redis client"""
    return redis_client.get_sync_client()

async def get_async_redis() -> aioredis.Redis:
    """Get asynchronous Redis client"""
    if not redis_client.async_client:
        await redis_client.initialize_async_client()
    return redis_client.async_client
