from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from routes import (
    deepgram_transcription, 
    gemini_seo, 
    firebase_storage, 
    firebase_firestore, 
    podcast_workflow,
    workspaces,
    billing,
    settings,
    verification,
    paddle
)
import os
import time
import asyncio
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials
import logging
from contextlib import asynccontextmanager

# Import scalability components
from utils.monitoring import metrics_collector, start_metrics_server, get_system_health
from utils.connection_pool import connection_manager
from utils.job_queue import job_queue
from utils.rate_limiter import AdvancedRateLimiter
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Scalability configuration
ENABLE_METRICS = os.getenv("ENABLE_METRICS_SERVER", "false").lower() == "true"
ENABLE_JOB_QUEUE = os.getenv("ENABLE_JOB_QUEUE", "false").lower() == "true"
ENABLE_RATE_LIMITING = os.getenv("ENABLE_RATE_LIMITING", "true").lower() == "true"

# Initialize Firebase (if service account key is provided)
def initialize_firebase():
    """Initialize Firebase Admin SDK if service account key is provided"""
    firebase_key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH", "podion-ai-8270d-firebase-adminsdk-fbsvc-76c6bcb61f.json")
    
    if firebase_key_path and os.path.exists(firebase_key_path):
        try:
            cred = credentials.Certificate(firebase_key_path)
            
            # Get storage bucket from environment
            storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET")
            
            # Initialize with or without storage bucket
            if storage_bucket:
                firebase_admin.initialize_app(cred, {
                    'storageBucket': storage_bucket
                })
                logging.info(f"Firebase Admin SDK initialized with Storage bucket: {storage_bucket}")
            else:
                firebase_admin.initialize_app(cred)
                logging.info(f"Firebase Admin SDK initialized without Storage bucket (add FIREBASE_STORAGE_BUCKET to .env)")
            
            logging.info(f"Firebase initialized using {firebase_key_path}")
            return True
        except Exception as e:
            logging.warning(f"Failed to initialize Firebase: {e}")
            return False
    else:
        logging.info(f"Firebase service account key not found at {firebase_key_path}, skipping Firebase initialization")
        return False

# Initialize Firebase on startup
firebase_initialized = initialize_firebase()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Podion AI API...")
    
    # Initialize scalability components
    await connection_manager.initialize()
    logger.info("Connection manager initialized")
    
    if ENABLE_JOB_QUEUE:
        await job_queue.initialize()
        logger.info("Job queue initialized")
    
    if ENABLE_METRICS:
        start_metrics_server()
        logger.info("Metrics server started")
    
    logger.info("Podion AI API startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Podion AI API...")
    
    await connection_manager.close()
    
    if ENABLE_JOB_QUEUE:
        await job_queue.close()
    
    logger.info("Podion AI API shutdown complete")

# Create FastAPI instance with lifespan management
app = FastAPI(
    title="Podion AI API",
    description="A SaaS platform for AI-powered podcast transcription and content generation",
    version="1.0.0",
    lifespan=lifespan
)

# Configure rate limiting
if ENABLE_RATE_LIMITING:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Reduce logging verbosity for job polling
import logging
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

# Add request monitoring middleware
@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    """Monitor request metrics"""
    start_time = time.time()
    
    # Get user tier (default to free_user if not authenticated)
    user_tier = "free_user"  # Could be extracted from JWT token
    
    response = await call_next(request)
    
    # Record metrics
    duration = time.time() - start_time
    await metrics_collector.record_request_metrics(
        method=request.method,
        endpoint=str(request.url.path),
        status_code=response.status_code,
        duration=duration,
        user_tier=user_tier
    )
    
    return response

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://localhost:8080",  # Vite dev server (alternative port)
        "http://localhost:8081",  # Vite dev server (alternative port)
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "https://podion-ai-8270d.web.app",  # Firebase Hosting production URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(deepgram_transcription.router, prefix="/api/v1", tags=["transcription"])
app.include_router(gemini_seo.router, prefix="/api/v1", tags=["seo"])
app.include_router(firebase_storage.router, prefix="/api/v1/storage", tags=["storage"])
app.include_router(firebase_firestore.router, prefix="/api/v1/firestore", tags=["firestore"])
app.include_router(podcast_workflow.router, prefix="/api/v1", tags=["workflow"])
app.include_router(workspaces.router, prefix="/api/v1", tags=["workspaces"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["billing"])
app.include_router(settings.router, tags=["settings"])
app.include_router(verification.router, prefix="/api/v1/verification", tags=["verification"])
app.include_router(paddle.router, tags=["paddle"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Welcome to Podion AI API", 
        "status": "healthy",
        "version": "1.0.0",
        "firebase_initialized": firebase_initialized
    }

@app.get("/health")
@limiter.limit("30/minute") if ENABLE_RATE_LIMITING else lambda x: x
async def health_check(request: Request):
    """Detailed health check with system metrics"""
    # Check Deepgram API key configuration
    deepgram_configured = bool(
        os.getenv("DEEPGRAM_API_KEY") and 
        os.getenv("DEEPGRAM_API_KEY") != "your-deepgram-api-key-here"
    )
    
    # Check Gemini API key configuration
    gemini_configured = bool(
        os.getenv("GEMINI_API_KEY") and 
        os.getenv("GEMINI_API_KEY") != "your-gemini-api-key-here"
    )
    
    # Check Firebase Storage bucket configuration
    storage_configured = bool(
        firebase_initialized and os.getenv("FIREBASE_STORAGE_BUCKET")
    )
    
    # Check Firestore availability (depends on Firebase being initialized)
    firestore_configured = firebase_initialized
    
    # Check complete workflow availability (requires all services)
    workflow_configured = all([
        deepgram_configured,
        gemini_configured,
        storage_configured,
        firestore_configured
    ])
    
    # Get system health metrics
    system_metrics = await get_system_health()
    
    return {
        "status": "healthy",
        "service": "Podion AI Backend",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "firebase_initialized": firebase_initialized,
        "deepgram_configured": deepgram_configured,
        "gemini_configured": gemini_configured,
        "storage_configured": storage_configured,
        "firestore_configured": firestore_configured,
        "workflow_configured": workflow_configured,
        "scalability": {
            "metrics_enabled": ENABLE_METRICS,
            "job_queue_enabled": ENABLE_JOB_QUEUE,
            "rate_limiting_enabled": ENABLE_RATE_LIMITING,
        },
        "services": {
            "firebase": "ready" if firebase_initialized else "not configured",
            "deepgram": "ready" if deepgram_configured else "not configured",
            "gemini": "ready" if gemini_configured else "not configured",
            "storage": "ready" if storage_configured else "not configured (add FIREBASE_STORAGE_BUCKET)",
            "firestore": "ready" if firestore_configured else "not configured (requires Firebase Admin SDK)",
            "workflow": "ready" if workflow_configured else "not ready (requires all services configured)"
        },
        "system_metrics": system_metrics
    }

@app.get("/metrics")
@limiter.limit("10/minute") if ENABLE_RATE_LIMITING else lambda x: x
async def metrics_endpoint(request: Request):
    """Prometheus metrics endpoint"""
    from prometheus_client import generate_latest
    return Response(generate_latest(), media_type="text/plain")

@app.get("/system/health")
@limiter.limit("10/minute") if ENABLE_RATE_LIMITING else lambda x: x
async def system_health(request: Request):
    """Comprehensive system health and metrics"""
    return await get_system_health()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
