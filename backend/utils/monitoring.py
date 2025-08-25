"""
Monitoring and metrics system for production scalability
"""
import time
import asyncio
from typing import Dict, Any, Optional, List
from functools import wraps
import logging
from datetime import datetime, timedelta
from prometheus_client import Counter, Histogram, Gauge, start_http_server, generate_latest
import structlog
from utils.redis_client_simple import get_async_redis
import json
import os

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter(
    'podion_requests_total',
    'Total number of requests',
    ['method', 'endpoint', 'status_code', 'user_tier']
)

REQUEST_DURATION = Histogram(
    'podion_request_duration_seconds',
    'Request duration in seconds',
    ['method', 'endpoint', 'user_tier']
)

PROCESSING_DURATION = Histogram(
    'podion_processing_duration_seconds',
    'Processing duration in seconds',
    ['stage', 'user_tier']
)

ACTIVE_JOBS = Gauge(
    'podion_active_jobs',
    'Number of active processing jobs',
    ['queue', 'status']
)

API_CALLS = Counter(
    'podion_external_api_calls_total',
    'Total external API calls',
    ['service', 'status']
)

ERROR_COUNT = Counter(
    'podion_errors_total',
    'Total number of errors',
    ['error_type', 'endpoint', 'service']
)

QUEUE_SIZE = Gauge(
    'podion_queue_size',
    'Size of processing queues',
    ['queue', 'priority']
)

USER_ACTIVITY = Counter(
    'podion_user_activity_total',
    'User activity metrics',
    ['user_tier', 'action', 'workspace_id']
)

class MetricsCollector:
    """Centralized metrics collection and reporting"""
    
    def __init__(self):
        self.redis_client = None
        self.metrics_cache = {}
        self.cache_ttl = 60  # Cache metrics for 1 minute
        
    async def initialize(self):
        """Initialize Redis connection for metrics storage"""
        if not self.redis_client:
            self.redis_client = await get_async_redis()
    
    async def record_request_metrics(
        self,
        method: str,
        endpoint: str,
        status_code: int,
        duration: float,
        user_tier: str = "free_user",
        user_id: Optional[str] = None
    ):
        """Record request metrics"""
        REQUEST_COUNT.labels(
            method=method,
            endpoint=endpoint,
            status_code=status_code,
            user_tier=user_tier
        ).inc()
        
        REQUEST_DURATION.labels(
            method=method,
            endpoint=endpoint,
            user_tier=user_tier
        ).observe(duration)
        
        # Store detailed metrics in Redis for analytics
        await self.initialize()
        try:
            metrics_key = f"metrics:requests:{datetime.now().strftime('%Y%m%d%H')}"
            request_data = {
                "timestamp": time.time(),
                "method": method,
                "endpoint": endpoint,
                "status_code": status_code,
                "duration": duration,
                "user_tier": user_tier,
                "user_id": user_id
            }
            
            await self.redis_client.lpush(metrics_key, json.dumps(request_data))
            await self.redis_client.expire(metrics_key, 86400)  # Keep for 24 hours
            
        except Exception as e:
            logger.error("Failed to store request metrics", error=str(e))
    
    async def record_processing_metrics(
        self,
        stage: str,
        duration: float,
        user_tier: str = "free_user",
        success: bool = True,
        error_type: Optional[str] = None
    ):
        """Record processing stage metrics"""
        PROCESSING_DURATION.labels(
            stage=stage,
            user_tier=user_tier
        ).observe(duration)
        
        if not success and error_type:
            ERROR_COUNT.labels(
                error_type=error_type,
                endpoint=stage,
                service="processing"
            ).inc()
    
    async def record_api_call_metrics(
        self,
        service: str,
        success: bool,
        duration: float,
        error_type: Optional[str] = None
    ):
        """Record external API call metrics"""
        status = "success" if success else "error"
        API_CALLS.labels(service=service, status=status).inc()
        
        if not success and error_type:
            ERROR_COUNT.labels(
                error_type=error_type,
                endpoint="external_api",
                service=service
            ).inc()
    
    async def update_queue_metrics(self, queue_stats: Dict[str, Any]):
        """Update queue size metrics"""
        for queue_name, stats in queue_stats.items():
            if isinstance(stats, dict):
                for priority, size in stats.items():
                    QUEUE_SIZE.labels(queue=queue_name, priority=str(priority)).set(size)
            else:
                QUEUE_SIZE.labels(queue=queue_name, priority="default").set(stats)
    
    async def record_user_activity(
        self,
        user_tier: str,
        action: str,
        workspace_id: Optional[str] = None
    ):
        """Record user activity metrics"""
        USER_ACTIVITY.labels(
            user_tier=user_tier,
            action=action,
            workspace_id=workspace_id or "unknown"
        ).inc()
    
    async def get_system_health_metrics(self) -> Dict[str, Any]:
        """Get comprehensive system health metrics"""
        await self.initialize()
        
        try:
            # Get queue statistics
            from utils.job_queue import job_queue
            queue_stats = job_queue.get_queue_stats()
            
            # Get service health
            from utils.circuit_breaker import get_all_service_status
            service_status = await get_all_service_status()
            
            # Get Redis info
            redis_info = await self.redis_client.info()
            
            # Calculate error rates
            error_rate = await self._calculate_error_rate()
            
            # Get processing performance
            avg_processing_time = await self._get_average_processing_time()
            
            health_metrics = {
                "timestamp": datetime.utcnow().isoformat(),
                "system_health": {
                    "overall_status": "healthy" if error_rate < 0.05 else "degraded",
                    "error_rate": error_rate,
                    "avg_processing_time": avg_processing_time,
                },
                "queue_stats": queue_stats,
                "service_status": service_status,
                "redis_stats": {
                    "connected_clients": redis_info.get("connected_clients", 0),
                    "used_memory": redis_info.get("used_memory", 0),
                    "keyspace_hits": redis_info.get("keyspace_hits", 0),
                    "keyspace_misses": redis_info.get("keyspace_misses", 0),
                },
                "performance_metrics": {
                    "requests_per_minute": await self._get_requests_per_minute(),
                    "active_jobs": await self._get_active_jobs_count(),
                    "queue_processing_rate": await self._get_queue_processing_rate(),
                }
            }
            
            return health_metrics
            
        except Exception as e:
            logger.error("Failed to get system health metrics", error=str(e))
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e),
                "system_health": {"overall_status": "unknown"}
            }
    
    async def _calculate_error_rate(self) -> float:
        """Calculate recent error rate"""
        try:
            # Get error count from last hour
            current_hour = datetime.now().strftime('%Y%m%d%H')
            error_key = f"metrics:errors:{current_hour}"
            request_key = f"metrics:requests:{current_hour}"
            
            error_count = await self.redis_client.llen(error_key)
            request_count = await self.redis_client.llen(request_key)
            
            if request_count == 0:
                return 0.0
            
            return error_count / request_count
            
        except Exception:
            return 0.0
    
    async def _get_average_processing_time(self) -> float:
        """Get average processing time from recent requests"""
        try:
            current_hour = datetime.now().strftime('%Y%m%d%H')
            processing_key = f"metrics:processing:{current_hour}"
            
            processing_times = await self.redis_client.lrange(processing_key, 0, 100)
            if not processing_times:
                return 0.0
            
            times = [float(t) for t in processing_times if t.replace('.', '').isdigit()]
            return sum(times) / len(times) if times else 0.0
            
        except Exception:
            return 0.0
    
    async def _get_requests_per_minute(self) -> int:
        """Get requests per minute"""
        try:
            current_minute = datetime.now().strftime('%Y%m%d%H%M')
            request_key = f"metrics:requests_minute:{current_minute}"
            
            return await self.redis_client.llen(request_key)
            
        except Exception:
            return 0
    
    async def _get_active_jobs_count(self) -> int:
        """Get number of active jobs"""
        try:
            from utils.job_queue import job_queue
            stats = job_queue.get_queue_stats()
            return stats.get("active_tasks", 0)
            
        except Exception:
            return 0
    
    async def _get_queue_processing_rate(self) -> float:
        """Get queue processing rate (jobs per minute)"""
        try:
            current_minute = datetime.now().strftime('%Y%m%d%H%M')
            completed_key = f"metrics:completed_jobs:{current_minute}"
            
            return await self.redis_client.llen(completed_key)
            
        except Exception:
            return 0.0

# Global metrics collector
metrics_collector = MetricsCollector()

def monitor_performance(
    stage: Optional[str] = None,
    user_tier: str = "free_user",
    track_errors: bool = True
):
    """
    Decorator for monitoring function performance
    
    Args:
        stage: Processing stage name
        user_tier: User subscription tier
        track_errors: Whether to track errors
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            stage_name = stage or func.__name__
            success = True
            error_type = None
            
            try:
                result = await func(*args, **kwargs)
                return result
                
            except Exception as e:
                success = False
                error_type = type(e).__name__
                logger.error(
                    "Function execution failed",
                    function=func.__name__,
                    stage=stage_name,
                    error=str(e),
                    user_tier=user_tier
                )
                raise
                
            finally:
                duration = time.time() - start_time
                
                # Record metrics
                await metrics_collector.record_processing_metrics(
                    stage=stage_name,
                    duration=duration,
                    user_tier=user_tier,
                    success=success,
                    error_type=error_type
                )
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            stage_name = stage or func.__name__
            success = True
            error_type = None
            
            try:
                result = func(*args, **kwargs)
                return result
                
            except Exception as e:
                success = False
                error_type = type(e).__name__
                logger.error(
                    "Function execution failed",
                    function=func.__name__,
                    stage=stage_name,
                    error=str(e),
                    user_tier=user_tier
                )
                raise
                
            finally:
                duration = time.time() - start_time
                
                # Record metrics (sync version)
                asyncio.create_task(
                    metrics_collector.record_processing_metrics(
                        stage=stage_name,
                        duration=duration,
                        user_tier=user_tier,
                        success=success,
                        error_type=error_type
                    )
                )
        
        # Return appropriate wrapper
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
            
    return decorator

class AlertManager:
    """Alert manager for critical system events"""
    
    def __init__(self):
        self.alert_thresholds = {
            "error_rate": 0.05,  # 5% error rate
            "queue_size": 100,   # 100 jobs in queue
            "processing_time": 300,  # 5 minutes processing time
            "memory_usage": 0.85,    # 85% memory usage
        }
        self.alert_cooldown = 300  # 5 minutes between same alerts
        self.last_alerts = {}
    
    async def check_alerts(self, metrics: Dict[str, Any]):
        """Check if any alerts should be triggered"""
        current_time = time.time()
        
        # Check error rate
        error_rate = metrics.get("system_health", {}).get("error_rate", 0)
        if error_rate > self.alert_thresholds["error_rate"]:
            await self._send_alert(
                "high_error_rate",
                f"Error rate is {error_rate:.2%}, threshold: {self.alert_thresholds['error_rate']:.2%}",
                current_time
            )
        
        # Check queue size
        queue_stats = metrics.get("queue_stats", {})
        total_queued = queue_stats.get("active_tasks", 0) + queue_stats.get("scheduled_tasks", 0)
        if total_queued > self.alert_thresholds["queue_size"]:
            await self._send_alert(
                "high_queue_size",
                f"Queue size is {total_queued}, threshold: {self.alert_thresholds['queue_size']}",
                current_time
            )
        
        # Check processing time
        avg_processing_time = metrics.get("system_health", {}).get("avg_processing_time", 0)
        if avg_processing_time > self.alert_thresholds["processing_time"]:
            await self._send_alert(
                "slow_processing",
                f"Average processing time is {avg_processing_time:.1f}s, threshold: {self.alert_thresholds['processing_time']}s",
                current_time
            )
    
    async def _send_alert(self, alert_type: str, message: str, current_time: float):
        """Send alert if not in cooldown period"""
        last_alert_time = self.last_alerts.get(alert_type, 0)
        
        if current_time - last_alert_time > self.alert_cooldown:
            logger.critical(
                "System alert triggered",
                alert_type=alert_type,
                message=message,
                timestamp=datetime.utcnow().isoformat()
            )
            
            # Here you could integrate with external alerting systems
            # like Slack, PagerDuty, email, etc.
            
            self.last_alerts[alert_type] = current_time

# Global alert manager
alert_manager = AlertManager()

# Convenience functions
async def record_request_metrics(method: str, endpoint: str, status_code: int, duration: float, user_tier: str = "free_user"):
    """Record request metrics"""
    await metrics_collector.record_request_metrics(method, endpoint, status_code, duration, user_tier)

async def record_api_call_metrics(service: str, success: bool, duration: float, error_type: Optional[str] = None):
    """Record API call metrics"""
    await metrics_collector.record_api_call_metrics(service, success, duration, error_type)

async def get_system_health() -> Dict[str, Any]:
    """Get system health metrics"""
    return await metrics_collector.get_system_health_metrics()

def start_metrics_server(port: int = 8001):
    """Start Prometheus metrics server"""
    try:
        start_http_server(port)
        logger.info(f"Metrics server started on port {port}")
    except Exception as e:
        logger.error(f"Failed to start metrics server: {e}")

# Initialize metrics server if enabled
if os.getenv("ENABLE_METRICS_SERVER", "false").lower() == "true":
    metrics_port = int(os.getenv("METRICS_PORT", "8001"))
    start_metrics_server(metrics_port)
