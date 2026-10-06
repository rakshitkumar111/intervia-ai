from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.interview import Interview
from app.models.system import SystemLog
from app.schemas.architecture import (
    ArchitectureProblemTemplate,
    ArchitectureEvaluationRequest,
    ArchitectureEvaluationResponse
)
from app.services.architecture_service import ArchitectureService
from app.services.auth_service import get_current_user
from app.utils.logger import logger

router = APIRouter(prefix="/architecture", tags=["System Design Whiteboard & Architecture Evaluation"])

@router.get("/templates", response_model=List[ArchitectureProblemTemplate])
def get_architecture_templates():
    """Returns the list of curated system design problem templates."""
    return ArchitectureService.get_templates()

@router.get("/templates/{template_id}", response_model=ArchitectureProblemTemplate)
def get_architecture_template(template_id: str):
    """Retrieves a specific system design problem template."""
    template = ArchitectureService.get_template_by_id(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Architecture template '{template_id}' not found."
        )
    return template

@router.post("/evaluate", response_model=ArchitectureEvaluationResponse)
def evaluate_architecture_diagram(
    payload: ArchitectureEvaluationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Evaluates candidate system design diagram topology for scalability, reliability, and SPOFs."""
    interview = db.query(Interview).filter(
        Interview.id == payload.interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session {payload.interview_id} not found."
        )

    eval_result = ArchitectureService.evaluate_diagram(payload.diagram)

    # Audit Log
    log = SystemLog(
        user_id=current_user.id,
        action="ARCHITECTURE_EVALUATE",
        level="INFO",
        details={
            "interview_id": payload.interview_id,
            "title": payload.diagram.title,
            "overall_score": eval_result.overall_score,
            "scalability_score": eval_result.scalability_score,
            "spof_count": len(eval_result.single_points_of_failure)
        }
    )
    db.add(log)
    db.commit()

    return eval_result
