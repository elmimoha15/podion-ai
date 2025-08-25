"""
Paddle subscription service for Podion AI SaaS platform
Handles checkout session creation, webhook processing, and subscription management
"""

import os
import logging
import httpx
import hmac
import hashlib
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
import base64

logger = logging.getLogger(__name__)

class PaddleService:
    """
    Paddle subscription service for managing SaaS subscriptions
    """
    
    def __init__(self):
        """Initialize Paddle service with credentials from environment"""
        self.api_key = os.getenv('PADDLE_API_KEY')
        self.webhook_secret = os.getenv('PADDLE_WEBHOOK_SECRET')
        self.environment = os.getenv('PADDLE_ENVIRONMENT', 'sandbox')  # 'sandbox' or 'production'
        
        # Paddle API endpoints (current API structure)
        if self.environment == 'production':
            self.api_base_url = "https://api.paddle.com"
        else:
            self.api_base_url = "https://sandbox-api.paddle.com"
        
        if not self.api_key:
            logger.warning("Paddle API key not found in environment variables")
            self.configured = False
            return
            
        self.configured = True
        logger.info(f"Paddle service initialized in {self.environment} mode")
    
    # Plan configurations matching your Paddle Catalog
    PLAN_CONFIGS = {
        "starter": {
            "name": "Starter Plan",
            "price_id": "pri_01k361dv20d9j4prp20kddnra1",
            "price": 10.00,
            "currency": "USD",
            "description": "Perfect for getting started - 5 episodes per month",
            "features": [
                "5 episodes per month",
                "Basic SEO content",
                "Email support",
                "Basic analytics"
            ]
        },
        "pro": {
            "name": "Pro Plan", 
            "price_id": "pri_01k361efwxa954axxmjnc1vmns",
            "price": 29.00,
            "currency": "USD",
            "description": "For growing podcasts - 25 episodes per month",
            "features": [
                "25 episodes per month",
                "Advanced SEO content",
                "Priority support",
                "Advanced analytics",
                "Custom templates"
            ]
        },
        "elite": {
            "name": "Elite Plan",
            "price_id": "pri_01k361f4zw7y10rpdzt0m7kcdv", 
            "price": 69.00,
            "currency": "USD",
            "description": "For podcast networks - unlimited episodes",
            "features": [
                "Unlimited episodes",
                "White-label options",
                "Dedicated support",
                "Advanced integrations",
                "Custom branding"
            ]
        }
    }
    
    async def create_checkout_session(self, plan_id: str, user_id: str, user_email: str, 
                                    success_url: str = None, cancel_url: str = None) -> Dict[str, Any]:
        """
        Create a Paddle checkout session for subscription
        
        Args:
            plan_id: Plan identifier (starter, pro, elite)
            user_id: User ID from your system
            user_email: User's email address
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect after canceled payment
            
        Returns:
            Dictionary with checkout session details
        """
        if not self.configured:
            return {"success": False, "error": "Paddle not configured"}
            
        try:
            # Validate plan
            if plan_id not in self.PLAN_CONFIGS:
                return {"success": False, "error": f"Invalid plan_id: {plan_id}"}
            
            plan_config = self.PLAN_CONFIGS[plan_id]
            price_id = plan_config["price_id"]
            
            # Default URLs if not provided
            if not success_url:
                success_url = "https://podion-ai-8270d.web.app/billing?success=true"
            if not cancel_url:
                cancel_url = "https://podion-ai-8270d.web.app/billing?canceled=true"
            
            # Prepare transaction data for current Paddle API
            transaction_data = {
                "items": [
                    {
                        "price_id": price_id,
                        "quantity": 1
                    }
                ],
                "customer_email": user_email,
                "custom_data": {
                    "user_id": user_id,
                    "plan_id": plan_id
                },
                "checkout": {
                    "url": success_url
                }
            }
            
            # Make API call to Paddle with correct headers
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base_url}/transactions",
                    json=transaction_data,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 201:
                    result = response.json()
                    transaction_data_response = result.get("data", {})
                    transaction_id = transaction_data_response.get("id")
                    checkout_url = transaction_data_response.get("checkout", {}).get("url")
                    
                    if transaction_id:
                        # If checkout URL is provided in response, use it; otherwise return transaction ID for frontend handling
                        if checkout_url:
                            logger.info(f"Paddle transaction created with checkout URL for user {user_id}, plan {plan_id}")
                            return {
                                "success": True,
                                "checkout_url": checkout_url,
                                "transaction_id": transaction_id,
                                "plan_config": plan_config
                            }
                        else:
                            # Return transaction ID for frontend to handle with Paddle.js
                            logger.info(f"Paddle transaction created for user {user_id}, plan {plan_id}")
                            return {
                                "success": True,
                                "transaction_id": transaction_id,
                                "plan_config": plan_config,
                                "use_paddle_js": True  # Signal frontend to use Paddle.js
                            }
                    else:
                        logger.error(f"No transaction ID in Paddle response: {result}")
                        return {"success": False, "error": "No transaction ID returned"}
                else:
                    error_text = response.text
                    logger.error(f"Paddle API error: {response.status_code} - {error_text}")
                    return {"success": False, "error": f"Paddle API error: {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Error creating Paddle checkout session: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def verify_webhook_signature(self, body: bytes, signature: str) -> bool:
        """
        Verify Paddle webhook signature
        
        Args:
            body: Raw request body as bytes
            signature: Paddle-Signature header value
            
        Returns:
            True if signature is valid
        """
        if not self.webhook_secret:
            logger.warning("Paddle webhook secret not configured")
            return True  # Allow for development
            
        try:
            # Parse signature header
            # Format: "ts=1234567890;h1=signature"
            sig_parts = {}
            for part in signature.split(';'):
                if '=' in part:
                    key, value = part.split('=', 1)
                    sig_parts[key] = value
            
            timestamp = sig_parts.get('ts')
            signature_hash = sig_parts.get('h1')
            
            if not timestamp or not signature_hash:
                logger.error("Invalid signature format")
                return False
            
            # Create expected signature
            payload = f"{timestamp}:{body.decode('utf-8')}"
            expected_signature = hmac.new(
                self.webhook_secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            return hmac.compare_digest(signature_hash, expected_signature)
            
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {str(e)}")
            return False
    
    def process_webhook_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process Paddle webhook event
        
        Args:
            event_data: Webhook event data from Paddle
            
        Returns:
            Dictionary with processing result
        """
        try:
            event_type = event_data.get("event_type")
            data = event_data.get("data", {})
            
            logger.info(f"Processing Paddle webhook event: {event_type}")
            
            # Handle different event types
            if event_type == "transaction.completed":
                return self._handle_transaction_completed(data)
            elif event_type == "subscription.created":
                return self._handle_subscription_created(data)
            elif event_type == "subscription.updated":
                return self._handle_subscription_updated(data)
            elif event_type == "subscription.canceled":
                return self._handle_subscription_canceled(data)
            elif event_type == "transaction.payment_failed":
                return self._handle_payment_failed(data)
            else:
                logger.info(f"Unhandled Paddle webhook event: {event_type}")
                return {"success": True, "message": "Event logged"}
                
        except Exception as e:
            logger.error(f"Error processing Paddle webhook: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _handle_transaction_completed(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle successful transaction completion"""
        try:
            # Extract relevant data
            transaction_id = data.get("id")
            customer_id = data.get("customer_id")
            custom_data = data.get("custom_data", {})
            user_id = custom_data.get("user_id")
            plan_id = custom_data.get("plan_id")
            
            # Get subscription details from items
            items = data.get("details", {}).get("line_items", [])
            if items:
                price_id = items[0].get("price", {}).get("id")
                
                # Find matching plan
                matching_plan = None
                for plan_key, plan_config in self.PLAN_CONFIGS.items():
                    if plan_config["price_id"] == price_id:
                        matching_plan = plan_key
                        break
                
                if matching_plan and user_id:
                    logger.info(f"Transaction completed for user {user_id}, plan {matching_plan}")
                    
                    # Here you would update your database
                    # For now, we'll return the data for the route handler to process
                    return {
                        "success": True,
                        "action": "upgrade_user_plan",
                        "user_id": user_id,
                        "plan_id": matching_plan,
                        "transaction_id": transaction_id,
                        "customer_id": customer_id
                    }
            
            logger.warning(f"Could not process transaction completion: missing data")
            return {"success": True, "message": "Transaction logged but not processed"}
            
        except Exception as e:
            logger.error(f"Error handling transaction completion: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _handle_subscription_created(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle subscription creation"""
        subscription_id = data.get("id")
        customer_id = data.get("customer_id")
        status = data.get("status")
        
        logger.info(f"Subscription created: {subscription_id}, status: {status}")
        
        return {
            "success": True,
            "action": "subscription_created",
            "subscription_id": subscription_id,
            "customer_id": customer_id,
            "status": status
        }
    
    def _handle_subscription_updated(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle subscription updates"""
        subscription_id = data.get("id")
        status = data.get("status")
        
        logger.info(f"Subscription updated: {subscription_id}, status: {status}")
        
        return {
            "success": True,
            "action": "subscription_updated", 
            "subscription_id": subscription_id,
            "status": status
        }
    
    def _handle_subscription_canceled(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle subscription cancellation"""
        subscription_id = data.get("id")
        customer_id = data.get("customer_id")
        custom_data = data.get("custom_data", {})
        user_id = custom_data.get("user_id")
        
        logger.info(f"Subscription canceled: {subscription_id} for user {user_id}")
        
        return {
            "success": True,
            "action": "cancel_user_subscription",
            "user_id": user_id,
            "subscription_id": subscription_id,
            "customer_id": customer_id
        }
    
    def _handle_payment_failed(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle payment failures"""
        transaction_id = data.get("id")
        customer_id = data.get("customer_id")
        
        logger.warning(f"Payment failed for transaction {transaction_id}, customer {customer_id}")
        
        return {
            "success": True,
            "action": "payment_failed",
            "transaction_id": transaction_id,
            "customer_id": customer_id
        }
    
    async def get_customer_invoices(self, customer_id: str, limit: int = 10) -> Dict[str, Any]:
        """
        Get invoices for a specific customer from Paddle
        
        Args:
            customer_id: Paddle customer ID
            limit: Maximum number of invoices to return
            
        Returns:
            Dict containing success status and invoice data
        """
        if not self.configured:
            return {"success": False, "error": "Paddle service not configured"}
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Paddle API endpoint for invoices
            url = f"{self.api_base_url}/invoices"
            params = {
                "customer_id": customer_id,
                "per_page": limit,
                "order_by": "created_at[desc]"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    invoices = data.get("data", [])
                    
                    # Format invoices for frontend consumption
                    formatted_invoices = []
                    for invoice in invoices:
                        formatted_invoice = {
                            "id": invoice.get("id"),
                            "number": invoice.get("number"),
                            "status": invoice.get("status"),
                            "amount": {
                                "total": invoice.get("totals", {}).get("total", "0"),
                                "currency": invoice.get("currency_code", "USD")
                            },
                            "created_at": invoice.get("created_at"),
                            "updated_at": invoice.get("updated_at"),
                            "pdf_url": invoice.get("invoice_pdf"),
                            "customer_id": invoice.get("customer_id"),
                            "subscription_id": invoice.get("subscription_id"),
                            "billing_period": {
                                "starts_at": invoice.get("billing_period", {}).get("starts_at"),
                                "ends_at": invoice.get("billing_period", {}).get("ends_at")
                            }
                        }
                        formatted_invoices.append(formatted_invoice)
                    
                    logger.info(f"Retrieved {len(formatted_invoices)} invoices for customer {customer_id}")
                    return {
                        "success": True,
                        "invoices": formatted_invoices,
                        "total_count": data.get("meta", {}).get("pagination", {}).get("total", len(formatted_invoices))
                    }
                else:
                    logger.error(f"Failed to fetch invoices: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"Paddle API error: {response.status_code}"
                    }
                    
        except Exception as e:
            logger.error(f"Error fetching customer invoices: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to fetch invoices: {str(e)}"
            }
    
    async def get_user_invoices_by_email(self, user_email: str, limit: int = 10) -> Dict[str, Any]:
        """
        Get invoices for a user by their email address
        First finds the customer, then fetches their invoices
        
        Args:
            user_email: User's email address
            limit: Maximum number of invoices to return
            
        Returns:
            Dict containing success status and invoice data
        """
        if not self.configured:
            return {"success": False, "error": "Paddle service not configured"}
        
        try:
            # First, find the customer by email
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Search for customer by email
            url = f"{self.api_base_url}/customers"
            params = {
                "email": user_email,
                "per_page": 1
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    customers = data.get("data", [])
                    
                    if not customers:
                        logger.info(f"No customer found for email: {user_email}")
                        return {
                            "success": True,
                            "invoices": [],
                            "total_count": 0
                        }
                    
                    customer_id = customers[0].get("id")
                    logger.info(f"Found customer {customer_id} for email {user_email}")
                    
                    # Now fetch invoices for this customer
                    return await self.get_customer_invoices(customer_id, limit)
                else:
                    logger.error(f"Failed to find customer: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"Failed to find customer: {response.status_code}"
                    }
                    
        except Exception as e:
            logger.error(f"Error fetching user invoices by email: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to fetch invoices: {str(e)}"
            }

# Global Paddle service instance
paddle_service = PaddleService()
