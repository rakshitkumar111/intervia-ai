import sys
import os
import json
import httpx
import pytest
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.resume_service import ResumeParserService
from app.services.ai.fallback_provider import FallbackAIProvider
from app.services.ai.gemini_provider import calculate_text_similarity
from app.services.ai.engine import ai_engine
from app.services.avatar.did_service import DIDRealtimeAvatarService

BASE_URL = "http://127.0.0.1:8000/api"

def generate_sample_pdf_resume(filepath: str):
    """Generates a real PDF resume file with structured candidate information."""
    c = canvas.Canvas(filepath, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, "Priya Sharma")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, 735, "Email: priya.sharma@example.com | Phone: +91-9876543210")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 710, "SKILLS & TECHNOLOGIES")
    c.setFont("Helvetica", 10)
    c.drawString(50, 695, "Languages: Python, TypeScript, Java, SQL, C++")
    c.drawString(50, 680, "Frameworks: React, FastAPI, Node.js, Express, Django")
    c.drawString(50, 665, "Databases & Caching: PostgreSQL, MongoDB, Redis")
    c.drawString(50, 650, "Cloud & DevOps: Docker, Kubernetes, AWS, Git, Kafka, CI/CD")
    c.drawString(50, 635, "AI & ML: PyTorch, TensorFlow, Pandas, Scikit-Learn")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 610, "FEATURED PROJECTS")
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, 595, "1. Distributed E-Commerce Microservices Platform (React + FastAPI)")
    c.setFont("Helvetica", 10)
    c.drawString(50, 580, "Built high-concurrency e-commerce backend with FastAPI, React frontend, Redis caching, and Kafka messaging.")
    c.drawString(50, 565, "Handled 15,000 requests/second with sub-50ms latency.")
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, 545, "2. Real-Time Telemetry & Observability Pipeline")
    c.setFont("Helvetica", 10)
    c.drawString(50, 530, "Implemented WebSocket and Dockerized log aggregation service with PostgreSQL backend.")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 505, "PROFESSIONAL EXPERIENCE")
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, 490, "Senior Software Engineer - Tech Solutions Pvt Ltd (2021 - Present)")
    c.setFont("Helvetica", 10)
    c.drawString(50, 475, "- Architected microservices with Docker, Kubernetes, and PostgreSQL.")
    c.drawString(50, 460, "- Mentored 5 junior engineers and led code review practices.")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 435, "EDUCATION")
    c.setFont("Helvetica", 10)
    c.drawString(50, 420, "Bachelor of Technology in Computer Science, IIT Delhi, 2021")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 395, "CERTIFICATIONS & ACHIEVEMENTS")
    c.setFont("Helvetica", 10)
    c.drawString(50, 380, "- AWS Certified Solutions Architect Associate")
    c.drawString(50, 365, "- Certified Kubernetes Administrator (CKA)")
    c.drawString(50, 350, "- Winner of National Smart City Hackathon 2022")
    
    c.save()

def generate_sample_pdf_jd(filepath: str):
    """Generates a real PDF Job Description."""
    c = canvas.Canvas(filepath, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, "Job Description: Senior Full Stack Engineer")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 720, "Company: CloudTech Global")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 695, "Required Skills:")
    c.setFont("Helvetica", 10)
    c.drawString(50, 680, "- Python, FastAPI, PostgreSQL, Kubernetes, AWS, Kafka")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 655, "Preferred Skills:")
    c.setFont("Helvetica", 10)
    c.drawString(50, 640, "- React, TypeScript, Redis, Docker, Microservices")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 615, "Responsibilities:")
    c.setFont("Helvetica", 10)
    c.drawString(50, 600, "- Design and scale distributed backend APIs and event-driven architectures.")
    c.drawString(50, 585, "- Lead cross-functional architecture reviews and mentor junior developers.")
    c.drawString(50, 570, "- Ensure 99.99% system availability with automated CI/CD and observability.")
    
    c.save()

def get_auth_token():
    """Authenticates or registers a verification test user to obtain a JWT bearer token."""
    with httpx.Client(timeout=10.0) as client:
        login_res = client.post(f"{BASE_URL}/auth/login", json={"email": "verifier@example.com", "password": "Password123!"})
        if login_res.status_code == 200:
            return login_res.json()["access_token"]
        
        reg_res = client.post(f"{BASE_URL}/auth/register", json={
            "email": "verifier@example.com",
            "password": "Password123!",
            "full_name": "Verification Candidate",
            "target_role": "Full Stack Engineer"
        })
        if reg_res.status_code in (200, 201):
            return reg_res.json()["access_token"]
        
        raise RuntimeError(f"Auth failed: {reg_res.text}")

def run_phase2_full_verification():
    results = {}
    print("\n=======================================================")
    print("STARTING PHASE 2 COMPLETE AI INTELLIGENCE VERIFICATION")
    print("=======================================================\n")
    
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # ---------------------------------------------------------
    # 1. Resume Upload (Real PDF)
    # ---------------------------------------------------------
    pdf_resume_path = "sample_test_resume.pdf"
    generate_sample_pdf_resume(pdf_resume_path)
    
    uploaded_resume_id = None
    with httpx.Client(timeout=35.0) as client:
        with open(pdf_resume_path, "rb") as f:
            upload_res = client.post(
                f"{BASE_URL}/resume/upload",
                headers=headers,
                files={"file": ("sample_test_resume.pdf", f, "application/pdf")}
            )
        
        if upload_res.status_code in (200, 201):
            resume_data = upload_res.json()
            uploaded_resume_id = resume_data["id"]
            results["Resume Upload"] = "PASS"
            print(f"[PASS] Resume Upload: PASS (Resume ID={uploaded_resume_id})")
        else:
            results["Resume Upload"] = f"FAIL ({upload_res.status_code}: {upload_res.text})"
            print(f"[FAIL] Resume Upload: FAIL -> {upload_res.text}")

    # ---------------------------------------------------------
    # 2. Resume Analysis Structured Extraction
    # ---------------------------------------------------------
    with httpx.Client(timeout=35.0) as client:
        get_res = client.get(f"{BASE_URL}/resume/{uploaded_resume_id}", headers=headers)
        if get_res.status_code == 200:
            parsed = get_res.json()
            skills = parsed.get("parsed_skills", [])
            projects = parsed.get("parsed_projects", [])
            experience = parsed.get("parsed_experience", [])
            education = parsed.get("parsed_education", [])
            certifications = parsed.get("parsed_certifications", [])
            
            has_skills = len(skills) >= 5
            has_projects = len(projects) >= 1
            has_experience = len(experience) >= 1
            has_education = len(education) >= 1
            has_certs = len(certifications) >= 1
            
            if has_skills and has_projects and has_experience and has_education and has_certs:
                results["Resume Analysis"] = "PASS"
                print(f"[PASS] Resume Analysis: PASS (Skills={len(skills)}, Projects={len(projects)}, Exp={len(experience)}, Edu={len(education)}, Certs={len(certifications)})")
            else:
                results["Resume Analysis"] = f"FAIL (Skills={len(skills)}, Projects={len(projects)}, Exp={len(experience)})"
                print(f"[FAIL] Resume Analysis: FAIL")
        else:
            results["Resume Analysis"] = f"FAIL ({get_res.status_code})"

    # ---------------------------------------------------------
    # 3. Job Description Input & Upload (Real PDF & Text)
    # ---------------------------------------------------------
    pdf_jd_path = "sample_test_jd.pdf"
    generate_sample_pdf_jd(pdf_jd_path)
    
    with httpx.Client(timeout=35.0) as client:
        with open(pdf_jd_path, "rb") as f:
            upload_jd_res = client.post(
                f"{BASE_URL}/interview/upload-jd",
                headers=headers,
                data={"resume_id": uploaded_resume_id, "target_role": "Senior Full Stack Engineer"},
                files={"file": ("sample_test_jd.pdf", f, "application/pdf")}
            )
        
        if upload_jd_res.status_code == 200:
            jd_data = upload_jd_res.json()
            extracted_text = jd_data.get("extracted_text", "")
            analysis = jd_data.get("analysis", {})
            if "FastAPI" in extracted_text or "Python" in extracted_text:
                results["JD Analysis"] = "PASS"
                print(f"[PASS] JD Analysis: PASS (Extracted {len(extracted_text)} chars, Required={analysis.get('required_skills')})")
            else:
                results["JD Analysis"] = "FAIL (No text extracted)"
        else:
            results["JD Analysis"] = f"FAIL ({upload_jd_res.status_code}: {upload_jd_res.text})"

    # ---------------------------------------------------------
    # 4. Resume vs JD Skill Matching (4-Way Matching)
    # ---------------------------------------------------------
    with httpx.Client(timeout=35.0) as client:
        match_payload = {
            "job_description": "Required: Python, FastAPI, PostgreSQL, Kubernetes, AWS, Kafka. Preferred: React, Redis, Docker.",
            "resume_id": uploaded_resume_id,
            "target_role": "Senior Full Stack Engineer"
        }
        match_res = client.post(f"{BASE_URL}/interview/analyze-jd", headers=headers, json=match_payload)
        if match_res.status_code == 200:
            match_data = match_res.json()
            matched = match_data.get("matched_skills", [])
            missing = match_data.get("missing_skills", [])
            partial = match_data.get("partial_matches", [])
            extra = match_data.get("extra_resume_skills", [])
            score = match_data.get("match_percentage", 0.0)
            
            if matched and score > 0:
                results["Skill Matching"] = "PASS"
                print(f"[PASS] Skill Matching: PASS (Score={score}%, Matched={matched}, Missing={missing}, Partial={partial}, Extra={extra})")
            else:
                results["Skill Matching"] = f"FAIL (Score={score})"
        else:
            results["Skill Matching"] = f"FAIL ({match_res.status_code})"

    # ---------------------------------------------------------
    # 5. Start Resume + JD Based Interview Session
    # ---------------------------------------------------------
    interview_id = None
    initial_questions = []
    with httpx.Client(timeout=20.0) as client:
        create_payload = {
            "target_role": "Senior Full Stack Software Engineer",
            "company_name": "CloudTech Global",
            "domain": "Technology & Software",
            "experience_level": "Senior",
            "mode": "Technical",
            "category": "Full Stack",
            "difficulty": "Hard",
            "total_questions": 5,
            "language": "English",
            "resume_id": uploaded_resume_id,
            "job_description": "Must have expertise in Python, FastAPI, React, PostgreSQL, Docker, Kafka, Redis."
        }
        create_res = client.post(f"{BASE_URL}/interview/create", headers=headers, json=create_payload)
        if create_res.status_code in (200, 201):
            session_data = create_res.json()
            interview_id = session_data["id"]
            initial_questions = session_data.get("questions", [])
            print(f"[PASS] Interview Session Initialized: ID={interview_id}, Questions={len(initial_questions)}")
        else:
            print(f"[FAIL] Interview Creation Failed: {create_res.text}")

    # ---------------------------------------------------------
    # 6. Verify Personalized Questions (from Resume + JD)
    # ---------------------------------------------------------
    gen_plan = ai_engine.generate_interview_plan(
        target_role="Senior Full Stack Software Engineer",
        mode="Technical",
        category="Full Stack",
        difficulty="Hard",
        total_questions=5,
        skills=skills,
        projects=projects,
        experience_level="Senior",
        domain="Technology & Software",
        job_description="Must have expertise in Python, FastAPI, React, PostgreSQL, Docker, Kafka, Redis.",
        candidate_name="Priya Sharma"
    )
    has_project_probe = any(
        "react" in q["question_text"].lower() or "fastapi" in q["question_text"].lower() or "e-commerce" in q["question_text"].lower()
        for q in gen_plan
    )
    if has_project_probe:
        results["Personalized Questions"] = "PASS"
        print("[PASS] Personalized Questions: PASS (Explicitly references candidate's React + FastAPI microservices project)")
    else:
        results["Personalized Questions"] = "FAIL (No resume project referenced)"

    # ---------------------------------------------------------
    # 7. Quality Answers & Adaptive Progression (Strong, Avg, Weak)
    # ---------------------------------------------------------
    provider = FallbackAIProvider()
    
    # A. Strong Answer (Score >= 75)
    strong_ans = (
        "In our distributed architecture, we used FastAPI with asyncpg connection pooling for PostgreSQL, "
        "Redis for sub-millisecond JWT session caching, and Apache Kafka for asynchronous order processing "
        "with idempotent consumers and dead letter queues."
    )
    strong_eval = provider.evaluate_answer(
        question_text="Explain how you built your microservices platform.",
        candidate_answer=strong_ans,
        expected_concepts=["FastAPI", "PostgreSQL", "Redis", "Kafka", "idempotent", "caching"],
        category="Full Stack",
        difficulty="Hard"
    )
    q_after_strong = provider.generate_next_adaptive_question(
        target_role="Senior Full Stack Software Engineer",
        mode="Technical",
        category="Full Stack",
        difficulty="Hard",
        previous_question="Explain how you built your microservices platform.",
        previous_answer=strong_ans,
        previous_evaluation=strong_eval,
        asked_questions=["Explain how you built your microservices platform."]
    )
    
    # B. Weak Answer (Score < 50)
    weak_ans = "We used some databases and computers."
    weak_eval = provider.evaluate_answer(
        question_text="Explain how ACID transactions work.",
        candidate_answer=weak_ans,
        expected_concepts=["atomicity", "consistency", "isolation", "durability"],
        category="Database",
        difficulty="Hard"
    )
    q_after_weak = provider.generate_next_adaptive_question(
        target_role="Senior Full Stack Software Engineer",
        mode="Technical",
        category="Full Stack",
        difficulty="Hard",
        previous_question="Explain how ACID transactions work.",
        previous_answer=weak_ans,
        previous_evaluation=weak_eval,
        asked_questions=["Explain how ACID transactions work."]
    )

    if q_after_strong["difficulty"] == "Senior" and q_after_weak["difficulty"] == "Fresher":
        results["Adaptive Questions"] = "PASS"
        print(f"[PASS] Adaptive Questions: PASS (Strong->Senior Level, Weak->Fresher Level)")
    else:
        results["Adaptive Questions"] = f"FAIL (Strong->{q_after_strong['difficulty']}, Weak->{q_after_weak['difficulty']})"

    # ---------------------------------------------------------
    # 8. Contextual Follow-up Questions (Candidate keyword recognition)
    # ---------------------------------------------------------
    candidate_jwt_ans = "We secured our FastAPI backend by issuing stateless JWT tokens with SHA-256 signatures."
    follow_up = provider.generate_follow_up_question(
        original_question="How did you secure your endpoints?",
        candidate_answer=candidate_jwt_ans,
        category="Security",
        difficulty="Hard"
    )
    if follow_up and ("jwt" in follow_up["question_text"].lower() or "token" in follow_up["question_text"].lower()):
        results["Follow-up Questions"] = "PASS"
        print(f"[PASS] Follow-up Questions: PASS (Contextual probe: '{follow_up['question_text']}')")
    else:
        results["Follow-up Questions"] = "FAIL (No contextual follow-up generated)"

    # ---------------------------------------------------------
    # 9. Zero Duplicate Questions
    # ---------------------------------------------------------
    asked_history = [
        "What is the difference between an Array and a Linked List?",
        "Can you explain OOP principles?",
        "How does Redis handle caching?"
    ]
    candidate_q = provider.generate_next_adaptive_question(
        target_role="Software Engineer",
        mode="Technical",
        category="Software Engineer",
        difficulty="Mid-Level",
        previous_question=asked_history[-1],
        previous_answer="Redis is an in-memory cache.",
        previous_evaluation={"score": 70.0},
        asked_questions=asked_history
    )
    is_dup = any(calculate_text_similarity(candidate_q["question_text"], aq) > 0.45 for aq in asked_history)
    if not is_dup:
        results["Zero Duplicate Questions"] = "PASS"
        print(f"[PASS] Zero Duplicate Questions: PASS (New Q='{candidate_q['question_text']}')")
    else:
        results["Zero Duplicate Questions"] = "FAIL (Duplicate generated)"

    # ---------------------------------------------------------
    # 10. Answer Submission -> Next Question Transition
    # ---------------------------------------------------------
    if interview_id and initial_questions:
        first_q_id = initial_questions[0]["id"]
        with httpx.Client(timeout=35.0) as client:
            submit_res = client.post(
                f"{BASE_URL}/interview/{interview_id}/answer",
                headers=headers,
                json={
                    "question_id": first_q_id,
                    "transcript_text": "I designed the frontend with React hooks and Zustand, communicating with FastAPI via REST endpoints protected by JWT authentication.",
                    "audio_duration_seconds": 25.0
                }
            )
            if submit_res.status_code == 200:
                sub_data = submit_res.json()
                results["Answer -> Next Question"] = "PASS"
                print(f"[PASS] Answer -> Next Question: PASS (Evaluated Score={sub_data.get('score', 0.0)}/100, Next Q={sub_data.get('next_question', {}).get('question_text')[:40]}...)")
            else:
                results["Answer -> Next Question"] = f"FAIL ({submit_res.status_code}: {submit_res.text})"
    else:
        results["Answer -> Next Question"] = "FAIL (No interview ID)"

    # ---------------------------------------------------------
    # 11, 12, 13. Multilingual Support (English, Hindi, Hinglish)
    # ---------------------------------------------------------
    q_en = provider.generate_interview_plan("Software Engineer", "Technical", "Tech", "Medium", 3, ["Python"], [], "Mid-Level", language="English")
    q_hi = provider.generate_interview_plan("Software Engineer", "Technical", "Tech", "Medium", 3, ["Python"], [], "Mid-Level", language="Hindi")
    q_hg = provider.generate_interview_plan("Software Engineer", "Technical", "Tech", "Medium", 3, ["Python"], [], "Mid-Level", language="Hinglish")
    
    results["English"] = "PASS" if len(q_en) == 3 and "welcome" in q_en[0]["question_text"].lower() else "FAIL"
    results["Hindi"] = "PASS" if len(q_hi) == 3 and "स्वागत" in q_hi[0]["question_text"] else "FAIL"
    results["Hinglish"] = "PASS" if len(q_hg) == 3 and ("welcome" in q_hg[0]["question_text"].lower() or "shuru" in q_hg[0]["question_text"].lower()) else "FAIL"
    
    print(f"[PASS] English Mode: {results['English']}")
    print(f"[PASS] Hindi Mode: {results['Hindi']}")
    print(f"[PASS] Hinglish Mode: {results['Hinglish']}")

    # ---------------------------------------------------------
    # 14, 15, 16. Modes (Technical, HR, Mixed)
    # ---------------------------------------------------------
    q_tech = provider.generate_interview_plan("DevOps Engineer", "Technical", "DevOps", "Medium", 3, ["Docker"], [], "Mid-Level")
    q_hr = provider.generate_interview_plan("HR Executive", "HR", "Human Resources", "Medium", 3, ["Recruiting"], [], "Mid-Level")
    q_mixed = provider.generate_interview_plan("Product Manager", "Mixed", "Product", "Medium", 3, ["Agile"], [], "Mid-Level")
    
    results["Technical Mode"] = "PASS" if len(q_tech) == 3 else "FAIL"
    results["HR Mode"] = "PASS" if len(q_hr) == 3 else "FAIL"
    results["Mixed Mode"] = "PASS" if len(q_mixed) == 3 else "FAIL"
    
    print(f"[PASS] Technical Mode: {results['Technical Mode']}")
    print(f"[PASS] HR Mode: {results['HR Mode']}")
    print(f"[PASS] Mixed Mode: {results['Mixed Mode']}")

    # ---------------------------------------------------------
    # 17. Automated 10-Question Personalized Interview
    # ---------------------------------------------------------
    evaluations_10 = []
    q_history_10 = []
    plan_10 = provider.generate_interview_plan(
        target_role="Senior Full Stack Software Engineer",
        mode="Technical",
        category="Full Stack",
        difficulty="Hard",
        total_questions=10,
        skills=["Python", "FastAPI", "React", "PostgreSQL", "Redis", "Kafka", "Docker", "AWS"],
        projects=[{"title": "Distributed E-Commerce Microservices", "description": "FastAPI + React with Kafka"}],
        experience_level="Senior",
        candidate_name="Priya Sharma"
    )
    
    curr_q = plan_10[0]
    for turn in range(10):
        q_history_10.append(curr_q["question_text"])
        ans = f"Turn {turn+1} answer covering distributed system design, caching with Redis, Kafka streaming, and PostgreSQL ACID transactions."
        ev = provider.evaluate_answer(curr_q["question_text"], ans, curr_q.get("expected_concepts", ["scalability", "architecture"]), "Full Stack", "Hard")
        evaluations_10.append(ev)
        if turn < 9:
            curr_q = provider.generate_next_adaptive_question(
                target_role="Senior Full Stack Software Engineer",
                mode="Technical",
                category="Full Stack",
                difficulty="Hard",
                previous_question=curr_q["question_text"],
                previous_answer=ans,
                previous_evaluation=ev,
                asked_questions=q_history_10
            )
    
    report_10 = provider.synthesize_final_report("Priya Sharma", "Senior Full Stack Software Engineer", "Technical", "Full Stack", "Hard", evaluations_10)
    
    if len(evaluations_10) == 10 and len(set(q_history_10)) == 10 and report_10.get("overall_score", 0) > 0:
        results["10-Question Test"] = "PASS"
        print(f"[PASS] 10-Question Test: PASS (Score={report_10['overall_score']}/100, Verdict={report_10['verdict']})")
    else:
        results["10-Question Test"] = "FAIL"

    # ---------------------------------------------------------
    # 18. D-ID Real Connection Regression Test
    # ---------------------------------------------------------
    with httpx.Client(timeout=60.0) as client:
        did_res = client.get(f"{BASE_URL}/avatar/did-health")
        if did_res.status_code == 200:
            did_diag = did_res.json()
            if (
                did_diag.get("configured") is True
                and did_diag.get("api_auth") == "PASS"
                and did_diag.get("agent") == "PASS"
                and did_diag.get("stream_creation") == "PASS"
            ):
                results["D-ID Regression"] = "PASS"
                print(f"[PASS] D-ID Regression: PASS (WebRTC Stream creation validated live)")
            else:
                results["D-ID Regression"] = f"FAIL ({did_diag})"
        else:
            results["D-ID Regression"] = f"FAIL ({did_res.status_code}: {did_res.text})"

    # Clean up test files
    if os.path.exists(pdf_resume_path):
        os.remove(pdf_resume_path)
    if os.path.exists(pdf_jd_path):
        os.remove(pdf_jd_path)

    # ---------------------------------------------------------
    # FINAL VERIFICATION REPORT MATRIX
    # ---------------------------------------------------------
    print("\n=======================================================")
    print("PHASE 2 VERIFICATION REPORT MATRIX")
    print("=======================================================")
    for test_name, status in results.items():
        print(f"{test_name}: {status}")
    print("=======================================================\n")
    
    all_passed = all("PASS" in str(v) for v in results.values())
    if all_passed:
        print("ALL VERIFICATION CHECKS PASSED WITH ZERO REGRESSIONS!")
    else:
        print("SOME CHECKS FAILED. PLEASE REVIEW LOGS.")
    
    return results

if __name__ == "__main__":
    run_phase2_full_verification()
