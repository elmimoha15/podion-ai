"""
Circuit breaker and retry mechanisms for external API resilience
"""
import time
import asyncio
from typing import Callable, Any, Dict, Optional
from functools import wraps
from enum import Enum
import logging
from tenacity import (
    retry, 
    stop_after_attempt, 
    wait_exponential, 
    retry_if_exception_type,
    before_sleep_log,
    after_log
)
from circuitbreaker import circuit
import httpx

logger = logging.getLogger(__name__)

class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Circuit is open, failing fast
    HALF_OPEN = "half_open"  # Testing if service is back

class ServiceCircuitBreaker:
    """Advanced circuit breaker for external services"""
    
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
        
    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Call function with circuit breaker protection
        """
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception(f"Circuit breaker is OPEN for {func.__name__}")
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
            
        except self.expected_exception as e:
            self._on_failure()
            raise e
    
    async def call_async(self, func: Callable, *args, **kwargs) -> Any:
        """
        Call async function with circuit breaker protection
        """
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception(f"Circuit breaker is OPEN for {func.__name__}")
        
        try:
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            self._on_success()
            return result
            
        except self.expected_exception as e:
            self._on_failure()
            raise e
    
    def _should_attempt_reset(self) -> bool:
        """Check if we should attempt to reset the circuit"""
        return (
            self.last_failure_time and 
            time.time() - self.last_failure_time >= self.recovery_timeout
        )
    
    def _on_success(self):
        """Handle successful call"""
        self.failure_count = 0
        self.state = CircuitState.CLOSED
        
    def _on_failure(self):
        """Handle failed call"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.warning(f"Circuit breaker opened after {self.failure_count} failures")

# Service-specific circuit breakers
deepgram_circuit = ServiceCircuitBreaker(
    failure_threshold=3,
    recovery_timeout=30,
    expected_exception=(httpx.HTTPError, ConnectionError, TimeoutError)
)

gemini_circuit = ServiceCircuitBreaker(
    failure_threshold=3,
    recovery_timeout=30,
    expected_exception=(httpx.HTTPError, ConnectionError, TimeoutError)
)

firebase_circuit = ServiceCircuitBreaker(
    failure_threshold=5,
    recovery_timeout=60,
    expected_exception=(Exception,)
)

class RetryConfig:
    """Retry configuration for different services"""
    
    DEEPGRAM = {
        "stop": stop_after_attempt(3),
        "wait": wait_exponential(multiplier=1, min=4, max=10),
        "retry": retry_if_exception_type((httpx.HTTPError, ConnectionError, TimeoutError)),
        "before_sleep": before_sleep_log(logger, logging.WARNING),
        "after": after_log(logger, logging.INFO)
    }
    
    GEMINI = {
        "stop": stop_after_attempt(3),
        "wait": wait_exponential(multiplier=2, min=4, max=20),
        "retry": retry_if_exception_type((httpx.HTTPError, ConnectionError, TimeoutError)),
        "before_sleep": before_sleep_log(logger, logging.WARNING),
        "after": after_log(logger, logging.INFO)
    }
    
    FIREBASE = {
        "stop": stop_after_attempt(5),
        "wait": wait_exponential(multiplier=1, min=2, max=8),
        "retry": retry_if_exception_type((ConnectionError, TimeoutError)),
        "before_sleep": before_sleep_log(logger, logging.WARNING),
        "after": after_log(logger, logging.INFO)
    }

def resilient_call(service_name: str = "default"):
    """
    Decorator for resilient API calls with circuit breaker and retry
    
    Args:
        service_name: Service name for specific configuration
    """
    def decorator(func: Callable) -> Callable:
        # Get service-specific configuration
        if service_name == "deepgram":
            circuit_breaker = deepgram_circuit
            retry_config = RetryConfig.DEEPGRAM
        elif service_name == "gemini":
            circuit_breaker = gemini_circuit
            retry_config = RetryConfig.GEMINI
        elif service_name == "firebase":
            circuit_breaker = firebase_circuit
            retry_config = RetryConfig.FIREBASE
        else:
            circuit_breaker = ServiceCircuitBreaker()
            retry_config = RetryConfig.FIREBASE
        
        # Apply retry decorator
        retried_func = retry(**retry_config)(func)
        
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                return await circuit_breaker.call_async(retried_func, *args, **kwargs)
            except Exception as e:
                logger.error(f"Resilient call failed for {func.__name__}: {e}")
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            try:
                return circuit_breaker.call(retried_func, *args, **kwargs)
            except Exception as e:
                logger.error(f"Resilient call failed for {func.__name__}: {e}")
                raise
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
            
    return decorator

class HealthChecker:
    """Health checker for external services"""
    
    def __init__(self):
        self.service_status = {}
        self.last_check_times = {}
        self.check_intervals = {
            "deepgram": 60,  # Check every minute
            "gemini": 60,
            "firebase": 30,
            "redis": 30
        }
    
    async def check_service_health(self, service_name: str) -> Dict[str, Any]:
        """
        Check health of a specific service
        
        Args:
            service_name: Name of service to check
            
        Returns:
            Health status information
        """
        current_time = time.time()
        last_check = self.last_check_times.get(service_name, 0)
        interval = self.check_intervals.get(service_name, 60)
        
        # Skip if checked recently
        if current_time - last_check < interval:
            return self.service_status.get(service_name, {"status": "unknown"})
        
        try:
            if service_name == "deepgram":
                status = await self._check_deepgram_health()
            elif service_name == "gemini":
                status = await self._check_gemini_health()
            elif service_name == "firebase":
                status = await self._check_firebase_health()
            elif service_name == "redis":
                status = await self._check_redis_health()
            else:
                status = {"status": "unknown", "message": "Unknown service"}
            
            self.service_status[service_name] = status
            self.last_check_times[service_name] = current_time
            
            return status
            
        except Exception as e:
            error_status = {
                "status": "unhealthy",
                "error": str(e),
                "checked_at": current_time
            }
            self.service_status[service_name] = error_status
            self.last_check_times[service_name] = current_time
            
            return error_status
    
    async def _check_deepgram_health(self) -> Dict[str, Any]:
        """Check Deepgram API health"""
        try:
            # Simple health check - just verify API key format
            api_key = os.getenv("DEEPGRAM_API_KEY")
            if not api_key or api_key == "your-deepgram-api-key-here":
                return {"status": "unhealthy", "message": "API key not configured"}
            
            # Could add actual API call here for more thorough check
            return {"status": "healthy", "message": "API key configured"}
            
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
    
    async def _check_gemini_health(self) -> Dict[str, Any]:
        """Check Gemini API health"""
        try:
            # Simple health check - just verify API key format
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key or api_key == "your-gemini-api-key-here":
                return {"status": "unhealthy", "message": "API key not configured"}
            
            return {"status": "healthy", "message": "API key configured"}
            
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
    
    async def _check_firebase_health(self) -> Dict[str, Any]:
        """Check Firebase health"""
        try:
            import firebase_admin
            
            # Check if Firebase is initialized
            try:
                app = firebase_admin.get_app()
                return {"status": "healthy", "message": "Firebase initialized"}
            except ValueError:
                return {"status": "unhealthy", "message": "Firebase not initialized"}
                
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
    
    async def _check_redis_health(self) -> Dict[str, Any]:
        """Check Redis health"""
        try:
            from utils.redis_client_simple import get_async_redis
            
            redis_client = await get_async_redis()
            await redis_client.ping()
            
            return {"status": "healthy", "message": "Redis connection successful"}
            
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
    
    async def get_all_service_status(self) -> Dict[str, Dict[str, Any]]:
        """Get health status of all services"""
        services = ["deepgram", "gemini", "firebase", "redis"]
        status = {}
        
        for service in services:
            status[service] = await self.check_service_health(service)
        
        return status

# Global health checker
health_checker = HealthChecker()

# Convenience functions
async def check_service_health(service_name: str) -> Dict[str, Any]:
    """Check health of a service"""
    return await health_checker.check_service_health(service_name)

async def get_all_service_status() -> Dict[str, Dict[str, Any]]:
    """Get status of all services"""
    return await health_checker.get_all_service_status()

# Fallback mechanisms
class FallbackHandler:
    """Handle fallbacks when services are unavailable"""
    
    @staticmethod
    async def transcription_fallback(audio_data: bytes, filename: str) -> Dict[str, Any]:
        """Fallback for transcription service"""
        logger.warning("Using transcription fallback - service unavailable")
        return {
            "transcript": "Transcription service temporarily unavailable. Please try again later.",
            "confidence": 0.0,
            "words": [],
            "metadata": {
                "fallback": True,
                "reason": "Service unavailable"
            }
        }
    
    @staticmethod
    async def seo_generation_fallback(transcript: str) -> Dict[str, Any]:
        """Fallback for SEO generation service"""
        logger.warning("Using SEO generation fallback - service unavailable")
        return {
            "seo_title": f"Podcast Episode - {transcript[:50]}...",
            "show_notes": [],
            "blog_post": {
                "title": "Podcast Episode",
                "meta_description": "Podcast episode content",
                "intro": "Content generation temporarily unavailable.",
                "body": "Please try again later.",
                "conclusion": ""
            },
            "social_media": {
                "twitter": "New podcast episode available!",
                "facebook": "Check out our latest podcast episode.",
                "linkedin": "New episode of our podcast is now live."
            },
            "metadata": {
                "fallback": True,
                "reason": "Service unavailable"
            }
        }

fallback_handler = FallbackHandler()

import os
