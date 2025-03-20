from fastapi import APIRouter, HTTPException, Depends, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, EmailStr, Field
import uuid

from src.core.security import create_access_token, verify_token

router = APIRouter()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

# Models
class UserCredentials(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    sub: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    is_active: bool = True
    is_superuser: bool = False

class OAuthRequest(BaseModel):
    provider: str
    redirect_uri: str

class OAuthCallback(BaseModel):
    provider: str
    code: str
    state: Optional[str] = None

# Endpoints
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Generate an access token for a user."""
    # TODO: Implement actual user authentication with database
    # For now, just generate a token for any credentials
    
    # Check if user exists and password is correct
    # This would normally verify against a database
    
    access_token = create_access_token(subject=form_data.username)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserCredentials):
    """Login with email and password."""
    # TODO: Implement actual user authentication with database
    # For now, just generate a token for any credentials
    
    access_token = create_access_token(subject=credentials.email)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    """Register a new user."""
    # TODO: Implement actual user registration with database
    # For now, return a mock user
    
    # Check if user already exists
    # This would normally check against a database
    
    # Create user in database
    # For now, return a mock user
    
    return {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "full_name": user.full_name or "New User",
        "is_active": True,
        "is_superuser": False
    }

@router.post("/oauth", response_model=Dict[str, str])
async def oauth_login(request: OAuthRequest):
    """Initiate OAuth login flow."""
    from src.agents.auth_integration_agent import AuthIntegrationAgent
    
    # Create an instance of the agent
    auth_agent = AuthIntegrationAgent("auth_agent", "Auth & Integration Agent")
    
    # Prepare task
    task = {
        "task_type": "create_oauth_url_task",
        "provider": request.provider,
        "redirect_uri": request.redirect_uri,
        "state": f"auth-{uuid.uuid4()}"
    }
    
    # Execute task
    result = auth_agent.handle_create_oauth_url(task)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", f"Failed to create OAuth URL for {request.provider}")
        )
    
    return {"auth_url": result["oauth_url"]}

@router.post("/oauth/callback", response_model=Token)
async def oauth_callback(callback: OAuthCallback):
    """Handle OAuth callback and generate token."""
    from src.agents.auth_integration_agent import AuthIntegrationAgent
    
    # Create an instance of the agent
    auth_agent = AuthIntegrationAgent("auth_agent", "Auth & Integration Agent")
    
    # Prepare task to handle the OAuth callback
    task = {
        "task_type": "user_authentication_task",
        "auth_provider": callback.provider,
        "auth_code": callback.code,
        "redirect_uri": "http://localhost:8000/api/v1/auth/oauth/callback",  # Should be configurable
        "state": callback.state
    }
    
    # Execute task
    result = auth_agent.handle_user_authentication(task)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.get("error", f"Authentication failed for {callback.provider}")
        )
    
    # Get user info from the result
    user_info = result.get("user_info", {})
    user_id = user_info.get("user_id", "")
    user_email = user_info.get("email", f"user_{user_id}@{callback.provider}.example.com")
    
    # Create a JWT token for the user
    access_token = create_access_token(subject=user_email)
    
    # Store the OAuth token in the agent's secure storage
    # This is now handled by the agent itself
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=User)
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get the current authenticated user."""
    # Verify token and get user ID
    user_id = verify_token(token)
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Retrieve user from database
    # For now, return a mock user
    return {
        "id": str(uuid.uuid4()),
        "email": user_id,
        "full_name": "Sample User",
        "is_active": True,
        "is_superuser": False
    }
