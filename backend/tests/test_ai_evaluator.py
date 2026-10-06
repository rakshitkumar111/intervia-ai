import pytest
from app.services.ai.fallback_provider import FallbackAIProvider

def test_fallback_question_generation():
    provider = FallbackAIProvider()
    plan = provider.generate_interview_plan(
        target_role="Full Stack Developer",
        mode="Technical",
        category="Data Structures & Algorithms",
        difficulty="Mid-Level",
        total_questions=5,
        skills=["Python", "React", "FastAPI"],
        projects=[{"title": "E-Commerce App"}],
        experience_level="Mid-Level"
    )

    assert len(plan) == 5
    assert all("question_text" in q for q in plan)
    assert all("expected_concepts" in q for q in plan)

def test_answer_evaluation_dimensions():
    provider = FallbackAIProvider()
    q_text = "What is the difference between an Array and a Linked List in memory allocation and insertion complexity?"
    expected = ["contiguous memory", "dynamic node pointer", "O(1) vs O(N) insertion"]
    
    good_answer = (
        "An array allocates contiguous blocks of memory, which provides excellent cache locality and O(1) random access, "
        "but inserting into an arbitrary index requires O(N) element shifting. In contrast, a linked list uses dynamic nodes "
        "connected by pointers. Inserting at the head or when holding a node reference is O(1), but random access is O(N) "
        "and traversal suffers from pointer chasing."
    )

    evaluation = provider.evaluate_answer(
        question_text=q_text,
        candidate_answer=good_answer,
        expected_concepts=expected,
        category="Data Structures & Algorithms",
        difficulty="Junior"
    )

    assert evaluation["score"] >= 70.0
    assert evaluation["correctness_score"] >= 70.0
    assert evaluation["depth_score"] >= 60.0
    assert len(evaluation["strengths"]) > 0
    assert len(evaluation["suggestions"]) > 0

def test_follow_up_trigger():
    provider = FallbackAIProvider()
    follow_up = provider.generate_follow_up_question(
        original_question="What are OOP concepts?",
        candidate_answer="Polymorphism means one interface has multiple implementations.",
        category="OOP",
        difficulty="Junior"
    )
    assert follow_up is not None
    assert follow_up.get("is_follow_up") is True
    assert "polymorphism" in follow_up.get("question_text", "").lower()
