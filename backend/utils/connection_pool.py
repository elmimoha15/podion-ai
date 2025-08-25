"""
Connection pooling and database optimization for high-concurrency operations
"""
import asyncio
import time
from typing import Dict, Any, Optional, List, AsyncContextManager
from contextlib import asynccontextmanager
import logging
from concurrent.futures import ThreadPoolExecutor
import httpx
from firebase_admin import firestore
import threading
from utils.redis_client_simple import get_async_redis

logger = logging.getLogger(__name__)

class MockFirestoreClient:
    """Mock Firestore client for development without Firebase"""
    
    def __init__(self):
        logger.info("Using mock Firestore client (Firebase not available)")
    
    def collection(self, name):
        return MockCollection()
    
    def batch(self):
        return MockBatch()

class MockCollection:
    """Mock Firestore collection"""
    
    def document(self, doc_id=None):
        return MockDocument(doc_id)
    
    def stream(self):
        return []
    
    def where(self, field, operator, value):
        return self
    
    def limit(self, count):
        return self

class MockDocument:
    """Mock Firestore document"""
    
    def __init__(self, doc_id=None):
        self.id = doc_id or "mock_doc_id"
    
    def get(self):
        return MockDocumentSnapshot()
    
    def create(self, data):
        return True
    
    def update(self, data):
        return True
    
    def delete(self):
        return True

class MockDocumentSnapshot:
    """Mock Firestore document snapshot"""
    
    def __init__(self):
        self.exists = False
    
    def to_dict(self):
        return {}

class MockBatch:
    """Mock Firestore batch"""
    
    def create(self, doc_ref, data):
        pass
    
    def update(self, doc_ref, data):
        pass
    
    def delete(self, doc_ref):
        pass
    
    def commit(self):
        pass

class HTTPConnectionPool:
    """HTTP connection pool for external API calls"""
    
    def __init__(self):
        self.pools = {}
        self.pool_configs = {
            "deepgram": {
                "limits": httpx.Limits(max_keepalive_connections=20, max_connections=100),
                "timeout": httpx.Timeout(30.0, connect=10.0),
                "base_url": "https://api.deepgram.com"
            },
            "gemini": {
                "limits": httpx.Limits(max_keepalive_connections=10, max_connections=50),
                "timeout": httpx.Timeout(60.0, connect=15.0),
                "base_url": "https://generativelanguage.googleapis.com"
            },
            "firebase": {
                "limits": httpx.Limits(max_keepalive_connections=30, max_connections=150),
                "timeout": httpx.Timeout(30.0, connect=10.0),
                "base_url": "https://firestore.googleapis.com"
            }
        }
        
    def get_client(self, service: str) -> httpx.AsyncClient:
        """Get or create HTTP client for service"""
        if service not in self.pools:
            config = self.pool_configs.get(service, self.pool_configs["firebase"])
            
            self.pools[service] = httpx.AsyncClient(
                limits=config["limits"],
                timeout=config["timeout"],
                http2=True,  # Enable HTTP/2 for better performance
                verify=True,
                follow_redirects=True
            )
            
            logger.info(f"Created HTTP connection pool for {service}")
        
        return self.pools[service]
    
    async def close_all(self):
        """Close all connection pools"""
        for service, client in self.pools.items():
            await client.aclose()
            logger.info(f"Closed HTTP connection pool for {service}")
        
        self.pools.clear()

class FirestoreConnectionPool:
    """Firestore connection pool with optimized batch operations"""
    
    def __init__(self):
        self.db = None  # Initialize lazily
        self.batch_size = 500  # Firestore batch limit
        self.write_executor = ThreadPoolExecutor(max_workers=10, thread_name_prefix="firestore_write")
        self.read_executor = ThreadPoolExecutor(max_workers=20, thread_name_prefix="firestore_read")
        self._connection_cache = {}
        self._cache_lock = threading.Lock()
        
    def _get_db(self):
        """Get Firestore client with lazy initialization"""
        if self.db is None:
            try:
                self.db = firestore.client()
            except Exception as e:
                logger.error(f"Failed to initialize Firestore client: {e}")
                # Return a mock client for development
                self.db = MockFirestoreClient()
        return self.db
        
    async def batch_write(self, operations: List[Dict[str, Any]]) -> List[str]:
        """
        Perform batch write operations to Firestore
        
        Args:
            operations: List of write operations
            
        Returns:
            List of document IDs
        """
        document_ids = []
        
        # Split operations into batches
        for i in range(0, len(operations), self.batch_size):
            batch_ops = operations[i:i + self.batch_size]
            batch_ids = await self._execute_batch_write(batch_ops)
            document_ids.extend(batch_ids)
        
        return document_ids
    
    async def _execute_batch_write(self, operations: List[Dict[str, Any]]) -> List[str]:
        """Execute a single batch write"""
        loop = asyncio.get_event_loop()
        
        def _write_batch():
            db = self._get_db()
            batch = db.batch()
            doc_ids = []
            
            for op in operations:
                op_type = op.get("type")
                collection = op.get("collection")
                doc_id = op.get("doc_id")
                data = op.get("data", {})
                
                if op_type == "create":
                    doc_ref = db.collection(collection).document(doc_id) if doc_id else db.collection(collection).document()
                    batch.create(doc_ref, data)
                    doc_ids.append(doc_ref.id)
                    
                elif op_type == "update":
                    doc_ref = db.collection(collection).document(doc_id)
                    batch.update(doc_ref, data)
                    doc_ids.append(doc_id)
                    
                elif op_type == "delete":
                    doc_ref = db.collection(collection).document(doc_id)
                    batch.delete(doc_ref)
                    doc_ids.append(doc_id)
            
            batch.commit()
            return doc_ids
        
        return await loop.run_in_executor(self.write_executor, _write_batch)
    
    async def batch_read(self, queries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Perform batch read operations from Firestore
        
        Args:
            queries: List of query specifications
            
        Returns:
            List of query results
        """
        loop = asyncio.get_event_loop()
        
        def _read_batch():
            db = self._get_db()
            results = []
            
            for query in queries:
                collection = query.get("collection")
                doc_id = query.get("doc_id")
                filters = query.get("filters", [])
                limit = query.get("limit")
                
                if doc_id:
                    # Single document read
                    doc_ref = db.collection(collection).document(doc_id)
                    doc = doc_ref.get()
                    if doc.exists:
                        data = doc.to_dict()
                        data["id"] = doc.id
                        results.append(data)
                    else:
                        results.append(None)
                else:
                    # Collection query
                    query_ref = db.collection(collection)
                    
                    # Apply filters
                    for filter_spec in filters:
                        field = filter_spec.get("field")
                        operator = filter_spec.get("operator")
                        value = filter_spec.get("value")
                        query_ref = query_ref.where(field, operator, value)
                    
                    # Apply limit
                    if limit:
                        query_ref = query_ref.limit(limit)
                    
                    # Execute query
                    docs = query_ref.stream()
                    query_results = []
                    for doc in docs:
                        data = doc.to_dict()
                        data["id"] = doc.id
                        query_results.append(data)
                    
                    results.append(query_results)
            
            return results
        
        return await loop.run_in_executor(self.read_executor, _read_batch)
    
    async def optimized_podcast_save(self, podcast_data: Dict[str, Any]) -> str:
        """
        Optimized podcast save with connection reuse
        
        Args:
            podcast_data: Podcast data to save
            
        Returns:
            Document ID
        """
        loop = asyncio.get_event_loop()
        
        def _save_podcast():
            db = self._get_db()
            # Use cached connection if available
            with self._cache_lock:
                if "podcasts" not in self._connection_cache:
                    self._connection_cache["podcasts"] = db.collection("podcasts")
                
                collection_ref = self._connection_cache["podcasts"]
            
            # Create document
            doc_ref = collection_ref.document()
            doc_ref.create(podcast_data)
            
            return doc_ref.id
        
        return await loop.run_in_executor(self.write_executor, _save_podcast)
    
    def close(self):
        """Close connection pool"""
        self.write_executor.shutdown(wait=True)
        self.read_executor.shutdown(wait=True)
        logger.info("Closed Firestore connection pool")

class CacheManager:
    """Advanced caching manager with Redis backend"""
    
    def __init__(self):
        self.redis_client = None
        self.cache_ttl = {
            "user_data": 300,      # 5 minutes
            "workspace_data": 600,  # 10 minutes
            "podcast_metadata": 1800,  # 30 minutes
            "api_responses": 3600,  # 1 hour
            "system_config": 7200,  # 2 hours
        }
        
    async def initialize(self):
        """Initialize Redis connection"""
        if not self.redis_client:
            self.redis_client = await get_async_redis()
    
    async def get(self, key: str, cache_type: str = "default") -> Optional[Any]:
        """Get value from cache"""
        await self.initialize()
        
        try:
            cached_value = await self.redis_client.get(f"cache:{cache_type}:{key}")
            if cached_value:
                import json
                return json.loads(cached_value)
            return None
            
        except Exception as e:
            logger.error(f"Cache get failed for {key}: {e}")
            return None
    
    async def set(self, key: str, value: Any, cache_type: str = "default", ttl: Optional[int] = None) -> bool:
        """Set value in cache"""
        await self.initialize()
        
        try:
            import json
            cache_key = f"cache:{cache_type}:{key}"
            serialized_value = json.dumps(value, default=str)
            
            ttl_seconds = ttl or self.cache_ttl.get(cache_type, 300)
            
            await self.redis_client.setex(cache_key, ttl_seconds, serialized_value)
            return True
            
        except Exception as e:
            logger.error(f"Cache set failed for {key}: {e}")
            return False
    
    async def delete(self, key: str, cache_type: str = "default") -> bool:
        """Delete value from cache"""
        await self.initialize()
        
        try:
            cache_key = f"cache:{cache_type}:{key}"
            result = await self.redis_client.delete(cache_key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Cache delete failed for {key}: {e}")
            return False
    
    async def clear_cache_type(self, cache_type: str) -> int:
        """Clear all cache entries of a specific type"""
        await self.initialize()
        
        try:
            pattern = f"cache:{cache_type}:*"
            keys = await self.redis_client.keys(pattern)
            
            if keys:
                return await self.redis_client.delete(*keys)
            return 0
            
        except Exception as e:
            logger.error(f"Cache clear failed for type {cache_type}: {e}")
            return 0
    
    @asynccontextmanager
    async def cached_operation(self, key: str, cache_type: str = "default", ttl: Optional[int] = None):
        """Context manager for cached operations"""
        # Try to get from cache first
        cached_result = await self.get(key, cache_type)
        if cached_result is not None:
            yield cached_result
            return
        
        # If not in cache, execute operation and cache result
        class CacheContext:
            def __init__(self, cache_manager, cache_key, cache_type, ttl):
                self.cache_manager = cache_manager
                self.cache_key = cache_key
                self.cache_type = cache_type
                self.ttl = ttl
                self.result = None
            
            async def set_result(self, result):
                self.result = result
                await self.cache_manager.set(self.cache_key, result, self.cache_type, self.ttl)
        
        context = CacheContext(self, key, cache_type, ttl)
        yield context

class ConnectionManager:
    """Main connection manager coordinating all pools"""
    
    def __init__(self):
        self.http_pool = HTTPConnectionPool()
        self.firestore_pool = FirestoreConnectionPool()
        self.cache_manager = CacheManager()
        self._initialized = False
        
    async def initialize(self):
        """Initialize all connection pools"""
        if not self._initialized:
            await self.cache_manager.initialize()
            self._initialized = True
            logger.info("Connection manager initialized")
    
    async def get_http_client(self, service: str) -> httpx.AsyncClient:
        """Get HTTP client for service"""
        await self.initialize()
        return self.http_pool.get_client(service)
    
    async def batch_firestore_write(self, operations: List[Dict[str, Any]]) -> List[str]:
        """Batch write to Firestore"""
        await self.initialize()
        return await self.firestore_pool.batch_write(operations)
    
    async def batch_firestore_read(self, queries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Batch read from Firestore"""
        await self.initialize()
        return await self.firestore_pool.batch_read(queries)
    
    async def cached_get(self, key: str, cache_type: str = "default") -> Optional[Any]:
        """Get from cache"""
        await self.initialize()
        return await self.cache_manager.get(key, cache_type)
    
    async def cached_set(self, key: str, value: Any, cache_type: str = "default", ttl: Optional[int] = None) -> bool:
        """Set in cache"""
        await self.initialize()
        return await self.cache_manager.set(key, value, cache_type, ttl)
    
    @asynccontextmanager
    async def cached_operation(self, key: str, cache_type: str = "default", ttl: Optional[int] = None):
        """Cached operation context manager"""
        await self.initialize()
        async with self.cache_manager.cached_operation(key, cache_type, ttl) as context:
            yield context
    
    async def close(self):
        """Close all connections"""
        await self.http_pool.close_all()
        self.firestore_pool.close()
        logger.info("All connection pools closed")

# Global connection manager
connection_manager = ConnectionManager()

# Convenience functions
async def get_http_client(service: str) -> httpx.AsyncClient:
    """Get HTTP client for service"""
    return await connection_manager.get_http_client(service)

async def batch_write_firestore(operations: List[Dict[str, Any]]) -> List[str]:
    """Batch write to Firestore"""
    return await connection_manager.batch_firestore_write(operations)

async def batch_read_firestore(queries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Batch read from Firestore"""
    return await connection_manager.batch_firestore_read(queries)

async def get_cached(key: str, cache_type: str = "default") -> Optional[Any]:
    """Get from cache"""
    return await connection_manager.cached_get(key, cache_type)

async def set_cached(key: str, value: Any, cache_type: str = "default", ttl: Optional[int] = None) -> bool:
    """Set in cache"""
    return await connection_manager.cached_set(key, value, cache_type, ttl)

@asynccontextmanager
async def cached_operation(key: str, cache_type: str = "default", ttl: Optional[int] = None):
    """Cached operation context manager"""
    async with connection_manager.cached_operation(key, cache_type, ttl) as context:
        yield context
