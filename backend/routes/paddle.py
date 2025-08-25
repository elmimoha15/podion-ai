"""
FastAPI routes for Paddle subscription management
Handles checkout session creation, webhook processing, and subscription management
"""

import logging
from fastapi import APIRouter, HTTPException, Request, Depends, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime

from utils.paddle_service import paddle_service
from utils.subscription_db import subscription_db
from utils.firebase_auth import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/paddle", tags=["paddle"])

# Pydantic models for request/response validation
class CheckoutRequest(BaseModel):
    """Request model for creating checkout session"""
    plan_id: str = Field(..., description="Plan ID (starter, pro, elite)")
    success_url: Optional[str] = Field(None, description="Success redirect URL")
    cancel_url: Optional[str] = Field(None, description="Cancel redirect URL")

class CheckoutResponse(BaseModel):
    """Response model for checkout session"""
    success: bool
    checkout_url: Optional[str] = None
    session_id: Optional[str] = None
    plan_config: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class SubscriptionResponse(BaseModel):
    """Response model for subscription data"""
    success: bool
    subscription: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@router.post("/create-checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CheckoutRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Create a Paddle checkout session for subscription
    
    This endpoint creates a new Paddle checkout session for the authenticated user
    to subscribe to one of the available plans (starter, pro, elite).
    
    Args:
        request: Checkout request with plan_id and optional URLs
        current_user: Authenticated user from Firebase Auth
        
    Returns:
        CheckoutResponse with checkout URL or error
    """
    try:
        # For now, we'll use a placeholder email since we only have user_id
        # In a real implementation, you'd fetch user details from Firestore
        user_email = f"{user_id}@example.com"
        
        if not user_id or not user_email:
            raise HTTPException(status_code=400, detail="User ID and email are required")
        
        # Validate plan_id
        valid_plans = ["starter", "pro", "elite"]
        if request.plan_id not in valid_plans:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid plan_id. Must be one of: {', '.join(valid_plans)}"
            )
        
        # Check if user already has an active subscription
        current_subscription = await subscription_db.get_user_subscription(user_id)
        if current_subscription and current_subscription.get("plan_id") == request.plan_id:
            return CheckoutResponse(
                success=False,
                error=f"User already subscribed to {request.plan_id} plan"
            )
        
        # Create checkout session
        result = await paddle_service.create_checkout_session(
            plan_id=request.plan_id,
            user_id=user_id,
            user_email=user_email,
            success_url=request.success_url,
            cancel_url=request.cancel_url
        )
        
        if result.get("success"):
            logger.info(f"Checkout session created for user {user_id}, plan {request.plan_id}")
            return CheckoutResponse(
                success=True,
                checkout_url=result.get("checkout_url"),
                session_id=result.get("session_id"),
                plan_config=result.get("plan_config")
            )
        else:
            logger.error(f"Failed to create checkout session: {result.get('error')}")
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to create checkout session"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in create_checkout_session: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/webhook")
async def paddle_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Handle Paddle webhook events
    
    This endpoint receives and processes webhook events from Paddle,
    including transaction completions, subscription changes, and payment failures.
    
    Args:
        request: FastAPI request object with webhook data
        background_tasks: FastAPI background tasks for async processing
        
    Returns:
        200 OK response for successful processing
    """
    try:
        # Get raw body and signature
        body = await request.body()
        signature = request.headers.get("paddle-signature", "")
        
        # Verify webhook signature
        if not paddle_service.verify_webhook_signature(body, signature):
            logger.warning("Invalid Paddle webhook signature")
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Parse webhook data
        try:
            webhook_data = await request.json()
        except Exception as e:
            logger.error(f"Error parsing webhook JSON: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid JSON")
        
        # Process webhook in background
        background_tasks.add_task(process_webhook_background, webhook_data)
        
        # Return 200 OK immediately
        return JSONResponse(content={"status": "received"}, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in paddle_webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def process_webhook_background(webhook_data: Dict[str, Any]):
    """
    Background task to process Paddle webhook events
    
    Args:
        webhook_data: Webhook event data from Paddle
    """
    try:
        # Process the webhook event
        result = paddle_service.process_webhook_event(webhook_data)
        
        if result.get("success"):
            action = result.get("action")
            
            # Handle different actions
            if action == "upgrade_user_plan":
                await handle_user_plan_upgrade(result)
            elif action == "cancel_user_subscription":
                await handle_subscription_cancellation(result)
            elif action == "payment_failed":
                await handle_payment_failure(result)
            else:
                logger.info(f"Webhook processed: {action}")
        else:
            logger.error(f"Webhook processing failed: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Error processing webhook in background: {str(e)}")

async def handle_user_plan_upgrade(result: Dict[str, Any]):
    """Handle user plan upgrade from successful transaction"""
    try:
        user_id = result.get("user_id")
        plan_id = result.get("plan_id")
        transaction_id = result.get("transaction_id")
        customer_id = result.get("customer_id")
        
        if not user_id or not plan_id:
            logger.error("Missing user_id or plan_id in upgrade event")
            return
        
        # Get plan configuration
        plan_config = paddle_service.PLAN_CONFIGS.get(plan_id)
        if not plan_config:
            logger.error(f"Unknown plan_id: {plan_id}")
            return
        
        # Calculate next billing date (30 days from now)
        next_billing = datetime.utcnow().replace(day=1)  # First of next month
        if next_billing.month == 12:
            next_billing = next_billing.replace(year=next_billing.year + 1, month=1)
        else:
            next_billing = next_billing.replace(month=next_billing.month + 1)
        
        # Create subscription data
        subscription_data = {
            "plan_id": plan_id,
            "plan_name": plan_config["name"],
            "status": "active",
            "paddle_transaction_id": transaction_id,
            "paddle_customer_id": customer_id,
            "price_id": plan_config["price_id"],
            "amount": plan_config["price"],
            "currency": plan_config["currency"],
            "billing_cycle": "monthly",
            "next_billing_date": next_billing.isoformat()
        }
        
        # Update database
        success = await subscription_db.create_or_update_subscription(user_id, subscription_data)
        
        if success:
            logger.info(f"User {user_id} upgraded to {plan_id} plan")
        else:
            logger.error(f"Failed to upgrade user {user_id} to {plan_id}")
            
    except Exception as e:
        logger.error(f"Error handling plan upgrade: {str(e)}")

async def handle_subscription_cancellation(result: Dict[str, Any]):
    """Handle subscription cancellation"""
    try:
        user_id = result.get("user_id")
        subscription_id = result.get("subscription_id")
        
        if not user_id:
            logger.error("Missing user_id in cancellation event")
            return
        
        # Cancel subscription in database
        success = await subscription_db.cancel_subscription(user_id)
        
        if success:
            logger.info(f"Subscription canceled for user {user_id}")
        else:
            logger.error(f"Failed to cancel subscription for user {user_id}")
            
    except Exception as e:
        logger.error(f"Error handling subscription cancellation: {str(e)}")

async def handle_payment_failure(result: Dict[str, Any]):
    """Handle payment failure"""
    try:
        transaction_id = result.get("transaction_id")
        customer_id = result.get("customer_id")
        
        # Log payment failure for admin notification
        logger.warning(f"Payment failed - Transaction: {transaction_id}, Customer: {customer_id}")
        
        # Here you could:
        # - Send notification email to admin
        # - Update user status
        # - Trigger retry logic
        # - etc.
        
    except Exception as e:
        logger.error(f"Error handling payment failure: {str(e)}")

@router.get("/subscription", response_model=SubscriptionResponse)
async def get_user_subscription(user_id: str = Depends(get_current_user_id)):
    """
    Get current user's subscription details
    
    Args:
        current_user: Authenticated user from Firebase Auth
        
    Returns:
        SubscriptionResponse with user's subscription data
    """
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        subscription = await subscription_db.get_user_subscription(user_id)
        return SubscriptionResponse(success=True, subscription=subscription)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user subscription: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/invoices")
async def get_user_invoices(
    user_id: str = Depends(get_current_user_id),
    limit: int = Query(10, ge=1, le=50, description="Number of invoices to return")
):
    """
    Get real Paddle invoices for the authenticated user
    """
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Get user's email from Firebase Auth or database
        from firebase_admin import auth
        try:
            user_record = auth.get_user(user_id)
            user_email = user_record.email
        except Exception as e:
            logger.error(f"Failed to get user email: {str(e)}")
            raise HTTPException(status_code=400, detail="User email not found")
        
        if not user_email:
            raise HTTPException(status_code=400, detail="User email is required")
        
        # Fetch invoices from Paddle
        result = await paddle_service.get_user_invoices_by_email(user_email, limit)
        
        if result["success"]:
            return {
                "success": True,
                "invoices": result["invoices"],
                "total_count": result.get("total_count", 0)
            }
        else:
            logger.error(f"Failed to fetch invoices: {result.get('error')}")
            return {
                "success": False,
                "error": result.get("error", "Failed to fetch invoices"),
                "invoices": [],
                "total_count": 0
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user invoices: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/plans")
async def get_available_plans():
    """
    Get all available subscription plans
    
    Returns:
        Dictionary with all available plans and their configurations
    """
    try:
        return {
            "success": True,
            "plans": paddle_service.PLAN_CONFIGS
        }
        
    except Exception as e:
        logger.error(f"Error getting plans: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/subscription")
async def cancel_subscription(user_id: str = Depends(get_current_user_id)):
    """
    Cancel current user's subscription
    
    Args:
        current_user: Authenticated user from Firebase Auth
        
    Returns:
        Success response
    """
    try:
        user_id = current_user.get("uid")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        success = await subscription_db.cancel_subscription(user_id)
        
        if success:
            return {"success": True, "message": "Subscription canceled successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to cancel subscription")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error canceling subscription: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
