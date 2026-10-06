import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # e.g., AUTH_LOGIN, INTERVIEW_START, AI_EVALUATION
    level = Column(String(20), default="INFO")   # INFO, WARNING, ERROR, CRITICAL
    details = Column(JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="system_logs")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
