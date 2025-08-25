"""
Email verification API endpoints for secure user onboarding.
Provides endpoints for sending verification codes, verifying codes, and resending codes.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Dict, Any

from utils.verification import verification_service
from utils.firebase_auth import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response Models
class SendVerificationRequest(BaseModel):
    email: EmailStr
    name: str = None

class VerifyCodeRequest(BaseModel):
    code: str

class ResendCodeRequest(BaseModel):
    pass  # No additional fields needed

# API Endpoints

@router.post("/send-verification")
async def send_verification_code(
    request: SendVerificationRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Send verification code to user's email.
    Requires authenticated user.
    
    Body:
        - email: User's email address
        - name: User's display name (optional)
    
    Returns:
        - success: Boolean
        - message: Status message
        - expires_in_minutes: Code expiration time
    """
    try:
        user_id = current_user_id
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")
        
        logger.info(f"Sending verification code to {request.email} for user {user_id}")
        
        result = verification_service.send_verification_email(
            user_id=user_id,
            email=request.email,
            name=request.name
        )
        
        if result["success"]:
            return {
                "success": True,
                "message": result["message"],
                "expires_in_minutes": result.get("expires_in_minutes"),
                "email": request.email
            }
        else:
            # Handle specific error cases
            if "rate limit" in result.get("error", "").lower():
                raise HTTPException(
                    status_code=429, 
                    detail=result["error"],
                    headers={"Retry-After": str(result.get("retry_after_minutes", 5) * 60)}
                )
            else:
                raise HTTPException(status_code=400, detail=result["error"])
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_verification_code for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/verify-code")
async def verify_code(
    request: VerifyCodeRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Verify the submitted 6-digit code.
    Marks user as verified if code is valid.
    
    Body:
        - code: 6-digit verification code
    
    Returns:
        - success: Boolean
        - message: Status message
        - user_verified: Boolean (if verification successful)
        - welcome_email_sent: Boolean
    """
    try:
        user_id = current_user_id
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")
        
        # Validate code format
        if not request.code or len(request.code) != 6 or not request.code.isdigit():
            raise HTTPException(
                status_code=400, 
                detail="Invalid code format. Please enter a 6-digit code."
            )
        
        logger.info(f"Verifying code for user {user_id}")
        
        result = verification_service.verify_code(
            user_id=user_id,
            submitted_code=request.code
        )
        
        if result["success"]:
            logger.info(f"User {user_id} successfully verified")
            return {
                "success": True,
                "message": result["message"],
                "user_verified": result.get("user_verified", False),
                "welcome_email_sent": result.get("welcome_email_sent", False)
            }
        else:
            # Handle specific error cases
            error_msg = result.get("error", "Verification failed")
            
            if result.get("expired", False):
                raise HTTPException(status_code=410, detail=error_msg)  # Gone
            elif result.get("max_attempts_exceeded", False):
                raise HTTPException(status_code=429, detail=error_msg)  # Too Many Requests
            else:
                raise HTTPException(status_code=400, detail=error_msg)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in verify_code for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/resend-code")
async def resend_verification_code(
    request: ResendCodeRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Resend verification code to user.
    Includes rate limiting protection.
    
    Returns:
        - success: Boolean
        - message: Status message
        - expires_in_minutes: Code expiration time
    """
    try:
        user_id = current_user_id
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")
        
        logger.info(f"Resending verification code for user {user_id}")
        
        result = verification_service.resend_verification_code(user_id=user_id)
        
        if result["success"]:
            return {
                "success": True,
                "message": result["message"],
                "expires_in_minutes": result.get("expires_in_minutes")
            }
        else:
            # Handle specific error cases
            if "rate limit" in result.get("error", "").lower():
                raise HTTPException(
                    status_code=429, 
                    detail=result["error"],
                    headers={"Retry-After": str(result.get("retry_after_minutes", 5) * 60)}
                )
            else:
                raise HTTPException(status_code=400, detail=result["error"])
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in resend_verification_code for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/status")
async def get_verification_status(
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get current verification status for user.
    
    Returns:
        - verified: Boolean
        - has_pending_verification: Boolean
        - verification_email: String (if pending)
    """
    try:
        user_id = current_user_id
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")
        
        # Check user verification status
        from utils.firebase_config import get_firestore_client
        db = get_firestore_client()
        
        # Check user document
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        
        verified = False
        if user_doc.exists:
            user_data = user_doc.to_dict()
            verified = user_data.get("verified", False)
        
        # Check pending verification
        verification_ref = db.collection("email_verifications").document(user_id)
        verification_doc = verification_ref.get()
        
        has_pending = False
        verification_email = None
        
        if verification_doc.exists:
            verification_data = verification_doc.to_dict()
            if not verification_data.get("used", False):
                # Check if not expired
                from datetime import datetime
                expires_at = verification_data.get("expires_at")
                if expires_at and datetime.utcnow() <= expires_at:
                    has_pending = True
                    verification_email = verification_data.get("email")
        
        return {
            "verified": verified,
            "has_pending_verification": has_pending,
            "verification_email": verification_email
        }
        
    except Exception as e:
        logger.error(f"Error getting verification status for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Health check endpoint
@router.get("/health")
async def verification_health_check():
    """Health check for verification service."""
    return {
        "status": "healthy",
        "service": "email_verification",
        "version": "1.0.0"
    }
