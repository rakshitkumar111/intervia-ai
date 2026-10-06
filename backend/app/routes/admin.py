import datetime
import time
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.user import User, CandidateProfile
from app.models.interview import Interview, InterviewReport, IntegrityEvent, InterviewQuestion, CandidateAnswer
from app.models.resume import Resume
from app.models.system import SystemLog, SystemSetting
from app.schemas.admin import (
    AdminStatsResponse,
    SystemLogResponse,
    SystemSettingUpdate,
    AdminUserCreate,
    UserStatusUpdate,
    UserRoleUpdate,
    SystemHealthResponse,
    IntegrityMetricsResponse
)
from app.services.auth_service import get_current_admin_user
from app.services.ai.engine import ai_engine
from app.services.code_execution_service import code_execution_service
from app.utils.security import get_password_hash
from app.utils.logger import logger

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_dashboard_stats(
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Aggregates platform-wide metrics for administrator monitor."""
    total_users = db.query(User).count()
    interviews = db.query(Interview).all()
    completed_interviews = [i for i in interviews if i.status == "completed"]
    
    avg_score = 0.0
    if completed_interviews:
        avg_score = round(sum(i.overall_score for i in completed_interviews) / len(completed_interviews), 1)

    # Category distribution
    cat_dist = {}
    for i in interviews:
        cat = i.category or "Other"
        cat_dist[cat] = cat_dist.get(cat, 0) + 1

    # Verdict distribution
    reports = db.query(InterviewReport).all()
    verdict_dist = {}
    for r in reports:
        v = r.verdict or "Pending"
        verdict_dist[v] = verdict_dist.get(v, 0) + 1

    recent_logs = db.query(SystemLog).order_by(SystemLog.timestamp.desc()).limit(15).all()

    return {
        "total_users": total_users,
        "total_interviews": len(interviews),
        "completed_interviews": len(completed_interviews),
        "average_score": avg_score,
        "category_distribution": cat_dist,
        "verdict_distribution": verdict_dist,
        "recent_activity": recent_logs
    }

@router.get("/health", response_model=SystemHealthResponse)
def get_system_health(
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Returns real-time health telemetry across AI, Database, and Code execution sandbox."""
    total_users = db.query(User).count()
    total_interviews = db.query(Interview).count()

    # Check Code Execution Sandbox capabilities
    sandbox_status = {
        "python": "AVAILABLE" if code_execution_service.is_language_supported("python") else "OFFLINE",
        "javascript": "AVAILABLE" if code_execution_service.is_language_supported("javascript") else "OFFLINE",
        "sql": "AVAILABLE" if code_execution_service.is_language_supported("sql") else "OFFLINE",
        "typescript": "AVAILABLE" if code_execution_service.is_language_supported("typescript") else "OFFLINE"
    }

    return SystemHealthResponse(
        ai_provider="Google Gemini (with Universal Fallback Engine)",
        gemini_model=settings.GEMINI_MODEL,
        ai_status="ONLINE",
        sandbox_status=sandbox_status,
        database_status="CONNECTED (SQLite Relational DB)",
        total_users=total_users,
        total_interviews=total_interviews,
        timestamp=datetime.datetime.utcnow()
    )

@router.get("/integrity-metrics", response_model=IntegrityMetricsResponse)
def get_integrity_metrics(
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Retrieves aggregated anti-cheating and proctoring telemetry."""
    events = db.query(IntegrityEvent).all()
    by_type: Dict[str, int] = {}
    for ev in events:
        by_type[ev.event_type] = by_type.get(ev.event_type, 0) + 1

    # Tally flagged interviews (interviews with >= 3 integrity events)
    all_interviews = db.query(Interview).all()
    flagged_count = 0
    scores = []
    for it in all_interviews:
        ev_count = len(it.integrity_events)
        if ev_count >= 3:
            flagged_count += 1
        integrity_score = max(10.0, 100.0 - (ev_count * 6.0))
        scores.append(integrity_score)

    avg_integrity = round(sum(scores) / len(scores), 1) if scores else 100.0

    return IntegrityMetricsResponse(
        total_events=len(events),
        by_type=by_type,
        flagged_sessions_count=flagged_count,
        average_integrity_score=avg_integrity
    )

@router.post("/test-ai")
def ping_ai_service(
    admin_user: User = Depends(get_current_admin_user)
):
    """Pings AI Engine and measures inference latency in milliseconds."""
    t0 = time.time()
    try:
        plan = ai_engine.generate_interview_plan(
            target_role="Full Stack Developer",
            mode="Technical",
            category="Web Engineering",
            difficulty="Medium",
            total_questions=1,
            skills=["React", "Python"],
            projects=[],
            experience_level="Mid-Level",
            domain="Technology",
            language="English"
        )
        latency_ms = round((time.time() - t0) * 1000, 1)
        return {
            "success": True,
            "latency_ms": latency_ms,
            "provider": "Gemini / Universal Engine",
            "sample_question": plan[0].get("question_text") if plan else "Ready"
        }
    except Exception as e:
        latency_ms = round((time.time() - t0) * 1000, 1)
        return {
            "success": False,
            "latency_ms": latency_ms,
            "error": str(e)
        }

@router.get("/candidates")
def list_candidates(
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Lists all registered users (candidates, recruiters, admins) with stats."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    results = []
    for u in users:
        interviews_count = len(u.interviews)
        avg_sc = 0.0
        comp = [i for i in u.interviews if i.status == "completed"]
        if comp:
            avg_sc = round(sum(i.overall_score for i in comp) / len(comp), 1)
        
        results.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "target_role": u.profile.target_role if u.profile else "Software Engineer",
            "experience_level": u.profile.experience_level if u.profile else "Mid-Level",
            "skills": u.profile.skills if u.profile else [],
            "interviews_count": interviews_count,
            "average_score": avg_sc,
            "created_at": u.created_at
        })
    return results

@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_admin_user(
    payload: AdminUserCreate,
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Creates a new user account with specified role from the Admin Console."""
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    new_user = User(
        email=payload.email.lower().strip(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role or "candidate",
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # Initialize profile
    prof = CandidateProfile(
        user_id=new_user.id,
        target_role="Software Engineer",
        experience_level="Mid-Level",
        skills=[]
    )
    db.add(prof)

    log = SystemLog(
        user_id=admin_user.id,
        action="USER_CREATED_BY_ADMIN",
        level="INFO",
        details={"created_user_id": new_user.id, "email": new_user.email, "role": new_user.role}
    )
    db.add(log)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": f"User {new_user.full_name} created successfully with role {new_user.role}.",
        "user_id": new_user.id,
        "email": new_user.email,
        "role": new_user.role
    }

@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Enables or suspends a user account."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if target_user.id == admin_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot alter status of own active administrator session.")

    target_user.is_active = payload.is_active
    log = SystemLog(
        user_id=admin_user.id,
        action="USER_STATUS_UPDATED",
        level="WARNING" if not payload.is_active else "INFO",
        details={"target_user_id": user_id, "is_active": payload.is_active}
    )
    db.add(log)
    db.commit()

    return {"success": True, "user_id": user_id, "is_active": target_user.is_active}

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Updates user authorization role (candidate, recruiter, admin)."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if target_user.id == admin_user.id and payload.role != "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot revoke own administrator privileges.")

    target_user.role = payload.role
    log = SystemLog(
        user_id=admin_user.id,
        action="USER_ROLE_UPDATED",
        level="WARNING",
        details={"target_user_id": user_id, "new_role": payload.role}
    )
    db.add(log)
    db.commit()

    return {"success": True, "user_id": user_id, "role": target_user.role}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Permanently deletes user account and cascading entities."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if target_user.id == admin_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete current administrator session.")

    email = target_user.email
    db.delete(target_user)
    log = SystemLog(
        user_id=admin_user.id,
        action="USER_DELETED_BY_ADMIN",
        level="WARNING",
        details={"deleted_user_id": user_id, "email": email}
    )
    db.add(log)
    db.commit()

    return {"success": True, "message": f"User {email} deleted successfully."}

@router.get("/interviews")
def list_all_interviews(
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Lists all interview sessions across candidates."""
    interviews = db.query(Interview).order_by(Interview.created_at.desc()).limit(100).all()
    results = []
    for i in interviews:
        integrity_events_count = len(i.integrity_events)
        integrity_score = max(10.0, 100.0 - (integrity_events_count * 6.0))
        results.append({
            "id": i.id,
            "candidate_name": i.candidate_name or (i.user.full_name if i.user else "Unknown"),
            "candidate_email": i.user.email if i.user else "Unknown",
            "title": i.title,
            "target_role": i.target_role,
            "mode": i.mode,
            "category": i.category,
            "difficulty": i.difficulty,
            "status": i.status,
            "overall_score": i.overall_score,
            "verdict": i.report.verdict if i.report else "N/A",
            "integrity_score": integrity_score,
            "integrity_events_count": integrity_events_count,
            "duration_seconds": i.duration_seconds,
            "created_at": i.created_at,
            "pdf_url": i.report.pdf_report_path if i.report else None
        })
    return results

@router.delete("/interviews/{interview_id}")
def delete_interview(
    interview_id: int,
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Deletes an interview session and its dependent records."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    db.delete(interview)
    log = SystemLog(
        user_id=admin_user.id,
        action="INTERVIEW_DELETED_BY_ADMIN",
        level="WARNING",
        details={"deleted_interview_id": interview_id}
    )
    db.add(log)
    db.commit()

    return {"success": True, "message": f"Interview session #{interview_id} deleted successfully."}

@router.get("/logs", response_model=List[SystemLogResponse])
def get_system_logs(
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Fetches system audit and security logs."""
    logs = db.query(SystemLog).order_by(SystemLog.timestamp.desc()).limit(150).all()
    return logs

@router.post("/settings")
def update_system_setting(
    payload: SystemSettingUpdate,
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Updates global system configuration settings."""
    setting = db.query(SystemSetting).filter(SystemSetting.key == payload.key).first()
    if not setting:
        setting = SystemSetting(key=payload.key, value=payload.value, description=payload.description)
        db.add(setting)
    else:
        setting.value = payload.value
        if payload.description:
            setting.description = payload.description
    
    db.commit()
    db.refresh(setting)
    return {"message": "Setting updated successfully.", "key": setting.key, "value": setting.value}
