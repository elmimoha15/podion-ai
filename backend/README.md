# Podion AI Backend

A FastAPI-based backend service for the Podion AI SaaS platform, providing AI-powered podcast transcription and content generation capabilities.

## Features

- 🚀 FastAPI with automatic API documentation
- 📁 File upload support for audio/video transcription
- 🎥 YouTube URL transcription processing
- 🔧 CORS middleware for frontend integration
- 🔥 Firebase integration ready
- 📊 Comprehensive logging and error handling

## Prerequisites

- Python 3.10 or higher
- pip (Python package installer)

## Quick Start

### 1. Setup Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# (Firebase credentials will be added later)
```

### 4. Run the Development Server

```bash
uvicorn main:app --reload
```

The API will be available at:
- **API Base URL**: http://127.0.0.1:8000
- **Interactive API Docs**: http://127.0.0.1:8000/docs
- **Alternative API Docs**: http://127.0.0.1:8000/redoc

## API Endpoints

### Health Check
- `GET /` - Welcome message and basic health check
- `GET /health` - Detailed health check with environment info

### Transcription API
- `POST /api/v1/transcribe/upload` - Upload audio/video file for transcription
- `POST /api/v1/transcribe/youtube` - Transcribe YouTube video from URL
- `GET /api/v1/transcribe/{transcription_id}` - Get transcription status and result
- `GET /api/v1/transcribe` - List all transcriptions

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── routes/                # API route modules
│   ├── __init__.py
│   └── transcription.py   # Transcription endpoints
└── README.md              # This file
```

## Development

### Adding New Routes

1. Create a new file in the `routes/` directory
2. Define your FastAPI router
3. Import and include the router in `main.py`

Example:
```python
# routes/new_feature.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/new-endpoint")
async def new_endpoint():
    return {"message": "Hello from new feature"}
```

```python
# main.py
from routes import new_feature

app.include_router(new_feature.router, prefix="/api/v1", tags=["new-feature"])
```

### Environment Variables

Key environment variables in `.env`:

- `ENVIRONMENT` - Application environment (development/production)
- `FIREBASE_*` - Firebase configuration (to be added later)
- `CORS_ORIGINS` - Allowed CORS origins for frontend

## Future Integrations

This backend is prepared for:

- 🔥 **Firebase Authentication** - User management and authentication
- 🔥 **Firebase Firestore** - Document database for storing transcriptions
- 🔥 **Firebase Storage** - File storage for uploaded audio/video files
- 🤖 **AI Services** - Integration with OpenAI, Anthropic, or other AI providers
- 🎵 **Audio Processing** - FFmpeg integration for audio format conversion
- 📊 **Analytics** - Usage tracking and analytics

## API Documentation

When the server is running, visit:
- http://127.0.0.1:8000/docs for Swagger UI
- http://127.0.0.1:8000/redoc for ReDoc

## Contributing

1. Follow PEP 8 style guidelines
2. Add type hints to all functions
3. Include docstrings for all public functions
4. Add appropriate error handling
5. Update this README when adding new features

## License

This project is part of the Podion AI SaaS platform. 