"""
Settings API endpoints for user profile, notifications, and preferences.
Handles user profile updates, notification preferences, and email functionality.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from pydantic import BaseModel, EmailStr
import logging
from utils.firebase_firestore import get_firestore_client
from utils.email_service import send_test_email, send_welcome_email
from google.cloud import firestore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])

# Pydantic models for request/response validation
class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    phone: Optional[str] = None

class NotificationPreferences(BaseModel):
    email_notifications: bool = True
    processing_complete: bool = True
    weekly_summary: bool = False
    marketing_emails: bool = False
    security_alerts: bool = True

class TestEmailRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = "Test User"

@router.get("/profile/{user_id}")
async def get_user_profile(user_id: str):
    """
    Get user profile information from Firestore.
    Returns user's profile data including name, email, company, etc.
    """
    try:
        db = get_firestore_client()
        
        # Get user profile from users collection
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            # Create default profile if doesn't exist
            default_profile = {
                "first_name": "",
                "last_name": "",
                "email": "",
                "company": "",
                "phone": "",
                "created_at": firestore.SERVER_TIMESTAMP,
                "updated_at": firestore.SERVER_TIMESTAMP
            }
            user_ref.set(default_profile)
            profile_data = default_profile
        else:
            profile_data = user_doc.to_dict()
        
        return {
            "success": True,
            "profile": profile_data
        }
        
    except Exception as e:
        logger.error(f"Failed to get user profile for {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")

@router.put("/profile/{user_id}")
async def update_user_profile(user_id: str, profile_update: ProfileUpdateRequest):
    """
    Update user profile information in Firestore.
    Updates only the provided fields, keeps existing data for others.
    """
    try:
        db = get_firestore_client()
        user_ref = db.collection("users").document(user_id)
        
        # Prepare update data (only include non-None fields)
        update_data = {}
        if profile_update.first_name is not None:
            update_data["first_name"] = profile_update.first_name
        if profile_update.last_name is not None:
            update_data["last_name"] = profile_update.last_name
        if profile_update.email is not None:
            update_data["email"] = profile_update.email
        if profile_update.company is not None:
            update_data["company"] = profile_update.company
        if profile_update.phone is not None:
            update_data["phone"] = profile_update.phone
        
        # Always update the timestamp
        update_data["updated_at"] = firestore.SERVER_TIMESTAMP
        
        # Update the document
        user_ref.update(update_data)
        
        logger.info(f"Updated profile for user {user_id}: {list(update_data.keys())}")
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "updated_fields": list(update_data.keys())
        }
        
    except Exception as e:
        logger.error(f"Failed to update profile for {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@router.get("/notifications/{user_id}")
async def get_notification_preferences(user_id: str):
    """
    Get user's notification preferences from Firestore.
    Returns notification settings for email, processing, etc.
    """
    try:
        db = get_firestore_client()
        
        # Get notification preferences from user_settings collection
        settings_ref = db.collection("user_settings").document(user_id)
        settings_doc = settings_ref.get()
        
        if not settings_doc.exists:
            # Create default notification preferences
            default_notifications = {
                "email_notifications": True,
                "processing_complete": True,
                "weekly_summary": False,
                "marketing_emails": False,
                "security_alerts": True,
                "created_at": firestore.SERVER_TIMESTAMP,
                "updated_at": firestore.SERVER_TIMESTAMP
            }
            settings_ref.set({"notifications": default_notifications})
            notifications = default_notifications
        else:
            settings_data = settings_doc.to_dict()
            notifications = settings_data.get("notifications", {})
        
        return {
            "success": True,
            "notifications": notifications
        }
        
    except Exception as e:
        logger.error(f"Failed to get notification preferences for {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get notifications: {str(e)}")

@router.put("/notifications/{user_id}")
async def update_notification_preferences(user_id: str, notifications: NotificationPreferences):
    """
    Update user's notification preferences in Firestore.
    Updates notification settings for various types of alerts.
    """
    try:
        db = get_firestore_client()
        settings_ref = db.collection("user_settings").document(user_id)
        
        # Prepare notification data
        notification_data = {
            "email_notifications": notifications.email_notifications,
            "processing_complete": notifications.processing_complete,
            "weekly_summary": notifications.weekly_summary,
            "marketing_emails": notifications.marketing_emails,
            "security_alerts": notifications.security_alerts,
            "updated_at": firestore.SERVER_TIMESTAMP
        }
        
        # Update or create the document
        settings_ref.set({"notifications": notification_data}, merge=True)
        
        logger.info(f"Updated notification preferences for user {user_id}")
        
        return {
            "success": True,
            "message": "Notification preferences updated successfully",
            "notifications": notification_data
        }
        
    except Exception as e:
        logger.error(f"Failed to update notification preferences for {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update notifications: {str(e)}")

@router.post("/email/test")
async def send_test_email_endpoint(test_request: TestEmailRequest):
    """
    Send a test email to verify Brevo integration is working.
    This endpoint allows testing the email functionality.
    """
    try:
        result = send_test_email(
            to_email=test_request.email,
            to_name=test_request.name
        )
        
        if result["success"]:
            logger.info(f"Test email sent successfully to {test_request.email}")
            return {
                "success": True,
                "message": f"Test email sent successfully to {test_request.email}",
                "message_id": result.get("message_id"),
                "details": result
            }
        else:
            logger.error(f"Failed to send test email to {test_request.email}: {result.get('error')}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to send test email: {result.get('error')}"
            )
        
    except Exception as e:
        logger.error(f"Error sending test email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send test email: {str(e)}")

@router.post("/email/welcome/{user_id}")
async def send_welcome_email_endpoint(user_id: str):
    """
    Send a welcome email to a user.
    Gets user info from Firestore and sends welcome email.
    If email is not in profile, tries to get it from Firebase Auth.
    """
    try:
        # Get user profile for name
        db = get_firestore_client()
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        
        user_email = None
        user_name = "User"
        
        # Try to get email and name from profile first
        if user_doc.exists:
            user_data = user_doc.to_dict()
            user_email = user_data.get("email")
            user_name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
            if not user_name:
                user_name = "User"
        
        # If no email in profile, try to get from Firebase Auth
        if not user_email:
            try:
                import firebase_admin
                from firebase_admin import auth
                
                # Get user record from Firebase Auth
                user_record = auth.get_user(user_id)
                user_email = user_record.email
                
                # If we got email from Auth but no name from profile, use Auth display name
                if user_name == "User" and user_record.display_name:
                    user_name = user_record.display_name
                    
                logger.info(f"Retrieved email from Firebase Auth for user {user_id}: {user_email}")
                
            except Exception as auth_error:
                logger.error(f"Failed to get user from Firebase Auth: {str(auth_error)}")
        
        # Final check for email
        if not user_email:
            raise HTTPException(
                status_code=400, 
                detail="User email not found in profile or Firebase Auth. Please update your profile with an email address first."
            )
        
        # Send welcome email
        result = send_welcome_email(user_email, user_name)
        
        if result["success"]:
            logger.info(f"Welcome email sent successfully to {user_email}")
            return {
                "success": True,
                "message": f"Welcome email sent successfully to {user_email}",
                "message_id": result.get("message_id"),
                "details": result
            }
        else:
            logger.error(f"Failed to send welcome email to {user_email}: {result.get('error')}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to send welcome email: {result.get('error')}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending welcome email for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send welcome email: {str(e)}")

@router.get("/email/status")
async def get_email_service_status():
    """
    Check if the email service is properly configured and working.
    Returns status of Brevo integration without sending emails.
    """
    try:
        from utils.email_service import get_email_service
        
        # Try to initialize the email service
        email_service = get_email_service()
        
        return {
            "success": True,
            "message": "Email service is properly configured",
            "service": "Brevo (Sendinblue)",
            "api_key_configured": bool(email_service.api_key),
            "status": "ready"
        }
        
    except ValueError as e:
        # API key not configured
        return {
            "success": False,
            "message": "Email service not configured",
            "error": str(e),
            "service": "Brevo (Sendinblue)",
            "api_key_configured": False,
            "status": "not_configured"
        }
    except Exception as e:
        logger.error(f"Error checking email service status: {str(e)}")
        return {
            "success": False,
            "message": "Error checking email service",
            "error": str(e),
            "service": "Brevo (Sendinblue)",
            "status": "error"
        }
