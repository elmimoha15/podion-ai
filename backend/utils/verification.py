"""
Email verification utility for secure user onboarding.
Handles verification code generation, storage, validation, and rate limiting.
"""

import os
import time
import secrets
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
from google.cloud import firestore

from utils.firebase_firestore import get_firestore_client
from utils.email_service import BrevoEmailService

logger = logging.getLogger(__name__)

class EmailVerificationService:
    """
    Handles email verification flow with security features:
    - 6-digit verification codes
    - Expiration (10 minutes)
    - One-time use
    - Rate limiting
    - Secure storage in Firestore
    """
    
    def __init__(self):
        self.db = None
        self.email_service = None
        
        # Configuration
        self.code_length = 6
        self.code_expiry_minutes = 10
        self.rate_limit_window_minutes = 5  # Max 1 code per 5 minutes
        self.max_attempts = 3  # Max 3 verification attempts
    
    def _ensure_initialized(self):
        """Lazy initialization of services"""
        if self.db is None:
            self.db = get_firestore_client()
        if self.email_service is None:
            self.email_service = BrevoEmailService()
        
    def generate_verification_code(self) -> str:
        """
        Generate a secure 6-digit verification code.
        Uses cryptographically secure random number generation.
        """
        # Generate 6-digit code using secure random
        code = ''.join([str(secrets.randbelow(10)) for _ in range(self.code_length)])
        logger.info(f"Generated verification code (length: {len(code)})")
        return code
    
    def send_verification_email(self, user_id: str, email: str, name: str = None) -> Dict[str, Any]:
        self._ensure_initialized()
        """
        Send verification code email to user.
        Includes rate limiting and secure code storage.
        
        Args:
            user_id: Firebase user ID
            email: User's email address
            name: User's display name (optional)
            
        Returns:
            Dict with success status and details
        """
        try:
            # Check rate limiting
            if not self._check_rate_limit(user_id):
                return {
                    "success": False,
                    "error": "Rate limit exceeded. Please wait before requesting another code.",
                    "retry_after_minutes": self.rate_limit_window_minutes
                }
            
            # Generate verification code
            code = self.generate_verification_code()
            
            # Store code in Firestore with expiration
            verification_data = {
                "code": code,
                "email": email,
                "created_at": firestore.SERVER_TIMESTAMP,
                "expires_at": datetime.utcnow() + timedelta(minutes=self.code_expiry_minutes),
                "used": False,
                "attempts": 0,
                "max_attempts": self.max_attempts
            }
            
            # Save to Firestore
            verification_ref = self.db.collection("email_verifications").document(user_id)
            verification_ref.set(verification_data)
            
            # Send verification email
            email_result = self._send_verification_code_email(email, code, name)
            
            if email_result["success"]:
                logger.info(f"Verification email sent successfully to {email} for user {user_id}")
                return {
                    "success": True,
                    "message": "Verification code sent successfully",
                    "expires_in_minutes": self.code_expiry_minutes,
                    "email_message_id": email_result.get("message_id")
                }
            else:
                # Clean up if email failed
                verification_ref.delete()
                logger.error(f"Failed to send verification email to {email}: {email_result.get('error')}")
                return {
                    "success": False,
                    "error": f"Failed to send verification email: {email_result.get('error')}"
                }
                
        except Exception as e:
            logger.error(f"Error sending verification email for user {user_id}: {str(e)}")
            return {
                "success": False,
                "error": f"Internal error: {str(e)}"
            }
    
    def verify_code(self, user_id: str, submitted_code: str) -> Dict[str, Any]:
        self._ensure_initialized()
        """
        Verify the submitted code and mark user as verified if valid.
        
        Args:
            user_id: Firebase user ID
            submitted_code: Code submitted by user
            
        Returns:
            Dict with verification result and user status
        """
        try:
            # Get verification data
            verification_ref = self.db.collection("email_verifications").document(user_id)
            verification_doc = verification_ref.get()
            
            if not verification_doc.exists:
                return {
                    "success": False,
                    "error": "No verification code found. Please request a new code."
                }
            
            verification_data = verification_doc.to_dict()
            
            # Check if code is already used
            if verification_data.get("used", False):
                return {
                    "success": False,
                    "error": "Verification code has already been used. Please request a new code."
                }
            
            # Check expiration
            expires_at = verification_data.get("expires_at")
            if expires_at:
                # Handle timezone-aware comparison
                current_time = datetime.utcnow()
                if hasattr(expires_at, 'timestamp'):
                    # Firestore timestamp
                    expires_timestamp = expires_at.timestamp()
                    current_timestamp = current_time.timestamp()
                    if current_timestamp > expires_timestamp:
                        # Clean up expired code
                        verification_ref.delete()
                        return {
                            "success": False,
                            "error": "Verification code has expired. Please request a new code.",
                            "expired": True
                        }
                else:
                    # Handle datetime objects
                    if hasattr(expires_at, 'replace'):
                        # Make both timezone-naive for comparison
                        if expires_at.tzinfo is not None:
                            expires_at = expires_at.replace(tzinfo=None)
                        if current_time > expires_at:
                            # Clean up expired code
                            verification_ref.delete()
                            return {
                                "success": False,
                                "error": "Verification code has expired. Please request a new code.",
                                "expired": True
                            }
            
            # Check attempt limit
            attempts = verification_data.get("attempts", 0)
            max_attempts = verification_data.get("max_attempts", self.max_attempts)
            
            if attempts >= max_attempts:
                # Clean up after max attempts
                verification_ref.delete()
                return {
                    "success": False,
                    "error": "Maximum verification attempts exceeded. Please request a new code.",
                    "max_attempts_exceeded": True
                }
            
            # Increment attempt counter
            verification_ref.update({"attempts": attempts + 1})
            
            # Verify the code
            stored_code = verification_data.get("code")
            if submitted_code != stored_code:
                return {
                    "success": False,
                    "error": f"Invalid verification code. {max_attempts - attempts - 1} attempts remaining.",
                    "attempts_remaining": max_attempts - attempts - 1
                }
            
            # Code is valid - mark as used and verify user
            verification_ref.update({"used": True, "verified_at": firestore.SERVER_TIMESTAMP})
            
            # Mark user as verified in users collection
            user_ref = self.db.collection("users").document(user_id)
            user_ref.set({
                "verified": True,
                "verified_at": firestore.SERVER_TIMESTAMP,
                "email": verification_data.get("email")
            }, merge=True)
            
            # Send welcome email
            welcome_result = self._send_welcome_email_after_verification(
                user_id, 
                verification_data.get("email")
            )
            
            logger.info(f"User {user_id} successfully verified")
            
            return {
                "success": True,
                "message": "Email verified successfully!",
                "user_verified": True,
                "welcome_email_sent": welcome_result.get("success", False),
                "welcome_email_message_id": welcome_result.get("message_id")
            }
            
        except Exception as e:
            logger.error(f"Error verifying code for user {user_id}: {str(e)}")
            return {
                "success": False,
                "error": f"Internal error: {str(e)}"
            }
    
    def resend_verification_code(self, user_id: str) -> Dict[str, Any]:
        self._ensure_initialized()
        """
        Resend verification code with rate limiting.
        
        Args:
            user_id: Firebase user ID
            
        Returns:
            Dict with resend result
        """
        try:
            # Get existing verification data
            verification_ref = self.db.collection("email_verifications").document(user_id)
            verification_doc = verification_ref.get()
            
            if not verification_doc.exists:
                return {
                    "success": False,
                    "error": "No verification request found. Please start the verification process."
                }
            
            verification_data = verification_doc.to_dict()
            email = verification_data.get("email")
            
            if not email:
                return {
                    "success": False,
                    "error": "Email address not found in verification data."
                }
            
            # Get user name from users collection
            user_ref = self.db.collection("users").document(user_id)
            user_doc = user_ref.get()
            user_name = None
            
            if user_doc.exists:
                user_data = user_doc.to_dict()
                user_name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
            
            # Send new verification code (includes rate limiting)
            return self.send_verification_email(user_id, email, user_name)
            
        except Exception as e:
            logger.error(f"Error resending verification code for user {user_id}: {str(e)}")
            return {
                "success": False,
                "error": f"Internal error: {str(e)}"
            }
    
    def _check_rate_limit(self, user_id: str) -> bool:
        """
        Check if user can request a new verification code.
        Rate limit: 1 code per 5 minutes.
        """
        try:
            verification_ref = self.db.collection("email_verifications").document(user_id)
            verification_doc = verification_ref.get()
            
            if not verification_doc.exists:
                return True  # No previous request
            
            verification_data = verification_doc.to_dict()
            created_at = verification_data.get("created_at")
            
            if not created_at:
                return True  # No timestamp, allow
            
            # Check if code has expired
            if hasattr(created_at, 'timestamp'):
                # Firestore timestamp
                created_timestamp = created_at.timestamp()
            elif hasattr(created_at, 'replace'):
                # datetime object - make it timezone aware if needed
                if created_at.tzinfo is None:
                    import pytz
                    created_at = pytz.UTC.localize(created_at)
                created_timestamp = created_at.timestamp()
            else:
                # Unix timestamp
                created_timestamp = float(created_at)
            
            time_since_creation = time.time() - created_timestamp
            if time_since_creation > (self.code_expiry_minutes * 60):
                return True
            
            # Check rate limit
            time_since_last = time.time() - created_timestamp
            rate_limit_seconds = self.rate_limit_window_minutes * 60
            
            return time_since_last >= rate_limit_seconds
            
        except Exception as e:
            logger.error(f"Error checking rate limit for user {user_id}: {str(e)}")
            return True  # Allow on error
    
    def _send_verification_code_email(self, email: str, code: str, name: str = None) -> Dict[str, Any]:
        """Send verification code email using Brevo."""
        subject = "Verify your Podion AI account"
        
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ text-align: center; margin-bottom: 30px; }}
                    .code-box {{ 
                        background: #f8f9fa; 
                        border: 2px solid #e9ecef; 
                        border-radius: 8px; 
                        padding: 20px; 
                        text-align: center; 
                        margin: 20px 0; 
                    }}
                    .code {{ 
                        font-size: 32px; 
                        font-weight: bold; 
                        color: #007bff; 
                        letter-spacing: 4px; 
                        font-family: 'Courier New', monospace; 
                    }}
                    .footer {{ margin-top: 30px; font-size: 14px; color: #666; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to Podion AI!</h1>
                        <p>Please verify your email address to complete your account setup.</p>
                    </div>
                    
                    <p>Hello {name or 'there'},</p>
                    
                    <p>Thank you for signing up for Podion AI! To complete your account verification, please enter the following 6-digit code:</p>
                    
                    <div class="code-box">
                        <div class="code">{code}</div>
                    </div>
                    
                    <p><strong>Important:</strong></p>
                    <ul>
                        <li>This code will expire in 10 minutes</li>
                        <li>This code can only be used once</li>
                        <li>If you didn't request this code, please ignore this email</li>
                    </ul>
                    
                    <div class="footer">
                        <p>Best regards,<br>The Podion AI Team</p>
                        <p><em>This is an automated message. Please do not reply to this email.</em></p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        text_content = f"""
        Welcome to Podion AI!
        
        Hello {name or 'there'},
        
        Thank you for signing up! Please verify your email address by entering this 6-digit code:
        
        {code}
        
        This code will expire in 10 minutes and can only be used once.
        
        If you didn't request this code, please ignore this email.
        
        Best regards,
        The Podion AI Team
        """
        
        return self.email_service.send_email(
            to_email=email,
            to_name=name or "User",
            subject=subject,
            html_content=html_content,
            text_content=text_content,
            tags=["verification", "onboarding"]
        )
    
    def _send_welcome_email_after_verification(self, user_id: str, email: str) -> Dict[str, Any]:
        """Send welcome email after successful verification."""
        try:
            # Check if welcome email was already sent
            user_ref = self.db.collection("users").document(user_id)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                user_data = user_doc.to_dict()
                if user_data.get("welcome_email_sent", False):
                    logger.info(f"Welcome email already sent to user {user_id}")
                    return {"success": True, "message": "Welcome email already sent"}
            
            # Get user name
            name = "User"
            if user_doc.exists:
                user_data = user_doc.to_dict()
                name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
                if not name:
                    name = "User"
            
            # Send welcome email
            result = self.email_service.send_welcome_email(email, name)
            
            if result["success"]:
                # Mark welcome email as sent
                user_ref.update({"welcome_email_sent": True, "welcome_email_sent_at": firestore.SERVER_TIMESTAMP})
                logger.info(f"Welcome email sent successfully to user {user_id}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error sending welcome email to user {user_id}: {str(e)}")
            return {"success": False, "error": str(e)}

# Global instance - will be lazy-loaded
verification_service = EmailVerificationService()
