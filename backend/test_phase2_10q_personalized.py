import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.resume_service import ResumeParserService
from app.services.ai.fallback_provider import FallbackAIProvider

def run_10q_personalized_interview_simulation():
    print("\n=======================================================")
    print("STARTING 10-QUESTION PERSONALIZED INTERVIEW SIMULATION")
    print("=======================================================")
    
    provider = FallbackAIProvider()
    
    # 1. Candidate Background
    candidate_name = "Alex Mercer"
    target_role = "Senior Full Stack Software Engineer"
    domain = "Technology"
    experience_level = "Senior"
    
    resume_projects = [
        {"title": "Distributed E-Commerce Microservices", "description": "FastAPI + React with Redis caching and Kafka streaming"},
        {"title": "Real-time Telemetry Dashboard", "description": "WebSocket pipeline with PostgreSQL and Docker"}
    ]
    resume_skills = ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Redis", "Kafka", "Docker", "AWS"]
    
    # 2. Job Description
    sample_jd = """
    Senior Full Stack Engineer:
    Must have hands-on expertise in Python, FastAPI, React, PostgreSQL, Docker, Kafka, and distributed system design.
    Responsibilities include building high-throughput APIs, caching layers, and CI/CD pipelines.
    """
    
    jd_analysis = ResumeParserService.analyze_job_description_text(sample_jd, target_role)
    matching = ResumeParserService.match_resume_to_jd({"skills": resume_skills, "projects": resume_projects}, jd_analysis)
    
    print(f"\n[1] JD vs Resume Alignment:")
    print(f"    - Role: {target_role}")
    print(f"    - Match Score: {matching['match_percentage']}%")
    print(f"    - Matched Skills: {matching['matched_skills']}")
    print(f"    - Missing Skills: {matching['missing_skills']}")
    
    # 3. Generate Initial 10-Question Plan
    question_plan = provider.generate_interview_plan(
        target_role=target_role,
        mode="Technical",
        category="Full Stack",
        difficulty="Hard",
        total_questions=10,
        skills=resume_skills,
        projects=resume_projects,
        experience_level=experience_level,
        domain=domain,
        job_description=sample_jd,
        candidate_name=candidate_name
    )
    
    print(f"\n[2] Generated 10-Question Personalized Plan:")
    for idx, q in enumerate(question_plan, 1):
        print(f"    Q{idx}: {q['question_text']}")
    
    # 4. Simulate 10-Turn Adaptive Q&A and Evaluation
    candidate_responses = [
        # Turn 1: Introduction
        "Hello Dr. Mitchell. I am Alex, a Senior Full Stack Engineer with 7 years of experience building scalable distributed systems with React, FastAPI, Kafka, and AWS.",
        # Turn 2: Project Deep Dive (React + FastAPI)
        "In our e-commerce platform, we decoupled React frontend and FastAPI backend via REST and OpenAPI contracts. We used Redis for JWT session caching and handled state with Zustand.",
        # Turn 3: Project Deep Dive (Kafka)
        "For Kafka event streaming, we configured idempotent producers, keyed partitioning on user_id to ensure order, and managed consumer offset commits manually to guarantee at-least-once delivery.",
        # Turn 4: Database ACID
        "Relational databases guarantee ACID properties through Write-Ahead Logging for durability, multi-version concurrency control (MVCC) for isolation, and atomic commit/rollback mechanisms.",
        # Turn 5: Redis Caching
        "To prevent cache stampedes, we set jittered TTL expiry times and used distributed mutex locks with Redlock pattern so only one worker refreshed the cache on miss.",
        # Turn 6: Docker Containerization
        "We used multi-stage Docker builds to reduce image size from 1.2GB to 85MB, ran non-root containers, and scanned layers for vulnerabilities using Trivy.",
        # Turn 7: System Scaling
        "For horizontal database scaling, we separated read replicas using connection pooling and applied hash-based horizontal sharding across tenant partitions.",
        # Turn 8: Microservices Consistency
        "We implemented the Saga pattern with choreography-based compensation transactions to maintain eventual consistency without locking distributed tables.",
        # Turn 9: Latency Debugging
        "When debugging latency spikes, we inspect APM traces with OpenTelemetry, identify database slow query locks via pg_stat_activity, and optimize index coverage.",
        # Turn 10: Engineering Leadership
        "I mentor junior engineers by establishing RFC architecture review processes, enforcing automated test coverage thresholds, and conducting blameless post-mortems."
    ]
    
    asked_question_texts = []
    evaluations = []
    
    print("\n[3] Executing 10 Adaptive Q&A Turns:")
    
    current_q = question_plan[0]
    
    for turn_idx in range(10):
        q_text = current_q["question_text"]
        asked_question_texts.append(q_text)
        ans_text = candidate_responses[turn_idx]
        
        # Evaluate Answer
        expected = current_q.get("expected_concepts", ["fundamental knowledge", "practical application"])
        eval_res = provider.evaluate_answer(
            question_text=q_text,
            candidate_answer=ans_text,
            expected_concepts=expected,
            category="Full Stack",
            difficulty="Hard",
            target_role=target_role
        )
        evaluations.append(eval_res)
        
        print(f"\n--- Turn {turn_idx + 1}/10 ---")
        print(f"Interviewer: {q_text}")
        print(f"Candidate:   {ans_text[:80]}...")
        print(f"Evaluation:  Score={eval_res['score']}/100 | Tech={eval_res['technical_score']}/10 | Comm={eval_res['communication_score']}/10 | Feedback={eval_res['feedback'][:60]}...")
        
        # Contextual Follow-Up Check
        follow_up = provider.generate_follow_up_question(q_text, ans_text, "Full Stack", "Hard")
        if follow_up:
            print(f"   [Contextual Probe]: {follow_up['question_text']}")
        
        # Prepare Next Adaptive Question (if not last turn)
        if turn_idx < 9:
            current_q = provider.generate_next_adaptive_question(
                target_role=target_role,
                mode="Technical",
                category="Full Stack",
                difficulty="Hard",
                previous_question=q_text,
                previous_answer=ans_text,
                previous_evaluation=eval_res,
                asked_questions=asked_question_texts,
                domain=domain,
                experience_level=experience_level
            )
    
    # 5. Synthesize Final Assessment Report
    final_report = provider.synthesize_final_report(
        candidate_name=candidate_name,
        target_role=target_role,
        mode="Technical",
        category="Full Stack",
        difficulty="Hard",
        evaluations=evaluations,
        domain=domain,
        experience_level=experience_level
    )
    
    print("\n=======================================================")
    print("FINAL UNIVERSAL AI ASSESSMENT REPORT")
    print("=======================================================")
    print(f"Candidate:          {candidate_name}")
    print(f"Target Role:        {target_role}")
    print(f"Overall Score:      {final_report['overall_score']}/100")
    print(f"Technical Score:    {final_report['technical_score']}/100")
    print(f"Communication:      {final_report['communication_score']}/100")
    print(f"Problem Solving:    {final_report['problem_solving_score']}/100")
    print(f"Hiring Verdict:     {final_report['verdict']}")
    print(f"Strengths:          {final_report['strengths']}")
    print(f"Executive Summary:  {final_report['executive_summary']}")
    
    # Assertions for 10-Question Test
    assert len(evaluations) == 10, "Must have exactly 10 evaluations"
    assert len(set(asked_question_texts)) == 10, "Must have 0 duplicate questions across 10 turns"
    assert final_report["overall_score"] > 70, "Strong candidate answers should score > 70"
    assert final_report["verdict"] in ("HIRE", "STRONG HIRE")
    
    print("\n✓ 10-QUESTION PERSONALIZED & ADAPTIVE INTERVIEW SIMULATION PASSED 100%!")

if __name__ == "__main__":
    run_10q_personalized_interview_simulation()
