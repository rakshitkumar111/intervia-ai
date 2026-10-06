import os
import sys
import time
import json
import requests

BACKEND_URL = "http://127.0.0.1:8000/api"
FRONTEND_URL = "http://localhost:5174"

def print_step(title):
    print("\n" + "=" * 65)
    print(f"  {title}")
    print("=" * 65)

def run_e2e_simulation():
    print("\n--- Starting End-to-End Live Platform Flow Simulation ---")
    print(f"Backend Target: {BACKEND_URL}")
    print(f"Frontend Target: {FRONTEND_URL}")

    # Step 0: Check Frontend availability
    print_step("STEP 0: Frontend & Backend Health Check")
    fe_resp = requests.get(FRONTEND_URL)
    assert fe_resp.status_code == 200, f"Frontend down: {fe_resp.status_code}"
    print(f" [PASSED] Frontend reachable at {FRONTEND_URL} (HTTP {fe_resp.status_code})")

    docs_resp = requests.get("http://127.0.0.1:8000/docs")
    assert docs_resp.status_code == 200, f"Backend down: {docs_resp.status_code}"
    print(f" [PASSED] Backend OpenAPI Docs reachable at http://127.0.0.1:8000/docs (HTTP {docs_resp.status_code})")

    # Step 1: Authentication
    print_step("STEP 1: Candidate Authentication")
    login_payload = {
        "email": "candidate@interviewer.ai",
        "password": "Password@123"
    }
    auth_resp = requests.post(f"{BACKEND_URL}/auth/login", json=login_payload)
    if auth_resp.status_code != 200:
        login_payload = {
            "email": "admin@interviewer.ai",
            "password": "Admin@12345"
        }
        auth_resp = requests.post(f"{BACKEND_URL}/auth/login", json=login_payload)

    assert auth_resp.status_code == 200, f"Login failed: {auth_resp.text}"
    token_data = auth_resp.json()
    token = token_data["access_token"]
    user_info = token_data.get("user", {})
    headers = {"Authorization": f"Bearer {token}"}
    print(f" [PASSED] Authenticated as: {user_info.get('full_name')} ({user_info.get('email')})")

    # Step 2: JD & Skill Matching
    print_step("STEP 2: Job Description Analysis & 4-Way Matching")
    jd_payload = {
        "job_title": "Senior AI Systems Engineer",
        "job_description": "Looking for a Senior AI Systems Engineer with proficiency in Python, FastAPI, Docker, Kubernetes, PostgreSQL, Redis caching, and Large Language Models orchestration."
    }
    jd_resp = requests.post(f"{BACKEND_URL}/interview/analyze-jd", json=jd_payload, headers=headers)
    assert jd_resp.status_code == 200, f"JD analysis failed: {jd_resp.text}"
    jd_analysis = jd_resp.json()
    print(f" [PASSED] Extracted Required Skills: {len(jd_analysis.get('required_skills', []))} skills found")
    print(f"   Skills: {', '.join(jd_analysis.get('required_skills', [])[:6])}...")

    # Step 3: Interview Creation with Adaptive Plan
    print_step("STEP 3: Interview Session Creation & Question Generation")
    interview_payload = {
        "target_role": "Senior AI Systems Engineer",
        "mode": "Technical",
        "category": "Distributed AI Infrastructure",
        "difficulty": "Hard",
        "total_questions": 3,
        "language": "English",
        "experience_level": "Senior",
        "focus_skills": ["Python", "FastAPI", "Kubernetes", "Redis", "LLMs"]
    }
    create_resp = requests.post(f"{BACKEND_URL}/interview/create", json=interview_payload, headers=headers)
    assert create_resp.status_code == 201, f"Interview creation failed: {create_resp.text}"
    interview_data = create_resp.json()
    interview_id = interview_data["id"]
    print(f" [PASSED] Interview Session #{interview_id} created successfully!")
    print(f"   Title: {interview_data['title']}")
    print(f"   Total Questions: {interview_data['total_questions']}")
    assert len(interview_data["questions"]) > 0
    q1 = interview_data["questions"][0]
    print(f"   Q1: {q1['question_text'][:80]}...")

    # Step 4: Live Answer Submission with Speech Telemetry
    print_step("STEP 4: Candidate Answer Submission with Speech Telemetry")
    answer_payload = {
        "question_id": q1["id"],
        "transcript_text": "In our distributed AI serving architecture, we deploy FastAPI inference workers on Kubernetes with autoscaling based on GPU utilization. We use Redis for caching frequent embeddings and Celery for asynchronous batching.",
        "audio_duration_seconds": 38.5,
        "speaking_pace_wpm": 135.0,
        "filler_word_count": 1
    }
    ans_resp = requests.post(f"{BACKEND_URL}/interview/{interview_id}/answer", json=answer_payload, headers=headers)
    assert ans_resp.status_code == 200, f"Answer submission failed: {ans_resp.text}"
    eval_data = ans_resp.json()
    print(f" [PASSED] 8-Dimensional Evaluation Result:")
    print(f"   Score: {eval_data.get('score')}/100")
    print(f"   Technical Score: {eval_data.get('technical_score')}/10")
    print(f"   Communication Score: {eval_data.get('communication_score')}/10")
    print(f"   Telemetry WPM: {eval_data.get('speaking_pace_wpm')} WPM")
    print(f"   Feedback: {eval_data.get('feedback', '')[:100]}...")

    # Step 5: Live Code Sandbox & Multi-Language Runner
    print_step("STEP 5: Code Sandbox Execution (Step 1 Module)")
    code_payload = {
        "language": "python",
        "code": "def two_sum(nums, target):\n    lookup = {}\n    for i, n in enumerate(nums):\n        if target - n in lookup:\n            return [lookup[target - n], i]\n        lookup[n] = i\n    return []\n\nimport json, sys\nprint(json.dumps(two_sum([2, 7, 11, 15], 9)))",
        "problem_id": "two-sum"
    }
    code_resp = requests.post(f"{BACKEND_URL}/coding/run", json=code_payload, headers=headers)
    assert code_resp.status_code == 200, f"Code runner failed: {code_resp.text}"
    code_data = code_resp.json()
    print(f" [PASSED] Python Code Executed in Sandbox:")
    print(f"   Success: {code_data.get('success')}")
    print(f"   Execution Time: {code_data.get('execution_time_ms')} ms")
    print(f"   Output: {code_data.get('stdout', '').strip()}")

    # Step 6: System Design Architecture Whiteboard
    print_step("STEP 6: System Design Topology Evaluation (Step 4 Module)")
    arch_payload = {
        "interview_id": interview_id,
        "diagram": {
            "title": "Design TinyURL URL Shortener",
            "nodes": [
                {"id": "c1", "type": "client", "label": "Web/Mobile Clients"},
                {"id": "lb1", "type": "load_balancer", "label": "NGINX Load Balancer"},
                {"id": "api1", "type": "service", "label": "URL Shortener API Service"},
                {"id": "cache1", "type": "cache", "label": "Redis Cache Cluster"},
                {"id": "db1", "type": "database", "label": "PostgreSQL Sharded Database"}
            ],
            "edges": [
                {"id": "e1", "source": "c1", "target": "lb1", "protocol": "HTTPS"},
                {"id": "e2", "source": "lb1", "target": "api1", "protocol": "HTTP/2"},
                {"id": "e3", "source": "api1", "target": "cache1", "protocol": "TCP"},
                {"id": "e4", "source": "api1", "target": "db1", "protocol": "SQL"}
            ]
        }
    }
    arch_resp = requests.post(f"{BACKEND_URL}/architecture/evaluate", json=arch_payload, headers=headers)
    assert arch_resp.status_code == 200, f"Architecture evaluation failed: {arch_resp.text}"
    arch_data = arch_resp.json()
    print(f" [PASSED] Architecture Review Result:")
    print(f"   Overall Score: {arch_data.get('overall_score')}/100")
    print(f"   Scalability: {arch_data.get('scalability_score')}/10")
    print(f"   Reliability: {arch_data.get('reliability_score')}/10")
    print(f"   SPOF Risks Found: {len(arch_data.get('single_points_of_failure', []))}")

    # Step 7: Anti-Cheating Integrity Proctoring
    print_step("STEP 7: AI Integrity Proctoring Event (Step 2 Module)")
    integrity_payload = {
        "event_type": "GAZE_DEVIATION",
        "details": {"gaze": "LOOKING_RIGHT", "duration_seconds": 3.2, "trust_score": 92.5}
    }
    proctor_resp = requests.post(f"{BACKEND_URL}/interview/{interview_id}/integrity-event", json=integrity_payload, headers=headers)
    assert proctor_resp.status_code == 201, f"Integrity log failed: {proctor_resp.text}"
    print(f" [PASSED] Integrity telemetry event registered: {proctor_resp.json().get('event_type')}")

    # Step 8: Recruiter & HR Operations Portal
    print_step("STEP 8: Recruiter Invite, Join, Leaderboard & Replay (Step 5 Module)")
    invite_payload = {
        "candidate_name": "Karan Malhotra",
        "candidate_email": "karan.malhotra@example.com",
        "target_role": "Staff Backend Engineer",
        "domain": "Technology",
        "experience_level": "Senior",
        "mode": "Technical",
        "difficulty": "Hard",
        "language": "English",
        "total_questions": 3,
        "expires_in_days": 7
    }
    rec_invite_resp = requests.post(f"{BACKEND_URL}/recruiter/invites", json=invite_payload, headers=headers)
    assert rec_invite_resp.status_code == 201, f"Recruiter invite failed: {rec_invite_resp.text}"
    invite_obj = rec_invite_resp.json()
    invite_token = invite_obj["invite_token"]
    print(f" [PASSED] Generated Expirable Candidate Invite:")
    print(f"   Invite Token: {invite_token}")
    print(f"   Sharable URL: {FRONTEND_URL}/join/{invite_token}")

    # Test Candidate joining with token
    join_resp = requests.get(f"{BACKEND_URL}/recruiter/join/{invite_token}")
    assert join_resp.status_code == 200, f"Candidate join failed: {join_resp.text}"
    joined_data = join_resp.json()
    print(f" [PASSED] Candidate successfully validated token & launched session:")
    print(f"   Assigned Interview ID: {joined_data.get('interview_id')}")

    # Fetch Leaderboard
    lb_resp = requests.get(f"{BACKEND_URL}/recruiter/leaderboard", headers=headers)
    assert lb_resp.status_code == 200, f"Leaderboard fetch failed: {lb_resp.text}"
    lb_list = lb_resp.json()
    print(f" [PASSED] Recruiter Leaderboard retrieved: {len(lb_list)} evaluated candidates listed")

    # Audit Session Replay
    replay_resp = requests.get(f"{BACKEND_URL}/recruiter/replay/{interview_id}", headers=headers)
    assert replay_resp.status_code == 200, f"Replay fetch failed: {replay_resp.text}"
    replay_obj = replay_resp.json()
    print(f" [PASSED] Candidate Session Replay Audited:")
    print(f"   Candidate: {replay_obj.get('candidate_name')}")
    print(f"   Questions Audited: {len(replay_obj.get('answers'))}")

    print("\n" + "*" * 65)
    print("  COMPLETE END-TO-END FLOW VERIFIED WITH 100% SUCCESS!")
    print("*" * 65 + "\n")

if __name__ == "__main__":
    run_e2e_simulation()
