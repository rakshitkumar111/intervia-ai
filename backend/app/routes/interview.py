import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, CandidateProfile
from app.models.resume import Resume
from app.models.interview import (
    Interview,
    InterviewQuestion,
    CandidateAnswer,
    AnswerEvaluation,
    InterviewReport,
    IntegrityEvent
)
from app.models.recruiter import InterviewInvite
from app.models.system import SystemLog
from app.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    QuestionResponse,
    AnswerSubmit,
    AnswerEvaluationResponse,
    CandidateAnswerResponse,
    InterviewReportResponse,
    NextQuestionRequest,
    NextQuestionResponse,
    JDAnalysisRequest,
    JDAnalysisResponse,
    IntegrityEventCreate,
    IntegrityEventResponse
)
from app.services.auth_service import get_current_user
from app.services.ai.engine import ai_engine
from app.services.pdf_service import PDFReportGenerator
from app.config import REPORT_DIR
from app.utils.logger import logger

router = APIRouter(prefix="/interview", tags=["Interview Lifecycle"])

@router.post("/create", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(
    payload: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new universal interview session and generates an adaptive question plan for ANY job role."""
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    
    # 1. Gather candidate skills & projects from resume or profile
    extracted_skills = payload.focus_skills or []
    extracted_projects = []
    
    if payload.resume_id:
        resume = db.query(Resume).filter(Resume.id == payload.resume_id, Resume.user_id == current_user.id).first()
        if resume:
            extracted_skills.extend(resume.parsed_skills or [])
            extracted_projects.extend(resume.parsed_projects or [])

    if profile and profile.skills:
        extracted_skills.extend(profile.skills)
    
    unique_skills = list(dict.fromkeys(extracted_skills))
    candidate_name = payload.candidate_name or current_user.full_name or "Candidate"
    exp_level = payload.experience_level or (profile.experience_level if profile else "Mid-Level")
    category = payload.category or payload.target_role

    # Default title
    title = payload.title or f"{payload.difficulty} {payload.mode} Interview - {payload.target_role} ({payload.domain})"

    # 2. Generate Universal Question Plan using AI Engine
    question_plan = ai_engine.generate_interview_plan(
        target_role=payload.target_role,
        mode=payload.mode,
        category=category,
        difficulty=payload.difficulty,
        total_questions=payload.total_questions,
        skills=unique_skills,
        projects=extracted_projects,
        experience_level=exp_level,
        domain=payload.domain,
        company_name=payload.company_name,
        language=payload.language,
        job_description=payload.job_description,
        candidate_name=candidate_name
    )

    # 3. Persist Universal Interview Session
    new_interview = Interview(
        user_id=current_user.id,
        resume_id=payload.resume_id,
        title=title,
        candidate_name=candidate_name,
        target_role=payload.target_role,
        company_name=payload.company_name,
        domain=payload.domain,
        experience_level=exp_level,
        mode=payload.mode,
        category=category,
        difficulty=payload.difficulty,
        language=payload.language,
        duration_mode=payload.duration_mode,
        job_description=payload.job_description,
        is_practice_mode=payload.is_practice_mode,
        total_questions=payload.total_questions,
        current_index=0,
        status="created"
    )
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)

    # 4. Persist Planned Interview Questions
    if question_plan:
        for idx, q_data in enumerate(question_plan, 1):
            q = InterviewQuestion(
                interview_id=new_interview.id,
                question_text=q_data.get("question_text", ""),
                question_number=idx,
                question_type=q_data.get("question_type", "conceptual"),
                category=q_data.get("category", category),
                difficulty=q_data.get("difficulty", payload.difficulty),
                order_index=idx,
                expected_concepts=q_data.get("expected_concepts", []),
                evaluation_criteria=q_data.get("evaluation_criteria", []),
                hint=q_data.get("hint", "Be structured, mention key principles and practical examples.")
            )
            db.add(q)
    else:
        q = InterviewQuestion(
            interview_id=new_interview.id,
            question_text=f"Welcome to your interview for the {payload.target_role} position. To start, please introduce yourself and share your background.",
            question_number=1,
            question_type="behavioral",
            category="Introduction",
            difficulty=payload.difficulty,
            order_index=1,
            expected_concepts=["introduction", "experience"],
            evaluation_criteria=["Clarity", "Relevance"],
            hint="Highlight your core background, main achievements, and relevant experience."
        )
        db.add(q)

    # 5. Audit Log
    log = SystemLog(
        user_id=current_user.id,
        action="INTERVIEW_CREATE",
        level="INFO",
        details={
            "interview_id": new_interview.id,
            "role": payload.target_role,
            "domain": payload.domain,
            "language": payload.language,
            "mode": payload.mode,
            "practice": payload.is_practice_mode
        }
    )
    db.add(log)
    db.commit()
    db.refresh(new_interview)

    return new_interview


@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves complete universal interview session details, questions, and reports."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    # Authorization: candidate who owns it, admin, or recruiter who created the invite
    is_owner = (interview.user_id == current_user.id)
    is_admin = (current_user.role == "admin")
    is_invite_recruiter = db.query(InterviewInvite).filter(
        InterviewInvite.interview_id == interview_id,
        InterviewInvite.recruiter_id == current_user.id
    ).first() is not None

    if not (is_owner or is_admin or is_invite_recruiter):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    return interview


@router.post("/{interview_id}/start", response_model=InterviewResponse)
def start_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Starts the live universal interview session and initializes timer."""
    interview = db.query(Interview).filter(Interview.id == interview_id, Interview.user_id == current_user.id).first()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")
    
    interview.status = "in_progress"
    interview.started_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(interview)
    return interview


@router.post("/{interview_id}/answer", response_model=AnswerEvaluationResponse)
def submit_answer(
    interview_id: int,
    payload: AnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submits candidate answer transcript, performs 8-dimensional AI evaluation, and generates the next adaptive non-repeating question."""
    interview = db.query(Interview).filter(Interview.id == interview_id, Interview.user_id == current_user.id).first()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    question = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == payload.question_id,
        InterviewQuestion.interview_id == interview_id
    ).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found in this interview.")

    # Record candidate answer
    new_answer = CandidateAnswer(
        interview_id=interview_id,
        question_id=question.id,
        transcript_text=payload.transcript_text,
        audio_duration_seconds=payload.audio_duration_seconds or 0.0
    )
    db.add(new_answer)
    db.commit()
    db.refresh(new_answer)

    # Perform 8-Dimensional Universal AI Evaluation
    evaluation_result = ai_engine.evaluate_answer(
        question_text=question.question_text,
        candidate_answer=payload.transcript_text,
        expected_concepts=question.expected_concepts or [],
        category=question.category or interview.category,
        difficulty=question.difficulty or interview.difficulty,
        target_role=interview.target_role,
        language=interview.language or "English"
    )

    new_eval = AnswerEvaluation(
        answer_id=new_answer.id,
        score=evaluation_result.get("score", 0.0),
        technical_score=evaluation_result.get("technical_score", 0.0),
        correctness_score=evaluation_result.get("correctness_score", 0.0),
        relevance_score=evaluation_result.get("relevance_score", 0.0),
        problem_solving_score=evaluation_result.get("problem_solving_score", 0.0),
        communication_score=evaluation_result.get("communication_score", 0.0),
        depth_score=evaluation_result.get("depth_score", 0.0),
        practical_score=evaluation_result.get("practical_score", 0.0),
        confidence_score=evaluation_result.get("confidence_score", 0.0),
        feedback=evaluation_result.get("feedback", ""),
        strengths=evaluation_result.get("strengths", []),
        weaknesses=evaluation_result.get("weaknesses", []),
        missing_concepts=evaluation_result.get("missing_concepts", []),
        suggestions=evaluation_result.get("suggestions", []),
        suggested_ideal_answer=evaluation_result.get("suggested_ideal_answer")
    )
    db.add(new_eval)

    # Query all answered questions for this session
    all_answers = db.query(CandidateAnswer).filter(CandidateAnswer.interview_id == interview_id).all()
    answered_ids = [a.question_id for a in all_answers]
    answered_count = len(answered_ids)
    interview.current_index = answered_count

    # Check if session has reached total questions limit
    if answered_count >= interview.total_questions:
        interview.status = "completed"
        interview.completed_at = datetime.datetime.utcnow()

        # Sync the associated invite status to "completed"
        invite = db.query(InterviewInvite).filter(InterviewInvite.interview_id == interview_id).first()
        if invite and invite.status != "completed":
            invite.status = "completed"

        db.commit()
        db.refresh(new_eval)

        eval_resp = AnswerEvaluationResponse.from_orm(new_eval)
        eval_resp.is_completed = True
        eval_resp.next_question = None
        eval_resp.speaking_pace_wpm = payload.speaking_pace_wpm
        eval_resp.filler_word_count = payload.filler_word_count or 0
        if payload.filler_word_count and payload.filler_word_count > 2:
            eval_resp.speech_delivery_feedback = f"Identified {payload.filler_word_count} filler words. Aim to pause instead of using filler vocalizations."
        return eval_resp

    # Generate Next Verified Unique Adaptive Question
    all_db_questions = db.query(InterviewQuestion).filter(InterviewQuestion.interview_id == interview_id).all()
    asked_texts = [q.question_text for q in all_db_questions]
    asked_ids = [q.id for q in all_db_questions]
    if payload.asked_question_ids:
        asked_ids.extend(payload.asked_question_ids)
    asked_ids = list(set(asked_ids))

    conversation_history = []
    for a in all_answers:
        q_obj = db.query(InterviewQuestion).filter(InterviewQuestion.id == a.question_id).first()
        e_obj = a.evaluation
        conversation_history.append({
            "question": q_obj.question_text if q_obj else "",
            "answer": a.transcript_text,
            "score": e_obj.score if e_obj else 0.0
        })

    next_q_data = ai_engine.generate_next_adaptive_question(
        target_role=interview.target_role,
        mode=interview.mode,
        category=interview.category,
        difficulty=interview.difficulty,
        previous_question=question.question_text,
        previous_answer=payload.transcript_text,
        previous_evaluation=evaluation_result,
        asked_questions=asked_texts,
        domain=interview.domain,
        experience_level=interview.experience_level,
        language=interview.language,
        job_description=interview.job_description,
        candidate_name=interview.candidate_name,
        conversation_history=conversation_history
    )

    next_order = answered_count + 1
    existing_next = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id,
        InterviewQuestion.order_index == next_order
    ).first()

    if existing_next:
        if next_q_data and next_q_data.get("question_text"):
            existing_next.question_text = next_q_data.get("question_text")
            existing_next.question_type = next_q_data.get("question_type", existing_next.question_type)
            existing_next.category = next_q_data.get("category", existing_next.category)
            existing_next.difficulty = next_q_data.get("difficulty", existing_next.difficulty)
            existing_next.expected_concepts = next_q_data.get("expected_concepts", existing_next.expected_concepts)
            existing_next.evaluation_criteria = next_q_data.get("evaluation_criteria", existing_next.evaluation_criteria)
            existing_next.hint = next_q_data.get("hint", existing_next.hint)
        next_question = existing_next
    else:
        next_question = InterviewQuestion(
            interview_id=interview_id,
            question_text=next_q_data.get("question_text", ""),
            question_number=next_order,
            question_type=next_q_data.get("question_type", "conceptual"),
            category=next_q_data.get("category", interview.category),
            difficulty=next_q_data.get("difficulty", interview.difficulty),
            order_index=next_order,
            expected_concepts=next_q_data.get("expected_concepts", []),
            evaluation_criteria=next_q_data.get("evaluation_criteria", []),
            hint=next_q_data.get("hint", "Focus on technical accuracy and real-world implementation details.")
        )
        db.add(next_question)
    db.commit()
    db.refresh(next_question)
    db.refresh(new_eval)

    eval_resp = AnswerEvaluationResponse.from_orm(new_eval)
    eval_resp.is_completed = False
    eval_resp.next_question = QuestionResponse.from_orm(next_question)
    eval_resp.speaking_pace_wpm = payload.speaking_pace_wpm
    eval_resp.filler_word_count = payload.filler_word_count or 0
    if payload.filler_word_count and payload.filler_word_count > 2:
        eval_resp.speech_delivery_feedback = f"Identified {payload.filler_word_count} filler words. Aim to pause instead of using filler vocalizations."
    return eval_resp


@router.post("/{interview_id}/next-question", response_model=NextQuestionResponse)
def get_next_question(
    interview_id: int,
    payload: NextQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates an immediate unique adaptive question ensuring 0 duplicate questions."""
    interview = db.query(Interview).filter(Interview.id == interview_id, Interview.user_id == current_user.id).first()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    all_db_questions = db.query(InterviewQuestion).filter(InterviewQuestion.interview_id == interview_id).all()
    asked_texts = [q.question_text for q in all_db_questions]
    
    next_order = len(all_db_questions) + 1
    if next_order > interview.total_questions:
        return NextQuestionResponse(success=True, is_completed=True, question=None)

    next_q_data = ai_engine.generate_next_adaptive_question(
        target_role=payload.job_role or interview.target_role,
        mode=payload.interview_type or interview.mode,
        category=interview.category,
        difficulty=payload.difficulty or interview.difficulty,
        previous_question=payload.previous_question or "",
        previous_answer="",
        previous_evaluation=None,
        asked_questions=asked_texts,
        domain=payload.domain or interview.domain,
        experience_level=payload.experience_level or interview.experience_level,
        language=payload.language or interview.language,
        job_description=payload.job_description or interview.job_description,
        candidate_name=payload.candidate_name or interview.candidate_name,
        conversation_history=payload.conversation_history or []
    )

    next_question = InterviewQuestion(
        interview_id=interview_id,
        question_text=next_q_data.get("question_text", ""),
        question_number=next_order,
        question_type=next_q_data.get("question_type", "conceptual"),
        category=next_q_data.get("category", interview.category),
        difficulty=next_q_data.get("difficulty", interview.difficulty),
        order_index=next_order,
        expected_concepts=next_q_data.get("expected_concepts", []),
        evaluation_criteria=next_q_data.get("evaluation_criteria", []),
        hint=next_q_data.get("hint", "Provide a clear, structured response.")
    )
    db.add(next_question)
    db.commit()
    db.refresh(next_question)

    return NextQuestionResponse(
        success=True,
        is_completed=False,
        question=QuestionResponse.from_orm(next_question)
    )


@router.post("/{interview_id}/complete", response_model=InterviewReportResponse)
def complete_interview(
    interview_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Finalizes universal interview session, generates multi-dimensional report, and triggers PDF export."""
    interview = db.query(Interview).filter(Interview.id == interview_id, Interview.user_id == current_user.id).first()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    interview.status = "completed"
    if not interview.completed_at:
        interview.completed_at = datetime.datetime.utcnow()

    # Query all questions and answers
    answers = db.query(CandidateAnswer).filter(CandidateAnswer.interview_id == interview_id).all()
    qa_pairs = []
    
    total_score = 0.0
    tech_sum = 0.0
    corr_sum = 0.0
    comm_sum = 0.0
    prob_sum = 0.0
    conf_sum = 0.0
    evaluated_count = 0

    for a in answers:
        q = db.query(InterviewQuestion).filter(InterviewQuestion.id == a.question_id).first()
        e = a.evaluation
        q_text = q.question_text if q else "Question"
        cat = q.category if q else "General"
        
        score_val = e.score if e else 0.0
        tech_val = e.technical_score if e else 0.0
        corr_val = e.correctness_score if e else 0.0
        comm_val = e.communication_score if e else 0.0
        prob_val = e.problem_solving_score if e else 0.0
        conf_val = e.confidence_score if e else 0.0

        if e:
            total_score += score_val
            tech_sum += tech_val if tech_val > 10.0 else tech_val * 10
            corr_sum += corr_val if corr_val > 10.0 else corr_val * 10
            comm_sum += comm_val if comm_val > 10.0 else comm_val * 10
            prob_sum += prob_val if prob_val > 10.0 else prob_val * 10
            conf_sum += conf_val if conf_val > 10.0 else conf_val * 10
            evaluated_count += 1

        qa_pairs.append({
            "question": q_text,
            "answer": a.transcript_text,
            "category": cat,
            "score": score_val,
            "technical_score": tech_val,
            "correctness_score": corr_val,
            "communication_score": comm_val,
            "problem_solving_score": prob_val,
            "confidence_score": conf_val,
            "feedback": e.feedback if e else "",
            "strengths": e.strengths if e else [],
            "weaknesses": e.weaknesses if e else [],
            "missing_concepts": e.missing_concepts if e else []
        })

    avg_overall = round(total_score / max(1, evaluated_count), 1)
    avg_tech = round(tech_sum / max(1, evaluated_count), 1)
    avg_corr = round(corr_sum / max(1, evaluated_count), 1)
    avg_comm = round(comm_sum / max(1, evaluated_count), 1)
    avg_prob = round(prob_sum / max(1, evaluated_count), 1)
    avg_conf = round(conf_sum / max(1, evaluated_count), 1)

    interview.overall_score = avg_overall

    # Generate Executive Assessment Report via AI Engine
    ai_report = ai_engine.generate_final_report(
        qa_pairs=qa_pairs,
        target_role=interview.target_role,
        domain=interview.domain,
        experience_level=interview.experience_level,
        language=interview.language,
        candidate_name=interview.candidate_name
    )

    # Determine Hiring Readiness
    verdict = ai_report.get("verdict", "Needs Improvement")
    readiness = "Excellent" if avg_overall >= 80 else "Good" if avg_overall >= 65 else "Needs Improvement" if avg_overall >= 45 else "Not Ready"

    # Upsert InterviewReport Record
    report = db.query(InterviewReport).filter(InterviewReport.interview_id == interview_id).first()
    if not report:
        report = InterviewReport(
            interview_id=interview.id,
            candidate_name=interview.candidate_name,
            target_role=interview.target_role,
            domain=interview.domain,
            experience_level=interview.experience_level,
            language=interview.language,
            overall_score=avg_overall,
            technical_score=avg_tech,
            communication_score=avg_comm,
            problem_solving_score=avg_prob,
            confidence_score=avg_conf,
            verdict=verdict,
            hiring_readiness=readiness,
            executive_summary=ai_report.get("executive_summary", ""),
            strengths=ai_report.get("strengths", []),
            weaknesses=ai_report.get("weaknesses", []),
            technical_gaps=ai_report.get("technical_gaps", []),
            skill_gaps=ai_report.get("skill_gaps", []),
            communication_feedback=ai_report.get("communication_feedback", ""),
            recommended_topics=ai_report.get("recommended_topics", []),
            recommendations=ai_report.get("recommendations", []),
            question_breakdown=qa_pairs
        )
        db.add(report)
    else:
        report.overall_score = avg_overall
        report.technical_score = avg_tech
        report.communication_score = avg_comm
        report.problem_solving_score = avg_prob
        report.confidence_score = avg_conf
        report.verdict = verdict
        report.hiring_readiness = readiness
        report.executive_summary = ai_report.get("executive_summary", "")
        report.strengths = ai_report.get("strengths", [])
        report.weaknesses = ai_report.get("weaknesses", [])
        report.technical_gaps = ai_report.get("technical_gaps", [])
        report.skill_gaps = ai_report.get("skill_gaps", [])
        report.communication_feedback = ai_report.get("communication_feedback", "")
        report.recommended_topics = ai_report.get("recommended_topics", [])
        report.recommendations = ai_report.get("recommendations", [])
        report.question_breakdown = qa_pairs

    # Sync the associated invite status to "completed"
    invite = db.query(InterviewInvite).filter(InterviewInvite.interview_id == interview_id).first()
    if invite and invite.status != "completed":
        invite.status = "completed"

    db.commit()
    db.refresh(report)

    # Generate PDF in Background
    pdf_filename = f"report_interview_{interview.id}_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"
    pdf_path = REPORT_DIR / pdf_filename
    background_tasks.add_task(PDFReportGenerator.generate_report_pdf, report, str(pdf_path))

    return report


@router.get("/{interview_id}/report", response_model=InterviewReportResponse)
def get_interview_report(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves the official candidate assessment and hiring readiness report."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    # Authorization: candidate who owns it, admin, or recruiter who created the invite
    is_owner = (interview.user_id == current_user.id)
    is_admin = (current_user.role == "admin")
    is_invite_recruiter = db.query(InterviewInvite).filter(
        InterviewInvite.interview_id == interview_id,
        InterviewInvite.recruiter_id == current_user.id
    ).first() is not None

    if not (is_owner or is_admin or is_invite_recruiter):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    if not interview.report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview report not found or not yet finalized.")
    return interview.report


@router.post("/analyze-jd", response_model=JDAnalysisResponse)
def analyze_job_description(
    payload: JDAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyzes job description, extracts required/preferred skills, and performs resume gap analysis."""
    candidate_skills = []
    if payload.resume_id:
        resume = db.query(Resume).filter(Resume.id == payload.resume_id, Resume.user_id == current_user.id).first()
        if resume:
            candidate_skills = resume.parsed_skills or []

    jd_text = payload.job_description
    role = payload.target_role or "Software Engineer"

    # Analyze via AI Engine or rule-based parsing
    analysis = ai_engine.analyze_job_description(jd_text, candidate_skills, role)
    return analysis


@router.post("/upload-jd")
async def upload_job_description(
    file: UploadFile = File(...),
    resume_id: Optional[int] = Form(None),
    target_role: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Uploads a job description file (PDF, DOCX, TXT), extracts text, and returns structured JD analysis."""
    from app.services.resume_service import ResumeParserService
    from app.config import RESUME_DIR
    import shutil

    allowed_extensions = [".pdf", ".docx", ".doc", ".txt", ".md"]
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '{file_ext}'. Allowed formats: {', '.join(allowed_extensions)}"
        )

    temp_path = RESUME_DIR / f"jd_{current_user.id}_{Path(file.filename).stem}_{file_ext}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store JD file: {e}")

    extracted_text = ResumeParserService.extract_text_from_file(temp_path)
    if temp_path.exists():
        temp_path.unlink()

    candidate_skills = []
    if resume_id:
        resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
        if resume:
            candidate_skills = resume.parsed_skills or []

    role = target_role or "Software Engineer"
    analysis = ai_engine.analyze_job_description(extracted_text, candidate_skills, role)

    return {
        "filename": file.filename,
        "extracted_text": extracted_text,
        "analysis": analysis
    }


@router.post("/{interview_id}/integrity-event", response_model=IntegrityEventResponse, status_code=status.HTTP_201_CREATED)
def log_integrity_event(
    interview_id: int,
    payload: IntegrityEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Passively logs anti-cheating & integrity events (tab switch, window blur, mic interruptions)."""
    interview = db.query(Interview).filter(Interview.id == interview_id, Interview.user_id == current_user.id).first()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    event = IntegrityEvent(
        interview_id=interview_id,
        event_type=payload.event_type,
        details=payload.details or {},
        timestamp=payload.timestamp or datetime.datetime.utcnow()
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/{interview_id}/integrity-events", response_model=List[IntegrityEventResponse])
def get_integrity_events(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all integrity events logged during the interview."""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        (Interview.user_id == current_user.id) | (current_user.role == "admin")
    ).first()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    events = db.query(IntegrityEvent).filter(IntegrityEvent.interview_id == interview_id).order_by(IntegrityEvent.timestamp.asc()).all()
    return events


@router.get("/{interview_id}/download-pdf")
def download_pdf_report(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Downloads the generated PDF evaluation report."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    is_owner = (interview.user_id == current_user.id)
    is_admin = (current_user.role == "admin")
    is_recruiter = (current_user.role == "recruiter")
    invite = db.query(InterviewInvite).filter(InterviewInvite.interview_id == interview_id).first()
    is_invite_recruiter = bool(invite and (invite.recruiter_id == current_user.id or is_recruiter))

    if not (is_owner or is_admin or is_invite_recruiter or is_recruiter):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    if not interview.report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not ready.")

    report = interview.report
    pdf_filename = f"interview_assessment_{interview.id}.pdf"
    pdf_path = REPORT_DIR / pdf_filename
    if not pdf_path.exists():
        PDFReportGenerator.generate_report_pdf(report, str(pdf_path))
    report.pdf_report_path = str(pdf_path)
    db.commit()

    return FileResponse(
        path=str(pdf_path),
        filename=f"Assessment_Report_Interview_{interview.id}.pdf",
        media_type="application/pdf"
    )
