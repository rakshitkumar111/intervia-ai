import os
import json
import pytest
from app.config import settings
from app.services.ai.gemini_provider import GeminiAIProvider
from app.services.ai.fallback_provider import FallbackAIProvider
from app.services.ai.engine import AIEngine

def test_gemini_provider_structure():
    """Verifies that GeminiAIProvider conforms to BaseAIProvider and handles configuration."""
    provider = GeminiAIProvider(api_key="", model_name="gemini-2.5-flash")
    assert provider.model_name == "gemini-2.5-flash"
    assert isinstance(provider.fallback, FallbackAIProvider)

def test_gemini_question_generation_contract():
    """Verifies that Gemini question generation returns properly structured questions."""
    provider = GeminiAIProvider(api_key=settings.GEMINI_API_KEY or "dummy-key", model_name=settings.GEMINI_MODEL)
    
    # Testing interview plan generation
    questions = provider.generate_interview_plan(
        target_role="Senior Full Stack AI Developer",
        mode="Technical",
        category="Data Structures & Algorithms",
        difficulty="Senior",
        total_questions=3,
        skills=["Python", "FastAPI", "React", "Docker", "PyTorch"],
        projects=[{"title": "AI Threat Detection", "description": "Intrusion detection model"}],
        experience_level="Senior (5+ yrs)"
    )

    assert isinstance(questions, list)
    assert len(questions) == 3
    for q in questions:
        assert "question_text" in q
        assert "category" in q
        assert "difficulty" in q
        assert "expected_concepts" in q
        assert isinstance(q["expected_concepts"], list)

def test_gemini_follow_up_generation_contract():
    """Verifies that follow-up generation behaves adaptively."""
    provider = GeminiAIProvider(api_key=settings.GEMINI_API_KEY or "dummy-key", model_name=settings.GEMINI_MODEL)

    follow_up = provider.generate_follow_up_question(
        original_question="What is polymorphism and how does dynamic dispatch work in OOP?",
        candidate_answer="Polymorphism lets objects be treated as their parent class.",
        category="Object-Oriented Design (OOP)",
        difficulty="Mid-Level"
    )

    if follow_up:
        assert "question_text" in follow_up
        assert follow_up.get("is_follow_up") is True

def test_gemini_answer_evaluation_contract():
    """Verifies 6-dimensional scoring contract."""
    provider = GeminiAIProvider(api_key=settings.GEMINI_API_KEY or "dummy-key", model_name=settings.GEMINI_MODEL)

    eval_result = provider.evaluate_answer(
        question_text="Explain the difference between an Array and a Linked List.",
        candidate_answer=(
            "An array allocates contiguous memory which grants O(1) random access by index. "
            "In contrast, a linked list consists of dynamically allocated nodes connected by pointers, "
            "allowing O(1) insertion at head but requiring O(N) traversal."
        ),
        expected_concepts=["contiguous memory", "dynamic node pointers", "O(1) indexing", "O(N) traversal"],
        category="Data Structures & Algorithms",
        difficulty="Junior"
    )

    assert isinstance(eval_result, dict)
    assert "score" in eval_result
    assert "relevance_score" in eval_result
    assert "correctness_score" in eval_result
    assert "depth_score" in eval_result
    assert "clarity_score" in eval_result
    assert "completeness_score" in eval_result
    assert "confidence_score" in eval_result
    assert "feedback" in eval_result
    assert "strengths" in eval_result
    assert "suggestions" in eval_result

def test_gemini_final_report_synthesis_contract():
    """Verifies final report synthesis and verdict assignment."""
    provider = GeminiAIProvider(api_key=settings.GEMINI_API_KEY or "dummy-key", model_name=settings.GEMINI_MODEL)

    dummy_evaluations = [
        {
            "score": 88.0,
            "relevance_score": 90.0,
            "correctness_score": 85.0,
            "depth_score": 85.0,
            "clarity_score": 90.0,
            "completeness_score": 85.0,
            "confidence_score": 90.0,
            "feedback": "Strong explanation with deep conceptual grounding."
        }
    ]

    report = provider.synthesize_final_report(
        candidate_name="Alex Chen",
        target_role="Senior Full Stack AI Developer",
        mode="Technical",
        category="Data Structures & Algorithms",
        difficulty="Senior",
        evaluations=dummy_evaluations
    )

    assert isinstance(report, dict)
    assert "overall_score" in report
    assert "verdict" in report
    assert report["verdict"] in ["Strong Hire", "Hire", "Leaning Hire", "Needs Improvement", "Reject"]
    assert "executive_summary" in report
    assert "strengths" in report
    assert "recommendations" in report

def test_ai_engine_telemetry():
    """Verifies AI Engine returns accurate provider status telemetry."""
    engine = AIEngine()
    info = engine.get_provider_info()
    assert "provider_name" in info
    assert "is_live_cloud_api" in info
    assert "configured_provider" in info
    assert "active_model" in info
    assert "fallback_status" in info

if __name__ == "__main__":
    pytest.main(["-v", __file__])
