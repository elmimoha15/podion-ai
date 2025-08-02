import os
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
import firebase_admin
from firebase_admin import firestore
from fastapi import HTTPException
import uuid

logger = logging.getLogger(__name__)

def get_firestore_client():
    """Get Firestore client instance"""
    try:
        # Firebase Admin SDK should already be initialized
        if not firebase_admin._apps:
            raise ValueError("Firebase Admin SDK not initialized")
        
        db = firestore.client()
        return db
    except Exception as e:
        logger.error(f"Failed to get Firestore client: {e}")
        raise HTTPException(status_code=500, detail="Firestore database not available")

def generate_workspace_id() -> str:
    """Generate unique workspace ID"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"workspace_{timestamp}_{unique_id}"

def create_workspace(
    user_id: str,
    name: str,
    description: Optional[str] = None
) -> str:
    """
    Create a new workspace for a user
    
    Args:
        user_id: User ID who owns the workspace
        name: Workspace name (required)
        description: Workspace description (optional)
    
    Returns:
        workspace_id: ID of created workspace
    """
    
    try:
        db = get_firestore_client()
        
        # Generate unique workspace ID
        workspace_id = generate_workspace_id()
        
        # Prepare workspace document
        workspace_doc = {
            "name": name.strip(),
            "description": description.strip() if description else "",
            "user_id": user_id,
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP,
            "metadata": {
                "version": "1.0",
                "podcast_count": 0
            }
        }
        
        # Save to Firestore: users/{user_id}/workspaces/{workspace_id}
        doc_ref = db.collection("users").document(user_id).collection("workspaces").document(workspace_id)
        doc_ref.set(workspace_doc)
        
        logger.info(f"Created workspace: {workspace_id} for user: {user_id}")
        
        return workspace_id
        
    except Exception as e:
        logger.error(f"Failed to create workspace: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create workspace: {str(e)}"
        )

def get_workspace(user_id: str, workspace_id: str) -> Dict[str, Any]:
    """
    Get a specific workspace by ID
    
    Args:
        user_id: User ID who owns the workspace
        workspace_id: Workspace ID to retrieve
    
    Returns:
        Workspace data dictionary
    """
    
    try:
        db = get_firestore_client()
        
        # Get workspace document
        doc_ref = db.collection("users").document(user_id).collection("workspaces").document(workspace_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Workspace not found: {workspace_id}"
            )
        
        workspace_data = doc.to_dict()
        workspace_data["id"] = workspace_id
        
        # Convert timestamps to ISO format
        if workspace_data.get("created_at"):
            workspace_data["created_at"] = workspace_data["created_at"].isoformat()
        if workspace_data.get("updated_at"):
            workspace_data["updated_at"] = workspace_data["updated_at"].isoformat()
        
        logger.info(f"Retrieved workspace: {workspace_id} for user: {user_id}")
        
        return workspace_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get workspace: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve workspace: {str(e)}"
        )

def list_user_workspaces(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    List all workspaces for a specific user
    
    Args:
        user_id: User ID to get workspaces for
        limit: Maximum number of workspaces to return
    
    Returns:
        List of workspace data dictionaries
    """
    
    try:
        db = get_firestore_client()
        
        # Query user's workspaces, ordered by creation date (newest first)
        workspaces_ref = (
            db.collection("users")
            .document(user_id)
            .collection("workspaces")
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )
        
        docs = workspaces_ref.stream()
        
        workspaces = []
        for doc in docs:
            workspace_data = doc.to_dict()
            workspace_data["id"] = doc.id
            
            # Convert timestamps to ISO format
            if workspace_data.get("created_at"):
                workspace_data["created_at"] = workspace_data["created_at"].isoformat()
            if workspace_data.get("updated_at"):
                workspace_data["updated_at"] = workspace_data["updated_at"].isoformat()
            
            workspaces.append(workspace_data)
        
        logger.info(f"Retrieved {len(workspaces)} workspaces for user: {user_id}")
        
        return workspaces
        
    except Exception as e:
        logger.error(f"Failed to list workspaces: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve workspaces: {str(e)}"
        )

def update_workspace(
    user_id: str,
    workspace_id: str,
    updates: Dict[str, Any]
) -> bool:
    """
    Update specific fields in a workspace
    
    Args:
        user_id: User ID who owns the workspace
        workspace_id: Workspace ID to update
        updates: Dictionary of fields to update
    
    Returns:
        True if updated successfully
    """
    
    try:
        db = get_firestore_client()
        
        # Check if workspace exists first
        doc_ref = db.collection("users").document(user_id).collection("workspaces").document(workspace_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Workspace not found: {workspace_id}"
            )
        
        # Prepare update data
        update_data = {}
        
        # Only allow updating specific fields
        allowed_fields = ["name", "description"]
        for field in allowed_fields:
            if field in updates:
                if field == "name":
                    update_data[field] = updates[field].strip()
                elif field == "description":
                    update_data[field] = updates[field].strip() if updates[field] else ""
        
        # Always update the timestamp
        update_data["updated_at"] = firestore.SERVER_TIMESTAMP
        
        if not update_data or len(update_data) == 1:  # Only timestamp
            logger.warning(f"No valid fields to update for workspace: {workspace_id}")
            return True
        
        # Update the document
        doc_ref.update(update_data)
        
        logger.info(f"Updated workspace: {workspace_id} for user: {user_id}")
        
        return True
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update workspace: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update workspace: {str(e)}"
        )

def delete_workspace(user_id: str, workspace_id: str) -> bool:
    """
    Delete a workspace
    
    Args:
        user_id: User ID who owns the workspace
        workspace_id: Workspace ID to delete
    
    Returns:
        True if deleted successfully
    """
    
    try:
        db = get_firestore_client()
        
        # Check if workspace exists first
        doc_ref = db.collection("users").document(user_id).collection("workspaces").document(workspace_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Workspace not found: {workspace_id}"
            )
        
        # TODO: Check if workspace has any podcasts
        # For now, we'll allow deletion but should implement this check
        
        # Delete the workspace
        doc_ref.delete()
        
        logger.info(f"Deleted workspace: {workspace_id} for user: {user_id}")
        
        return True
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete workspace: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete workspace: {str(e)}"
        )

def get_workspace_stats(user_id: str, workspace_id: str) -> Dict[str, Any]:
    """
    Get statistics for a specific workspace
    
    Args:
        user_id: User ID who owns the workspace
        workspace_id: Workspace ID to get stats for
    
    Returns:
        Dictionary with workspace statistics
    """
    
    try:
        db = get_firestore_client()
        
        # Check if workspace exists
        workspace_ref = db.collection("users").document(user_id).collection("workspaces").document(workspace_id)
        workspace_doc = workspace_ref.get()
        
        if not workspace_doc.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Workspace not found: {workspace_id}"
            )
        
        # TODO: Query podcasts collection for this workspace
        # For now, return basic stats
        workspace_data = workspace_doc.to_dict()
        
        return {
            "workspace_id": workspace_id,
            "name": workspace_data.get("name", ""),
            "podcast_count": workspace_data.get("metadata", {}).get("podcast_count", 0),
            "created_at": workspace_data.get("created_at").isoformat() if workspace_data.get("created_at") else None,
            "last_updated": workspace_data.get("updated_at").isoformat() if workspace_data.get("updated_at") else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get workspace stats: {str(e)}")
        return {}
