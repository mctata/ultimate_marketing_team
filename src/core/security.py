# Standard library imports
import base64
import os
from datetime import datetime, timedelta
from functools import wraps
from typing import Optional, Union, Any, Dict, List

# Third-party imports
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from sqlalchemy.orm import Session

# Local imports
from src.core.settings import settings
from src.core.database import get_db

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

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
            "project:create", "project:read", "project:update", "project:delete", "project:assign"
        ]
    },
    {
        "name": "content_creator",
        "description": "Can create and edit content",
        "permissions": [
            "brand:read", "project:read",
            "content:create", "content:read", "content:update"
        ]
    },
    {
        "name": "viewer",
        "description": "Can view brands, projects, and content but not modify them",
        "permissions": [
            "brand:read", "project:read", "content:read"
        ]
    }
]

def initialize_rbac(db: Session):
    """Initialize default roles and permissions in the database."""
    from src.models.system import Role, Permission
    
    # Create default permissions
    permissions = {}
    resources = ["brand", "project", "content", "user", "role", "integration"]
    actions = ["create", "read", "update", "delete", "assign", "publish"]
    
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
