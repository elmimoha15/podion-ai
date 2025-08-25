"""
Billing and usage tracking API endpoints
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from utils.usage_tracking import get_user_usage_stats, get_user_billing_history, track_usage_event

logger = logging.getLogger(__name__)

router = APIRouter()

class UsageStatsResponse(BaseModel):
    success: bool
    usage_stats: Optional[Dict[str, Any]] = None
    user_id: str
    error: Optional[str] = None

class BillingHistoryResponse(BaseModel):
    success: bool
    billing_history: Optional[List[Dict[str, Any]]] = None
    user_id: str
    count: int = 0
    error: Optional[str] = None

class UsageEventRequest(BaseModel):
    event_type: str
    metadata: Optional[Dict[str, Any]] = None

class UsageEventResponse(BaseModel):
    success: bool
    event_id: Optional[str] = None
    error: Optional[str] = None

@router.get("/usage/{user_id}", response_model=UsageStatsResponse)
async def get_user_usage_endpoint(user_id: str, period_days: int = 30):
    """
    Get comprehensive usage statistics for a user
    
    Returns detailed usage data including episodes, content generation,
    storage usage, API usage, and estimated costs.
    """
    
    try:
        logger.info(f"Getting usage stats for user {user_id} (period: {period_days} days)")
        
        usage_stats = get_user_usage_stats(user_id, period_days)
        
        if not usage_stats:
            return UsageStatsResponse(
                success=False,
                user_id=user_id,
                error="No usage data found or failed to retrieve usage stats"
            )
        
        return UsageStatsResponse(
            success=True,
            usage_stats=usage_stats,
            user_id=user_id
        )
        
    except Exception as e:
        logger.error(f"Failed to get usage stats for user {user_id}: {str(e)}")
        
        return UsageStatsResponse(
            success=False,
            user_id=user_id,
            error=f"Failed to get usage stats: {str(e)}"
        )

@router.get("/billing-history/{user_id}", response_model=BillingHistoryResponse)
async def get_billing_history_endpoint(user_id: str, limit: int = 12):
    """
    Get billing history for a user
    
    Returns historical billing records with usage data for each period.
    """
    
    try:
        if limit > 24:
            limit = 24  # Maximum 2 years of history
        
        logger.info(f"Getting billing history for user {user_id} (limit: {limit})")
        
        billing_history = get_user_billing_history(user_id, limit)
        
        return BillingHistoryResponse(
            success=True,
            billing_history=billing_history,
            user_id=user_id,
            count=len(billing_history)
        )
        
    except Exception as e:
        logger.error(f"Failed to get billing history for user {user_id}: {str(e)}")
        
        return BillingHistoryResponse(
            success=False,
            user_id=user_id,
            count=0,
            error=f"Failed to get billing history: {str(e)}"
        )

@router.post("/usage-event/{user_id}", response_model=UsageEventResponse)
async def track_usage_event_endpoint(user_id: str, event_request: UsageEventRequest):
    """
    Track a usage event for billing purposes
    
    Records usage events like episode uploads, content generation, API calls, etc.
    """
    
    try:
        logger.info(f"Tracking usage event for user {user_id}: {event_request.event_type}")
        
        success = track_usage_event(
            user_id=user_id,
            event_type=event_request.event_type,
            metadata=event_request.metadata
        )
        
        if success:
            return UsageEventResponse(
                success=True,
                event_id=f"evt_{user_id}_{event_request.event_type}"
            )
        else:
            return UsageEventResponse(
                success=False,
                error="Failed to track usage event"
            )
        
    except Exception as e:
        logger.error(f"Failed to track usage event for user {user_id}: {str(e)}")
        
        return UsageEventResponse(
            success=False,
            error=f"Failed to track usage event: {str(e)}"
        )

@router.get("/current-plan/{user_id}")
async def get_current_plan_endpoint(user_id: str):
    """
    Get current subscription plan for a user
    
    Returns plan details, billing cycle, and next billing date.
    """
    
    try:
        logger.info(f"Getting current plan for user {user_id}")
        
        # For now, return mock plan data
        # In production, this would query a subscriptions collection
        
        current_plan = {
            "plan_id": "prof_monthly",
            "name": "Professional",
            "price": 79.00,
            "currency": "USD",
            "billing_cycle": "monthly",
            "status": "active",
            "next_billing_date": "2025-09-18T00:00:00Z",
            "features": [
                "25 episodes per month",
                "Advanced SEO content",
                "All social platforms",
                "Custom templates",
                "Priority support"
            ],
            "limits": {
                "episodes_per_month": 25,
                "content_generation_per_month": 100,
                "storage_gb": 10
            }
        }
        
        return {
            "success": True,
            "plan": current_plan,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Failed to get current plan for user {user_id}: {str(e)}")
        
        return {
            "success": False,
            "user_id": user_id,
            "error": f"Failed to get current plan: {str(e)}"
        }

@router.get("/usage-limits/{user_id}")
async def get_usage_limits_endpoint(user_id: str):
    """
    Get usage limits and current usage for a user's plan
    
    Returns plan limits and current usage to show progress bars and warnings.
    """
    
    try:
        logger.info(f"Getting usage limits for user {user_id}")
        
        # Get current usage
        usage_stats = get_user_usage_stats(user_id, period_days=30)
        
        # Get plan limits (mock data for now)
        plan_limits = {
            "episodes_per_month": 25,
            "content_generation_per_month": 100,
            "storage_gb": 10
        }
        
        # Calculate usage percentages
        current_usage = {
            "episodes": {
                "used": usage_stats.get("episodes", {}).get("total", 0),
                "limit": plan_limits["episodes_per_month"],
                "percentage": min(100, (usage_stats.get("episodes", {}).get("total", 0) / plan_limits["episodes_per_month"]) * 100)
            },
            "content_generation": {
                "used": usage_stats.get("content_generation", {}).get("total_items", 0),
                "limit": plan_limits["content_generation_per_month"],
                "percentage": min(100, (usage_stats.get("content_generation", {}).get("total_items", 0) / plan_limits["content_generation_per_month"]) * 100)
            },
            "storage": {
                "used": usage_stats.get("storage", {}).get("total_mb", 0) / 1024,  # Convert to GB
                "limit": plan_limits["storage_gb"],
                "percentage": min(100, (usage_stats.get("storage", {}).get("total_mb", 0) / 1024 / plan_limits["storage_gb"]) * 100)
            }
        }
        
        return {
            "success": True,
            "usage": current_usage,
            "limits": plan_limits,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Failed to get usage limits for user {user_id}: {str(e)}")
        
        return {
            "success": False,
            "user_id": user_id,
            "error": f"Failed to get usage limits: {str(e)}"
        }
