import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from app.config import settings, UPLOAD_DIR, REPORT_DIR
from app.database import init_db, get_db
from app.models.user import User, CandidateProfile
from app.models.system import SystemSetting
from app.utils.security import get_password_hash
from app.routes import (
    auth_router,
    resume_router,
    interview_router,
    dashboard_router,
    admin_router,
    speech_router,
    avatar_router,
    coding_router,
    architecture_router,
    recruiter_router
)
from app.services.ai.engine import ai_engine
from app.utils.logger import logger

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-style AI-Powered Humanoid Virtual Interviewer Backend API for Intelligent Candidate Assessment."
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for reports
app.mount("/static/reports", StaticFiles(directory=str(REPORT_DIR)), name="reports")

# Include API Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(resume_router, prefix=settings.API_V1_PREFIX)
app.include_router(interview_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)
app.include_router(speech_router, prefix=settings.API_V1_PREFIX)
app.include_router(avatar_router, prefix=settings.API_V1_PREFIX)
app.include_router(coding_router, prefix=settings.API_V1_PREFIX)
app.include_router(architecture_router, prefix=settings.API_V1_PREFIX)
app.include_router(recruiter_router, prefix=settings.API_V1_PREFIX)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing database schema...")
    init_db()
    
    # Seed initial Admin and Candidate accounts if not present
    from app.database import SessionLocal
    db: Session = SessionLocal()
    try:
        # Seed Admin User
        admin_email = "admin@interviewer.ai"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                hashed_password=get_password_hash("Admin@12345"),
                full_name="System Administrator",
                role="admin"
            )
            db.add(admin)
            logger.info("Seeded default Admin: admin@interviewer.ai / Admin@12345")

        # Seed Demo Candidate
        demo_candidate_email = "candidate@interviewer.ai"
        candidate = db.query(User).filter(User.email == demo_candidate_email).first()
        if not candidate:
            candidate = User(
                email=demo_candidate_email,
                hashed_password=get_password_hash("Candidate@12345"),
                full_name="Alex Chen",
                role="candidate"
            )
            db.add(candidate)
            db.flush()
            profile = CandidateProfile(
                user_id=candidate.id,
                target_role="Full Stack AI Engineer",
                experience_level="Fresher (0-1 yrs)",
                skills=["Python", "FastAPI", "React", "TypeScript", "SQL", "Machine Learning", "Docker"],
                bio="Passionate computer science graduate specializing in modern full-stack web applications and AI integration."
            )
            db.add(profile)
            logger.info("Seeded default Candidate: candidate@interviewer.ai / Candidate@12345")

        # Seed System Settings
        if not db.query(SystemSetting).filter(SystemSetting.key == "AI_PROVIDER_ACTIVE").first():
            db.add(SystemSetting(key="AI_PROVIDER_ACTIVE", value=ai_engine.get_provider_name(), description="Active AI provider engine"))
        
        db.commit()
    except Exception as e:
        logger.error(f"Error during startup seed: {e}")
        db.rollback()
    finally:
        db.close()

    # Automatically start Cloudflare HTTPS Tunnel in background for cross-device mobile access
    try:
        from app.services.tunnel_service import tunnel_service
        tunnel_service.start_tunnel_async(target_url="http://localhost:5174")
    except Exception as e:
        logger.warning(f"Could not initialize auto-tunnel: {e}")

@app.on_event("shutdown")
def on_shutdown():
    try:
        from app.services.tunnel_service import tunnel_service
        tunnel_service.stop_tunnel()
    except Exception:
        pass

@app.get("/")
def root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ai_engine": ai_engine.get_provider_name(),
        "ai_telemetry": ai_engine.get_provider_info(),
        "docs_url": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "ai_provider": ai_engine.get_provider_name(),
        "ai_telemetry": ai_engine.get_provider_info()
    }
