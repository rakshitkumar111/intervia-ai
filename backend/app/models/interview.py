import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False)
    candidate_name = Column(String(100), nullable=True)
    target_role = Column(String(100), nullable=False)  # Universal: Any job role
    company_name = Column(String(100), nullable=True)  # Optional target company
    domain = Column(String(100), default="Technology")  # Technology, Business, Finance, Engineering, Healthcare, Education, Government, etc.
    experience_level = Column(String(50), default="Mid-Level")  # Fresher, Internship, Junior, Mid-Level, Senior, Lead / Manager
    mode = Column(String(50), nullable=False)  # HR, Technical, Behavioral, Situational, Case Study, Coding, Domain Specific, Mixed
    category = Column(String(100), nullable=False)  # Specific topic or domain specialization
    difficulty = Column(String(50), default="Medium")  # Easy, Medium, Hard, Expert, Adaptive
    language = Column(String(50), default="English")  # English, Hindi, Hinglish
    duration_mode = Column(String(50), default="Standard")  # Short, Standard, Extended
    job_description = Column(Text, nullable=True)  # Optional JD text
    is_practice_mode = Column(Boolean, default=False)  # Practice mode provides hints and explanations
    
    total_questions = Column(Integer, default=5)
    current_index = Column(Integer, default=0)
    status = Column(String(50), default="created")  # created, in_progress, paused, completed, cancelled
    
    overall_score = Column(Float, default=0.0)
    duration_seconds = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="interviews")
    questions = relationship("InterviewQuestion", back_populates="interview", order_by="InterviewQuestion.order_index", cascade="all, delete-orphan")
    answers = relationship("CandidateAnswer", back_populates="interview", cascade="all, delete-orphan")
    report = relationship("InterviewReport", back_populates="interview", uselist=False, cascade="all, delete-orphan")
    integrity_events = relationship("IntegrityEvent", back_populates="interview", cascade="all, delete-orphan")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    
    question_text = Column(Text, nullable=False)
    question_number = Column(Integer, default=1)
    question_type = Column(String(50), default="conceptual")  # conceptual, coding, scenario, behavioral, case_study, follow_up
    category = Column(String(100), nullable=True)
    difficulty = Column(String(50), default="Medium")
    order_index = Column(Integer, default=0)
    
    expected_concepts = Column(JSON, default=list)  # Key domain concepts expected in answer
    rubric_criteria = Column(JSON, default=dict)    # Multi-dimensional evaluation criteria
    evaluation_criteria = Column(JSON, default=list)  # Specific evaluation criteria
    hint = Column(Text, nullable=True)  # Helpful hint in practice mode
    
    is_follow_up = Column(Boolean, default=False)
    parent_question_id = Column(Integer, ForeignKey("interview_questions.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    interview = relationship("Interview", back_populates="questions")
    answer = relationship("CandidateAnswer", back_populates="question", uselist=False, cascade="all, delete-orphan")


class CandidateAnswer(Base):
    __tablename__ = "candidate_answers"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("interview_questions.id", ondelete="CASCADE"), nullable=False)
    
    transcript_text = Column(Text, nullable=False)
    audio_duration_seconds = Column(Float, default=0.0)
    answered_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    interview = relationship("Interview", back_populates="answers")
    question = relationship("InterviewQuestion", back_populates="answer")
    evaluation = relationship("AnswerEvaluation", back_populates="answer", uselist=False, cascade="all, delete-orphan")


class AnswerEvaluation(Base):
    __tablename__ = "answer_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    answer_id = Column(Integer, ForeignKey("candidate_answers.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # 8-Dimensional Universal Assessment Scoring (0 - 10 per dimension, normalized 0 - 100 overall)
    score = Column(Float, default=0.0)  # Overall composite score (0 - 100)
    technical_score = Column(Float, default=0.0)  # Technical / Domain Knowledge (0 - 10)
    correctness_score = Column(Float, default=0.0)  # Correctness (0 - 10)
    relevance_score = Column(Float, default=0.0)  # Relevance (0 - 10)
    problem_solving_score = Column(Float, default=0.0)  # Problem Solving (0 - 10)
    communication_score = Column(Float, default=0.0)  # Communication (0 - 10)
    depth_score = Column(Float, default=0.0)  # Depth of Understanding (0 - 10)
    practical_score = Column(Float, default=0.0)  # Practical Understanding / Examples (0 - 10)
    confidence_score = Column(Float, default=0.0)  # Confidence & Clarity (0 - 10)
    
    feedback = Column(Text, nullable=True)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    missing_concepts = Column(JSON, default=list)
    suggestions = Column(JSON, default=list)
    suggested_ideal_answer = Column(Text, nullable=True)
    
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    answer = relationship("CandidateAnswer", back_populates="evaluation")


class InterviewReport(Base):
    __tablename__ = "interview_reports"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    candidate_name = Column(String(100), nullable=True)
    target_role = Column(String(100), nullable=True)
    domain = Column(String(100), nullable=True)
    experience_level = Column(String(50), nullable=True)
    language = Column(String(50), default="English")
    
    overall_score = Column(Float, default=0.0)
    technical_score = Column(Float, default=0.0)
    communication_score = Column(Float, default=0.0)
    problem_solving_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    
    # Hiring Readiness Verdict: Strong Hire, Hire, Consider, Needs Improvement, Not Ready
    verdict = Column(String(50), default="Needs Improvement")
    hiring_readiness = Column(String(50), default="Needs Improvement")
    
    executive_summary = Column(Text, nullable=True)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    technical_gaps = Column(JSON, default=list)
    skill_gaps = Column(JSON, default=list)
    communication_feedback = Column(Text, nullable=True)
    recommended_topics = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)
    
    question_breakdown = Column(JSON, default=list)
    pdf_report_path = Column(String(500), nullable=True)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    interview = relationship("Interview", back_populates="report")


class IntegrityEvent(Base):
    __tablename__ = "integrity_events"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    
    event_type = Column(String(50), nullable=False)  # TAB_SWITCH, WINDOW_BLUR, AUDIO_DROP, CAMERA_DROP, INACTIVITY
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    interview = relationship("Interview", back_populates="integrity_events")
