import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / ".env")
load_dotenv()

UPLOAD_DIR = BASE_DIR / "uploads"
RESUME_DIR = UPLOAD_DIR / "resumes"
REPORT_DIR = UPLOAD_DIR / "reports"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESUME_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)

class Settings:
    PROJECT_NAME: str = "AI Humanoid Virtual Interviewer"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-production-key-for-ai-interviewer-2026-btech")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/interviewer.db")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # AI Engine Configuration - Gemini is the Primary Production Provider
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")  # "gemini", "openai", "fallback", "auto"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("AI_API_KEY", "")).strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash").strip()
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip()
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
    
    # Strict AI Mode
    STRICT_AI_MODE: bool = os.getenv("STRICT_AI_MODE", "false").lower() in ("true", "1", "yes")

    # D-ID Real-Time Photorealistic Human Avatar Configuration
    DID_API_KEY: str = os.getenv("DID_API_KEY", os.getenv("D_ID_API_KEY", "")).strip()
    DID_AGENT_ID: str = os.getenv("DID_AGENT_ID", "").strip()
    DID_CLIENT_KEY: str = os.getenv("DID_CLIENT_KEY", os.getenv("DID_KEY", "")).strip()
    DID_PRESENTER_IMAGE_URL: str = os.getenv(
        "DID_PRESENTER_IMAGE_URL", 
        "https://raw.githubusercontent.com/d-id/streaming-demos/main/main/source.jpg"
    ).strip()
    DID_VOICE_ID: str = os.getenv("DID_VOICE_ID", "en-US-JennyNeural").strip()

settings = Settings()
