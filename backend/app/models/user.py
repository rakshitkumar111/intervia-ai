import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="candidate")  # candidate, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    profile = relationship("CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")
    system_logs = relationship("SystemLog", back_populates="user")


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    target_role = Column(String(100), default="Software Engineer")
    experience_level = Column(String(50), default="Fresher (0-1 yrs)")  # Fresher, Mid-Level, Senior
    skills = Column(JSON, default=list)  # ["Python", "FastAPI", "React"]
    bio = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    preferred_language = Column(String(50), default="English")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="profile")
