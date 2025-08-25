"""
Brevo (Sendinblue) Email Service Utility
Handles transactional email sending using Brevo API.
Based on: https://developers.brevo.com/docs/send-a-transactional-email
"""

import os
import time
import logging
import requests
from typing import List, Dict, Any, Optional
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

logger = logging.getLogger(__name__)

class BrevoEmailService:
    """
    Brevo email service for sending transactional emails.
    Handles email templates, attachments, and error handling.
    """
    
    def __init__(self):
        """
        Initialize Brevo API client with API key from environment.
        If no API key is found, initialize in mock mode for testing.
        """
        # Get API key from environment variable
        self.api_key = os.getenv('BREVO_API_KEY')
        self.mock_mode = False
        self.api_url = "https://api.brevo.com/v3/smtp/email"
        
        if not self.api_key:
            logger.warning("BREVO_API_KEY not found in environment variables - running in MOCK mode")
            self.mock_mode = True
            self.api_instance = None
        else:
            try:
                # Configure Brevo API client using the correct configuration method
                configuration = sib_api_v3_sdk.Configuration()
                configuration.api_key['api-key'] = self.api_key
                
                # Initialize API instance for transactional emails
                self.api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
                
                logger.info("Brevo email service initialized successfully with SDK")
            except Exception as e:
                logger.error(f"Failed to initialize Brevo SDK: {str(e)} - falling back to direct API")
                self.api_instance = None
    
    def send_email(
        self, 
        to_email: str, 
        to_name: str,
        subject: str, 
        html_content: str,
        text_content: Optional[str] = None,
        sender_email: Optional[str] = None,
        sender_name: Optional[str] = None,
        reply_to: Optional[str] = None,
        tags: Optional[List[str]] = None,
        template_id: Optional[int] = None,
        template_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send a transactional email using Brevo API.
        
        Args:
            to_email: Recipient email address
            to_name: Recipient name
            subject: Email subject line
            html_content: HTML email content
            text_content: Plain text email content (optional)
            sender_email: Sender email (defaults to env BREVO_SENDER_EMAIL)
            sender_name: Sender name (defaults to env BREVO_SENDER_NAME)
            reply_to: Reply-to email address
            tags: List of tags for email tracking
            template_id: Brevo template ID (if using template)
            template_params: Template parameters (if using template)
        
        Returns:
            Dict with success status and message ID or error details
        """
        try:
            # Check if running in mock mode
            if self.mock_mode:
                logger.info(f"MOCK MODE: Would send email to {to_email} with subject '{subject}'")
                mock_message_id = f"mock_{int(time.time())}_{to_email.replace('@', '_at_')}"
                
                return {
                    "success": True,
                    "message_id": mock_message_id,
                    "recipient": to_email,
                    "subject": subject,
                    "mock_mode": True,
                    "message": "Email sent successfully (MOCK MODE - no actual email sent)"
                }
            
            # Set default sender info from environment
            if not sender_email:
                sender_email = os.getenv('BREVO_SENDER_EMAIL', 'elmimoha0@gmail.com')
            if not sender_name:
                sender_name = os.getenv('BREVO_SENDER_NAME', 'Podion AI')
            
            # Try SDK first if available, then fallback to direct API
            if self.api_instance:
                try:
                    # Use SDK approach
                    sender = sib_api_v3_sdk.SendSmtpEmailSender(
                        name=sender_name,
                        email=sender_email
                    )
                    
                    to = [sib_api_v3_sdk.SendSmtpEmailTo(
                        email=to_email,
                        name=to_name or "User"
                    )]
                    
                    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                        sender=sender,
                        to=to,
                        subject=subject,
                        html_content=html_content,
                        text_content=text_content,
                        reply_to=sib_api_v3_sdk.SendSmtpEmailReplyTo(email=reply_to) if reply_to else None,
                        tags=tags or [],
                        template_id=template_id,
                        params=template_params or {}
                    )
                    
                    api_response = self.api_instance.send_transac_email(send_smtp_email)
                    
                    logger.info(f"Email sent successfully via SDK to {to_email}. Message ID: {api_response.message_id}")
                    
                    return {
                        "success": True,
                        "message_id": api_response.message_id,
                        "recipient": to_email,
                        "subject": subject
                    }
                    
                except Exception as sdk_error:
                    logger.warning(f"SDK failed, trying direct API: {str(sdk_error)}")
            
            # Fallback to direct API call (we know this works)
            headers = {
                "accept": "application/json",
                "api-key": self.api_key,
                "content-type": "application/json"
            }
            
            payload = {
                "sender": {
                    "name": sender_name,
                    "email": sender_email
                },
                "to": [
                    {
                        "email": to_email,
                        "name": to_name or "User"
                    }
                ],
                "subject": subject
            }
            
            # Add content
            if html_content:
                payload["htmlContent"] = html_content
            if text_content:
                payload["textContent"] = text_content
            
            # Add optional fields
            if reply_to:
                payload["replyTo"] = {"email": reply_to}
            if tags:
                payload["tags"] = tags
            if template_id:
                payload["templateId"] = template_id
            if template_params:
                payload["params"] = template_params
            
            # Send via direct API
            response = requests.post(self.api_url, headers=headers, json=payload)
            
            if response.status_code == 201:
                result = response.json()
                message_id = result.get('messageId', 'unknown')
                
                logger.info(f"Email sent successfully via direct API to {to_email}. Message ID: {message_id}")
                
                return {
                    "success": True,
                    "message_id": message_id,
                    "recipient": to_email,
                    "subject": subject
                }
            else:
                error_msg = f"Brevo API error: {response.status_code}"
                logger.error(f"Failed to send email to {to_email}: {error_msg}")
                logger.error(f"Response: {response.text}")
                
                return {
                    "success": False,
                    "error": error_msg,
                    "error_details": response.text,
                    "recipient": to_email,
                    "subject": subject
                }
            
        except ApiException as e:
            # Get detailed error information
            error_body = getattr(e, 'body', 'No error body')
            error_msg = f"Brevo API error: {e.status} - {e.reason}"
            
            logger.error(f"Failed to send email to {to_email}: {error_msg}")
            logger.error(f"Brevo API error body: {error_body}")
            logger.error(f"Email details - From: {sender_email}, To: {to_email}, Subject: {subject}")
            
            return {
                "success": False,
                "error": error_msg,
                "error_details": str(error_body),
                "recipient": to_email,
                "subject": subject
            }
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"Failed to send email to {to_email}: {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "recipient": to_email
            }
    
    def send_welcome_email(self, user_email: str, user_name: str) -> Dict[str, Any]:
        """
        Send a welcome email to new users.
        Uses a predefined template for consistent branding.
        """
        subject = f"Welcome to Podion AI, {user_name}!"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to Podion AI</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb;">Welcome to Podion AI</h1>
                </div>
                
                <p>Hi {user_name},</p>
                
                <p>Welcome to Podion AI! We're excited to have you on board. Your account has been successfully created and you're ready to start creating amazing podcast content.</p>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1e40af;">What you can do with Podion AI:</h3>
                    <ul>
                        <li>Upload and transcribe podcast episodes</li>
                        <li>Generate SEO-optimized blog posts</li>
                        <li>Create social media content</li>
                        <li>Generate show notes automatically</li>
                        <li>Track your content performance</li>
                    </ul>
                </div>
                
                <p>Ready to get started? <a href="https://podion.ai/dashboard" style="color: #2563eb;">Visit your dashboard</a> to upload your first episode.</p>
                
                <p>If you have any questions, feel free to reach out to our support team.</p>
                
                <p>Best regards,<br>The Podion AI Team</p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="font-size: 12px; color: #6b7280; text-align: center;">
                    This email was sent to {user_email}. If you didn't create an account with Podion AI, please ignore this email.
                </p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=user_email,
            to_name=user_name,
            subject=subject,
            html_content=html_content,
            tags=["welcome", "onboarding"]
        )
    
        return self.send_email(
            to_email=user_email,
            to_name=user_name,
            subject=subject,
            html_content=html_content,
            tags=["processing-complete", "notification"]
        )
    
    def send_test_email(self, to_email: str, to_name: str = "Test User") -> Dict[str, Any]:
        """
        Send a test email to verify Brevo integration is working.
        """
        subject = "Brevo Integration Test - Podion AI"
        
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb;">Brevo Integration Test</h1>
                <p>This is a test email to verify that the Brevo email integration is working correctly.</p>
                <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
                    <strong>✅ Email service is working!</strong>
                </div>
                <p>If you received this email, the Brevo integration is configured properly.</p>
                <p><em>Sent from Podion AI</em></p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["test", "integration"]
        )
    
    def send_password_reset_email(self, user_email: str, user_name: str, reset_token: str) -> Dict[str, Any]:
        """
        Send a password reset email with secure reset link.
        """
        subject = "Reset Your Podion AI Password"
        reset_url = f"https://podion.ai/reset-password?token={reset_token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #dc2626;">Password Reset Request</h1>
                </div>
                
                <p>Hi {user_name},</p>
                
                <p>We received a request to reset your password for your Podion AI account.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" 
                       style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Reset Your Password
                    </a>
                </div>
                
                <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
                
                <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                
                <p>For security, this reset link will only work once.</p>
                
                <p>Best regards,<br>The Podion AI Team</p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="font-size: 12px; color: #6b7280; text-align: center;">
                    If the button doesn't work, copy and paste this link: {reset_url}
                </p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=user_email,
            to_name=user_name,
            subject=subject,
            html_content=html_content,
            tags=["password-reset", "security"]
        )
    
    def send_billing_invoice_email(self, user_email: str, user_name: str, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send billing invoice notification email.
        """
        subject = f"Invoice #{invoice_data.get('invoice_number')} - Podion AI"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Invoice Notification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb;">Invoice Ready</h1>
                </div>
                
                <p>Hi {user_name},</p>
                
                <p>Your invoice for Podion AI is ready. Here are the details:</p>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1e40af;">Invoice Details:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Invoice #:</strong> {invoice_data.get('invoice_number', 'N/A')}</li>
                        <li><strong>Amount:</strong> ${invoice_data.get('amount', '0.00')}</li>
                        <li><strong>Due Date:</strong> {invoice_data.get('due_date', 'N/A')}</li>
                        <li><strong>Plan:</strong> {invoice_data.get('plan_name', 'N/A')}</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{invoice_data.get('invoice_url', '#')}" 
                       style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        View Invoice
                    </a>
                </div>
                
                <p>Payment will be automatically processed on the due date using your saved payment method.</p>
                
                <p>Questions? Reply to this email or contact our support team.</p>
                
                <p>Best regards,<br>The Podion AI Team</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=user_email,
            to_name=user_name,
            subject=subject,
            html_content=html_content,
            tags=["billing", "invoice"]
        )
    
    def send_usage_limit_warning_email(self, user_email: str, user_name: str, usage_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send warning when user approaches usage limits.
        """
        subject = "Usage Limit Warning - Podion AI"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Usage Limit Warning</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #f59e0b;">Usage Limit Warning</h1>
                </div>
                
                <p>Hi {user_name},</p>
                
                <p>You're approaching your monthly usage limits on your current plan:</p>
                
                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <h3 style="margin-top: 0; color: #92400e;">Current Usage:</h3>
                    <ul>
                        <li><strong>Episodes:</strong> {usage_data.get('episodes_used', 0)}/{usage_data.get('episodes_limit', 0)} ({usage_data.get('episodes_percentage', 0)}%)</li>
                        <li><strong>Content Items:</strong> {usage_data.get('content_used', 0)}/{usage_data.get('content_limit', 0)} ({usage_data.get('content_percentage', 0)}%)</li>
                        <li><strong>Storage:</strong> {usage_data.get('storage_used', 0)}MB/{usage_data.get('storage_limit', 0)}MB ({usage_data.get('storage_percentage', 0)}%)</li>
                    </ul>
                </div>
                
                <p>To avoid service interruption, consider upgrading your plan:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://podion.ai/billing" 
                       style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Upgrade Plan
                    </a>
                </div>
                
                <p>Questions about your usage or plans? We're here to help!</p>
                
                <p>Best regards,<br>The Podion AI Team</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=user_email,
            to_name=user_name,
            subject=subject,
            html_content=html_content,
            tags=["usage-warning", "billing"]
        )

# Global email service instance
_email_service = None

def get_email_service() -> BrevoEmailService:
    """
    Get or create the global email service instance.
    Singleton pattern to reuse the same instance.
    """
    global _email_service
    if _email_service is None:
        _email_service = BrevoEmailService()
    return _email_service

# Convenience functions for common email operations
def send_email(to_email: str, to_name: str, subject: str, html_content: str, **kwargs) -> Dict[str, Any]:
    """
    Convenience function to send an email using the global service instance.
    """
    service = get_email_service()
    return service.send_email(to_email, to_name, subject, html_content, **kwargs)

def send_welcome_email(user_email: str, user_name: str) -> Dict[str, Any]:
    """
    Convenience function to send a welcome email.
    """
    service = get_email_service()
    return service.send_welcome_email(user_email, user_name)

def send_processing_complete_email(user_email: str, user_name: str, episode_title: str, episode_id: str) -> Dict[str, Any]:
    """
    Convenience function to send processing complete notification.
    """
    service = get_email_service()
    return service.send_processing_complete_email(user_email, user_name, episode_title, episode_id)

def send_test_email(to_email: str, to_name: str = "Test User") -> Dict[str, Any]:
    """
    Convenience function to send a test email.
    """
    service = get_email_service()
    return service.send_test_email(to_email, to_name)

def send_password_reset_email(user_email: str, user_name: str, reset_token: str) -> Dict[str, Any]:
    """
    Convenience function to send a password reset email.
    """
    service = get_email_service()
    return service.send_password_reset_email(user_email, user_name, reset_token)

def send_billing_invoice_email(user_email: str, user_name: str, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convenience function to send a billing invoice email.
    """
    service = get_email_service()
    return service.send_billing_invoice_email(user_email, user_name, invoice_data)

def send_usage_limit_warning_email(user_email: str, user_name: str, usage_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convenience function to send a usage limit warning email.
    """
    service = get_email_service()
    return service.send_usage_limit_warning_email(user_email, user_name, usage_data)
