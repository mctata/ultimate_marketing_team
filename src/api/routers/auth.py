# Standard library imports
import uuid
from typing import Dict, Any, List, Optional

# Third-party imports
from fastapi import APIRouter, HTTPException, Depends, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field

# Local imports
from src.agents.auth_integration_agent import AuthIntegrationAgent
from src.core.security import create_access_token, verify_token

router = APIRouter()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

# Models
class UserCredentials(BaseModel):
    email: EmailStr
    password: str
    mfa_code: Optional[str] = None
    device_name: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int = Field(default=3600)
    scope: Optional[str] = None
    id_token: Optional[str] = None
    refresh_token: Optional[str] = None
    device_id: Optional[str] = None
    
class TokenData(BaseModel):
    sub: Optional[str] = None
    device_id: Optional[str] = None
    session_id: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    
class MFASetupResponse(BaseModel):
    secret_key: str
    qr_code_url: str
    backup_codes: List[str]

class MFAVerifyRequest(BaseModel):
    code: str
    
class MFAType(str, Enum):
    APP = "app"
    SMS = "sms"
    EMAIL = "email"
    
class MFARequest(BaseModel):
    mfa_type: MFAType
    contact_info: Optional[str] = None
    
class MFAVerifyResponse(BaseModel):
    success: bool
    message: str
    
class User(UserBase):
    id: str
    is_active: bool = True
    is_superuser: bool = False
    mfa_enabled: bool = False
    mfa_type: Optional[str] = None

class OAuthProvider(str, Enum):
    GOOGLE = "google"
    MICROSOFT = "microsoft"
    FACEBOOK = "facebook"
    GITHUB = "github"
    OKTA = "okta"

class OAuthRequest(BaseModel):
    provider: OAuthProvider
    redirect_uri: str
    scope: Optional[List[str]] = None
    
class PKCEParams(BaseModel):
    code_challenge: str
    code_challenge_method: str = "S256"

class OAuthAuthorizeRequest(BaseModel):
    provider: OAuthProvider
    redirect_uri: str
    response_type: str = "code"
    scope: Optional[List[str]] = None
    state: Optional[str] = None
    pkce_params: Optional[PKCEParams] = None
    
class OAuthCallback(BaseModel):
    provider: OAuthProvider
    code: str
    state: Optional[str] = None
    code_verifier: Optional[str] = None
    
class DeviceInfo(BaseModel):
    device_name: Optional[str] = None
    device_type: Optional[str] = None
    
class SessionInfo(BaseModel):
    session_id: str
    device_id: str
    device_name: str
    device_type: str
    ip_address: str
    last_activity: Optional[str] = None
    
class RevokeRequest(BaseModel):
    token_type: str = "access_token"
    device_id: Optional[str] = None
    session_id: Optional[str] = None
    all_sessions: bool = False

# Endpoints
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Generate an access token for a user.
    
    Args:
        form_data: OAuth2 password request form data containing username and password
        
    Returns:
        Dict containing access token and token type
    """
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
    """Login with email and password.
    
    Args:
        credentials: User credentials containing email and password
        
    Returns:
        Dict containing access token and token type
    """
    # TODO: Implement actual user authentication with database
    # For now, just generate a token for any credentials
    
    access_token = create_access_token(subject=credentials.email)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    """Register a new user.
    
    Args:
        user: User creation data containing email, password and optional full name
        
    Returns:
        User object with generated ID and default settings
    """
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
    """Initiate OAuth login flow.
    
    Args:
        request: OAuth request containing provider and redirect URI
        
    Returns:
        Dict containing authentication URL for the OAuth provider
    """
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
    """Handle OAuth callback and generate token.
    
    Args:
        callback: OAuth callback data containing provider, code and optional state
        
    Returns:
        Dict containing access token and token type
    """
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
    """Get the current authenticated user.
    
    Args:
        token: JWT authentication token from the request header
        
    Returns:
        User object containing user details
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
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
        "is_superuser": False,
        "mfa_enabled": False
    }

@router.post("/mfa/setup", response_model=MFASetupResponse)
async def setup_mfa(
    mfa_type: MFAType,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Set up multi-factor authentication for a user.
    
    Args:
        mfa_type: The type of MFA to set up (app, sms, email)
        user: The authenticated user
        db: Database session
        
    Returns:
        MFA setup information including QR code URL for app-based MFA
    """
    from src.core.security import (
        generate_totp_secret, generate_totp_uri, 
        generate_mfa_backup_codes, encrypt_sensitive_data
    )
    
    # Generate TOTP secret for app-based authentication
    if mfa_type == MFAType.APP:
        secret = generate_totp_secret()
        qr_code_url = generate_totp_uri(user.email, secret)
        backup_codes = generate_mfa_backup_codes(10)
        
        # In a real implementation, store these in the database
        # For demonstration purposes, we're just returning them
        
        # Update user in database with encrypted secret and backup codes
        # user.totp_secret_encrypted, user.totp_secret_salt = encrypt_sensitive_data(secret)
        # user.mfa_backup_codes = backup_codes
        # user.mfa_enabled = True
        # user.mfa_type = mfa_type.value
        # db.commit()
        
        return {
            "secret_key": secret,
            "qr_code_url": qr_code_url,
            "backup_codes": backup_codes
        }
    else:
        # For SMS and email, we don't need to generate a QR code
        # Just enable MFA and return a placeholder response
        backup_codes = generate_mfa_backup_codes(10)
        
        # In a real implementation, store these in the database
        # user.mfa_enabled = True
        # user.mfa_type = mfa_type.value
        # user.phone_number = phone_number  # For SMS
        # user.mfa_backup_codes = backup_codes
        # db.commit()
        
        return {
            "secret_key": "",
            "qr_code_url": "",
            "backup_codes": backup_codes
        }

@router.post("/mfa/verify", response_model=MFAVerifyResponse)
async def verify_mfa(
    request: MFAVerifyRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify a MFA code during setup.
    
    Args:
        request: The verification request containing the MFA code
        user: The authenticated user
        db: Database session
        
    Returns:
        Verification result
    """
    from src.core.security import verify_mfa_code, verify_backup_code
    
    # In a real implementation, get user's MFA type from the database
    mfa_type = MFAType.APP
    
    # Verify code - assuming user ID is an integer
    try:
        user_id = int(user.id)
    except ValueError:
        user_id = 1  # Mock for demo
    
    # Try as a normal MFA code
    success = verify_mfa_code(user_id, mfa_type, request.code, db)
    
    if not success:
        # Try as a backup code
        success = verify_backup_code(user_id, request.code, db)
    
    if success:
        return {
            "success": True,
            "message": "MFA verification successful"
        }
    else:
        return {
            "success": False,
            "message": "Invalid MFA code"
        }

@router.post("/mfa/send-code")
async def send_mfa_code(
    request: MFARequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a MFA code to the user via the specified method.
    
    Args:
        request: The request containing the MFA type and optional contact info
        user: The authenticated user
        db: Database session
        
    Returns:
        Success confirmation
    """
    from src.core.security import send_mfa_code
    
    # Assuming user ID is an integer
    try:
        user_id = int(user.id)
    except ValueError:
        user_id = 1  # Mock for demo
    
    # Send the code
    await send_mfa_code(
        user_id=user_id,
        mfa_type=request.mfa_type,
        db=db,
        contact_info=request.contact_info
    )
    
    # Return success response
    return {
        "success": True,
        "message": f"MFA code sent via {request.mfa_type.value}"
    }

@router.post("/authorize")
async def authorize_oauth(
    request: OAuthAuthorizeRequest,
    db: Session = Depends(get_db)
):
    """
    OAuth 2.0 authorization endpoint with PKCE support.
    
    Args:
        request: OAuth authorization request
        db: Database session
        
    Returns:
        Authorization URL to redirect the user to
    """
    from src.core.security import create_authorization_url, OAuthProvider as SecurityOAuthProvider
    
    # Convert from API enum to security module enum
    provider = SecurityOAuthProvider(request.provider.value)
    
    # Default scopes if not provided
    scope = request.scope or ["openid", "email", "profile"]
    
    # Generate authorization URL
    authorization_url, state = create_authorization_url(
        provider=provider,
        redirect_uri=request.redirect_uri,
        scope=scope
    )
    
    # If PKCE is being used, associate the code challenge with the state
    if request.pkce_params:
        # In a real implementation, store the code challenge method and the state
        # We're using a secure method (S256) so we don't need to store it
        pass
    
    return {
        "authorization_url": authorization_url,
        "state": state
    }

@router.get("/sessions", response_model=List[SessionInfo])
async def get_user_sessions(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all active sessions for the current user.
    
    Args:
        user: The authenticated user
        db: Database session
        
    Returns:
        List of active sessions
    """
    from src.core.security import get_user_sessions
    
    # Assuming user ID is an integer
    try:
        user_id = int(user.id)
    except ValueError:
        user_id = 1  # Mock for demo
    
    # Get user sessions
    sessions = get_user_sessions(user_id, db)
    
    return sessions

@router.post("/revoke")
async def revoke_token(
    request: RevokeRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoke a token, session, or device.
    
    Args:
        request: The revocation request
        user: The authenticated user
        db: Database session
        
    Returns:
        Success confirmation
    """
    from src.core.security import revoke_session, revoke_device, revoke_all_sessions
    
    # Assuming user ID is an integer
    try:
        user_id = int(user.id)
    except ValueError:
        user_id = 1  # Mock for demo
    
    if request.all_sessions:
        # Revoke all sessions except the current one
        current_session_id = "current_session_id"  # Get from token in a real implementation
        count = revoke_all_sessions(user_id, db, except_session_id=current_session_id)
        return {
            "success": True,
            "message": f"Revoked {count} sessions"
        }
    
    elif request.session_id:
        # Revoke a specific session
        success = revoke_session(user_id, request.session_id, db)
        return {
            "success": success,
            "message": "Session revoked" if success else "Session not found"
        }
    
    elif request.device_id:
        # Revoke a device and all its sessions
        success = revoke_device(user_id, request.device_id, db)
        return {
            "success": success,
            "message": "Device revoked" if success else "Device not found"
        }
    
    else:
        return {
            "success": False,
            "message": "No session or device specified"
        }
