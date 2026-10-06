from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import datetime

class InterviewCreate(BaseModel):
    title: Optional[str] = None
    candidate_name: Optional[str] = None
    target_role: str = "Software Engineer"  # Any Universal job role
    company_name: Optional[str] = None
    domain: str = "Technology"  # Technology, Business, Finance, Engineering, Healthcare, Education, Government, etc.
    experience_level: str = "Mid-Level"  # Fresher, Internship, Junior, Mid-Level, Senior, Lead / Manager
    mode: str = "Technical"  # Technical, HR, Behavioral, Resume Based, Job Description Based, Mixed, Mock Interview, Practice
    category: Optional[str] = None  # Specific category or specialization
    difficulty: str = "Medium"  # Easy, Medium, Hard, Adaptive
    total_questions: int = Field(default=5, ge=3, le=20)
    duration_mode: str = "Standard"  # Short, Standard, Extended
    language: str = "English"  # English, Hindi, Hinglish
    resume_id: Optional[int] = None
    job_description: Optional[str] = None
    focus_skills: Optional[List[str]] = []
    is_practice_mode: bool = False  # Practice mode provides hints and explanations

class QuestionResponse(BaseModel):
    id: int
    interview_id: int
    question_text: str
    question_number: int = 1
    question_type: str = "conceptual"
    category: Optional[str] = None
    difficulty: str = "Medium"
    order_index: int = 1
    is_follow_up: bool = False
    parent_question_id: Optional[int] = None
    expected_concepts: List[str] = []
    evaluation_criteria: List[str] = []
    hint: Optional[str] = None  # Available in practice mode

    class Config:
        from_attributes = True

class AnswerSubmit(BaseModel):
    question_id: int
    transcript_text: str
    audio_duration_seconds: Optional[float] = 0.0
    asked_question_ids: Optional[List[int]] = []
    speaking_pace_wpm: Optional[float] = None
    filler_word_count: Optional[int] = 0
    filler_words_breakdown: Optional[Dict[str, int]] = {}

class AnswerEvaluationResponse(BaseModel):
    id: int
    answer_id: int
    score: float = 0.0  # Overall weighted composite score (0 - 100)
    
    # 8-Dimensional Universal Assessment (0 - 10 scale)
    technical_score: float = 0.0
    correctness_score: float = 0.0
    relevance_score: float = 0.0
    problem_solving_score: float = 0.0
    communication_score: float = 0.0
    depth_score: float = 0.0
    practical_score: float = 0.0
    confidence_score: float = 0.0
    
    # Speech Delivery Telemetry
    speaking_pace_wpm: Optional[float] = None
    filler_word_count: Optional[int] = 0
    speech_delivery_feedback: Optional[str] = None
    
    feedback: Optional[str] = None
    strengths: List[str] = []
    weaknesses: List[str] = []
    missing_concepts: List[str] = []
    suggestions: List[str] = []
    suggested_ideal_answer: Optional[str] = None
    evaluated_at: datetime.datetime
    next_question: Optional[QuestionResponse] = None
    is_completed: bool = False

    class Config:
        from_attributes = True

class CandidateAnswerResponse(BaseModel):
    id: int
    interview_id: int
    question_id: int
    transcript_text: str
    audio_duration_seconds: float
    answered_at: datetime.datetime
    evaluation: Optional[AnswerEvaluationResponse] = None

    class Config:
        from_attributes = True

class FollowUpRequest(BaseModel):
    question_id: int
    candidate_answer: str

class NextQuestionRequest(BaseModel):
    previous_question_id: Optional[int] = None
    previous_question: Optional[str] = None
    asked_question_ids: Optional[List[int]] = []
    candidate_name: Optional[str] = None
    job_role: Optional[str] = None
    company_name: Optional[str] = None
    domain: Optional[str] = None
    experience_level: Optional[str] = None
    interview_type: Optional[str] = None
    difficulty: Optional[str] = None
    language: Optional[str] = "English"
    job_description: Optional[str] = None
    conversation_history: Optional[List[Dict[str, Any]]] = []

class NextQuestionResponse(BaseModel):
    success: bool
    is_completed: bool = False
    question: Optional[QuestionResponse] = None

class InterviewReportResponse(BaseModel):
    id: int
    interview_id: int
    candidate_name: Optional[str] = None
    target_role: Optional[str] = None
    domain: Optional[str] = None
    experience_level: Optional[str] = None
    language: Optional[str] = "English"
    overall_score: float
    technical_score: float
    correctness_score: Optional[float] = 0.0
    communication_score: float
    problem_solving_score: float
    confidence_score: float
    verdict: str  # Strong Hire, Hire, Consider, Needs Improvement, Not Ready
    hiring_readiness: Optional[str] = "Needs Improvement"
    executive_summary: Optional[str] = None
    strengths: List[str] = []
    weaknesses: List[str] = []
    technical_gaps: List[str] = []
    skill_gaps: List[str] = []
    communication_feedback: Optional[str] = None
    recommended_topics: List[str] = []
    recommendations: List[str] = []
    question_breakdown: List[Dict[str, Any]] = []
    pdf_report_path: Optional[str] = None
    generated_at: datetime.datetime

    class Config:
        from_attributes = True

class InterviewResponse(BaseModel):
    id: int
    user_id: int
    resume_id: Optional[int] = None
    title: str
    candidate_name: Optional[str] = None
    target_role: str
    company_name: Optional[str] = None
    domain: Optional[str] = "Technology"
    experience_level: Optional[str] = "Mid-Level"
    mode: str
    category: str
    difficulty: str
    language: Optional[str] = "English"
    duration_mode: Optional[str] = "Standard"
    job_description: Optional[str] = None
    is_practice_mode: bool = False
    total_questions: int
    current_index: int
    status: str
    overall_score: float
    duration_seconds: int
    created_at: datetime.datetime
    started_at: Optional[datetime.datetime] = None
    completed_at: Optional[datetime.datetime] = None
    questions: List[QuestionResponse] = []
    report: Optional[InterviewReportResponse] = None

    class Config:
        from_attributes = True

# Job Description Analysis
class JDAnalysisRequest(BaseModel):
    job_description: str
    resume_id: Optional[int] = None
    target_role: Optional[str] = None

class JDAnalysisResponse(BaseModel):
    extracted_role: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    responsibilities: List[str] = []
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    partial_matches: List[str] = []
    extra_resume_skills: List[str] = []
    match_percentage: float = 0.0
    weightings: Dict[str, int] = {
        "resume_projects": 20,
        "required_skills": 30,
        "technical_questions": 25,
        "problem_solving": 10,
        "behavioral": 10,
        "communication": 5
    }
    recommended_focus_areas: List[str] = []

# Anti-cheating / Integrity Logging
class IntegrityEventCreate(BaseModel):
    event_type: str  # TAB_SWITCH, WINDOW_BLUR, AUDIO_DROP, CAMERA_DROP, INACTIVITY
    details: Optional[Dict[str, Any]] = {}
    timestamp: Optional[datetime.datetime] = None

class IntegrityEventResponse(BaseModel):
    id: int
    interview_id: int
    event_type: str
    details: Dict[str, Any] = {}
    timestamp: datetime.datetime

    class Config:
        from_attributes = True
