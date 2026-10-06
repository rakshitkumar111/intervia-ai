import shutil
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import RESUME_DIR
from app.models.user import User, CandidateProfile
from app.models.resume import Resume
from app.models.system import SystemLog
from app.schemas.resume import ResumeResponse, ResumeAnalysisResult
from app.services.auth_service import get_current_user
from app.services.resume_service import ResumeParserService
from app.utils.logger import logger

router = APIRouter(prefix="/resume", tags=["Resume Processing"])

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Uploads, validates, parses, and extracts skills and experience from a resume file."""
    allowed_extensions = [".pdf", ".docx", ".doc", ".txt"]
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats: {', '.join(allowed_extensions)}"
        )

    # Save to disk
    safe_filename = f"user_{current_user.id}_{Path(file.filename).stem}_{file_ext}"
    destination = RESUME_DIR / safe_filename

    try:
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to write uploaded resume: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not store file on server.")

    # Extract text and parse skills
    extracted_text = ResumeParserService.extract_text_from_file(destination)
    analysis = ResumeParserService.analyze_resume(extracted_text, file.filename)

    file_size = destination.stat().st_size

    # Save Resume Record in Database
    new_resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=str(destination),
        file_size_bytes=file_size,
        extracted_text=extracted_text,
        parsed_skills=analysis.get("skills", []),
        parsed_experience=analysis.get("experience", []),
        parsed_education=analysis.get("education", []),
        parsed_projects=analysis.get("projects", []),
        parsed_certifications=analysis.get("certifications", []),
        summary=analysis.get("summary", "")
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    # Update candidate profile skills if present
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if profile:
        existing_skills = profile.skills or []
        combined_skills = list(dict.fromkeys(existing_skills + analysis.get("skills", [])))
        profile.skills = combined_skills
        db.commit()

    # System audit log
    log = SystemLog(
        user_id=current_user.id,
        action="RESUME_UPLOAD",
        level="INFO",
        details={"resume_id": new_resume.id, "filename": file.filename, "skills_count": len(new_resume.parsed_skills)}
    )
    db.add(log)
    db.commit()

    return new_resume

@router.get("/my-resumes", response_model=List[ResumeResponse])
def get_my_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all resumes uploaded by the current user."""
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.uploaded_at.desc()).all()
    return resumes

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves a specific resume by ID."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")
    return resume

@router.delete("/{resume_id}", status_code=status.HTTP_200_OK)
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes an uploaded resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")
    
    # Try deleting file on disk
    try:
        p = Path(resume.file_path)
        if p.exists():
            p.unlink()
    except Exception as e:
        logger.warning(f"Failed to delete resume file on disk: {e}")

    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted successfully."}
