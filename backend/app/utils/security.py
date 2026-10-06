import datetime
from typing import Optional, Any, Union
import bcrypt
from jose import jwt, JWTError
from app.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored bcrypt hash."""
    try:
        if isinstance(plain_password, str):
            plain_password_bytes = plain_password.encode("utf-8")
        else:
            plain_password_bytes = plain_password

        if isinstance(hashed_password, str):
            hashed_password_bytes = hashed_password.encode("utf-8")
        else:
            hashed_password_bytes = hashed_password

        return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hashes a password with bcrypt salt."""
    if isinstance(password, str):
        password_bytes = password.encode("utf-8")
    else:
        password_bytes = password
    
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")

def create_access_token(subject: Union[str, Any], role: str = "candidate", expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Creates a signed JWT access token with user identifier and role."""
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "iat": datetime.datetime.utcnow()
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
