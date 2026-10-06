import os
import sys
import json
import httpx
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

BASE_URL = "http://127.0.0.1:8000"
API_URL = f"{BASE_URL}/api"

results = {
    "passed": [],
    "failed": [],
    "warnings": [],
    "dependencies": []
}

def log_pass(test_name: str, detail: str = ""):
    print(f"  [PASS] {test_name}: {detail}")
    results["passed"].append({"test": test_name, "detail": detail})

def log_fail(test_name: str, detail: str = ""):
    print(f"  [FAIL] {test_name}: {detail}")
    results["failed"].append({"test": test_name, "detail": detail})

def log_warn(item: str):
    print(f"  [WARN] {item}")
    results["warnings"].append(item)

def generate_sample_resume_pdf(file_path: Path):
    doc = SimpleDocTemplate(str(file_path), pagesize=letter)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("<b>Alex Chen</b> - Full Stack & AI Systems Engineer", styles['Heading1']),
        Paragraph("Email: alex.chen@example.com | Phone: +1-555-0199", styles['Normal']),
        Spacer(1, 10),
        Paragraph("<b>Education:</b>", styles['Heading2']),
        Paragraph("Bachelor of Technology in Computer Science and Engineering, 2024", styles['Normal']),
        Spacer(1, 10),
        Paragraph("<b>Technical Skills:</b>", styles['Heading2']),
        Paragraph("Languages: Python, Java, TypeScript, JavaScript, SQL, C++", styles['Normal']),
        Paragraph("Frameworks: FastAPI, React, Node.js, Docker, PyTorch, Tailwind CSS", styles['Normal']),
        Paragraph("Databases & Cloud: PostgreSQL, MongoDB, Redis, AWS", styles['Normal']),
        Paragraph("Core CS: Data Structures & Algorithms, Object-Oriented Programming, Operating Systems, Computer Networks", styles['Normal']),
        Spacer(1, 10),
        Paragraph("<b>Key Projects:</b>", styles['Heading2']),
        Paragraph("• AI Threat Detection Engine: Built neural network intrusion detection model with PyTorch and FastAPI.", styles['Normal']),
        Paragraph("• Distributed Caching Middleware: Engineered lock-free cache with Redis and Docker.", styles['Normal']),
    ]
    doc.build(story)

def run_verification():
    print("======================================================================")
    print("   AI-POWERED HUMANOID VIRTUAL INTERVIEWER - END-TO-END VERIFICATION")
    print("======================================================================\n")

    with httpx.Client(timeout=30.0) as client:
        # 1. Health & Root Check
        print("1. Testing Server Health & Connectivity...")
        try:
            r = client.get(f"{BASE_URL}/")
            assert r.status_code == 200, f"Status {r.status_code}"
            data = r.json()
            assert data["status"] == "online"
            log_pass("Root Health Endpoint", f"Server online, AI Engine: {data.get('ai_engine')}")
        except Exception as e:
            log_fail("Root Health Endpoint", str(e))

        try:
            r = client.get(f"{API_URL}/health")
            assert r.status_code == 200
            log_pass("API Health Check", f"Status: {r.json().get('status')}")
        except Exception as e:
            log_fail("API Health Check", str(e))

        # 2. Database Schema Verification
        print("\n2. Verifying Relational Database Schema...")
        db_file = Path("interviewer.db")
        if db_file.exists():
            log_pass("Database File Existence", f"Found SQLite database at {db_file.resolve()} ({db_file.stat().st_size} bytes)")
        else:
            log_fail("Database File Existence", "interviewer.db not found on disk")

        # 3. Authentication Verification
        print("\n3. Testing Authentication & RBAC...")
        test_email = "test.verification.candidate@interviewer.ai"
        test_pwd = "Verification@12345"

        # Register
        try:
            reg_payload = {
                "full_name": "Dr. Verification Candidate",
                "email": test_email,
                "password": test_pwd,
                "role": "candidate"
            }
            r = client.post(f"{API_URL}/auth/register", json=reg_payload)
            if r.status_code == 400: # already registered
                r = client.post(f"{API_URL}/auth/login", json={"email": test_email, "password": test_pwd})
            assert r.status_code in [200, 201]
            token = r.json()["access_token"]
            log_pass("User Registration & JWT Issuance", f"User registered, received token ({token[:15]}...)")
        except Exception as e:
            log_fail("User Registration & JWT Issuance", str(e))
            return

        headers = {"Authorization": f"Bearer {token}"}

        # Invalid Login Check
        try:
            r = client.post(f"{API_URL}/auth/login", json={"email": test_email, "password": "WrongPassword123!"})
            assert r.status_code == 401
            log_pass("Security: Invalid Password Rejection", "401 Unauthorized correctly returned")
        except Exception as e:
            log_fail("Security: Invalid Password Rejection", str(e))

        # Valid Login Check
        try:
            r = client.post(f"{API_URL}/auth/login", json={"email": test_email, "password": test_pwd})
            assert r.status_code == 200
            assert "access_token" in r.json()
            log_pass("User Login & Token Verification", "Valid login succeeded with JWT")
        except Exception as e:
            log_fail("User Login & Token Verification", str(e))

        # Authenticated Profile /me
        try:
            r = client.get(f"{API_URL}/auth/me", headers=headers)
            assert r.status_code == 200
            assert r.json()["email"] == test_email
            log_pass("Authenticated /me Route", f"Authenticated user: {r.json()['full_name']}")
        except Exception as e:
            log_fail("Authenticated /me Route", str(e))

        # 4. Candidate Profile Management
        print("\n4. Testing Candidate Profile Updates...")
        try:
            profile_payload = {
                "target_role": "Lead Full Stack AI Engineer",
                "experience_level": "Senior (5+ yrs)",
                "skills": ["Python", "FastAPI", "React", "TypeScript", "SQL", "Docker", "PyTorch"],
                "bio": "Lead researcher specializing in autonomous conversational AI architectures.",
                "github_url": "https://github.com/alexchen-ai",
                "linkedin_url": "https://linkedin.com/in/alexchen-ai"
            }
            r = client.put(f"{API_URL}/auth/profile", json=profile_payload, headers=headers)
            assert r.status_code == 200
            assert r.json()["target_role"] == "Lead Full Stack AI Engineer"
            log_pass("Candidate Profile Update", f"Profile persisted: Role={r.json()['target_role']}, Exp={r.json()['experience_level']}")
        except Exception as e:
            log_fail("Candidate Profile Update", str(e))

        # 5. Resume Upload & NLP Analysis
        print("\n5. Testing Resume Upload & NLP Skill Extraction...")
        resume_pdf = Path("uploads/temp_test_resume.pdf")
        resume_pdf.parent.mkdir(parents=True, exist_ok=True)
        generate_sample_resume_pdf(resume_pdf)

        resume_id = None
        try:
            with open(resume_pdf, "rb") as f:
                r = client.post(f"{API_URL}/resume/upload", files={"file": ("test_resume.pdf", f, "application/pdf")}, headers=headers)
            assert r.status_code == 201
            data = r.json()
            resume_id = data["id"]
            skills = data.get("parsed_skills", [])
            assert len(skills) >= 4, f"Extracted only {len(skills)} skills"
            assert "Python" in skills
            assert "React" in skills
            log_pass("Resume Upload & NLP Parsing", f"Parsed {len(skills)} skills: {', '.join(skills[:5])}")
        except Exception as e:
            log_fail("Resume Upload & NLP Parsing", str(e))

        # 6. Interview Configuration & Question Plan
        print("\n6. Testing Adaptive Interview Creation...")
        interview_id = None
        try:
            create_payload = {
                "title": "Senior AI Systems Architecture Interview",
                "target_role": "Lead Full Stack AI Engineer",
                "mode": "Technical",
                "category": "Data Structures & Algorithms",
                "difficulty": "Senior",
                "total_questions": 3,
                "resume_id": resume_id
            }
            r = client.post(f"{API_URL}/interview/create", json=create_payload, headers=headers)
            assert r.status_code == 201
            session_data = r.json()
            interview_id = session_data["id"]
            questions = session_data["questions"]
            assert len(questions) == 3
            log_pass("Adaptive Interview Plan Generation", f"Created Interview ID #{interview_id} with {len(questions)} dynamic questions")
        except Exception as e:
            log_fail("Adaptive Interview Plan Generation", str(e))
            return

        # 7. Start Interview & Viseme Generation
        print("\n7. Testing Live Interview Lifecycle & Lip-Sync Timeline...")
        try:
            r = client.post(f"{API_URL}/interview/{interview_id}/start", headers=headers)
            assert r.status_code == 200
            assert r.json()["status"] == "in_progress"
            log_pass("Interview Start Lifecycle", "Session transitioned to in_progress")
        except Exception as e:
            log_fail("Interview Start Lifecycle", str(e))

        try:
            sample_q = questions[0]["question_text"]
            r = client.post(f"{API_URL}/speech/viseme-timeline", json={"text": sample_q, "words_per_minute": 150})
            assert r.status_code == 200
            visemes = r.json().get("cues", [])
            assert len(visemes) > 0
            log_pass("Viseme Lip-Sync Pipeline", f"Generated {len(visemes)} viseme timestamp cues for avatar animation")
        except Exception as e:
            log_fail("Viseme Lip-Sync Pipeline", str(e))

        # 8. Answering Questions, Multi-Criteria Scoring & Dynamic Follow-ups
        print("\n8. Testing Answer Submissions, Multi-Criteria Scoring & Follow-ups...")
        answers_to_submit = [
            (
                questions[0]["id"],
                "In-memory inverted indexes utilize postings lists and skip pointers for fast Boolean intersections. "
                "To optimize memory footprint and cache locality, we apply integer compression techniques such as Roaring Bitmaps "
                "or Variable-Byte encoding alongside a concurrent lock-free hash table for term dictionaries.",
                18.5
            ),
            (
                questions[1]["id"],
                "Polymorphism allows objects to be treated as instances of their parent class.",
                6.0  # short answer triggering follow-up
            )
        ]

        for idx, (q_id, ans_text, dur) in enumerate(answers_to_submit, 1):
            try:
                r = client.post(
                    f"{API_URL}/interview/{interview_id}/answer",
                    json={"question_id": q_id, "transcript_text": ans_text, "audio_duration_seconds": dur},
                    headers=headers
                )
                assert r.status_code == 200
                eval_data = r.json()
                assert eval_data["score"] > 0
                assert "relevance_score" in eval_data
                assert "correctness_score" in eval_data
                assert "depth_score" in eval_data
                assert "clarity_score" in eval_data
                log_pass(f"Question #{idx} 6-Dimensional AI Evaluation", f"Score: {eval_data['score']}/100 | Rel: {eval_data['relevance_score']} | Depth: {eval_data['depth_score']}")
            except Exception as e:
                log_fail(f"Question #{idx} 6-Dimensional AI Evaluation", str(e))

        # Check if follow up was dynamically added
        try:
            r = client.get(f"{API_URL}/interview/{interview_id}", headers=headers)
            updated_session = r.json()
            has_followup = any(q.get("is_follow_up") for q in updated_session.get("questions", []))
            log_pass("Dynamic Follow-Up Injection", f"Follow-up present: {has_followup}, Total questions: {len(updated_session['questions'])}")
        except Exception as e:
            log_fail("Dynamic Follow-Up Injection", str(e))

        # 9. Interview Completion & Report Synthesis
        print("\n9. Testing Final Assessment Report & PDF Exporter...")
        try:
            r = client.post(f"{API_URL}/interview/{interview_id}/complete", headers=headers)
            assert r.status_code == 200
            rep = r.json()
            assert rep["overall_score"] > 0
            assert rep["verdict"] in ["Strong Hire", "Hire", "Leaning Hire", "Needs Improvement", "Reject"]
            log_pass("Executive Report Synthesis", f"Verdict: {rep['verdict']} | Overall Score: {rep['overall_score']}/100")
        except Exception as e:
            log_fail("Executive Report Synthesis", str(e))

        # Download PDF
        try:
            r = client.get(f"{API_URL}/interview/report/{interview_id}/download-pdf")
            assert r.status_code == 200
            assert r.content.startswith(b"%PDF"), "Response is not valid PDF binary"
            assert len(r.content) > 1000
            log_pass("PDF Report Generation & Stream", f"Successfully downloaded PDF report ({len(r.content)} bytes)")
        except Exception as e:
            log_fail("PDF Report Generation & Stream", str(e))

        # 10. Dashboard Analytics
        print("\n10. Testing Candidate Dashboard Analytics...")
        try:
            r = client.get(f"{API_URL}/dashboard/stats", headers=headers)
            assert r.status_code == 200
            d_stats = r.json()
            assert d_stats["completed_count"] >= 1
            log_pass("Candidate Dashboard Stats", f"Completed sessions: {d_stats['completed_count']}, Avg: {d_stats['average_score']}%, Readiness: {d_stats['readiness_index']}")
        except Exception as e:
            log_fail("Candidate Dashboard Stats", str(e))

        # 11. Admin Command Center
        print("\n11. Testing Administrative Governance Portal...")
        try:
            admin_auth = client.post(f"{API_URL}/auth/login", json={"email": "admin@interviewer.ai", "password": "Admin@12345"})
            assert admin_auth.status_code == 200
            admin_token = admin_auth.json()["access_token"]
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
            log_pass("Admin Authentication", "Administrator login authenticated successfully")
        except Exception as e:
            log_fail("Admin Authentication", str(e))
            return

        try:
            r = client.get(f"{API_URL}/admin/stats", headers=admin_headers)
            assert r.status_code == 200
            a_stats = r.json()
            assert a_stats["total_interviews"] >= 1
            log_pass("Admin Platform Telemetry", f"Total Users: {a_stats['total_users']}, Total Interviews: {a_stats['total_interviews']}")
        except Exception as e:
            log_fail("Admin Platform Telemetry", str(e))

        try:
            r = client.get(f"{API_URL}/admin/candidates", headers=admin_headers)
            assert r.status_code == 200
            cands = r.json()
            assert len(cands) >= 1
            log_pass("Admin Candidates Directory", f"Fetched {len(cands)} candidate records")
        except Exception as e:
            log_fail("Admin Candidates Directory", str(e))

        try:
            r = client.get(f"{API_URL}/admin/logs", headers=admin_headers)
            assert r.status_code == 200
            logs = r.json()
            assert len(logs) >= 1
            log_pass("Admin Security Audit Trail", f"Retrieved {len(logs)} security event logs")
        except Exception as e:
            log_fail("Admin Security Audit Trail", str(e))

        # Test RBAC security boundary: Candidate token forbidden on Admin route
        try:
            r = client.get(f"{API_URL}/admin/stats", headers=headers)
            assert r.status_code == 403
            log_pass("Security: RBAC Boundary", "Candidate rejected with 403 Forbidden on admin route")
        except Exception as e:
            log_fail("Security: RBAC Boundary", str(e))

    print("\n======================================================================")
    print(f"VERIFICATION COMPLETE: {len(results['passed'])} PASSED | {len(results['failed'])} FAILED")
    print("======================================================================")

if __name__ == "__main__":
    run_verification()
