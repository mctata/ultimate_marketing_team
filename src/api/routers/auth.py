# Standard library imports
import uuid
import secrets
import re
from typing import Dict, Any, List, Optional
from enum import Enum

# Third-party imports
from fastapi import APIRouter, HTTPException, Depends, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

# Local imports
from src.core.security import create_access_token, verify_token
from src.core.database import get_db

router = APIRouter()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

# Models
class UserCredentials(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    mfa_code: Optional[str] = Field(None, min_length=6, max_length=6)
    device_name: Optional[str] = Field(None, max_length=100)
    
    @validator('email')
    def validate_email(cls, v):
        """Additional email validation beyond basic format."""
        # Check for disposable email domains (example check)
        disposable_domains = ["tempmail.com", "throwaway.com", "mailinator.com"]
        domain = v.split('@')[1].lower()
        if domain in disposable_domains:
            raise ValueError("Email from disposable domains not allowed")
        return v
    
    @validator('mfa_code')
    def validate_mfa_code(cls, v):
        """Validate MFA code if provided."""
        if v is not None:
            if not v.isdigit():
                raise ValueError("MFA code must contain only digits")
            if len(v) != 6:
                raise ValueError("MFA code must be exactly 6 digits")
        return v
    
    @validator('device_name')
    def validate_device_name(cls, v):
        """Validate device name if provided."""
        if v is not None:
            if len(v) < 1:
                raise ValueError("Device name cannot be empty")
            # Sanitize the device name to prevent XSS
            v = re.sub(r'[<>]', '', v)
        return v

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
    
class RefreshRequest(BaseModel):
    refresh_token: str

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)
    
    @validator('password')
    def password_strength(cls, v):
        """Validate password strength."""
        # Check for minimum complexity
        if len(v) < 12:
            raise ValueError("Password must be at least 12 characters long")
        
        # Check for at least one uppercase, lowercase, digit, and special character
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r'\d', v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Password must contain at least one special character")
        
        # Check for common passwords
        common_passwords = ["password", "123456", "qwerty", "welcome", "admin"]
        if any(common in v.lower() for common in common_passwords):
            raise ValueError("Password contains a common password pattern")
        
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        """Validate that passwords match."""
        if 'password' in values and v != values['password']:
            raise ValueError("Passwords do not match")
        return v
    
class MFASetupResponse(BaseModel):
    secret_key: str
    qr_code_url: str
    backup_codes: List[str]

class MFAVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)
    
    @validator('code')
    def validate_code_format(cls, v):
        """Validate that the MFA code is numeric and 6 digits."""
        if not v.isdigit():
            raise ValueError("MFA code must contain only digits")
        if len(v) != 6:
            raise ValueError("MFA code must be exactly 6 digits")
        return v
    
class MFAType(str, Enum):
    APP = "app"
    SMS = "sms"
    EMAIL = "email"

class OAuthRequest(BaseModel):
    provider: str
    redirect_uri: str
    response_type: str = Field(default="code")
    scope: Optional[str] = Field(default="openid profile email")
    state: Optional[str] = None
    code_challenge: Optional[str] = None
    code_challenge_method: Optional[str] = None
    
    @validator('provider')
    def validate_provider(cls, v):
        """Validate that the provider is supported."""
        allowed_providers = ["google", "microsoft", "okta", "github", "facebook"]
        if v.lower() not in allowed_providers:
            raise ValueError(f"Provider {v} not supported. Allowed providers: {', '.join(allowed_providers)}")
        return v.lower()
    
    @validator('redirect_uri')
    def validate_redirect_uri(cls, v):
        """Validate the redirect URI against an allowlist."""
        # Get allowed redirect URIs from settings or environment
        allowed_redirect_uris = [
            "http://localhost:3000/auth/callback",
            "http://localhost:8000/api/v1/auth/callback",
            "https://ultimate-marketing-team.example.com/auth/callback"
        ]
        
        # Parse the redirect URI
        from urllib.parse import urlparse
        parsed_uri = urlparse(v)
        
        # Check if the redirect URI is in the allowlist
        if v not in allowed_redirect_uris:
            # If not in exact allowlist, check domain match
            allowed_domains = ["localhost", "ultimate-marketing-team.example.com"]
            if parsed_uri.netloc not in allowed_domains:
                raise ValueError(f"Redirect URI domain not allowed: {parsed_uri.netloc}")
        
        # Ensure HTTPS in production
        if parsed_uri.scheme != "https" and parsed_uri.netloc != "localhost":
            raise ValueError("Redirect URI must use HTTPS")
        
        return v
    
    @validator('code_challenge_method')
    def validate_challenge_method(cls, v, values):
        """Validate the code challenge method."""
        if v is not None:
            if v not in ["S256", "plain"]:
                raise ValueError("Code challenge method must be S256 or plain")
                
            # If method is provided, challenge must also be provided
            if values.get('code_challenge') is None:
                raise ValueError("Code challenge is required when code_challenge_method is provided")
                
        return v
    
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
    refresh_token = secrets.token_hex(32)  # Simple refresh token for demonstration
    
    # Store refresh token in a secure way (Redis or database)
    # This is just a placeholder
    # Example: cache.set(f"refresh_token:{refresh_token}", form_data.username, expire=30*24*60*60)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "expires_in": settings.JWT_EXPIRY
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
    refresh_token = secrets.token_hex(32)  # Simple refresh token for demonstration
    
    # Store refresh token in a secure way (Redis or database)
    # This is just a placeholder
    # Example: cache.set(f"refresh_token:{refresh_token}", credentials.email, expire=30*24*60*60)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "expires_in": settings.JWT_EXPIRY
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
    # Mock OAuth URL generation
    state = f"auth-{uuid.uuid4()}"
    provider_urls = {
        OAuthProvider.GOOGLE: "https://accounts.google.com/o/oauth2/v2/auth",
        OAuthProvider.MICROSOFT: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        OAuthProvider.FACEBOOK: "https://www.facebook.com/v13.0/dialog/oauth",
        OAuthProvider.GITHUB: "https://github.com/login/oauth/authorize",
        OAuthProvider.OKTA: "https://your-okta-domain.okta.com/oauth2/default/v1/authorize"
    }
    
    base_url = provider_urls.get(request.provider, "")
    if not base_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider: {request.provider}"
        )
    
    mock_oauth_url = f"{base_url}?client_id=mock_client_id&redirect_uri={request.redirect_uri}&state={state}&response_type=code"
    
    return {"auth_url": mock_oauth_url}

@router.post("/oauth/callback", response_model=Token)
async def oauth_callback(callback: OAuthCallback):
    """Handle OAuth callback and generate token.
    
    Args:
        callback: OAuth callback data containing provider, code and optional state
        
    Returns:
        Dict containing access token and token type
    """
    # Mock OAuth callback handling
    if not callback.code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization code"
        )
    
    # Mock user data based on provider
    mock_user_email = f"user@{callback.provider.value}.example.com"
    
    # Create a JWT token for the user
    access_token = create_access_token(subject=mock_user_email)
    
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

@router.post("/refresh", response_model=Token)
async def refresh_access_token(request: RefreshRequest):
    """
    Refresh an access token using a refresh token.
    
    Args:
        request: The refresh request containing the refresh token
        
    Returns:
        A new access token and optionally a new refresh token
    """
    # In a real implementation, you would:
    # 1. Validate the refresh token against the stored token
    # 2. Check if the refresh token is expired or revoked
    # 3. Get the user ID associated with the refresh token
    # 4. Generate a new access token and optionally a new refresh token
    
    # Mock implementation
    try:
        # Validate the refresh token - this is just a placeholder
        # In a real implementation, you would verify against a database or cache
        if not request.refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid refresh token"
            )
        
        # In a real implementation, you would extract the user ID from the stored token data
        # Mock user ID for demonstration
        user_id = "user@example.com"
        
        # Generate a new access token
        access_token = create_access_token(subject=user_id)
        
        # Generate a new refresh token (token rotation for security)
        new_refresh_token = secrets.token_hex(32)
        
        # Store the new refresh token and invalidate the old one
        # Example: cache.delete(f"refresh_token:{request.refresh_token}")
        # Example: cache.set(f"refresh_token:{new_refresh_token}", user_id, expire=30*24*60*60)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": new_refresh_token,
            "expires_in": settings.JWT_EXPIRY
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate refresh token"
        )

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
