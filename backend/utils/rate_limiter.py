"""
Rate limiting and throttling system for API endpoints
"""
import os
import time
from typing import Dict, Any, Optional, Callable
from functools import wraps
import asyncio
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException, status
from utils.redis_client import get_redis, get_async_redis
import logging

logger = logging.getLogger(__name__)

# Rate limiter configuration
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    default_limits=["1000/day", "100/hour", "10/minute"]
)

class AdvancedRateLimiter:
    """Advanced rate limiter with user-based limits, burst handling, and priority queues"""
    
    def __init__(self):
        self.redis_client = None
        self.default_limits = {
            "free_user": {"requests_per_minute": 5, "requests_per_hour": 50, "requests_per_day": 200},
            "premium_user": {"requests_per_minute": 20, "requests_per_hour": 500, "requests_per_day": 2000},
            "enterprise_user": {"requests_per_minute": 100, "requests_per_hour": 2000, "requests_per_day": 10000},
            "admin": {"requests_per_minute": 1000, "requests_per_hour": 10000, "requests_per_day": 50000}
        }
        
    async def initialize(self):
        """Initialize Redis connection"""
        if not self.redis_client:
            self.redis_client = await get_async_redis()
    
    async def check_rate_limit(
        self, 
        user_id: str, 
        endpoint: str, 
        user_tier: str = "free_user",
        request_weight: int = 1
    ) -> Dict[str, Any]:
        """
        Check if request is within rate limits
        
        Args:
            user_id: User identifier
            endpoint: API endpoint
            user_tier: User subscription tier
            request_weight: Request complexity weight (1-10)
            
        Returns:
            Rate limit status information
        """
        await self.initialize()
        
        try:
            current_time = int(time.time())
            limits = self.default_limits.get(user_tier, self.default_limits["free_user"])
            
            # Create Redis keys for different time windows
            minute_key = f"rate_limit:{user_id}:{endpoint}:minute:{current_time // 60}"
            hour_key = f"rate_limit:{user_id}:{endpoint}:hour:{current_time // 3600}"
            day_key = f"rate_limit:{user_id}:{endpoint}:day:{current_time // 86400}"
            
            # Check current usage
            minute_count = await self.redis_client.get(minute_key) or 0
            hour_count = await self.redis_client.get(hour_key) or 0
            day_count = await self.redis_client.get(day_key) or 0
            
            minute_count = int(minute_count)
            hour_count = int(hour_count)
            day_count = int(day_count)
            
            # Apply request weight
            weighted_request = request_weight
            
            # Check limits
            if minute_count + weighted_request > limits["requests_per_minute"]:
                return {
                    "allowed": False,
                    "limit_type": "minute",
                    "current_usage": minute_count,
                    "limit": limits["requests_per_minute"],
                    "reset_time": (current_time // 60 + 1) * 60,
                    "retry_after": 60 - (current_time % 60)
                }
            
            if hour_count + weighted_request > limits["requests_per_hour"]:
                return {
                    "allowed": False,
                    "limit_type": "hour",
                    "current_usage": hour_count,
                    "limit": limits["requests_per_hour"],
                    "reset_time": (current_time // 3600 + 1) * 3600,
                    "retry_after": 3600 - (current_time % 3600)
                }
            
            if day_count + weighted_request > limits["requests_per_day"]:
                return {
                    "allowed": False,
                    "limit_type": "day",
                    "current_usage": day_count,
                    "limit": limits["requests_per_day"],
                    "reset_time": (current_time // 86400 + 1) * 86400,
                    "retry_after": 86400 - (current_time % 86400)
                }
            
            # Increment counters
            pipe = self.redis_client.pipeline()
            pipe.incr(minute_key, weighted_request)
            pipe.expire(minute_key, 60)
            pipe.incr(hour_key, weighted_request)
            pipe.expire(hour_key, 3600)
            pipe.incr(day_key, weighted_request)
            pipe.expire(day_key, 86400)
            await pipe.execute()
            
            return {
                "allowed": True,
                "current_usage": {
                    "minute": minute_count + weighted_request,
                    "hour": hour_count + weighted_request,
                    "day": day_count + weighted_request
                },
                "limits": limits,
                "remaining": {
                    "minute": limits["requests_per_minute"] - (minute_count + weighted_request),
                    "hour": limits["requests_per_hour"] - (hour_count + weighted_request),
                    "day": limits["requests_per_day"] - (day_count + weighted_request)
                }
            }
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            # Allow request on Redis failure (fail open)
            return {"allowed": True, "error": str(e)}
    
    async def add_to_priority_queue(
        self, 
        user_id: str, 
        request_data: Dict[str, Any], 
        priority: int = 5
    ) -> str:
        """
        Add request to priority queue when rate limited
        
        Args:
            user_id: User identifier
            request_data: Request data to queue
            priority: Priority level (0-9, lower = higher priority)
            
        Returns:
            Queue position identifier
        """
        await self.initialize()
        
        try:
            queue_key = f"priority_queue:{priority}"
            request_id = f"{user_id}:{int(time.time() * 1000)}"
            
            # Add to priority queue
            await self.redis_client.lpush(queue_key, request_id)
            
            # Store request data
            data_key = f"queue_data:{request_id}"
            await self.redis_client.hset(data_key, mapping={
                "user_id": user_id,
                "request_data": str(request_data),
                "queued_at": int(time.time()),
                "priority": priority
            })
            await self.redis_client.expire(data_key, 3600)  # Expire after 1 hour
            
            # Get queue position
            queue_length = await self.redis_client.llen(queue_key)
            
            logger.info(f"Added request {request_id} to priority queue {priority}, position: {queue_length}")
            
            return request_id
            
        except Exception as e:
            logger.error(f"Failed to add to priority queue: {e}")
            raise
    
    async def process_priority_queue(self, priority: int = 5) -> Optional[Dict[str, Any]]:
        """
        Process next request from priority queue
        
        Args:
            priority: Priority level to process
            
        Returns:
            Request data or None if queue is empty
        """
        await self.initialize()
        
        try:
            queue_key = f"priority_queue:{priority}"
            request_id = await self.redis_client.rpop(queue_key)
            
            if not request_id:
                return None
            
            # Get request data
            data_key = f"queue_data:{request_id}"
            request_data = await self.redis_client.hgetall(data_key)
            
            if request_data:
                await self.redis_client.delete(data_key)
                return {
                    "request_id": request_id,
                    "user_id": request_data.get("user_id"),
                    "request_data": request_data.get("request_data"),
                    "queued_at": int(request_data.get("queued_at", 0)),
                    "priority": int(request_data.get("priority", 5))
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to process priority queue: {e}")
            return None

# Global rate limiter instance
advanced_limiter = AdvancedRateLimiter()

def rate_limit(
    requests_per_minute: int = 10,
    user_tier_based: bool = True,
    request_weight: int = 1,
    endpoint_name: Optional[str] = None
):
    """
    Decorator for rate limiting endpoints
    
    Args:
        requests_per_minute: Base requests per minute
        user_tier_based: Use user tier for limits
        request_weight: Request complexity weight
        endpoint_name: Custom endpoint name for tracking
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request and user info
            request = kwargs.get('request') or (args[0] if args and hasattr(args[0], 'client') else None)
            user_id = kwargs.get('user_id') or kwargs.get('current_user_id') or 'anonymous'
            
            if not request:
                # If no request object, skip rate limiting
                return await func(*args, **kwargs)
            
            endpoint = endpoint_name or func.__name__
            user_tier = "free_user"  # Default tier, should be determined from user data
            
            # Check rate limit
            limit_result = await advanced_limiter.check_rate_limit(
                user_id=user_id,
                endpoint=endpoint,
                user_tier=user_tier,
                request_weight=request_weight
            )
            
            if not limit_result.get("allowed", True):
                # Add to priority queue if rate limited
                request_data = {
                    "endpoint": endpoint,
                    "args": str(args),
                    "kwargs": str(kwargs),
                    "timestamp": time.time()
                }
                
                queue_id = await advanced_limiter.add_to_priority_queue(
                    user_id=user_id,
                    request_data=request_data,
                    priority=5
                )
                
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Rate limit exceeded",
                        "limit_type": limit_result.get("limit_type"),
                        "current_usage": limit_result.get("current_usage"),
                        "limit": limit_result.get("limit"),
                        "retry_after": limit_result.get("retry_after"),
                        "queue_id": queue_id
                    },
                    headers={
                        "Retry-After": str(limit_result.get("retry_after", 60)),
                        "X-RateLimit-Limit": str(limit_result.get("limit", requests_per_minute)),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(limit_result.get("reset_time", 0))
                    }
                )
            
            # Add rate limit headers to response
            result = await func(*args, **kwargs)
            
            if hasattr(result, 'headers'):
                remaining = limit_result.get("remaining", {})
                result.headers["X-RateLimit-Limit-Minute"] = str(limit_result.get("limits", {}).get("requests_per_minute", requests_per_minute))
                result.headers["X-RateLimit-Remaining-Minute"] = str(remaining.get("minute", 0))
                result.headers["X-RateLimit-Limit-Hour"] = str(limit_result.get("limits", {}).get("requests_per_hour", requests_per_minute * 60))
                result.headers["X-RateLimit-Remaining-Hour"] = str(remaining.get("hour", 0))
            
            return result
            
        return wrapper
    return decorator

# Throttling for external API calls
class APIThrottler:
    """Throttler for external API calls to prevent hitting rate limits"""
    
    def __init__(self):
        self.api_limits = {
            "deepgram": {"requests_per_second": 10, "requests_per_minute": 200},
            "gemini": {"requests_per_second": 5, "requests_per_minute": 100},
            "firebase": {"requests_per_second": 50, "requests_per_minute": 1000}
        }
        self.last_request_times = {}
    
    async def throttle_api_call(self, api_name: str, call_func: Callable, *args, **kwargs):
        """
        Throttle API call to respect rate limits
        
        Args:
            api_name: Name of the API
            call_func: Function to call
            *args, **kwargs: Arguments for the function
            
        Returns:
            Function result
        """
        limits = self.api_limits.get(api_name, {"requests_per_second": 1})
        min_interval = 1.0 / limits["requests_per_second"]
        
        # Check last request time
        last_time = self.last_request_times.get(api_name, 0)
        current_time = time.time()
        time_since_last = current_time - last_time
        
        # Wait if necessary
        if time_since_last < min_interval:
            wait_time = min_interval - time_since_last
            await asyncio.sleep(wait_time)
        
        # Update last request time
        self.last_request_times[api_name] = time.time()
        
        # Make the API call
        try:
            if asyncio.iscoroutinefunction(call_func):
                return await call_func(*args, **kwargs)
            else:
                return call_func(*args, **kwargs)
        except Exception as e:
            logger.error(f"API call to {api_name} failed: {e}")
            raise

# Global API throttler
api_throttler = APIThrottler()

# Convenience functions
async def check_user_rate_limit(user_id: str, endpoint: str, user_tier: str = "free_user") -> Dict[str, Any]:
    """Check user rate limit"""
    return await advanced_limiter.check_rate_limit(user_id, endpoint, user_tier)

async def throttle_deepgram_call(call_func: Callable, *args, **kwargs):
    """Throttle Deepgram API call"""
    return await api_throttler.throttle_api_call("deepgram", call_func, *args, **kwargs)

async def throttle_gemini_call(call_func: Callable, *args, **kwargs):
    """Throttle Gemini API call"""
    return await api_throttler.throttle_api_call("gemini", call_func, *args, **kwargs)

async def throttle_firebase_call(call_func: Callable, *args, **kwargs):
    """Throttle Firebase API call"""
    return await api_throttler.throttle_api_call("firebase", call_func, *args, **kwargs)
