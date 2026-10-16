import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, CandidateProfile
from app.models.recruiter import InterviewInvite
from app.models.interview import (
    Interview,
    InterviewQuestion,
    CandidateAnswer,
    AnswerEvaluation,
    InterviewReport,
    IntegrityEvent
)
from app.schemas.recruiter import (
    InterviewInviteCreate,
    InterviewInviteResponse,
    CandidateLeaderboardItem,
    CandidateSessionReplayResponse,
    CandidateAnswerReplay
)
from app.services.auth_service import get_current_user
from app.services.ai.engine import ai_engine
from app.services.email_service import email_service
from app.config import settings
from app.utils.security import create_access_token, get_password_hash
from app.utils.logger import logger
from app.services.tunnel_service import tunnel_service

router = APIRouter(prefix="/recruiter", tags=["Recruiter Portal"])

def build_candidate_url(invite_token: str) -> str:
    """Builds the canonical candidate-facing URL using live auto-generated Cloudflare tunnel."""
    auto_url = tunnel_service.public_url
    if auto_url and "trycloudflare.com" in auto_url:
        return f"{auto_url.rstrip('/')}/interview/{invite_token}"

    base = settings.PUBLIC_FRONTEND_URL.rstrip("/") if settings.PUBLIC_FRONTEND_URL else "http://localhost:5174"
    if "example.com" in base:
        base = "http://localhost:5174"
    return f"{base}/interview/{invite_token}"

@router.get("/tunnel-status")
def get_tunnel_status():
    """Returns the live auto-generated Cloudflare tunnel status and public URL."""
    url = tunnel_service.public_url
    return {
        "is_active": bool(url),
        "public_url": url or settings.PUBLIC_FRONTEND_URL,
        "is_installed": bool(tunnel_service.find_cloudflared_executable())
    }

@router.post("/invites", response_model=InterviewInviteResponse, status_code=status.HTTP_201_CREATED)
def create_interview_invite(
    payload: InterviewInviteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates an invitation link with expiration date for a candidate."""
    invite_token = uuid.uuid4().hex
    expiry_days = payload.expires_in_days if payload.expires_in_days and payload.expires_in_days > 0 else 7
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=expiry_days)
    candidate_phone = payload.candidate_phone.strip() if payload.candidate_phone else None

    invite = InterviewInvite(
        invite_token=invite_token,
        recruiter_id=current_user.id,
        candidate_name=payload.candidate_name.strip(),
        candidate_email=str(payload.candidate_email).strip().lower(),
        candidate_phone=candidate_phone,
        target_role=payload.target_role.strip(),
        domain=payload.domain or "Technology",
        experience_level=payload.experience_level or "Mid-Level",
        mode=payload.mode or "Technical",
        difficulty=payload.difficulty or "Medium",
        language=payload.language or "English",
        total_questions=payload.total_questions or 5,
        status="pending",
        email_status="not_sent",
        whatsapp_status="not_sent",
        expires_at=expires_at
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    cand_url = build_candidate_url(invite.invite_token)

    return InterviewInviteResponse(
        id=invite.id,
        invite_token=invite.invite_token,
        invite_url=f"/join/{invite.invite_token}",
        candidate_url=cand_url,
        candidate_name=invite.candidate_name,
        candidate_email=invite.candidate_email,
        candidate_phone=invite.candidate_phone,
        target_role=invite.target_role,
        mode=invite.mode,
        difficulty=invite.difficulty,
        language=invite.language,
        total_questions=invite.total_questions,
        status=invite.status,
        email_status=invite.email_status or "not_sent",
        whatsapp_status=invite.whatsapp_status or "not_sent",
        overall_score=None,
        created_at=invite.created_at,
        expires_at=invite.expires_at,
        interview_id=invite.interview_id
    )

@router.get("/invites", response_model=List[InterviewInviteResponse])
def get_invites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all interview invites created by the recruiter."""
    now = datetime.datetime.utcnow()
    query = db.query(InterviewInvite)
    if current_user.role != "admin":
        query = query.filter(InterviewInvite.recruiter_id == current_user.id)
    
    invites = query.order_by(InterviewInvite.created_at.desc()).all()
    results = []
    for inv in invites:
        if inv.status == "pending" and inv.expires_at < now:
            inv.status = "expired"
            db.commit()
        elif inv.status == "in_progress" and inv.interview and inv.interview.status == "completed":
            inv.status = "completed"
            db.commit()
        
        cand_url = build_candidate_url(inv.invite_token)
        score = inv.interview.overall_score if inv.interview else None

        results.append(InterviewInviteResponse(
            id=inv.id,
            invite_token=inv.invite_token,
            invite_url=f"/join/{inv.invite_token}",
            candidate_url=cand_url,
            candidate_name=inv.candidate_name,
            candidate_email=inv.candidate_email,
            candidate_phone=inv.candidate_phone,
            target_role=inv.target_role,
            mode=inv.mode,
            difficulty=inv.difficulty,
            language=inv.language,
            total_questions=inv.total_questions,
            status=inv.status,
            email_status=inv.email_status or "not_sent",
            whatsapp_status=inv.whatsapp_status or "not_sent",
            overall_score=score,
            created_at=inv.created_at,
            expires_at=inv.expires_at,
            interview_id=inv.interview_id
        ))
    return results

@router.post("/invites/{invite_id}/send-email")
def send_invite_email(
    invite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sends an official interview invitation email to the candidate via SMTP."""
    invite = db.query(InterviewInvite).filter(InterviewInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found.")

    if current_user.role != "admin" and invite.recruiter_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to dispatch this invitation.")

    cand_url = build_candidate_url(invite.invite_token)

    result = email_service.send_interview_invitation(
        candidate_name=invite.candidate_name,
        candidate_email=invite.candidate_email,
        target_role=invite.target_role,
        mode=invite.mode,
        difficulty=invite.difficulty,
        total_questions=invite.total_questions,
        expires_at=invite.expires_at,
        interview_url=cand_url,
        recruiter_name=current_user.full_name or "AI Virtual Interviewer Team"
    )

    invite.email_status = result.get("email_status", "failed")
    if result.get("success"):
        invite.email_sent_at = datetime.datetime.utcnow()
    db.commit()

    return {
        "success": result.get("success", False),
        "email_status": invite.email_status,
        "error": result.get("error")
    }

@router.post("/invites/{invite_id}/mark-whatsapp")
def mark_whatsapp_sent(
    invite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Records that a WhatsApp invitation share link was generated/dispatched."""
    invite = db.query(InterviewInvite).filter(InterviewInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found.")

    if current_user.role != "admin" and invite.recruiter_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    invite.whatsapp_status = "sent"
    invite.whatsapp_sent_at = datetime.datetime.utcnow()
    db.commit()

    return {
        "success": True,
        "whatsapp_status": "sent",
        "whatsapp_sent_at": invite.whatsapp_sent_at
    }

@router.get("/invite-info/{invite_token}")
def get_invite_info(
    invite_token: str,
    db: Session = Depends(get_db)
):
    """Fetches invitation metadata before launching interview session."""
    invite = db.query(InterviewInvite).filter(InterviewInvite.invite_token == invite_token).first()
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid interview invitation link."
        )

    now = datetime.datetime.utcnow()
    if invite.expires_at < now:
        if invite.status == "pending":
            invite.status = "expired"
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This interview invitation link has expired."
        )

    return {
        "valid": True,
        "candidate_name": invite.candidate_name,
        "candidate_email": invite.candidate_email,
        "target_role": invite.target_role,
        "domain": invite.domain,
        "experience_level": invite.experience_level,
        "mode": invite.mode,
        "difficulty": invite.difficulty,
        "language": invite.language,
        "total_questions": invite.total_questions,
        "status": invite.status,
        "expires_at": invite.expires_at,
        "interview_id": invite.interview_id
    }

@router.get("/join/{invite_token}")
@router.post("/join/{invite_token}")
def join_interview_by_token(
    invite_token: str,
    db: Session = Depends(get_db)
):
    """Validates invite token, provisions candidate auth session, and launches the interview."""
    invite = db.query(InterviewInvite).filter(InterviewInvite.invite_token == invite_token).first()
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid interview invitation link."
        )

    now = datetime.datetime.utcnow()
    if invite.expires_at < now:
        if invite.status == "pending":
            invite.status = "expired"
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This interview invitation link has expired. Please request a new link from the recruiter."
        )

    # 1. Lookup or Auto-provision Candidate User Account
    candidate_email = invite.candidate_email.strip().lower()
    candidate_user = db.query(User).filter(User.email == candidate_email).first()
    if not candidate_user:
        candidate_user = User(
            email=candidate_email,
            hashed_password=get_password_hash(f"Candidate@{uuid.uuid4().hex[:8]}"),
            full_name=invite.candidate_name,
            role="candidate",
            is_active=True
        )
        db.add(candidate_user)
        db.flush()

        prof = CandidateProfile(
            user_id=candidate_user.id,
            target_role=invite.target_role,
            experience_level=invite.experience_level,
            skills=[invite.target_role, invite.domain]
        )
        db.add(prof)
        db.flush()

    # Generate candidate access token so frontend can authenticate immediately
    access_token = create_access_token(subject=str(candidate_user.id), role="candidate")

    # If interview already initialized, return it with candidate ownership ensured
    if invite.interview_id:
        interview = db.query(Interview).filter(Interview.id == invite.interview_id).first()
        if interview:
            if interview.user_id != candidate_user.id:
                interview.user_id = candidate_user.id
                db.commit()

            # If already completed, return a clear completed response — do NOT restart
            if interview.status == "completed":
                return {
                    "valid": True,
                    "access_token": access_token,
                    "user": {
                        "id": candidate_user.id,
                        "email": candidate_user.email,
                        "full_name": candidate_user.full_name,
                        "role": candidate_user.role
                    },
                    "interview_id": interview.id,
                    "candidate_name": invite.candidate_name,
                    "target_role": invite.target_role,
                    "status": "completed",
                    "total_questions": interview.total_questions,
                    "current_index": interview.current_index,
                    "expires_at": invite.expires_at
                }

            return {
                "valid": True,
                "access_token": access_token,
                "user": {
                    "id": candidate_user.id,
                    "email": candidate_user.email,
                    "full_name": candidate_user.full_name,
                    "role": candidate_user.role
                },
                "interview_id": interview.id,
                "candidate_name": invite.candidate_name,
                "target_role": invite.target_role,
                "status": interview.status,
                "total_questions": interview.total_questions,
                "current_index": interview.current_index,
                "expires_at": invite.expires_at
            }

    # Generate initial interview session assigned to candidate_user
    title = f"{invite.difficulty} {invite.mode} Interview - {invite.target_role} ({invite.domain})"
    new_interview = Interview(
        user_id=candidate_user.id,
        title=title,
        candidate_name=invite.candidate_name,
        target_role=invite.target_role,
        domain=invite.domain,
        experience_level=invite.experience_level,
        mode=invite.mode,
        category=invite.target_role,
        difficulty=invite.difficulty,
        language=invite.language,
        duration_mode="Standard",
        total_questions=invite.total_questions,
        current_index=0,
        status="in_progress",
        started_at=datetime.datetime.utcnow()
    )
    db.add(new_interview)
    db.flush()

    # Generate questions via AI engine
    question_plan = ai_engine.generate_interview_plan(
        target_role=invite.target_role,
        mode=invite.mode,
        category=invite.target_role,
        difficulty=invite.difficulty,
        total_questions=invite.total_questions,
        skills=[invite.target_role, invite.domain],
        projects=[],
        experience_level=invite.experience_level,
        domain=invite.domain,
        language=invite.language,
        candidate_name=invite.candidate_name
    )

    for idx, q_data in enumerate(question_plan):
        q = InterviewQuestion(
            interview_id=new_interview.id,
            question_text=q_data.get("question_text", "Describe your experience."),
            question_number=idx + 1,
            question_type=q_data.get("question_type", "conceptual"),
            category=q_data.get("category", invite.target_role),
            difficulty=q_data.get("difficulty", invite.difficulty),
            order_index=idx,
            expected_concepts=q_data.get("expected_concepts", []),
            rubric_criteria=q_data.get("rubric_criteria", {}),
            evaluation_criteria=q_data.get("evaluation_criteria", []),
            hint=q_data.get("hint")
        )
        db.add(q)

    invite.interview_id = new_interview.id
    invite.status = "in_progress"
    db.commit()
    db.refresh(new_interview)

    return {
        "valid": True,
        "access_token": access_token,
        "user": {
            "id": candidate_user.id,
            "email": candidate_user.email,
            "full_name": candidate_user.full_name,
            "role": candidate_user.role
        },
        "interview_id": new_interview.id,
        "candidate_name": invite.candidate_name,
        "target_role": invite.target_role,
        "status": new_interview.status,
        "total_questions": new_interview.total_questions,
        "current_index": 0,
        "expires_at": invite.expires_at
    }

@router.get("/leaderboard", response_model=List[CandidateLeaderboardItem])
def get_candidate_leaderboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves ranked candidate leaderboard with scores, integrity, and verdicts."""
    # Query completed interviews
    query = db.query(Interview).filter(Interview.status == "completed")
    if current_user.role != "admin":
        recruiter_invites = db.query(InterviewInvite).filter(
            InterviewInvite.recruiter_id == current_user.id,
            InterviewInvite.interview_id.isnot(None)
        ).all()
        recruiter_interview_ids = [inv.interview_id for inv in recruiter_invites]
        query = query.filter(
            (Interview.user_id == current_user.id) | (Interview.id.in_(recruiter_interview_ids))
        )
    
    interviews = query.all()
    leaderboard = []

    for item in interviews:
        report = db.query(InterviewReport).filter(InterviewReport.interview_id == item.id).first()
        integrity_events = db.query(IntegrityEvent).filter(IntegrityEvent.interview_id == item.id).all()
        integrity_deduction = len(integrity_events) * 6.0
        integrity_score = max(10.0, 100.0 - integrity_deduction)

        overall_score = report.overall_score if report else item.overall_score
        technical_score = report.technical_score if report else 0.0
        communication_score = report.communication_score if report else 0.0
        problem_solving_score = report.problem_solving_score if report else 0.0
        verdict = report.verdict if report else ("Qualified" if overall_score >= 70 else "Needs Improvement")
        pdf_path = report.pdf_report_path if report else None

        leaderboard.append(CandidateLeaderboardItem(
            interview_id=item.id,
            candidate_name=item.candidate_name or "Anonymous Candidate",
            target_role=item.target_role,
            domain=item.domain or "Technology",
            experience_level=item.experience_level or "Mid-Level",
            overall_score=round(overall_score, 1),
            technical_score=round(technical_score, 1),
            communication_score=round(communication_score, 1),
            problem_solving_score=round(problem_solving_score, 1),
            verdict=verdict,
            integrity_score=round(integrity_score, 1),
            completed_at=item.completed_at,
            pdf_report_path=pdf_path
        ))

    # Sort descending by overall score
    leaderboard.sort(key=lambda x: x.overall_score, reverse=True)
    return leaderboard

@router.get("/replay/{interview_id}", response_model=CandidateSessionReplayResponse)
def get_candidate_replay(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves question-by-question answer replay, transcript, and telemetry for recruiter audit."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found."
        )

    # Permission check: recruiter who owns it, created the invite for it, or admin
    is_invite_owner = db.query(InterviewInvite).filter(
        InterviewInvite.interview_id == interview_id,
        InterviewInvite.recruiter_id == current_user.id
    ).first() is not None

    if current_user.role != "admin" and interview.user_id != current_user.id and not is_invite_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this candidate replay."
        )

    report = db.query(InterviewReport).filter(InterviewReport.interview_id == interview_id).first()
    integrity_count = db.query(IntegrityEvent).filter(IntegrityEvent.interview_id == interview_id).count()

    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id
    ).order_by(InterviewQuestion.order_index.asc()).all()

    answers_replay = []
    for q in questions:
        ans = db.query(CandidateAnswer).filter(CandidateAnswer.question_id == q.id).first()
        if not ans:
            continue
        ev = db.query(AnswerEvaluation).filter(AnswerEvaluation.answer_id == ans.id).first()
        
        words = len(ans.transcript_text.split())
        duration_min = max(0.1, (ans.audio_duration_seconds or 30.0) / 60.0)
        approx_wpm = round(words / duration_min, 1)

        # Count filler words in transcript
        fillers = ["um", "uh", "like", "basically", "actually", "matlab", "woh"]
        filler_count = sum(ans.transcript_text.lower().split().count(f) for f in fillers)

        answers_replay.append(CandidateAnswerReplay(
            question_number=q.question_number,
            question_text=q.question_text,
            candidate_answer=ans.transcript_text,
            score=ev.score if ev else 0.0,
            technical_score=ev.technical_score if ev else 0.0,
            feedback=ev.feedback if ev else "No feedback recorded",
            speaking_pace_wpm=approx_wpm,
            filler_word_count=filler_count
        ))

    overall_score = report.overall_score if report else interview.overall_score
    verdict = report.verdict if report else ("Qualified" if overall_score >= 70 else "Needs Improvement")

    return CandidateSessionReplayResponse(
        interview_id=interview.id,
        candidate_name=interview.candidate_name or "Candidate",
        target_role=interview.target_role,
        overall_score=round(overall_score, 1),
        verdict=verdict,
        integrity_events_count=integrity_count,
        answers=answers_replay
    )
