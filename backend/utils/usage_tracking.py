"""
Usage tracking utilities for billing and analytics
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from google.cloud import firestore
from .firebase_firestore import get_firestore_client

logger = logging.getLogger(__name__)

def get_user_usage_stats(user_id: str, period_days: int = 30) -> Dict[str, Any]:
    """
    Get comprehensive usage statistics for a user within a specified period
    
    Args:
        user_id: User ID to get usage for
        period_days: Number of days to look back (default: 30 for monthly)
    
    Returns:
        Dictionary with detailed usage statistics
    """
    
    try:
        db = get_firestore_client()
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=period_days)
        
        # Get all podcasts for user (remove date filtering for now to ensure we get episodes)
        query = db.collection("podcasts").where("user_id", "==", user_id)
        docs = list(query.stream())
        
        logger.info(f"Found {len(docs)} total podcasts for user {user_id}")
        
        # Initialize usage counters
        usage_stats = {
            "period_days": period_days,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "episodes": {
                "total": 0,
                "with_transcripts": 0,
                "with_seo_content": 0,
                "with_social_posts": 0
            },
            "content_generation": {
                "blog_posts": 0,
                "social_media_posts": 0,
                "show_notes": 0,
                "transcripts": 0,
                "total_items": 0
            },
            "storage": {
                "total_mb": 0,
                "audio_files_mb": 0,
                "content_mb": 0
            },
            "api_usage": {
                "deepgram_minutes": 0,
                "gemini_requests": 0,
                "total_words_processed": 0
            },
            "costs": {
                "estimated_deepgram": 0.0,
                "estimated_gemini": 0.0,
                "estimated_storage": 0.0,
                "total_estimated": 0.0
            }
        }
        
        # Process each podcast
        for doc in docs:
            data = doc.to_dict()
            
            # For now, count all episodes regardless of date to ensure accurate billing
            # TODO: Add proper date filtering for monthly billing cycles later
            
            # Count episodes
            usage_stats["episodes"]["total"] += 1
            
            # Count content types
            if data.get("transcript"):
                usage_stats["episodes"]["with_transcripts"] += 1
                usage_stats["content_generation"]["transcripts"] += 1
                
                # Count transcript words for API usage
                word_count = data.get("transcript", {}).get("word_count", 0)
                usage_stats["api_usage"]["total_words_processed"] += word_count
            
            if data.get("seo_content"):
                usage_stats["episodes"]["with_seo_content"] += 1
                seo_content = data["seo_content"]
                
                # Count blog posts
                if seo_content.get("blog_post"):
                    usage_stats["content_generation"]["blog_posts"] += 1
                
                # Count social media posts
                if seo_content.get("social_media_posts"):
                    social_posts = seo_content["social_media_posts"]
                    if isinstance(social_posts, list):
                        usage_stats["content_generation"]["social_media_posts"] += len(social_posts)
                        usage_stats["episodes"]["with_social_posts"] += 1
                    elif social_posts:
                        usage_stats["content_generation"]["social_media_posts"] += 1
                        usage_stats["episodes"]["with_social_posts"] += 1
                
                # Count show notes
                if seo_content.get("show_notes"):
                    usage_stats["content_generation"]["show_notes"] += 1
                
                # Count Gemini API requests (estimate)
                usage_stats["api_usage"]["gemini_requests"] += 1
            
            # Calculate storage usage
            file_size = data.get("file_size", 0) or 0  # Handle None values
            if file_size > 0:
                usage_stats["storage"]["total_mb"] += file_size / (1024 * 1024)
                usage_stats["storage"]["audio_files_mb"] += file_size / (1024 * 1024)
            
            # Estimate content storage (rough estimate)
            content_size_estimate = 0
            if data.get("transcript"):
                content_size_estimate += len(str(data["transcript"])) / 1024  # KB
            if data.get("seo_content"):
                content_size_estimate += len(str(data["seo_content"])) / 1024  # KB
            
            usage_stats["storage"]["content_mb"] += content_size_estimate / 1024  # Convert to MB
            
            # Estimate Deepgram usage (audio duration)
            duration = data.get("metadata", {}).get("duration", 0) or 0  # Handle None values
            if duration and duration > 0:
                usage_stats["api_usage"]["deepgram_minutes"] += duration / 60
        
        # Calculate total content items
        content_gen = usage_stats["content_generation"]
        usage_stats["content_generation"]["total_items"] = (
            content_gen["blog_posts"] + 
            content_gen["social_media_posts"] + 
            content_gen["show_notes"] + 
            content_gen["transcripts"]
        )
        
        # Estimate costs (rough estimates based on typical API pricing)
        costs = usage_stats["costs"]
        costs["estimated_deepgram"] = usage_stats["api_usage"]["deepgram_minutes"] * 0.0048  # ~$0.0048/minute
        costs["estimated_gemini"] = usage_stats["api_usage"]["gemini_requests"] * 0.002  # ~$0.002/request
        costs["estimated_storage"] = usage_stats["storage"]["total_mb"] * 0.00002  # ~$0.02/GB/month
        costs["total_estimated"] = costs["estimated_deepgram"] + costs["estimated_gemini"] + costs["estimated_storage"]
        
        # Round storage values
        usage_stats["storage"]["total_mb"] = round(usage_stats["storage"]["total_mb"], 2)
        usage_stats["storage"]["audio_files_mb"] = round(usage_stats["storage"]["audio_files_mb"], 2)
        usage_stats["storage"]["content_mb"] = round(usage_stats["storage"]["content_mb"], 2)
        
        # Round API usage
        usage_stats["api_usage"]["deepgram_minutes"] = round(usage_stats["api_usage"]["deepgram_minutes"], 2)
        
        # Round costs
        for key in costs:
            costs[key] = round(costs[key], 4)
        
        logger.info(f"Retrieved usage stats for user {user_id}: {usage_stats['episodes']['total']} episodes, {usage_stats['content_generation']['total_items']} content items")
        
        return usage_stats
        
    except Exception as e:
        logger.error(f"Failed to get usage stats for user {user_id}: {str(e)}")
        return {}

def get_user_billing_history(user_id: str, limit: int = 12) -> List[Dict[str, Any]]:
    """
    Get billing history for a user (placeholder for future implementation)
    
    Args:
        user_id: User ID to get billing history for
        limit: Maximum number of billing records to return
    
    Returns:
        List of billing history records
    """
    
    try:
        # For now, return mock billing history
        # In production, this would query a billing/payments collection
        
        current_date = datetime.now()
        billing_history = []
        
        for i in range(min(limit, 6)):  # Generate last 6 months
            month_date = current_date - timedelta(days=30 * i)
            
            # Get usage for that month
            month_usage = get_user_usage_stats(user_id, period_days=30)
            
            billing_record = {
                "id": f"inv_{month_date.strftime('%Y%m')}_{user_id[:8]}",
                "date": month_date.isoformat(),
                "period_start": (month_date - timedelta(days=30)).isoformat(),
                "period_end": month_date.isoformat(),
                "status": "paid" if i > 0 else "current",
                "amount": 79.00,  # Professional plan price
                "currency": "USD",
                "plan": "Professional",
                "usage": {
                    "episodes": month_usage.get("episodes", {}).get("total", 0),
                    "content_items": month_usage.get("content_generation", {}).get("total_items", 0),
                    "storage_mb": month_usage.get("storage", {}).get("total_mb", 0)
                }
            }
            
            billing_history.append(billing_record)
        
        return billing_history
        
    except Exception as e:
        logger.error(f"Failed to get billing history for user {user_id}: {str(e)}")
        return []

def track_usage_event(user_id: str, event_type: str, metadata: Dict[str, Any] = None) -> bool:
    """
    Track a usage event for billing purposes (placeholder for future implementation)
    
    Args:
        user_id: User ID
        event_type: Type of event (e.g., 'episode_upload', 'content_generation', 'api_call')
        metadata: Additional event metadata
    
    Returns:
        True if event was tracked successfully
    """
    
    try:
        # For now, just log the event
        # In production, this would store events in a usage_events collection
        
        logger.info(f"Usage event tracked - User: {user_id}, Type: {event_type}, Metadata: {metadata}")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to track usage event: {str(e)}")
        return False
