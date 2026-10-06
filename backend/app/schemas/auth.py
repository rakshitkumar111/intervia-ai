from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Optional[str] = "candidate"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class CandidateProfileBase(BaseModel):
    target_role: Optional[str] = "Software Engineer"
    experience_level: Optional[str] = "Fresher (0-1 yrs)"
    skills: Optional[List[str]] = []
    bio: Optional[str] = None
    phone: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    preferred_language: Optional[str] = "English"

class CandidateProfileUpdate(CandidateProfileBase):
    pass

class CandidateProfileResponse(CandidateProfileBase):
    id: int
    user_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime.datetime
    profile: Optional[CandidateProfileResponse] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
