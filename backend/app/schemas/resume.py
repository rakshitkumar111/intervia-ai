from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import datetime

class ResumeBase(BaseModel):
    filename: str

class ResumeAnalysisResult(BaseModel):
    filename: str
    name: Optional[str] = None
    skills: List[str] = []
    programming_languages: List[str] = []
    frameworks: List[str] = []
    databases: List[str] = []
    tools: List[str] = []
    cloud_devops: List[str] = []
    ai_ml: List[str] = []
    experience: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    certifications: List[str] = []
    achievements: List[str] = []
    summary: Optional[str] = None
    suggested_domains: List[str] = []

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_size_bytes: int
    parsed_skills: List[str] = []
    parsed_experience: List[Dict[str, Any]] = []
    parsed_education: List[Dict[str, Any]] = []
    parsed_projects: List[Dict[str, Any]] = []
    parsed_certifications: List[str] = []
    summary: Optional[str] = None
    uploaded_at: datetime.datetime

    class Config:
        from_attributes = True
