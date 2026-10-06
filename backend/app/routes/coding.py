from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models.user import User
from app.models.interview import Interview, CandidateAnswer, AnswerEvaluation
from app.models.system import SystemLog
from app.schemas.coding import (
    CodingProblem,
    CodeRunRequest,
    CodeRunResponse,
    CodeSubmitRequest,
    CodeSubmitResponse,
    AICodeReview
)
from app.services.code_execution_service import CodeExecutionService
from app.services.ai.engine import ai_engine
from app.services.auth_service import get_current_user
from app.utils.logger import logger

router = APIRouter(prefix="/coding", tags=["Coding Sandbox & Evaluation"])

@router.get("/problems", response_model=List[CodingProblem])
def get_coding_problems():
    """Returns the list of available curated coding problems."""
    return CodeExecutionService.get_problems()

@router.get("/problems/{problem_id}", response_model=CodingProblem)
def get_coding_problem(problem_id: str):
    """Retrieves a specific coding problem with its templates and test cases."""
    problem = CodeExecutionService.get_problem_by_id(problem_id)
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Coding problem '{problem_id}' not found."
        )
    return problem

@router.post("/run", response_model=CodeRunResponse)
def run_code_sandbox(payload: CodeRunRequest):
    """Executes candidate code in the sandboxed runtime with custom stdin or test cases."""
    try:
        run_res = CodeExecutionService.run_code_with_test_cases(
            language=payload.language,
            code=payload.code,
            stdin=payload.stdin or "",
            test_cases=payload.test_cases
        )
        return run_res
    except Exception as e:
        logger.error(f"Code execution sandbox error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code execution sandbox error: {str(e)}"
        )

@router.post("/submit", response_model=CodeSubmitResponse)
def submit_code_solution(
    payload: CodeSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submits candidate code for full automated test execution and AI code review."""
    # 1. Validate Interview Session
    interview = db.query(Interview).filter(
        Interview.id == payload.interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session {payload.interview_id} not found."
        )

    # 2. Execute Code against all Test Cases
    run_res = CodeExecutionService.run_code_with_test_cases(
        language=payload.language,
        code=payload.code,
        stdin="",
        test_cases=payload.test_cases
    )

    passed_all = (run_res.total_passed == run_res.total_tests and run_res.total_tests > 0)
    test_summary = f"Passed {run_res.total_passed}/{run_res.total_tests} automated test cases."

    # 3. Perform AI Code Review
    ai_raw = ai_engine.evaluate_code_solution(
        problem_title=payload.problem_title,
        language=payload.language,
        candidate_code=payload.code,
        passed_tests=passed_all,
        test_case_summary=test_summary
    )

    ai_review = AICodeReview(
        correctness_score=ai_raw.get("correctness_score", 0.0),
        efficiency_score=ai_raw.get("efficiency_score", 0.0),
        code_quality_score=ai_raw.get("code_quality_score", 0.0),
        overall_code_score=ai_raw.get("overall_code_score", 0.0),
        time_complexity=ai_raw.get("time_complexity", "O(N)"),
        space_complexity=ai_raw.get("space_complexity", "O(1)"),
        strengths=ai_raw.get("strengths", []),
        issues_and_bugs=ai_raw.get("issues_and_bugs", []),
        optimization_tips=ai_raw.get("optimization_tips", []),
        clean_code_suggestions=ai_raw.get("clean_code_suggestions", []),
        ideal_solution_snippet=ai_raw.get("ideal_solution_snippet")
    )

    # 4. Audit Log
    log = SystemLog(
        user_id=current_user.id,
        action="CODE_SUBMIT",
        level="INFO",
        details={
            "interview_id": payload.interview_id,
            "problem": payload.problem_title,
            "language": payload.language,
            "passed_tests": f"{run_res.total_passed}/{run_res.total_tests}",
            "overall_score": ai_review.overall_code_score,
            "time_complexity": ai_review.time_complexity
        }
    )
    db.add(log)
    db.commit()

    return CodeSubmitResponse(
        success=True,
        run_result=run_res,
        ai_review=ai_review,
        passed_all_tests=passed_all
    )
