from datetime import datetime, timedelta
from typing import Optional, Union, Any
import base64
import os

from jose import jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from src.ultimate_marketing_team.core.settings import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate a password hash."""
    return pwd_context.hash(password)

def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=settings.JWT_EXPIRY)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """Verify a JWT token and return the subject."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload.get("sub")
    except jwt.JWTError:
        return None

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
