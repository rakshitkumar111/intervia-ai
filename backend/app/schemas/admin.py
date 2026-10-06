import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr

class SystemLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    level: str
    details: Dict[str, Any] = {}
    ip_address: Optional[str] = None
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

class SystemSettingUpdate(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class AdminStatsResponse(BaseModel):
    total_users: int
    total_interviews: int
    completed_interviews: int
    average_score: float
    category_distribution: Dict[str, int]
    verdict_distribution: Dict[str, int]
    recent_activity: List[SystemLogResponse]

class AdminUserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Optional[str] = "candidate"

class UserStatusUpdate(BaseModel):
    is_active: bool

class UserRoleUpdate(BaseModel):
    role: str

class SystemHealthResponse(BaseModel):
    ai_provider: str
    gemini_model: str
    ai_status: str
    sandbox_status: Dict[str, str]
    database_status: str
    total_users: int
    total_interviews: int
    timestamp: datetime.datetime

class IntegrityMetricsResponse(BaseModel):
    total_events: int
    by_type: Dict[str, int]
    flagged_sessions_count: int
    average_integrity_score: float
