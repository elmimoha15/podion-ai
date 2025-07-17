"""
Workspace utility functions for Firestore operations.
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional
import firebase_admin
from firebase_admin import firestore
from fastapi import HTTPException, status
import uuid

logger = logging.getLogger(__name__)

def get_workspace_collection(user_id: str):
    """Get the Firestore collection reference for user's workspaces."""
    try:
        db = firestore.client()
        return db.collection('users').document(user_id).collection('workspaces')
    except Exception as e:
        logger.error(f"Error accessing Firestore: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to access database"
        )

def create_workspace(user_id: str, name: str, description: Optional[str] = None) -> Dict[str, any]:
    """
    Create a new workspace for the user.
    
    Args:
        user_id: ID of the user creating the workspace
        name: Name of the workspace
        description: Optional description of the workspace
        
    Returns:
        Dict containing the created workspace data
    """
    try:
        workspaces_ref = get_workspace_collection(user_id)
        workspace_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        workspace_data = {
            'id': workspace_id,
            'name': name,
            'description': description,
            'created_at': now,
            'updated_at': now
        }
        
        workspaces_ref.document(workspace_id).set(workspace_data)
        return workspace_data
        
    except Exception as e:
        logger.error(f"Error creating workspace: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create workspace"
        )

def get_workspace(user_id: str, workspace_id: str) -> Dict[str, any]:
    """
    Get a specific workspace by ID.
    
    Args:
        user_id: ID of the user
        workspace_id: ID of the workspace to retrieve
        
    Returns:
        Workspace data if found, None otherwise
    """
    try:
        workspace_ref = get_workspace_collection(user_id).document(workspace_id)
        workspace = workspace_ref.get()
        
        if not workspace.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found"
            )
            
        return workspace.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workspace: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve workspace"
        )

def list_workspaces(user_id: str) -> List[Dict[str, any]]:
    """
    List all workspaces for a user.
    
    Args:
        user_id: ID of the user
        
    Returns:
        List of workspace dictionaries
    """
    try:
        workspaces_ref = get_workspace_collection(user_id)
        workspaces = workspaces_ref.stream()
        
        return [doc.to_dict() for doc in workspaces]
        
    except Exception as e:
        logger.error(f"Error listing workspaces: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list workspaces"
        )

def update_workspace(user_id: str, workspace_id: str, updates: Dict[str, any]) -> Dict[str, any]:
    """
    Update a workspace's details.
    
    Args:
        user_id: ID of the user
        workspace_id: ID of the workspace to update
        updates: Dictionary of fields to update
        
    Returns:
        Updated workspace data
    """
    try:
        workspace_ref = get_workspace_collection(user_id).document(workspace_id)
        
        # Only allow updating name and description
        valid_updates = {}
        if 'name' in updates:
            valid_updates['name'] = updates['name']
        if 'description' in updates:
            valid_updates['description'] = updates['description']
            
        if not valid_updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
            
        valid_updates['updated_at'] = datetime.utcnow()
        
        workspace_ref.update(valid_updates)
        return {**workspace_ref.get().to_dict(), **valid_updates}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating workspace: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update workspace"
        )

def delete_workspace(user_id: str, workspace_id: str) -> None:
    """
    Delete a workspace.
    
    Args:
        user_id: ID of the user
        workspace_id: ID of the workspace to delete
    """
    try:
        workspace_ref = get_workspace_collection(user_id).document(workspace_id)
        
        # Check if workspace exists
        if not workspace_ref.get().exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found"
            )
            
        # TODO: Optionally delete all episodes in this workspace
        # For now, we'll just delete the workspace document
        workspace_ref.delete()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting workspace: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete workspace"
        )
