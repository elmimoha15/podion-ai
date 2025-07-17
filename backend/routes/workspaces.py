""
Workspace management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
import firebase_admin
from firebase_admin import auth
from pydantic import BaseModel

from ..utils.workspace_utils import (
    create_workspace as create_workspace_db,
    get_workspace as get_workspace_db,
    list_workspaces as list_workspaces_db,
    update_workspace as update_workspace_db,
    delete_workspace as delete_workspace_db
)

# Security
security = HTTPBearer()

# Router
router = APIRouter(prefix="/workspaces", tags=["workspaces"])

# Models
class WorkspaceBase(BaseModel):
    name: str
    description: Optional[str] = None

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class WorkspaceResponse(WorkspaceBase):
    id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

# Helper Functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify and return the user ID from the Firebase token."""
    try:
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Routes
@router.post(
    "/",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workspace"
)
async def create_workspace(
    workspace: WorkspaceCreate,
    user_id: str = Depends(get_current_user)
):
    """
    Create a new workspace for the authenticated user.
    
    - **name**: Name of the workspace (required)
    - **description**: Optional description of the workspace
    """
    return create_workspace_db(
        user_id=user_id,
        name=workspace.name,
        description=workspace.description
    )

@router.get(
    "/",
    response_model=List[WorkspaceResponse],
    summary="List all workspaces"
)
async def list_workspaces(user_id: str = Depends(get_current_user)):
    """
    List all workspaces belonging to the authenticated user.
    """
    return list_workspaces_db(user_id)

@router.get(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
    summary="Get a specific workspace"
)
async def get_workspace(
    workspace_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get details of a specific workspace by ID.
    """
    return get_workspace_db(user_id, workspace_id)

@router.put(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
    summary="Update a workspace"
)
async def update_workspace(
    workspace_id: str,
    updates: WorkspaceUpdate,
    user_id: str = Depends(get_current_user)
):
    """
    Update a workspace's details.
    
    - **name**: New name for the workspace (optional)
    - **description**: New description for the workspace (optional)
    """
    return update_workspace_db(
        user_id=user_id,
        workspace_id=workspace_id,
        updates=updates.dict(exclude_unset=True)
    )

@router.delete(
    "/{workspace_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a workspace"
)
async def delete_workspace(
    workspace_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Delete a workspace. This action cannot be undone.
    """
    delete_workspace_db(user_id, workspace_id)
    return {"message": "Workspace deleted successfully"}
