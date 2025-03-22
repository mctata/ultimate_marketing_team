# Standard library imports
import base64
import os
import secrets
import hashlib
import string
import uuid
from datetime import datetime, timedelta
from functools import wraps
from enum import Enum
from typing import Optional, Union, Any, Dict, List, Tuple

# Third-party imports
from fastapi import Depends, HTTPException, status, Request, Header
from fastapi.security import OAuth2PasswordBearer, OAuth2AuthorizationCodeBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from sqlalchemy.orm import Session
import pyotp

# Local imports
from src.core.settings import settings
from src.core.database import get_db
from src.core.cache import cache

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

# OAuth2 scheme for authorization code flow
oauth2_auth_code_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl="/api/v1/auth/authorize",
    tokenUrl="/api/v1/auth/token"
)

class MFAType(str, Enum):
    """Types of multi-factor authentication."""
    APP = "app"
    SMS = "sms"
    EMAIL = "email"
    
class OAuthProvider(str, Enum):
    """Supported OAuth providers."""
    GOOGLE = "google"
    MICROSOFT = "microsoft"
    FACEBOOK = "facebook"
    GITHUB = "github"
    OKTA = "okta"
    
class DeviceType(str, Enum):
    """Known device types."""
    DESKTOP = "desktop"
    MOBILE = "mobile"
    TABLET = "tablet"
    OTHER = "other"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash.
    
    Args:
        plain_password: The plain text password to verify
        hashed_password: The hashed password to compare against
        
    Returns:
        bool: True if password matches the hash, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate a password hash.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        str: The hashed password
    """
    return pwd_context.hash(password)

def create_access_token(
    subject: Union[str, Any], 
    expires_delta: Optional[timedelta] = None,
    additional_data: Optional[Dict[str, Any]] = None
) -> str:
    """Create a JWT access token with optional additional data.
    
    Args:
        subject: The subject of the token, typically user ID or email
        expires_delta: Optional custom expiration time
        additional_data: Optional dictionary of additional claims to include in the token
        
    Returns:
        str: The encoded JWT token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=settings.JWT_EXPIRY)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    
    # Add any additional data to the token
    if additional_data:
        to_encode.update(additional_data)
        
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode a JWT token and return the full payload."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.JWTError:
        return None

def verify_token(token: str) -> Optional[str]:
    """Verify a JWT token and return the subject."""
    payload = decode_token(token)
    if payload:
        return payload.get("sub")
    return None

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get the current authenticated user."""
    from src.models.system import User
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    
    return user

def has_permission(resource: str, action: str):
    """
    Decorator to check if a user has permission to perform an action on a resource.
    
    Example:
    @app.get("/brands")
    @has_permission("brand", "read")
    def get_brands(current_user = Depends(get_current_user)):
        # This function will only be called if the user has permission to read brands
        pass
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user from kwargs
            current_user = kwargs.get("current_user")
            if not current_user:
                for arg in args:
                    if hasattr(arg, "id") and hasattr(arg, "roles"):
                        current_user = arg
                        break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User authentication required",
                )
            
            # Superusers can do anything
            if current_user.is_superuser:
                return await func(*args, **kwargs)
            
            # Check user permissions through roles
            for role in current_user.roles:
                for permission in role.permissions:
                    if permission.resource == resource and permission.action == action:
                        return await func(*args, **kwargs)
            
            # Permission denied
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {action} {resource}",
            )
        
        return wrapper
    return decorator

def get_current_user_with_permissions(required_permissions: List[str]):
    """
    Dependency that checks if the current user has the required permissions.
    
    Args:
        required_permissions: List of permission strings in format "resource:action"
        
    Returns:
        Dependency function that will raise an exception if the user doesn't have the required permissions
    """
    async def check_permissions(
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(get_db)
    ):
        from src.models.system import User, Role, Permission
        
        # Verify the token and get the user
        payload = decode_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get the user with their roles and permissions
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user",
            )
        
        # Superusers can do anything
        if user.is_superuser:
            return user
        
        # Check if the user has any of the required permissions
        for permission_string in required_permissions:
            # Parse the permission string
            try:
                resource, action = permission_string.split(":")
            except ValueError:
                continue
            
            # Check if the user has this permission through any of their roles
            for role in user.roles:
                for permission in role.permissions:
                    # Wildcard permission check
                    if permission.resource == "*" and permission.action == "*":
                        return user
                    # Specific resource wildcard action
                    if permission.resource == resource and permission.action == "*":
                        return user
                    # Wildcard resource specific action
                    if permission.resource == "*" and permission.action == action:
                        return user
                    # Exact permission match
                    if permission.resource == resource and permission.action == action:
                        return user
        
        # User doesn't have any of the required permissions
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    
    return check_permissions

def create_audit_log(
    db: Session,
    user_id: int,
    action: str,
    resource_type: str,
    resource_id: int,
    previous_state: Optional[Dict[str, Any]] = None,
    new_state: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Create an audit log entry for user actions."""
    from src.models.system import AuditLog
    
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        previous_state=previous_state,
        new_state=new_state,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.add(audit_log)
    db.commit()
    
    return audit_log

def _get_encryption_key(salt: Optional[bytes] = None) -> tuple[bytes, bytes]:
    """
    Derive an encryption key from the application secret.
    Returns tuple of (key, salt)
    """
    if salt is None:
        salt = os.urandom(16)
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    
    key = base64.urlsafe_b64encode(kdf.derive(settings.JWT_SECRET.encode()))
    return key, salt

def encrypt_sensitive_data(data: str) -> tuple[str, str]:
    """
    Encrypt sensitive data using Fernet symmetric encryption.
    Returns tuple of (encrypted_data, salt_b64)
    """
    if not data:
        return ("", "")
    
    key, salt = _get_encryption_key()
    fernet = Fernet(key)
    encrypted_data = fernet.encrypt(data.encode())
    
    # Convert binary data to strings for database storage
    encrypted_b64 = base64.urlsafe_b64encode(encrypted_data).decode()
    salt_b64 = base64.urlsafe_b64encode(salt).decode()
    
    return encrypted_b64, salt_b64

def decrypt_sensitive_data(encrypted_b64: str, salt_b64: str) -> str:
    """Decrypt sensitive data using Fernet symmetric encryption."""
    if not encrypted_b64 or not salt_b64:
        return ""
    
    # Convert from base64 strings back to binary
    encrypted_data = base64.urlsafe_b64decode(encrypted_b64.encode())
    salt = base64.urlsafe_b64decode(salt_b64.encode())
    
    key, _ = _get_encryption_key(salt)
    fernet = Fernet(key)
    decrypted_data = fernet.decrypt(encrypted_data).decode()
    
    return decrypted_data

def encrypt_data(data: Any) -> Dict[str, str]:
    """
    Encrypt data of various types and return encrypted data with salt.
    
    Args:
        data: The data to encrypt (string, dict, list, etc.)
        
    Returns:
        Dict with encrypted_data and salt
    """
    if data is None:
        return {"encrypted_data": "", "salt": ""}
    
    # Convert non-string data to JSON string
    if not isinstance(data, str):
        data = json.dumps(data)
    
    encrypted_data, salt = encrypt_sensitive_data(data)
    return {"encrypted_data": encrypted_data, "salt": salt}

def decrypt_data(encrypted_data: str, salt: str) -> Any:
    """
    Decrypt data and attempt to parse as JSON if possible.
    
    Args:
        encrypted_data: The encrypted data
        salt: The salt used for encryption
        
    Returns:
        The decrypted data, parsed from JSON if possible
    """
    if not encrypted_data or not salt:
        return None
    
    decrypted_data = decrypt_sensitive_data(encrypted_data, salt)
    
    # Try to parse as JSON
    try:
        return json.loads(decrypted_data)
    except json.JSONDecodeError:
        # Return as string if not valid JSON
        return decrypted_data

def encrypt_field_if_needed(table_name: str, field_name: str, value: Any, db: Session) -> Tuple[Any, bool]:
    """
    Check if a field needs encryption based on classification and encrypt if needed.
    
    Args:
        table_name: The database table name
        field_name: The field name
        value: The value to potentially encrypt
        db: Database session
        
    Returns:
        Tuple of (final_value, is_encrypted)
    """
    try:
        # Try to import here to avoid circular imports
        from src.core.compliance import DataClassificationService
        
        # Check if this field should be encrypted
        classification_service = DataClassificationService(db)
        should_encrypt = classification_service.should_encrypt_field(table_name, field_name)
        
        if should_encrypt and value is not None:
            encrypted = encrypt_data(value)
            return {
                "value": encrypted["encrypted_data"],
                "salt": encrypted["salt"],
                "encrypted": True
            }, True
        
        return value, False
    except Exception as e:
        # If any error occurs, return the value unencrypted to avoid data loss
        print(f"Error checking field encryption: {str(e)}")
        return value, False

def decrypt_field_if_needed(encrypted_value: Dict[str, Any]) -> Any:
    """
    Decrypt a field if it's encrypted.
    
    Args:
        encrypted_value: Dict with value, salt, and encrypted flag
        
    Returns:
        The decrypted value
    """
    if not isinstance(encrypted_value, dict):
        return encrypted_value
    
    is_encrypted = encrypted_value.get("encrypted", False)
    if not is_encrypted:
        return encrypted_value.get("value")
    
    value = encrypted_value.get("value")
    salt = encrypted_value.get("salt")
    
    if not value or not salt:
        return None
    
    return decrypt_data(value, salt)

# Multi-factor Authentication
def generate_totp_secret() -> str:
    """Generate a secret key for TOTP (Time-based One-Time Password)."""
    return pyotp.random_base32()

def generate_totp_uri(user_email: str, secret: str) -> str:
    """Generate a TOTP URI for QR code generation."""
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=user_email,
        issuer_name=settings.APP_NAME
    )

def verify_totp_code(secret: str, code: str) -> bool:
    """Verify a TOTP code."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code)

def generate_mfa_backup_codes(count: int = 10) -> List[str]:
    """Generate backup codes for MFA recovery."""
    # Generate random codes with a mix of letters and numbers
    codes = []
    for _ in range(count):
        # Generate a 10-character backup code with 4 groups of 4 characters
        code_parts = []
        for _ in range(4):
            part = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
            code_parts.append(part)
        codes.append('-'.join(code_parts))
    
    return codes

async def send_mfa_code(
    user_id: int, 
    mfa_type: MFAType,
    db: Session,
    contact_info: Optional[str] = None
) -> str:
    """
    Generate and send an MFA code to the user via the specified method.
    
    Args:
        user_id: The user ID
        mfa_type: The MFA method (app, sms, email)
        db: Database session
        contact_info: Optional contact information (phone number for SMS)
        
    Returns:
        The generated code (for testing purposes) or empty string if app-based
    """
    from src.models.system import User, UserPreference
    
    # Get user information
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user preferences
    user_prefs = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    
    if mfa_type == MFAType.APP:
        # For app-based authentication, we don't need to send a code
        # The code is generated by the app
        return ""
    
    # Generate a 6-digit code
    code = ''.join(secrets.choice(string.digits) for _ in range(6))
    
    # Store the code in Redis with a 5-minute expiry
    cache_key = f"mfa:code:{user_id}:{mfa_type.value}"
    cache.set(cache_key, code, expire=300)  # 5 minutes
    
    if mfa_type == MFAType.SMS:
        # Send SMS via external service (implementation depends on the SMS provider)
        phone = contact_info or user_prefs.phone_number
        if not phone:
            raise HTTPException(status_code=400, detail="Phone number not available")
        
        # TODO: Implement SMS sending logic (e.g., Twilio, AWS SNS)
        # For now, we'll just log it
        print(f"[MFA SMS] Sending code {code} to {phone}")
        
    elif mfa_type == MFAType.EMAIL:
        # Send email with the code
        email = user.email
        
        # TODO: Implement email sending logic
        # For now, we'll just log it
        print(f"[MFA EMAIL] Sending code {code} to {email}")
    
    return code  # In production, wouldn't return this

def verify_mfa_code(
    user_id: int,
    mfa_type: MFAType,
    code: str,
    db: Session
) -> bool:
    """
    Verify an MFA code.
    
    Args:
        user_id: The user ID
        mfa_type: The MFA method (app, sms, email)
        code: The code to verify
        db: Database session
        
    Returns:
        True if the code is valid, False otherwise
    """
    # For app-based TOTP
    if mfa_type == MFAType.APP:
        from src.models.system import User
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # Decrypt the TOTP secret
        totp_secret_encrypted = user.totp_secret_encrypted
        totp_secret_salt = user.totp_secret_salt
        
        if not totp_secret_encrypted or not totp_secret_salt:
            return False
            
        totp_secret = decrypt_sensitive_data(totp_secret_encrypted, totp_secret_salt)
        
        # Verify the TOTP code
        return verify_totp_code(totp_secret, code)
    else:
        # For SMS and email codes
        cache_key = f"mfa:code:{user_id}:{mfa_type.value}"
        stored_code = cache.get(cache_key)
        
        if stored_code == code:
            # Invalidate the code after successful verification
            cache.delete(cache_key)
            return True
        
        return False

def verify_backup_code(user_id: int, code: str, db: Session) -> bool:
    """
    Verify a backup code and if valid, remove it from the available codes.
    
    Args:
        user_id: The user ID
        code: The backup code to verify
        db: Database session
        
    Returns:
        True if the code is valid, False otherwise
    """
    from src.models.system import User
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.mfa_backup_codes:
        return False
    
    # Normalize the code (uppercase and remove dashes)
    normalized_code = code.upper().replace('-', '')
    
    # Check if the code exists in the backup codes
    backup_codes = user.mfa_backup_codes
    for i, backup_code in enumerate(backup_codes):
        # Normalize stored code as well
        stored_code = backup_code.upper().replace('-', '')
        if stored_code == normalized_code:
            # Remove the used code
            backup_codes.pop(i)
            user.mfa_backup_codes = backup_codes
            db.commit()
            return True
    
    return False

# OAuth 2.0 with PKCE
def generate_pkce_pair() -> Tuple[str, str]:
    """
    Generate a PKCE (Proof Key for Code Exchange) code verifier and challenge pair.
    
    Returns:
        Tuple of (code_verifier, code_challenge)
    """
    # Generate a secure random code verifier (43-128 chars)
    code_verifier = secrets.token_urlsafe(64)
    
    # Generate the code challenge using SHA256
    code_challenge = hashlib.sha256(code_verifier.encode()).digest()
    code_challenge = base64.urlsafe_b64encode(code_challenge).decode().rstrip('=')
    
    return code_verifier, code_challenge

def store_pkce_verifier(state: str, code_verifier: str) -> None:
    """
    Store a PKCE code verifier for later verification.
    
    Args:
        state: The OAuth state parameter
        code_verifier: The PKCE code verifier
    """
    cache_key = f"oauth:pkce:{state}"
    cache.set(cache_key, code_verifier, expire=600)  # 10 minutes

def get_pkce_verifier(state: str) -> Optional[str]:
    """
    Get a stored PKCE code verifier.
    
    Args:
        state: The OAuth state parameter
        
    Returns:
        The stored code verifier or None if not found
    """
    cache_key = f"oauth:pkce:{state}"
    verifier = cache.get(cache_key)
    
    # Delete after retrieving to prevent reuse
    if verifier:
        cache.delete(cache_key)
    
    return verifier

def create_authorization_url(
    provider: OAuthProvider,
    redirect_uri: str,
    scope: List[str] = ["openid", "email", "profile"]
) -> Tuple[str, str]:
    """
    Create an OAuth 2.0 authorization URL with PKCE.
    
    Args:
        provider: The OAuth provider
        redirect_uri: The redirect URI
        scope: The requested scopes
        
    Returns:
        Tuple of (authorization_url, state)
    """
    # Generate state and PKCE values
    state = secrets.token_urlsafe(32)
    code_verifier, code_challenge = generate_pkce_pair()
    
    # Store the code verifier for later verification
    store_pkce_verifier(state, code_verifier)
    
    # Get provider-specific configuration
    if provider == OAuthProvider.GOOGLE:
        auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
        client_id = settings.GOOGLE_CLIENT_ID
        
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(scope),
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
            "access_type": "offline",  # For refresh token
            "prompt": "consent"         # Force consent screen for refresh token
        }
    
    elif provider == OAuthProvider.MICROSOFT:
        auth_url = f"https://login.microsoftonline.com/{settings.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize"
        client_id = settings.MICROSOFT_CLIENT_ID
        
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(scope),
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256"
        }
    
    elif provider == OAuthProvider.OKTA:
        auth_url = f"{settings.OKTA_DOMAIN}/oauth2/v1/authorize"
        client_id = settings.OKTA_CLIENT_ID
        
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(scope),
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256"
        }
    
    else:
        raise ValueError(f"Unsupported OAuth provider: {provider}")
    
    # Build authorization URL
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    authorization_url = f"{auth_url}?{query_string}"
    
    return authorization_url, state

# Device and session management
def register_device(
    user_id: int,
    device_info: Dict[str, Any],
    db: Session
) -> str:
    """
    Register a new device for a user and return a device token.
    
    Args:
        user_id: The user ID
        device_info: Information about the device
        db: Database session
        
    Returns:
        A device token
    """
    from src.models.system import UserDevice
    
    # Generate a unique device ID
    device_id = str(uuid.uuid4())
    
    # Determine device type
    device_type = DeviceType.OTHER
    user_agent = device_info.get("user_agent", "")
    
    if "Mobile" in user_agent and "Tablet" not in user_agent:
        device_type = DeviceType.MOBILE
    elif "Tablet" in user_agent:
        device_type = DeviceType.TABLET
    else:
        device_type = DeviceType.DESKTOP
    
    # Create a new device record
    device = UserDevice(
        user_id=user_id,
        device_id=device_id,
        device_name=device_info.get("device_name", "Unknown Device"),
        device_type=device_type.value,
        user_agent=user_agent,
        ip_address=device_info.get("ip_address"),
        last_used=datetime.utcnow(),
        is_trusted=False
    )
    
    db.add(device)
    db.commit()
    
    return device_id

def get_user_devices(user_id: int, db: Session) -> List[Dict[str, Any]]:
    """
    Get all devices registered for a user.
    
    Args:
        user_id: The user ID
        db: Database session
        
    Returns:
        List of devices
    """
    from src.models.system import UserDevice
    
    devices = db.query(UserDevice).filter(UserDevice.user_id == user_id).all()
    
    return [
        {
            "device_id": device.device_id,
            "device_name": device.device_name,
            "device_type": device.device_type,
            "last_used": device.last_used.isoformat(),
            "is_trusted": device.is_trusted,
            "ip_address": device.ip_address
        }
        for device in devices
    ]

def update_device_trust(
    user_id: int,
    device_id: str,
    trusted: bool,
    db: Session
) -> bool:
    """
    Update the trust status of a device.
    
    Args:
        user_id: The user ID
        device_id: The device ID
        trusted: Whether the device is trusted
        db: Database session
        
    Returns:
        True if the device was updated, False otherwise
    """
    from src.models.system import UserDevice
    
    device = db.query(UserDevice).filter(
        UserDevice.user_id == user_id,
        UserDevice.device_id == device_id
    ).first()
    
    if not device:
        return False
    
    device.is_trusted = trusted
    db.commit()
    
    return True

def revoke_device(user_id: int, device_id: str, db: Session) -> bool:
    """
    Revoke a device and invalidate all its sessions.
    
    Args:
        user_id: The user ID
        device_id: The device ID
        db: Database session
        
    Returns:
        True if the device was revoked, False otherwise
    """
    from src.models.system import UserDevice, UserSession
    
    # Delete device record
    device_deleted = db.query(UserDevice).filter(
        UserDevice.user_id == user_id,
        UserDevice.device_id == device_id
    ).delete()
    
    # Delete all sessions for this device
    db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.device_id == device_id
    ).delete()
    
    db.commit()
    
    return device_deleted > 0

def create_session(
    user_id: int,
    device_id: str,
    ip_address: str,
    user_agent: str,
    db: Session,
    expires_in: int = settings.SESSION_EXPIRY
) -> str:
    """
    Create a new session for a user and device.
    
    Args:
        user_id: The user ID
        device_id: The device ID
        ip_address: The client IP address
        user_agent: The client user agent
        db: Database session
        expires_in: Session expiry in seconds
        
    Returns:
        A session token
    """
    from src.models.system import UserSession, UserDevice
    
    # Update device last used time
    device = db.query(UserDevice).filter(
        UserDevice.user_id == user_id,
        UserDevice.device_id == device_id
    ).first()
    
    if device:
        device.last_used = datetime.utcnow()
        device.ip_address = ip_address
        device.user_agent = user_agent
    
    # Generate a unique session ID
    session_id = str(uuid.uuid4())
    
    # Calculate expiry time
    expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
    
    # Create session record
    session = UserSession(
        user_id=user_id,
        device_id=device_id,
        session_id=session_id,
        ip_address=ip_address,
        user_agent=user_agent,
        created_at=datetime.utcnow(),
        expires_at=expires_at,
        is_active=True
    )
    
    db.add(session)
    db.commit()
    
    # Generate a token for the session
    payload = {
        "sub": str(user_id),
        "sid": session_id,
        "did": device_id,
        "exp": int(expires_at.timestamp())
    }
    
    token = jwt.encode(
        payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
    
    return token

def validate_session(token: str, db: Session) -> Optional[Dict[str, Any]]:
    """
    Validate a session token and update last activity.
    
    Args:
        token: The session token
        db: Database session
        
    Returns:
        Dict with user_id, session_id, and device_id if valid, None otherwise
    """
    try:
        # Decode token
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        
        user_id = int(payload["sub"])
        session_id = payload["sid"]
        device_id = payload["did"]
        
        # Check if session exists and is active
        from src.models.system import UserSession
        
        session = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.session_id == session_id,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.utcnow()
        ).first()
        
        if not session:
            return None
        
        # Update last activity
        session.last_activity = datetime.utcnow()
        db.commit()
        
        return {
            "user_id": user_id,
            "session_id": session_id,
            "device_id": device_id
        }
    
    except JWTError:
        return None

def revoke_session(user_id: int, session_id: str, db: Session) -> bool:
    """
    Revoke a session.
    
    Args:
        user_id: The user ID
        session_id: The session ID
        db: Database session
        
    Returns:
        True if the session was revoked, False otherwise
    """
    from src.models.system import UserSession
    
    # Find and deactivate session
    session = db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.session_id == session_id
    ).first()
    
    if not session:
        return False
    
    session.is_active = False
    db.commit()
    
    return True

def revoke_all_sessions(user_id: int, db: Session, except_session_id: Optional[str] = None) -> int:
    """
    Revoke all sessions for a user.
    
    Args:
        user_id: The user ID
        db: Database session
        except_session_id: Optional session ID to keep active
        
    Returns:
        Number of sessions revoked
    """
    from src.models.system import UserSession
    
    query = db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.is_active == True
    )
    
    if except_session_id:
        query = query.filter(UserSession.session_id != except_session_id)
    
    sessions = query.all()
    
    for session in sessions:
        session.is_active = False
    
    db.commit()
    
    return len(sessions)

def get_user_sessions(user_id: int, db: Session) -> List[Dict[str, Any]]:
    """
    Get all active sessions for a user.
    
    Args:
        user_id: The user ID
        db: Database session
        
    Returns:
        List of active sessions
    """
    from src.models.system import UserSession, UserDevice
    
    # Get all active sessions and join with devices
    sessions = db.query(UserSession, UserDevice).join(
        UserDevice, 
        UserSession.device_id == UserDevice.device_id
    ).filter(
        UserSession.user_id == user_id,
        UserSession.is_active == True,
        UserSession.expires_at > datetime.utcnow()
    ).all()
    
    return [
        {
            "session_id": session.session_id,
            "device_id": session.device_id,
            "device_name": device.device_name,
            "device_type": device.device_type,
            "ip_address": session.ip_address,
            "created_at": session.created_at.isoformat(),
            "last_activity": session.last_activity.isoformat() if session.last_activity else None,
            "expires_at": session.expires_at.isoformat()
        }
        for session, device in sessions
    ]

# Default roles and permissions
DEFAULT_ROLES = [
    {
        "name": "admin",
        "description": "Administrator with full access to all resources",
        "permissions": ["*:*"]  # Wildcard for all permissions
    },
    {
        "name": "brand_manager",
        "description": "Can manage brands and their projects",
        "permissions": [
            "brand:create", "brand:read", "brand:update", "brand:delete",
            "project:create", "project:read", "project:update", "project:delete", "project:assign",
            "compliance:read" # Can view compliance data but not modify
        ]
    },
    {
        "name": "content_creator",
        "description": "Can create and edit content",
        "permissions": [
            "brand:read", "project:read",
            "content:create", "content:read", "content:update",
            "compliance:read" # Can view compliance data but not modify
        ]
    },
    {
        "name": "viewer",
        "description": "Can view brands, projects, and content but not modify them",
        "permissions": [
            "brand:read", "project:read", "content:read",
            "compliance:read" # Can view compliance data but not modify
        ]
    },
    {
        "name": "compliance_officer",
        "description": "Manages compliance and data retention policies",
        "permissions": [
            "brand:read", "project:read", "content:read", "user:read",
            "compliance:create", "compliance:read", "compliance:update", "compliance:delete",
            "data_retention:create", "data_retention:read", "data_retention:update", "data_retention:delete",
            "data_classification:create", "data_classification:read", "data_classification:update", "data_classification:delete"
        ]
    },
    {
        "name": "data_protection_officer",
        "description": "Manages privacy and data protection",
        "permissions": [
            "brand:read", "project:read", "content:read", "user:read",
            "compliance:read", "compliance:update",
            "data_retention:read", "data_retention:update",
            "data_classification:read", "data_classification:update",
            "data_subject_request:create", "data_subject_request:read", "data_subject_request:update", "data_subject_request:delete",
            "privacy_impact_assessment:create", "privacy_impact_assessment:read", "privacy_impact_assessment:update"
        ]
    }
]

def initialize_rbac(db: Session):
    """Initialize default roles and permissions in the database."""
    from src.models.system import Role, Permission
    
    # Create default permissions
    permissions = {}
    resources = [
        "brand", "project", "content", "user", "role", "integration",
        # Compliance resources
        "compliance", "data_retention", "data_classification", 
        "data_subject_request", "privacy_impact_assessment"
    ]
    actions = ["create", "read", "update", "delete", "assign", "publish", "execute"]
    
    # Create wildcard permission
    wildcard_perm = db.query(Permission).filter(
        Permission.name == "*:*"
    ).first()
    
    if not wildcard_perm:
        wildcard_perm = Permission(
            name="*:*",
            description="Wildcard permission - grants all access",
            resource="*",
            action="*"
        )
        db.add(wildcard_perm)
        permissions["*:*"] = wildcard_perm
    
    # Create regular permissions
    for resource in resources:
        for action in actions:
            perm_name = f"{resource}:{action}"
            perm = db.query(Permission).filter(
                Permission.name == perm_name
            ).first()
            
            if not perm:
                perm = Permission(
                    name=perm_name,
                    description=f"Can {action} {resource}s",
                    resource=resource,
                    action=action
                )
                db.add(perm)
            
            permissions[perm_name] = perm
    
    # Commit to get IDs for the permissions
    db.commit()
    
    # Create default roles with permissions
    for role_data in DEFAULT_ROLES:
        role = db.query(Role).filter(
            Role.name == role_data["name"]
        ).first()
        
        if not role:
            role = Role(
                name=role_data["name"],
                description=role_data["description"]
            )
            db.add(role)
            db.commit()  # To get the role ID
        
        # Add permissions to role
        for perm_name in role_data["permissions"]:
            if perm_name in permissions:
                if permissions[perm_name] not in role.permissions:
                    role.permissions.append(permissions[perm_name])
    
    # Commit all changes
    db.commit()
