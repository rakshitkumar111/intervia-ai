import sys
import os
import json
import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.resume_service import ResumeParserService
from app.services.ai.fallback_provider import FallbackAIProvider
from app.services.ai.engine import ai_engine
from app.services.avatar.did_service import DIDRealtimeAvatarService

def test_resume_parser_multi_category():
    sample_text = """
    John Doe
    Email: john.doe@example.com | Phone: +1-555-0199
    
    SKILLS:
    Programming: Python, TypeScript, Java, C++
    Frameworks: React, FastAPI, Node.js, Next.js, Django
    Databases: PostgreSQL, MongoDB, Redis
    Tools & Cloud: Docker, Kubernetes, AWS, Git, Kafka
    AI/ML: PyTorch, TensorFlow, Pandas
    
    PROJECTS:
    1. Real-Time Distributed E-Commerce: Built fullstack system using React and FastAPI with Redis caching and Kafka message broker. Handled 10k req/sec.
    2. AI Diagnostic Vision: Developed automated image segmentation pipeline with PyTorch and FastAPI.
    
    EXPERIENCE:
    Senior Software Engineer at Acme Corp (2021 - Present)
    - Architected microservices platform using Docker, Kubernetes, and PostgreSQL.
    
    EDUCATION:
    Bachelor of Science in Computer Science, State University, 2020
    
    CERTIFICATIONS:
    AWS Certified Solutions Architect, Kubernetes CKA
    
    ACHIEVEMENTS:
    Won 1st place in National Hackathon 2022
    """
    
    parsed = ResumeParserService.analyze_resume(sample_text, "john_doe_resume.pdf")
    
    assert "Python" in parsed["skills"] or "python" in [s.lower() for s in parsed["skills"]]
    assert len(parsed["projects"]) >= 1
    assert len(parsed["experience"]) >= 1
    assert len(parsed["certifications"]) >= 1
    assert len(parsed["achievements"]) >= 1
    print("✓ Resume Parser Multi-Category Extraction: PASSED")

def test_jd_analysis_and_4way_matching():
    sample_resume = {
        "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Redis", "Git"],
        "projects": [{"title": "React + FastAPI Platform", "description": "Built e-commerce app"}]
    }
    
    sample_jd = """
    We are looking for a Senior Full Stack Engineer.
    Required Skills: Python, FastAPI, PostgreSQL, Kubernetes, AWS, Kafka.
    Preferred Skills: React, Redis, Docker.
    Responsibilities:
    - Design and scale distributed backend APIs.
    - Deploy containerized services on AWS EKS.
    """
    
    jd_analysis = ResumeParserService.analyze_job_description_text(sample_jd, "Senior Full Stack Engineer")
    match_result = ResumeParserService.match_resume_to_jd(sample_resume, jd_analysis)
    
    assert "matched_skills" in match_result
    assert "missing_skills" in match_result
    assert "partial_matches" in match_result
    assert "extra_resume_skills" in match_result
    assert match_result["match_percentage"] > 0
    assert "resume_projects" in match_result["weightings"]
    
    print(f"✓ JD 4-Way Skill Matching ({match_result['match_percentage']}%): PASSED")
    print(f"   - Matched: {match_result['matched_skills']}")
    print(f"   - Missing: {match_result['missing_skills']}")

def test_personalized_question_generation():
    provider = FallbackAIProvider()
    
    projects = [
        {"title": "E-Commerce React + FastAPI", "description": "High throughput microservices with Redis"}
    ]
    skills = ["Python", "FastAPI", "React", "PostgreSQL", "Redis"]
    
    questions = provider.generate_interview_plan(
        target_role="Full Stack Engineer",
        mode="Technical",
        category="Full Stack",
        difficulty="Medium",
        total_questions=5,
        skills=skills,
        projects=projects,
        experience_level="Mid-Level"
    )
    
    assert len(questions) == 5
    # Check that at least one question specifically references the candidate's project
    has_project_q = any("react" in q["question_text"].lower() or "fastapi" in q["question_text"].lower() for q in questions)
    assert has_project_q, "Generated questions must reference resume projects"
    print("✓ Personalized Question Generation: PASSED")

def test_adaptive_difficulty_progression():
    provider = FallbackAIProvider()
    
    # 1. Strong Candidate (Score 90) -> Should escalate
    strong_eval = {"score": 90.0, "technical_score": 9.5}
    q_strong = provider.generate_next_adaptive_question(
        target_role="Software Engineering",
        mode="Technical",
        category="Software Engineering",
        difficulty="Medium",
        previous_question="What is an Array vs Linked List?",
        previous_answer="Arrays allocate contiguous memory with O(1) indexing while linked lists use non-contiguous nodes.",
        previous_evaluation=strong_eval,
        asked_questions=["What is an Array vs Linked List?"]
    )
    assert q_strong["difficulty"] == "Senior"
    
    # 2. Weak Candidate (Score 40) -> Should drill into fundamentals
    weak_eval = {"score": 40.0, "technical_score": 4.0}
    q_weak = provider.generate_next_adaptive_question(
        target_role="Software Engineering",
        mode="Technical",
        category="Software Engineering",
        difficulty="Medium",
        previous_question="Explain ACID properties.",
        previous_answer="It means databases are good.",
        previous_evaluation=weak_eval,
        asked_questions=["Explain ACID properties."]
    )
    assert q_weak["difficulty"] == "Fresher"
    print("✓ Adaptive Questioning (Strong -> Senior, Weak -> Fresher): PASSED")

def test_contextual_follow_up():
    provider = FallbackAIProvider()
    
    # Candidate mentions specific tech keyword (e.g. JWT)
    ans_jwt = "For our API authentication, I implemented stateless JWT tokens with role claims."
    follow_up = provider.generate_follow_up_question(
        original_question="How did you secure your API?",
        candidate_answer=ans_jwt,
        category="Security",
        difficulty="Medium"
    )
    
    assert follow_up is not None
    assert "jwt" in follow_up["question_text"].lower() or "token" in follow_up["question_text"].lower()
    print("✓ Contextual Follow-up (JWT Recognition): PASSED")

def test_multilingual_phrasing():
    provider = FallbackAIProvider()
    
    q_eng = provider.generate_interview_plan(
        target_role="Data Scientist", mode="Technical", category="AI/ML", difficulty="Medium", total_questions=3,
        skills=["Python"], projects=[], experience_level="Mid-Level", language="English"
    )
    q_hin = provider.generate_interview_plan(
        target_role="Data Scientist", mode="Technical", category="AI/ML", difficulty="Medium", total_questions=3,
        skills=["Python"], projects=[], experience_level="Mid-Level", language="Hindi"
    )
    q_hing = provider.generate_interview_plan(
        target_role="Data Scientist", mode="Technical", category="AI/ML", difficulty="Medium", total_questions=3,
        skills=["Python"], projects=[], experience_level="Mid-Level", language="Hinglish"
    )
    
    assert "welcome" in q_eng[0]["question_text"].lower()
    assert "स्वागत" in q_hin[0]["question_text"]
    assert "welcome" in q_hing[0]["question_text"].lower() or "shuru" in q_hing[0]["question_text"].lower()
    print("✓ Multilingual Generation (English, Hindi, Hinglish): PASSED")

def test_evaluation_6_dimensions():
    provider = FallbackAIProvider()
    
    eval_res = provider.evaluate_answer(
        question_text="Explain how Redis is used for caching.",
        candidate_answer="Redis is an in-memory key-value data store used as a distributed cache. We use TTL expiry to invalidate stale data and write-through cache to keep database and cache synchronized.",
        expected_concepts=["in-memory", "TTL expiry", "write-through", "distributed cache", "cache aside"],
        category="Backend",
        difficulty="Medium"
    )
    
    assert "technical_score" in eval_res
    assert "relevance_score" in eval_res
    assert "depth_score" in eval_res  # Completeness
    assert "problem_solving_score" in eval_res
    assert "communication_score" in eval_res
    assert "confidence_score" in eval_res
    assert 0 <= eval_res["score"] <= 100
    print(f"✓ 6-Dimension Evaluation ({eval_res['score']}/100): PASSED")

def test_did_real_connection_regression():
    did_service = DIDRealtimeAvatarService()
    diag = did_service.validate_did_health()
    assert diag["configured"] is True
    assert diag["api_auth"] == "PASS"
    assert diag["agent"] == "PASS"
    assert diag["stream_creation"] == "PASS"
    print("✓ D-ID Real WebRTC Stream Health Diagnostic (0 Regression): PASSED")

if __name__ == "__main__":
    print("\n--- RUNNING PHASE 2 AI INTELLIGENCE TEST SUITE ---")
    test_resume_parser_multi_category()
    test_jd_analysis_and_4way_matching()
    test_personalized_question_generation()
    test_adaptive_difficulty_progression()
    test_contextual_follow_up()
    test_multilingual_phrasing()
    test_evaluation_6_dimensions()
    test_did_real_connection_regression()
    print("\n✓ ALL PHASE 2 AI INTELLIGENCE UNIT & REGRESSION TESTS PASSED!")
