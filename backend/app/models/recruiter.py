import uuid
import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.database import Base

class InterviewInvite(Base):
    __tablename__ = "interview_invites"

    id = Column(Integer, primary_key=True, index=True)
    invite_token = Column(String(100), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    recruiter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    candidate_name = Column(String(100), nullable=False)
    candidate_email = Column(String(150), nullable=False)
    target_role = Column(String(100), nullable=False)
    domain = Column(String(100), default="Technology")
    experience_level = Column(String(50), default="Mid-Level")
    mode = Column(String(50), default="Technical")
    difficulty = Column(String(50), default="Medium")
    language = Column(String(50), default="English")
    total_questions = Column(Integer, default=5)
    
    # Status: pending, in_progress, completed, expired
    status = Column(String(50), default="pending")
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.datetime.utcnow() + datetime.timedelta(days=7))

    # Relationships
    recruiter = relationship("User", foreign_keys=[recruiter_id])
    interview = relationship("Interview", foreign_keys=[interview_id])
