from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, CandidateProfile
from app.models.system import SystemLog
from app.utils.security import decode_access_token, verify_password, get_password_hash
from app.schemas.auth import UserCreate, UserLogin

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Extracts and validates current authenticated user from Bearer token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")
    return user

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Verifies that the authenticated user has administrative privileges."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required"
        )
    return current_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticates a user with email and password."""
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_user(db: Session, user_data: UserCreate) -> User:
    """Creates a new user with hashed password and initialized candidate profile."""
    existing_user = db.query(User).filter(User.email == user_data.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email.lower().strip(),
        hashed_password=hashed_pwd,
        full_name=user_data.full_name,
        role=user_data.role or "candidate"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Initialize candidate profile
    profile = CandidateProfile(
        user_id=new_user.id,
        target_role="Software Engineer",
        experience_level="Fresher (0-1 yrs)",
        skills=[]
    )
    db.add(profile)
    
    # Add audit log
    log = SystemLog(
        user_id=new_user.id,
        action="USER_REGISTER",
        level="INFO",
        details={"email": new_user.email, "role": new_user.role}
    )
    db.add(log)
    db.commit()
    db.refresh(new_user)
    return new_user
