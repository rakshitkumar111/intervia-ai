from typing import Dict, Any, List, Optional
from app.services.ai.base import BaseAIProvider
from app.services.ai.gemini_provider import GeminiAIProvider
from app.services.ai.fallback_provider import FallbackAIProvider
from app.config import settings
from app.utils.logger import logger

class AIEngine:
    """
    Unified AI Engine Facade managing Universal AI Interviewer execution,
    Gemini 3.5 live intelligence, and graceful Universal Fallback transitions.
    """

    def __init__(self):
        self._provider: BaseAIProvider = self._initialize_provider()

    def _initialize_provider(self) -> BaseAIProvider:
        provider_type = (settings.AI_PROVIDER or "gemini").lower()

        # Primary Production AI Provider: Google Gemini
        if provider_type in ("gemini", "auto"):
            if settings.GEMINI_API_KEY:
                logger.info(f"Initializing Universal AI Provider: Google Gemini (Model: {settings.GEMINI_MODEL})")
                return GeminiAIProvider()
            elif provider_type == "gemini" and settings.STRICT_AI_MODE:
                logger.error("STRICT AI MODE: GEMINI_API_KEY is missing while AI_PROVIDER=gemini.")
                raise RuntimeError("STRICT AI MODE: GEMINI_API_KEY is required in .env")

        logger.info("[Universal Fallback Engine]: Active.")
        return FallbackAIProvider()

    def get_provider_name(self) -> str:
        name = self._provider.__class__.__name__
        if name == "FallbackAIProvider":
            return "Universal Rule-Based Fallback Engine"
        return name

    def get_provider_info(self) -> Dict[str, Any]:
        is_live_gemini = isinstance(self._provider, GeminiAIProvider) and bool(settings.GEMINI_API_KEY)
        return {
            "provider_name": self.get_provider_name(),
            "is_live_cloud_api": is_live_gemini,
            "configured_provider": settings.AI_PROVIDER,
            "active_model": settings.GEMINI_MODEL if is_live_gemini else "Universal Ontology Engine",
            "fallback_status": "Standby" if is_live_gemini else "Active",
            "strict_mode": settings.STRICT_AI_MODE
        }

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
        return self._provider.generate_interview_plan(
            target_role, mode, category, difficulty, total_questions, skills, projects, experience_level,
            domain, company_name, language, job_description, candidate_name
        )

    def generate_follow_up_question(
        self,
        original_question: str,
        candidate_answer: str,
        category: str,
        difficulty: str,
        language: Optional[str] = "English"
    ) -> Optional[Dict[str, Any]]:
        return self._provider.generate_follow_up_question(
            original_question, candidate_answer, category, difficulty, language
        )

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
        return self._provider.generate_next_adaptive_question(
            target_role, mode, category, difficulty, previous_question, previous_answer, previous_evaluation,
            asked_questions, domain, experience_level, language, job_description, candidate_name, conversation_history
        )

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
        return self._provider.evaluate_answer(
            question_text, candidate_answer, expected_concepts, category, difficulty, target_role, language
        )

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
        return self._provider.synthesize_final_report(
            candidate_name, target_role, mode, category, difficulty, evaluations, domain, experience_level, language
        )

    def generate_final_report(
        self,
        qa_pairs: List[Dict[str, Any]],
        target_role: str,
        domain: Optional[str] = "Technology",
        experience_level: Optional[str] = "Mid-Level",
        language: Optional[str] = "English"
    ) -> Dict[str, Any]:
        return self._provider.synthesize_final_report(
            "Candidate", target_role, "Universal", "General", "Medium", qa_pairs, domain, experience_level, language
        )

    def analyze_job_description(
        self,
        job_description: str,
        candidate_skills: List[str],
        target_role: Optional[str] = "Software Engineer"
    ) -> Dict[str, Any]:
        return self._provider.analyze_job_description(job_description, candidate_skills, target_role)

    def evaluate_code_solution(
        self,
        problem_title: str,
        language: str,
        candidate_code: str,
        passed_tests: bool,
        test_case_summary: str
    ) -> Dict[str, Any]:
        return self._provider.evaluate_code_solution(
            problem_title, language, candidate_code, passed_tests, test_case_summary
        )

# Global Singleton Instance
ai_engine = AIEngine()
