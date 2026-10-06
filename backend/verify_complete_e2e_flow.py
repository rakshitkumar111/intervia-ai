import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def run_e2e_verification():
    print("=" * 70)
    print("STARTING COMPLETE PRODUCTION END-TO-END VERIFICATION")
    print("=" * 70)

    # 1. Avatar status check
    print("\n[Step 1] Verifying Avatar Status & Supported Providers...")
    res = requests.get(f"{BASE_URL}/avatar/status")
    assert res.status_code == 200, f"Failed: {res.text}"
    status_data = res.json()
    print("Avatar Providers:", status_data["supported_providers"])
    assert "threejs-3d" in status_data["supported_providers"], "Missing threejs-3d"
    assert "d-id" in status_data["supported_providers"], "Missing d-id"
    print("[PASS] Avatar status contains all supported providers including 'threejs-3d'")

    # 2. DID Health check
    print("\n[Step 2] Verifying Live/Mock DID Health Check...")
    res = requests.get(f"{BASE_URL}/avatar/did-health")
    assert res.status_code == 200, f"Failed: {res.text}"
    health_data = res.json()
    print("DID Health Data:", json.dumps(health_data, indent=2))
    assert "configured" in health_data
    assert "api_auth" in health_data
    assert "allowed_domain" in health_data
    print("[PASS] DID Health Check correctly reflects configuration")

    # 3. Candidate Auth
    print("\n[Step 3] Candidate Registration & Authentication...")
    user_email = f"prod_e2e_candidate_{int(time.time())}@example.com"
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": user_email,
        "password": "Password123!",
        "full_name": "Rohan Sharma",
        "phone_number": "+919876543210"
    })
    assert reg_res.status_code in [200, 201], f"Auth failed: {reg_res.text}"
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Candidate authenticated, JWT token acquired")

    # 4. Setup Interview
    print("\n[Step 4] Setting up Universal AI Interview (Requested total_questions = 3)...")
    create_res = requests.post(f"{BASE_URL}/interview/create", headers=headers, json={
        "target_role": "Full Stack Engineer",
        "domain": "Technology",
        "difficulty": "Mid-Level",
        "mode": "Technical",
        "category": "Software Engineering",
        "total_questions": 3,
        "language": "English"
    })
    assert create_res.status_code == 201, f"Create interview failed: {create_res.text}"
    interview_data = create_res.json()
    interview_id = interview_data["id"]
    questions = interview_data["questions"]
    print(f"Interview ID: {interview_id}, Questions Returned: {len(questions)}")
    assert len(questions) == 3, f"Expected exactly 3 questions, got {len(questions)}"
    print("[PASS] Exactly the requested number of interview questions (3) returned")

    # 5. Start Interview
    print("\n[Step 5] Starting Interview Session...")
    start_res = requests.post(f"{BASE_URL}/interview/{interview_id}/start", headers=headers)
    assert start_res.status_code == 200, f"Start failed: {start_res.text}"
    assert start_res.json()["status"] == "in_progress"
    print("[PASS] Session status transitioned to 'in_progress'")

    # 6. Answer Question 1 with a realistic, high quality answer
    q1 = questions[0]
    print(f"\n[Step 6] Answering Q1: \"{q1['question_text']}\"")
    good_answer_q1 = (
        "In our microservices architecture, we structure components around business domains using REST and gRPC. "
        "We maintain database-per-service isolation with PostgreSQL, coordinate asynchronous workflows via Kafka events, "
        "and handle cross-service transactions using the Saga pattern with compensating actions for rollback safety."
    )
    ans1_res = requests.post(f"{BASE_URL}/interview/{interview_id}/answer", headers=headers, json={
        "question_id": q1["id"],
        "transcript_text": good_answer_q1,
        "audio_duration_seconds": 22.0
    })
    assert ans1_res.status_code == 200, f"Answer 1 failed: {ans1_res.text}"
    eval1 = ans1_res.json()
    print(f"Evaluation 1 Score: {eval1['score']}/100, Correctness: {eval1.get('correctness_score')}")
    assert eval1["score"] >= 70.0, f"Expected realistic score >= 70, got {eval1['score']}"
    assert eval1["is_completed"] is False
    assert eval1["next_question"] is not None
    print("[PASS] Realistic answer received sensible evaluation score >= 70")

    # 7. Answer Question 2
    q2 = eval1["next_question"]
    print(f"\n[Step 7] Answering Q2: \"{q2['question_text']}\"")
    good_answer_q2 = (
        "Polymorphism allows objects to take multiple forms. For example, runtime polymorphism allows method overriding "
        "where a base class method is executed dynamically by derived class instances, whereas compile-time polymorphism "
        "is achieved via method overloading and generics."
    )
    ans2_res = requests.post(f"{BASE_URL}/interview/{interview_id}/answer", headers=headers, json={
        "question_id": q2["id"],
        "transcript_text": good_answer_q2,
        "audio_duration_seconds": 20.0
    })
    assert ans2_res.status_code == 200, f"Answer 2 failed: {ans2_res.text}"
    eval2 = ans2_res.json()
    print(f"Evaluation 2 Score: {eval2['score']}/100")
    assert eval2["is_completed"] is False
    assert eval2["next_question"] is not None

    # 8. Answer Question 3 (Final Question)
    q3 = eval2["next_question"]
    print(f"\n[Step 8] Answering Q3 (Final): \"{q3['question_text']}\"")
    good_answer_q3 = (
        "ACID guarantees that relational database transactions are executed reliably. Atomicity ensures all changes succeed or rollback. "
        "Consistency maintains database invariants. Isolation prevents dirty and phantom reads across concurrent transactions using locks or MVCC. "
        "Durability writes committed transactions to persistent WAL storage."
    )
    ans3_res = requests.post(f"{BASE_URL}/interview/{interview_id}/answer", headers=headers, json={
        "question_id": q3["id"],
        "transcript_text": good_answer_q3,
        "audio_duration_seconds": 24.0
    })
    assert ans3_res.status_code == 200, f"Answer 3 failed: {ans3_res.text}"
    eval3 = ans3_res.json()
    print(f"Evaluation 3 Score: {eval3['score']}/100, is_completed: {eval3['is_completed']}")
    assert eval3["is_completed"] is True, "Expected interview completion on final question"
    assert eval3["next_question"] is None
    print("[PASS] Final question completed session")

    # 9. Complete Interview & Persist Report
    print("\n[Step 9] Completing Interview & Synthesizing Final Report...")
    comp_res = requests.post(f"{BASE_URL}/interview/{interview_id}/complete", headers=headers)
    assert comp_res.status_code == 200, f"Complete failed: {comp_res.text}"
    comp_data = comp_res.json()
    print(f"Report Overall Score: {comp_data['overall_score']}/100, Verdict: {comp_data['verdict']}")
    assert comp_data["verdict"] in ["Strong Hire", "Hire", "Leaning Hire", "Needs Improvement", "Reject"]
    print("[PASS] Report generated with valid title-case hiring verdict")

    # 10. GET /interview/{id}/report
    print(f"\n[Step 10] Calling GET /api/interview/{interview_id}/report...")
    report_res = requests.get(f"{BASE_URL}/interview/{interview_id}/report", headers=headers)
    assert report_res.status_code == 200, f"Report endpoint failed with HTTP {report_res.status_code}: {report_res.text}"
    report_data = report_res.json()
    assert report_data["interview_id"] == interview_id
    assert report_data["overall_score"] == comp_data["overall_score"]
    assert len(report_data["question_breakdown"]) == 3
    print("[PASS] GET /interview/{id}/report returned 200 OK with persisted report data!")

    print("\n" + "=" * 70)
    print("ALL 10 END-TO-END FLOW VERIFICATION STEPS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_e2e_verification()
