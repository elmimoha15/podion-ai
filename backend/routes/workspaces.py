from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
from utils.firebase_auth import get_current_user_id
from utils.workspace_firestore import (
    create_workspace,
    get_workspace,
    list_user_workspaces,
    update_workspace,
    delete_workspace,
    get_workspace_stats
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Pydantic models
class CreateWorkspaceRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Workspace name")
    description: Optional[str] = Field(None, max_length=500, description="Workspace description")

class UpdateWorkspaceRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Workspace name")
    description: Optional[str] = Field(None, max_length=500, description="Workspace description")

class WorkspaceResponse(BaseModel):
    success: bool
    workspace_id: Optional[str] = None
    workspace_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class WorkspaceListResponse(BaseModel):
    success: bool
    workspaces: Optional[List[Dict[str, Any]]] = None
    count: Optional[int] = None
    user_id: Optional[str] = None
    error: Optional[str] = None

class WorkspaceStatsResponse(BaseModel):
    success: bool
    stats: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@router.post("/workspaces", response_model=WorkspaceResponse)
async def create_workspace_endpoint(
    request: CreateWorkspaceRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Create a new workspace for the authenticated user
    
    Requires:
    - Valid Firebase ID token in Authorization header
    - Workspace name (required)
    - Workspace description (optional)
    """
    
    try:
        logger.info(f"Creating workspace for user {user_id}: {request.name}")
        
        workspace_id = create_workspace(
            user_id=user_id,
            name=request.name,
            description=request.description
        )
        
        # Get the created workspace data
        workspace_data = get_workspace(user_id, workspace_id)
        
        logger.info(f"Workspace created successfully: {workspace_id}")
        
        return WorkspaceResponse(
            success=True,
            workspace_id=workspace_id,
            workspace_data=workspace_data
        )
        
    except Exception as e:
        logger.error(f"Failed to create workspace: {str(e)}")
        
        return WorkspaceResponse(
            success=False,
            error=f"Failed to create workspace: {str(e)}"
        )

@router.get("/workspaces", response_model=WorkspaceListResponse)
async def list_workspaces_endpoint(
    limit: int = 50,
    user_id: str = Depends(get_current_user_id)
):
    """
    List all workspaces for the authenticated user
    
    Requires:
    - Valid Firebase ID token in Authorization header
    
    Returns workspaces ordered by creation date (newest first)
    """
    
    try:
        logger.info(f"Listing workspaces for user {user_id}")
        
        workspaces = list_user_workspaces(user_id, limit)
        
        logger.info(f"Retrieved {len(workspaces)} workspaces for user {user_id}")
        
        return WorkspaceListResponse(
            success=True,
            workspaces=workspaces,
            count=len(workspaces),
            user_id=user_id
        )
        
    except Exception as e:
        logger.error(f"Failed to list workspaces: {str(e)}")
        
        return WorkspaceListResponse(
            success=False,
            error=f"Failed to retrieve workspaces: {str(e)}"
        )

@router.get("/workspaces/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace_endpoint(
    workspace_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get a specific workspace by ID
    
    Requires:
    - Valid Firebase ID token in Authorization header
    - User must own the workspace
    """
    
    try:
        logger.info(f"Getting workspace {workspace_id} for user {user_id}")
        
        workspace_data = get_workspace(user_id, workspace_id)
        
        logger.info(f"Retrieved workspace: {workspace_id}")
        
        return WorkspaceResponse(
            success=True,
            workspace_id=workspace_id,
            workspace_data=workspace_data
        )
        
    except HTTPException as e:
        logger.error(f"HTTP error getting workspace: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Failed to get workspace: {str(e)}")
        
        return WorkspaceResponse(
            success=False,
            error=f"Failed to retrieve workspace: {str(e)}"
        )

@router.put("/workspaces/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace_endpoint(
    workspace_id: str,
    request: UpdateWorkspaceRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update a workspace's name or description
    
    Requires:
    - Valid Firebase ID token in Authorization header
    - User must own the workspace
    """
    
    try:
        logger.info(f"Updating workspace {workspace_id} for user {user_id}")
        
        # Prepare updates dictionary
        updates = {}
        if request.name is not None:
            updates["name"] = request.name
        if request.description is not None:
            updates["description"] = request.description
        
        if not updates:
            return WorkspaceResponse(
                success=False,
                error="No fields provided to update"
            )
        
        success = update_workspace(user_id, workspace_id, updates)
        
        if success:
            # Get updated workspace data
            workspace_data = get_workspace(user_id, workspace_id)
            
            logger.info(f"Workspace updated successfully: {workspace_id}")
            
            return WorkspaceResponse(
                success=True,
                workspace_id=workspace_id,
                workspace_data=workspace_data
            )
        else:
            return WorkspaceResponse(
                success=False,
                error="Failed to update workspace"
            )
        
    except HTTPException as e:
        logger.error(f"HTTP error updating workspace: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Failed to update workspace: {str(e)}")
        
        return WorkspaceResponse(
            success=False,
            error=f"Failed to update workspace: {str(e)}"
        )

@router.delete("/workspaces/{workspace_id}")
async def delete_workspace_endpoint(
    workspace_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete a workspace
    
    Requires:
    - Valid Firebase ID token in Authorization header
    - User must own the workspace
    
    Warning: This will delete the workspace. Associated podcasts should be
    handled separately (moved to another workspace or deleted).
    """
    
    try:
        logger.info(f"Deleting workspace {workspace_id} for user {user_id}")
        
        success = delete_workspace(user_id, workspace_id)
        
        if success:
            logger.info(f"Workspace deleted successfully: {workspace_id}")
            
            return {
                "success": True,
                "workspace_id": workspace_id,
                "message": "Workspace deleted successfully"
            }
        else:
            return {
                "success": False,
                "error": "Failed to delete workspace"
            }
        
    except HTTPException as e:
        logger.error(f"HTTP error deleting workspace: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Failed to delete workspace: {str(e)}")
        
        return {
            "success": False,
            "error": f"Failed to delete workspace: {str(e)}"
        }

@router.get("/workspaces/{workspace_id}/stats", response_model=WorkspaceStatsResponse)
async def get_workspace_stats_endpoint(
    workspace_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get statistics for a specific workspace
    
    Requires:
    - Valid Firebase ID token in Authorization header
    - User must own the workspace
    """
    
    try:
        logger.info(f"Getting stats for workspace {workspace_id} for user {user_id}")
        
        stats = get_workspace_stats(user_id, workspace_id)
        
        return WorkspaceStatsResponse(
            success=True,
            stats=stats
        )
        
    except HTTPException as e:
        logger.error(f"HTTP error getting workspace stats: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Failed to get workspace stats: {str(e)}")
        
        return WorkspaceStatsResponse(
            success=False,
            error=f"Failed to retrieve workspace statistics: {str(e)}"
        )

@router.get("/workspaces-info")
async def workspaces_service_info():
    """Get information about the workspace management service"""
    return {
        "message": "Workspace management service for Podion AI",
        "collection_structure": "users/{user_id}/workspaces/{workspace_id}",
        "authentication": "Firebase ID token required in Authorization header",
        "features": [
            "Create workspaces with name and description",
            "List user's workspaces (newest first)",
            "Get individual workspace details",
            "Update workspace name and description",
            "Delete workspaces",
            "Get workspace statistics"
        ],
        "data_structure": {
            "name": "string (required, 1-100 chars)",
            "description": "string (optional, max 500 chars)",
            "user_id": "string (auto-set from auth)",
            "created_at": "timestamp (auto-set)",
            "updated_at": "timestamp (auto-updated)",
            "metadata": {
                "version": "string",
                "podcast_count": "number"
            }
        },
        "endpoints": {
            "create": "POST /workspaces - Create new workspace",
            "list": "GET /workspaces - List user's workspaces",
            "get": "GET /workspaces/{workspace_id} - Get workspace by ID",
            "update": "PUT /workspaces/{workspace_id} - Update workspace",
            "delete": "DELETE /workspaces/{workspace_id} - Delete workspace",
            "stats": "GET /workspaces/{workspace_id}/stats - Get workspace stats"
        },
        "integration": {
            "authentication": "Firebase ID token verification",
            "storage": "Firestore subcollections under users",
            "podcasts": "Will be linked via workspace_id field"
        }
    }
