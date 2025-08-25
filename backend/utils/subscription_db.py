"""
Database models and utilities for Paddle subscription management
Integrates with existing Firestore database for user subscriptions
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from google.cloud import firestore
from utils.firebase_firestore import get_firestore_client

logger = logging.getLogger(__name__)

class SubscriptionDB:
    """
    Database service for managing user subscriptions in Firestore
    """
    
    def __init__(self):
        """Initialize subscription database service"""
        self.db = None
        self.subscriptions_collection = "user_subscriptions"
        self.users_collection = "users"
    
    def _get_db(self):
        """Lazy initialization of Firestore client"""
        if self.db is None:
            self.db = get_firestore_client()
        return self.db
    
    async def create_or_update_subscription(self, user_id: str, subscription_data: Dict[str, Any]) -> bool:
        """
        Create or update user subscription in Firestore
        
        Args:
            user_id: User ID
            subscription_data: Subscription details
            
        Returns:
            True if successful
        """
        try:
            subscription_doc = {
                "user_id": user_id,
                "plan_id": subscription_data.get("plan_id"),
                "plan_name": subscription_data.get("plan_name"),
                "status": subscription_data.get("status", "active"),
                "paddle_subscription_id": subscription_data.get("paddle_subscription_id"),
                "paddle_customer_id": subscription_data.get("paddle_customer_id"),
                "paddle_transaction_id": subscription_data.get("paddle_transaction_id"),
                "price_id": subscription_data.get("price_id"),
                "amount": subscription_data.get("amount"),
                "currency": subscription_data.get("currency", "USD"),
                "billing_cycle": subscription_data.get("billing_cycle", "monthly"),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "next_billing_date": subscription_data.get("next_billing_date"),
                "trial_end_date": subscription_data.get("trial_end_date"),
                "canceled_at": subscription_data.get("canceled_at"),
                "expires_at": subscription_data.get("expires_at")
            }
            
            # Store subscription
            db = self._get_db()
            subscription_ref = db.collection(self.subscriptions_collection).document(user_id)
            subscription_ref.set(subscription_doc, merge=True)
            
            # Update user document with current plan
            user_ref = db.collection(self.users_collection).document(user_id)
            user_ref.update({
                "current_plan": subscription_data.get("plan_id", "free"),
                "subscription_status": subscription_data.get("status", "active"),
                "subscription_updated_at": datetime.utcnow().isoformat()
            })
            
            logger.info(f"Subscription updated for user {user_id}: {subscription_data.get('plan_id')}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating subscription for user {user_id}: {str(e)}")
            return False
    
    async def get_user_subscription(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user's current subscription
        
        Args:
            user_id: User ID
            
        Returns:
            Subscription data or None
        """
        try:
            db = self._get_db()
            subscription_ref = db.collection(self.subscriptions_collection).document(user_id)
            subscription_doc = subscription_ref.get()
            
            if subscription_doc.exists:
                return subscription_doc.to_dict()
            else:
                # Return free plan as default
                return {
                    "user_id": user_id,
                    "plan_id": "free",
                    "plan_name": "Free Plan",
                    "status": "active",
                    "created_at": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error getting subscription for user {user_id}: {str(e)}")
            return None
    
    async def cancel_subscription(self, user_id: str, canceled_at: str = None) -> bool:
        """
        Cancel user subscription
        
        Args:
            user_id: User ID
            canceled_at: Cancellation timestamp
            
        Returns:
            True if successful
        """
        try:
            if not canceled_at:
                canceled_at = datetime.utcnow().isoformat()
            
            # Update subscription status
            db = self._get_db()
            subscription_ref = db.collection(self.subscriptions_collection).document(user_id)
            subscription_ref.update({
                "status": "canceled",
                "canceled_at": canceled_at,
                "updated_at": datetime.utcnow().isoformat()
            })
            
            # Update user document
            user_ref = db.collection(self.users_collection).document(user_id)
            user_ref.update({
                "subscription_status": "canceled",
                "subscription_updated_at": datetime.utcnow().isoformat()
            })
            
            logger.info(f"Subscription canceled for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error canceling subscription for user {user_id}: {str(e)}")
            return False
    
    async def downgrade_to_free(self, user_id: str) -> bool:
        """
        Downgrade user to free plan
        
        Args:
            user_id: User ID
            
        Returns:
            True if successful
        """
        try:
            free_plan_data = {
                "plan_id": "free",
                "plan_name": "Free Plan",
                "status": "active",
                "paddle_subscription_id": None,
                "paddle_customer_id": None,
                "amount": 0,
                "currency": "USD"
            }
            
            return await self.create_or_update_subscription(user_id, free_plan_data)
            
        except Exception as e:
            logger.error(f"Error downgrading user {user_id} to free: {str(e)}")
            return False
    
    async def get_subscription_stats(self) -> Dict[str, Any]:
        """
        Get subscription statistics for admin dashboard
        
        Returns:
            Dictionary with subscription stats
        """
        try:
            db = self._get_db()
            subscriptions_ref = db.collection(self.subscriptions_collection)
            all_subscriptions = list(subscriptions_ref.stream())
            
            stats = {
                "total_subscriptions": len(all_subscriptions),
                "active_subscriptions": 0,
                "canceled_subscriptions": 0,
                "plan_distribution": {
                    "free": 0,
                    "starter": 0,
                    "pro": 0,
                    "elite": 0
                },
                "monthly_revenue": 0
            }
            
            for sub_doc in all_subscriptions:
                sub_data = sub_doc.to_dict()
                status = sub_data.get("status", "active")
                plan_id = sub_data.get("plan_id", "free")
                amount = sub_data.get("amount", 0) or 0
                
                if status == "active":
                    stats["active_subscriptions"] += 1
                    stats["monthly_revenue"] += amount
                elif status == "canceled":
                    stats["canceled_subscriptions"] += 1
                
                if plan_id in stats["plan_distribution"]:
                    stats["plan_distribution"][plan_id] += 1
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting subscription stats: {str(e)}")
            return {}
    
    async def get_users_by_plan(self, plan_id: str) -> List[Dict[str, Any]]:
        """
        Get all users on a specific plan
        
        Args:
            plan_id: Plan identifier
            
        Returns:
            List of user subscription data
        """
        try:
            db = self._get_db()
            subscriptions_ref = db.collection(self.subscriptions_collection)
            query = subscriptions_ref.where("plan_id", "==", plan_id).where("status", "==", "active")
            
            users = []
            for doc in query.stream():
                users.append(doc.to_dict())
            
            return users
            
        except Exception as e:
            logger.error(f"Error getting users by plan {plan_id}: {str(e)}")
            return []

# Global subscription database instance
subscription_db = SubscriptionDB()
