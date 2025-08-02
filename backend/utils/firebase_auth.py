import logging
from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth

logger = logging.getLogger(__name__)

# HTTP Bearer token security scheme
security = HTTPBearer()

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Verify Firebase ID token and return user ID
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        
    Returns:
        user_id: Firebase user ID
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    
    try:
        # Check if Firebase Admin SDK is initialized
        if not firebase_admin._apps:
            logger.error("Firebase Admin SDK not initialized")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication service not available"
            )
        
        # Verify the ID token
        decoded_token = auth.verify_id_token(credentials.credentials)
        user_id = decoded_token.get('uid')
        
        if not user_id:
            logger.error("No user ID found in token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        
        logger.info(f"Successfully authenticated user: {user_id}")
        return user_id
        
    except auth.InvalidIdTokenError:
        logger.error("Invalid ID token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    except auth.ExpiredIdTokenError:
        logger.error("Expired ID token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired"
        )
    except auth.RevokedIdTokenError:
        logger.error("Revoked ID token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has been revoked"
        )
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

def get_current_user_id(user_id: str = Depends(verify_firebase_token)) -> str:
    """
    Dependency to get current authenticated user ID
    
    Args:
        user_id: User ID from token verification
        
    Returns:
        user_id: Firebase user ID
    """
    return user_id
