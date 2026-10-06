import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    extracted_text = Column(Text, nullable=True)
    
    # Structured NLP extractions
    parsed_skills = Column(JSON, default=list)        # ["Python", "SQL", "React", "Docker"]
    parsed_experience = Column(JSON, default=list)    # [{"role": "Intern", "company": "...", "duration": "..."}]
    parsed_education = Column(JSON, default=list)     # [{"degree": "B.Tech", "institution": "...", "year": "..."}]
    parsed_projects = Column(JSON, default=list)      # [{"title": "Threat Detection", "description": "..."}]
    parsed_certifications = Column(JSON, default=list)# ["AWS Cloud Practitioner", "..."]
    summary = Column(Text, nullable=True)
    
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
