from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseAIProvider(ABC):
    """Abstract Base Class for Universal AI Interview Engine Providers."""

    @abstractmethod
    def generate_interview_plan(
        self,
        target_role: str,
        mode: str,
        category: str,
        difficulty: str,
        total_questions: int,
        skills: List[str],
        projects: List[Dict[str, Any]],
        experience_level: str,
        domain: Optional[str] = "Technology",
        company_name: Optional[str] = None,
        language: Optional[str] = "English",
        job_description: Optional[str] = None,
        candidate_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Generates a structured list of interview questions tailored to any role, domain, language, and background."""
        pass

    @abstractmethod
    def generate_follow_up_question(
        self,
        original_question: str,
        candidate_answer: str,
        category: str,
        difficulty: str,
        language: Optional[str] = "English"
    ) -> Optional[Dict[str, Any]]:
        """Generates an intelligent follow-up question if the answer warrants deeper probing."""
        pass

    @abstractmethod
    def generate_next_adaptive_question(
        self,
        target_role: str,
        mode: str,
        category: str,
        difficulty: str,
        previous_question: str,
        previous_answer: str,
        previous_evaluation: Optional[Dict[str, Any]],
        asked_questions: List[str],
        domain: Optional[str] = "Technology",
        experience_level: Optional[str] = "Mid-Level",
        language: Optional[str] = "English",
        job_description: Optional[str] = None,
        candidate_name: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Generates the next adaptive interview question ensuring semantic deduplication and role alignment."""
        pass

    @abstractmethod
    def evaluate_answer(
        self,
        question_text: str,
        candidate_answer: str,
        expected_concepts: List[str],
        category: str,
        difficulty: str,
        target_role: Optional[str] = "Candidate",
        language: Optional[str] = "English"
    ) -> Dict[str, Any]:
        """Evaluates candidate response across 8 core universal dimensions (0 - 10 per dimension, 0 - 100 overall)."""
        pass

    @abstractmethod
    def synthesize_final_report(
        self,
        candidate_name: str,
        target_role: str,
        mode: str,
        category: str,
        difficulty: str,
        evaluations: List[Dict[str, Any]],
        domain: Optional[str] = "Technology",
        experience_level: Optional[str] = "Mid-Level",
        language: Optional[str] = "English"
    ) -> Dict[str, Any]:
        """Synthesizes an executive hiring readiness report with Strengths, Weaknesses, Technical Gaps, Communication, and Verdict."""
        pass

    @abstractmethod
    def analyze_job_description(
        self,
        job_description: str,
        candidate_skills: List[str],
        target_role: Optional[str] = "Software Engineer"
    ) -> Dict[str, Any]:
        """Analyzes a job description, extracts key skills, and calculates skill gap match percentage."""
        pass

    @abstractmethod
    def evaluate_code_solution(
        self,
        problem_title: str,
        language: str,
        candidate_code: str,
        passed_tests: bool,
        test_case_summary: str
    ) -> Dict[str, Any]:
        """Evaluates a candidate's code submission for time/space complexity, correctness, and code quality."""
        pass
