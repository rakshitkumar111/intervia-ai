from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, CandidateProfile
from app.models.system import SystemLog
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    CandidateProfileUpdate,
    CandidateProfileResponse
)
from app.services.auth_service import (
    authenticate_user,
    create_user,
    get_current_user
)
from app.utils.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Registers a new user account and returns JWT token."""
    new_user = create_user(db, user_data)
    access_token = create_access_token(subject=new_user.id, role=new_user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticates candidate or admin credentials."""
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Audit log
    log = SystemLog(
        user_id=user.id,
        action="USER_LOGIN",
        level="INFO",
        details={"email": user.email, "role": user.role}
    )
    db.add(log)
    db.commit()

    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the current authenticated user profile."""
    return current_user

@router.put("/profile", response_model=CandidateProfileResponse)
def update_profile(
    profile_data: CandidateProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates candidate profile details, target role, experience, and skills."""
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)

    if profile_data.target_role is not None:
        profile.target_role = profile_data.target_role
    if profile_data.experience_level is not None:
        profile.experience_level = profile_data.experience_level
    if profile_data.skills is not None:
        profile.skills = profile_data.skills
    if profile_data.bio is not None:
        profile.bio = profile_data.bio
    if profile_data.phone is not None:
        profile.phone = profile_data.phone
    if profile_data.github_url is not None:
        profile.github_url = profile_data.github_url
    if profile_data.linkedin_url is not None:
        profile.linkedin_url = profile_data.linkedin_url
    if profile_data.preferred_language is not None:
        profile.preferred_language = profile_data.preferred_language

    db.commit()
    db.refresh(profile)
    return profile
