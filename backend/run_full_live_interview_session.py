import os
import json
import time
import httpx
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

BASE_URL = "http://127.0.0.1:8000"
API_URL = f"{BASE_URL}/api"

def generate_test_resume(path: Path):
    doc = SimpleDocTemplate(str(path), pagesize=letter)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("<b>Rahul Sharma</b> - Software Engineer", styles['Heading1']),
        Paragraph("Email: rahul.sharma@example.com | Bengaluru, India", styles['Normal']),
        Spacer(1, 10),
        Paragraph("<b>Education:</b>", styles['Heading2']),
        Paragraph("B.Tech in Computer Science & Engineering, 2024", styles['Normal']),
        Spacer(1, 10),
        Paragraph("<b>Core Competencies & Skills:</b>", styles['Heading2']),
        Paragraph("Languages: Python, Java, JavaScript, TypeScript, SQL, C++", styles['Normal']),
        Paragraph("Technologies & Frameworks: FastAPI, React, Node.js, Docker, Redis, PostgreSQL, Git", styles['Normal']),
        Paragraph("CS Fundamentals: Data Structures, Algorithms, DBMS, Operating Systems, Computer Networks", styles['Normal']),
        Spacer(1, 10),
        Paragraph("<b>Key Engineering Projects:</b>", styles['Heading2']),
        Paragraph("• Distributed In-Memory Cache: Engineered a distributed cache with LRU eviction and thread-safe lock mechanisms in Python.", styles['Normal']),
        Paragraph("• Real-time Collaboration Platform: Built WebSocket-driven collaborative editor with operational transformation algorithms.", styles['Normal']),
    ]
    doc.build(story)

def run_full_live_test():
    print("======================================================================")
    print("   COMPLETE REAL LIVE END-TO-END INTERVIEW TEST (GEMINI AI ENGINE)")
    print("======================================================================\n")

    with httpx.Client(timeout=45.0) as client:
        # Step 1: Health & Live AI Verification
        print("Step 1: Checking Backend & Live Gemini Status...")
        r = client.get(f"{API_URL}/health")
        assert r.status_code == 200, f"Health error: {r.text}"
        h_data = r.json()
        print("  - Backend Status:", h_data["status"])
        print("  - Active AI Provider:", h_data["ai_provider"])
        print("  - Telemetry:", h_data["ai_telemetry"])
        assert h_data["ai_telemetry"]["is_live_cloud_api"] is True
        assert h_data["ai_telemetry"]["fallback_status"] == "Standby"

        # Step 2: Register New Candidate
        print("\nStep 2: Registering Candidate Account...")
        email = f"rahul.test.{int(time.time())}@interviewer.ai"
        pwd = "Candidate@12345"
        reg_r = client.post(f"{API_URL}/auth/register", json={
            "full_name": "Rahul Sharma",
            "email": email,
            "password": pwd,
            "role": "candidate"
        })
        assert reg_r.status_code in [200, 201]
        token = reg_r.json()["access_token"]
        print(f"  - Registered & Authenticated: {email}")
        headers = {"Authorization": f"Bearer {token}"}

        # Step 3: Update Candidate Profile
        print("\nStep 3: Creating/Updating Candidate Profile...")
        prof_r = client.put(f"{API_URL}/auth/profile", json={
            "target_role": "Software Engineer",
            "experience_level": "Mid-Level (2-4 yrs)",
            "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Data Structures", "Docker"],
            "bio": "Software engineer with background in distributed backend systems and full-stack web applications.",
            "github_url": "https://github.com/rahulsharma-dev",
            "linkedin_url": "https://linkedin.com/in/rahulsharma-dev"
        }, headers=headers)
        assert prof_r.status_code == 200
        print("  - Profile updated for Software Engineer (Mid-Level)")

        # Step 4: Upload Resume & NLP Analysis
        print("\nStep 4: Uploading PDF Resume & Parsing with NLP...")
        resume_pdf = Path("uploads/temp_rahul_resume.pdf")
        resume_pdf.parent.mkdir(parents=True, exist_ok=True)
        generate_test_resume(resume_pdf)
        
        with open(resume_pdf, "rb") as f:
            upload_r = client.post(f"{API_URL}/resume/upload", files={"file": ("rahul_resume.pdf", f, "application/pdf")}, headers=headers)
        assert upload_r.status_code == 201
        resume_data = upload_r.json()
        resume_id = resume_data["id"]
        print(f"  - Resume #{resume_id} parsed. Skills extracted: {len(resume_data['parsed_skills'])} ({', '.join(resume_data['parsed_skills'][:5])})")

        # Step 5: Configure & Initialize Interview Session
        print("\nStep 5: Configuring & Generating Adaptive Questions with Live Gemini AI...")
        create_payload = {
            "title": "Software Engineer Technical & HR Interview",
            "target_role": "Software Engineer",
            "mode": "Mixed",
            "category": "Data Structures & Algorithms",
            "difficulty": "Mid-Level",
            "total_questions": 5,
            "resume_id": resume_id
        }
        t0 = time.time()
        create_r = client.post(f"{API_URL}/interview/create", json=create_payload, headers=headers)
        assert create_r.status_code == 201, f"Create interview failed: {create_r.text}"
        session_data = create_r.json()
        interview_id = session_data["id"]
        initial_questions = session_data["questions"]
        print(f"  - Session #{interview_id} created in {time.time()-t0:.2f}s with {len(initial_questions)} Gemini-generated questions:")
        for idx, q in enumerate(initial_questions, 1):
            print(f"    Q{idx}: [{q['question_type']}] {q['question_text'][:80]}...")

        # Step 6: Start Interview Session
        print(f"\nStep 6: Starting Live Interview Session #{interview_id}...")
        start_r = client.post(f"{API_URL}/interview/{interview_id}/start", headers=headers)
        assert start_r.status_code == 200
        assert start_r.json()["status"] == "in_progress"
        print("  - Interview status transitioned to: in_progress")

        # Step 7: Answer Questions & Evaluate with Live Gemini
        print("\nStep 7: Executing Real Turn-by-Turn Q&A with Live Gemini Evaluation...")
        
        sample_candidate_answers = [
            # Q1 (Technical DSA)
            "An array stores elements in contiguous memory locations, which gives us O(1) random access by index due to pointer arithmetic. "
            "However, insertions or deletions take O(n) because remaining elements must be shifted. "
            "In contrast, a linked list allocates nodes dynamically anywhere in the heap, connected by next and prev pointers. "
            "Insertion at known pointer position is O(1), but random access requires O(n) linear traversal.",
            
            # Q2 (Scenario / System - brief to test follow-up trigger)
            "I use a Hash Map and a Doubly Linked List to implement an LRU cache in O(1) time.",
            
            # Q3 (Behavioral / Conflict)
            "In my previous project, we had a disagreement regarding whether to use synchronous REST or asynchronous message queues for inter-service communication. "
            "I set up a benchmark testing latency and throughput under high load, presented the trade-off matrix to the team, and we collectively decided on RabbitMQ for decoupling.",
            
            # Q4 (Database / Indexing)
            "B-Trees and B+ Trees minimize expensive disk I/O operations by maintaining a high branching factor. "
            "In a B+ Tree, all data records are stored exclusively in the leaf nodes linked sequentially, which makes range scans and sequential scans significantly faster than standard BSTs.",
            
            # Q5 (HR / Leadership)
            "When prioritizing multiple tight deadlines, I use the Eisenhower Matrix to categorize tasks by urgency and business impact. "
            "I maintain open daily communication with stakeholders, manage expectations transparently, and automate repetitive tasks."
        ]

        # Dynamic loop through the interview questions
        current_step = 0
        while True:
            cur_session = client.get(f"{API_URL}/interview/{interview_id}", headers=headers).json()
            idx = cur_session["current_index"]
            all_qs = cur_session["questions"]
            
            if idx >= len(all_qs) or current_step >= len(sample_candidate_answers):
                break
                
            q = all_qs[idx]
            print(f"\n  --- Turn #{idx + 1}: [{q['question_type']}] ---")
            print(f"  [Interviewer]: \"{q['question_text']}\"")
            
            # Viseme calculation
            vis_r = client.post(f"{API_URL}/speech/viseme-timeline", json={"text": q["question_text"]})
            assert vis_r.status_code == 200
            print(f"  [Avatar Lip-Sync]: Generated {len(vis_r.json().get('cues', []))} phoneme visemes")

            ans_text = sample_candidate_answers[current_step % len(sample_candidate_answers)]
            print(f"  [Candidate Spoken]: \"{ans_text[:90]}...\"")

            # Submit answer to Gemini
            t_eval = time.time()
            ans_r = client.post(f"{API_URL}/interview/{interview_id}/answer", json={
                "question_id": q["id"],
                "transcript_text": ans_text,
                "audio_duration_seconds": 15.0
            }, headers=headers)
            assert ans_r.status_code == 200, f"Answer evaluation error: {ans_r.text}"
            eval_data = ans_r.json()
            
            print(f"  [Gemini Live Evaluation in {time.time()-t_eval:.2f}s]:")
            print(f"    - Composite Score: {eval_data['score']}/100")
            print(f"    - Relevance: {eval_data['relevance_score']} | Correctness: {eval_data['correctness_score']} | Depth: {eval_data['depth_score']}")
            print(f"    - Clarity: {eval_data['clarity_score']} | Completeness: {eval_data['completeness_score']} | Confidence: {eval_data['confidence_score']}")
            print(f"    - Feedback: {eval_data['feedback']}")

            current_step += 1

        # Check total questions after potential follow-ups
        final_session_state = client.get(f"{API_URL}/interview/{interview_id}", headers=headers).json()
        print(f"\n  Total Questions Processed: {len(final_session_state['questions'])}")

        # Step 8: Complete Interview & Synthesize Final Report
        print("\nStep 8: Finalizing Interview & Synthesizing Executive Assessment with Live Gemini...")
        t_rep = time.time()
        comp_r = client.post(f"{API_URL}/interview/{interview_id}/complete", headers=headers)
        assert comp_r.status_code == 200, f"Complete interview failed: {comp_r.text}"
        report = comp_r.json()
        
        print(f"  - Final Report Synthesized in {time.time()-t_rep:.2f}s:")
        print(f"    • Overall Assessment Score: {report['overall_score']}/100")
        print(f"    • Technical Depth: {report['technical_score']}% | Communication: {report['communication_score']}% | Problem Solving: {report['problem_solving_score']}%")
        print(f"    • Hiring Verdict: {report['verdict']}")
        print(f"    • Executive Summary: {report['executive_summary']}")
        print(f"    • Strengths: {', '.join(report['strengths'][:2])}")
        print(f"    • Recommendations: {', '.join(report['recommendations'][:2])}")

        # Step 9: Download Official PDF Assessment Report
        print("\nStep 9: Downloading Official Executive Assessment PDF Report...")
        pdf_r = client.get(f"{API_URL}/interview/report/{interview_id}/download-pdf")
        assert pdf_r.status_code == 200
        assert pdf_r.content.startswith(b"%PDF")
        print(f"  - Downloaded valid PDF assessment report ({len(pdf_r.content)} bytes)")

        # Step 10: Verify Candidate Dashboard Analytics & History
        print("\nStep 10: Verifying Dashboard Telemetry & Database Persistence...")
        d_r = client.get(f"{API_URL}/dashboard/stats", headers=headers)
        assert d_r.status_code == 200
        d_stats = d_r.json()
        print(f"  - Dashboard Completed Interviews: {d_stats['completed_count']}")
        print(f"  - Dashboard Average Score: {d_stats['average_score']}%")
        print(f"  - Candidate Readiness: {d_stats['readiness_index']}")

        rec_r = client.get(f"{API_URL}/dashboard/recent-interviews", headers=headers)
        assert rec_r.status_code == 200
        assert len(rec_r.json()) >= 1
        print(f"  - Interview history confirmed: Session #{rec_r.json()[0]['id']} recorded with score {rec_r.json()[0]['overall_score']}%")

        print("\n======================================================================")
        print("   COMPLETE LIVE INTERVIEW SESSION TEST PASSED (100% SUCCESS)")
        print("======================================================================")

if __name__ == "__main__":
    run_full_live_test()
