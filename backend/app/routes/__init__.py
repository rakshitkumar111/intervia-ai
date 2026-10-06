from app.routes.auth import router as auth_router
from app.routes.resume import router as resume_router
from app.routes.interview import router as interview_router
from app.routes.dashboard import router as dashboard_router
from app.routes.admin import router as admin_router
from app.routes.speech import router as speech_router
from app.routes.avatar import avatar_router
from app.routes.coding import router as coding_router
from app.routes.architecture import router as architecture_router
from app.routes.recruiter import router as recruiter_router

__all__ = [
    "auth_router",
    "resume_router",
    "interview_router",
    "dashboard_router",
    "admin_router",
    "speech_router",
    "avatar_router",
    "coding_router",
    "architecture_router",
    "recruiter_router"
]
