import datetime
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional

class InterviewInviteCreate(BaseModel):
    candidate_name: str
    candidate_email: EmailStr
    target_role: str
    domain: Optional[str] = "Technology"
    experience_level: Optional[str] = "Mid-Level"
    mode: Optional[str] = "Technical"
    difficulty: Optional[str] = "Medium"
    language: Optional[str] = "English"
    total_questions: Optional[int] = 5
    expires_in_days: Optional[int] = 7

class InterviewInviteResponse(BaseModel):
    id: int
    invite_token: str
    invite_url: str
    candidate_name: str
    candidate_email: str
    target_role: str
    mode: str
    difficulty: str
    language: str
    total_questions: int
    status: str
    created_at: datetime.datetime
    expires_at: datetime.datetime
    interview_id: Optional[int] = None

    class Config:
        from_attributes = True

class CandidateLeaderboardItem(BaseModel):
    interview_id: int
    candidate_name: str
    target_role: str
    domain: str
    experience_level: str
    overall_score: float
    technical_score: float
    communication_score: float
    problem_solving_score: float
    verdict: str
    integrity_score: float
    completed_at: Optional[datetime.datetime] = None
    pdf_report_path: Optional[str] = None

class CandidateAnswerReplay(BaseModel):
    question_number: int
    question_text: str
    candidate_answer: str
    score: float
    technical_score: float
    feedback: str
    speaking_pace_wpm: Optional[float] = None
    filler_word_count: Optional[int] = 0

class CandidateSessionReplayResponse(BaseModel):
    interview_id: int
    candidate_name: str
    target_role: str
    overall_score: float
    verdict: str
    integrity_events_count: int
    answers: List[CandidateAnswerReplay]
