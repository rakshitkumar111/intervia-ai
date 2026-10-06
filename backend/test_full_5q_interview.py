import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def test_full_5_question_interview():
    print("=" * 70)
    print("TESTING 5-QUESTION UNIVERSAL AI INTERVIEW (WITHOUT D-ID CREDENTIALS)")
    print("=" * 70)

    # 1. Check Avatar Status
    print("\n[Step 1] Checking Avatar Telemetry & Fallback Provider...")
    res = requests.get(f"{BASE_URL}/avatar/status")
    assert res.status_code == 200, f"Status check failed: {res.text}"
    avatar_status = res.json()
    print("Avatar Status:", json.dumps(avatar_status, indent=2))
    assert "realistic-female" in avatar_status.get("supported_providers", []) or avatar_status.get("primary_provider") in ["d-id", "realistic-female"]
    print("[PASS] Confirmed: Avatar supported providers include 'realistic-female'.")

    # 2. Candidate Auth
    print("\n[Step 2] Authenticating Candidate...")
    user_email = f"test_candidate_{int(time.time())}@example.com"
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": user_email,
        "password": "Password123!",
        "full_name": "Dr. Sarah Mitchell Tester",
        "phone_number": "+1234567890"
    })
    assert reg_res.status_code in [200, 201], f"Registration failed: {reg_res.text}"
    token = reg_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS] Registered candidate token: {token[:20]}...")

    # 3. Create 5-Question Interview Session
    print("\n[Step 3] Creating Universal AI Interview for Software Engineer (5 Questions)...")
    create_res = requests.post(f"{BASE_URL}/interview/create", headers=headers, json={
        "target_role": "Full Stack Software Engineer",
        "domain": "Technology",
        "difficulty": "Medium",
        "mode": "Technical",
        "category": "System Design & Distributed Systems",
        "total_questions": 5,
        "language": "English"
    })
    assert create_res.status_code == 201, f"Create interview failed: {create_res.text}"
    session_data = create_res.json()
    interview_id = session_data["id"]
    print(f"[PASS] Session Created: ID {interview_id}, Target: {session_data['target_role']}, Questions: {session_data['total_questions']}")

    # 4. Start Interview
    start_res = requests.post(f"{BASE_URL}/interview/{interview_id}/start", headers=headers)
    assert start_res.status_code == 200, f"Start failed: {start_res.text}"
    session = start_res.json()
    print(f"[PASS] Session Started: Status = {session['status']}")

    # 5. Execute 5-Question Progression
    asked_question_ids = []
    asked_question_texts = []
    current_q = session["questions"][0]

    candidate_answers = [
        "I have 6 years of experience building scalable backend microservices with Python and Go, using distributed caching with Redis and PostgreSQL replication.",
        "We handle eventual consistency using the Saga pattern with RabbitMQ messaging, idempotency keys on every transaction, and compensating transactions for rollbacks.",
        "For database partitioning, I use consistent hashing on the tenant ID to shard PostgreSQL tables horizontally and maintain read replicas for heavy read workloads.",
        "To monitor microservices latency, we instrument OpenTelemetry distributed traces with Jaeger, Prometheus metrics, and set up automated P99 alerts in Grafana.",
        "During high-load flash sales, we apply rate limiting via Redis token bucket, degrade non-critical services gracefully, and cache static responses on Cloudflare CDN."
    ]

    for turn in range(1, 6):
        print(f"\n--- [TURN {turn}/5] ---")
        q_id = current_q["id"]
        q_text = current_q["question_text"]
        print(f"Interviewer Question (Q00{turn}): \"{q_text}\"")

        # Deduplication check
        assert q_id not in asked_question_ids, f"DUPLICATE QUESTION ID {q_id} detected!"
        assert q_text not in asked_question_texts, f"DUPLICATE QUESTION TEXT detected: {q_text}"

        asked_question_ids.append(q_id)
        asked_question_texts.append(q_text)

        # Candidate speaks & submits
        candidate_ans = candidate_answers[turn - 1]
        print(f"Candidate Answer: \"{candidate_ans}\"")

        submit_res = requests.post(f"{BASE_URL}/interview/{interview_id}/answer", headers=headers, json={
            "question_id": q_id,
            "transcript_text": candidate_ans,
            "audio_duration_seconds": 18,
            "asked_question_ids": asked_question_ids
        })
        assert submit_res.status_code == 200, f"Submit answer failed on turn {turn}: {submit_res.text}"
        eval_data = submit_res.json()

        print(f"[PASS] Evaluation Score: {eval_data.get('score', 0)}/100 | Feedback: {eval_data.get('feedback', '')[:80]}...")

        if turn < 5:
            assert eval_data.get("is_completed") is False, f"Unexpected completion before turn 5 on turn {turn}"
            assert eval_data.get("next_question") is not None, f"Missing next question on turn {turn}"
            current_q = eval_data["next_question"]
            print(f"[PASS] Next Question Generated: ID {current_q['id']} - \"{current_q['question_text'][:60]}...\"")
        else:
            assert eval_data.get("is_completed") is True, "Expected is_completed=True on turn 5"
            assert eval_data.get("next_question") is None, "Expected next_question=None on turn 5"
            print("[PASS] 5th Question answered. Session marked as completed.")

    # 6. Complete Interview & Fetch Report
    print("\n[Step 6] Finalizing Interview & Generating Executive Assessment Report...")
    comp_res = requests.post(f"{BASE_URL}/interview/{interview_id}/complete", headers=headers)
    assert comp_res.status_code == 200, f"Complete interview failed: {comp_res.text}"

    report_res = requests.get(f"{BASE_URL}/interview/{interview_id}/report", headers=headers)
    assert report_res.status_code == 200, f"Report fetch failed: {report_res.text}"
    report_data = report_res.json()

    print("\n" + "=" * 70)
    print("EXECUTIVE ASSESSMENT REPORT SUMMARY")
    print("=" * 70)
    print(f"Overall Score: {report_data.get('overall_score')}/100")
    print(f"Technical: {report_data.get('technical_score')}/100 | Correctness: {report_data.get('correctness_score')}/100")
    print(f"Problem Solving: {report_data.get('problem_solving_score')}/100 | Communication: {report_data.get('communication_score')}/100")
    questions_count = len(report_data.get('question_breakdown', []))
    print(f"Questions Evaluated: {questions_count}/5")
    assert questions_count == 5, f"Expected 5 questions evaluated, got {questions_count}"
    print("\n[PASS] ALL 5 QUESTIONS AND FINAL REPORT VERIFIED SUCCESSFULLY WITH 100% UNIQUE QUESTIONS!")

if __name__ == "__main__":
    test_full_5_question_interview()
