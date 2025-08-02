
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import (
    deepgram_transcription, 
    gemini_seo, 
    firebase_storage, 
    firebase_firestore, 
    podcast_workflow,
    workspaces
)
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials
import logging

# Load environment variables
load_dotenv()

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

# Create FastAPI instance
app = FastAPI(
    title="Podion AI API",
    description="A SaaS platform for AI-powered podcast transcription and content generation",
    version="1.0.0",
)

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
        # Add your production domain here when deployed
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
async def health_check():
    """Detailed health check"""
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
        "services": {
            "firebase": "ready" if firebase_initialized else "not configured",
            "deepgram": "ready" if deepgram_configured else "not configured",
            "gemini": "ready" if gemini_configured else "not configured",
            "storage": "ready" if storage_configured else "not configured (add FIREBASE_STORAGE_BUCKET)",
            "firestore": "ready" if firestore_configured else "not configured (requires Firebase Admin SDK)",
            "workflow": "ready" if workflow_configured else "not ready (requires all services configured)"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
