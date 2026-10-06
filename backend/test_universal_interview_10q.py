import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def run_10q_universal_interview_test():
    print("=" * 70)
    print("RUNNING 10-QUESTION UNIVERSAL AI INTERVIEW AUTOMATED TEST")
    print("=" * 70)

    # 1. Authenticate candidate
    email = f"universal_candidate_{int(time.time())}@example.com"
    reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Dr. Alex Taylor",
        "role": "candidate"
    })
    
    if reg_res.status_code == 201:
        token = reg_res.json()["access_token"]
    else:
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "candidate@example.com",
            "password": "password"
        })
        token = login_res.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 2. Test JD Analysis Endpoint
    print("\n[Test 1] Testing Job Description Alignment Endpoint (/api/interview/analyze-jd)...")
    sample_jd = """
    We are looking for a Senior Full Stack Engineer with expertise in Python, React, TypeScript, PostgreSQL, 
    Docker, Redis, and Kubernetes. The candidate will design scalable microservices and lead architectural decisions.
    """
    jd_res = requests.post(f"{BASE_URL}/api/interview/analyze-jd", headers=headers, json={
        "job_description": sample_jd,
        "target_role": "Senior Full Stack Engineer"
    })
    print(f"JD Analysis Status: HTTP {jd_res.status_code}")
    assert jd_res.status_code == 200, f"JD Analysis failed: {jd_res.text}"
    jd_data = jd_res.json()
    print(f"[PASS] Required Skills Extracted: {jd_data.get('required_skills')}")
    print(f"[PASS] Alignment Match Score: {jd_data.get('match_percentage')}%")

    # 3. Create 10-Question Universal Interview
    print("\n[Test 2] Creating 10-Question Universal Interview Session...")
    create_payload = {
        "title": "Universal Senior Engineering Assessment",
        "candidate_name": "Dr. Alex Taylor",
        "target_role": "Principal Software Architect",
        "company_name": "Tech Corp Global",
        "domain": "Technology & Software",
        "experience_level": "Senior",
        "mode": "Technical",
        "difficulty": "Adaptive",
        "total_questions": 10,
        "language": "English",
        "is_practice_mode": True,
        "job_description": sample_jd
    }

    create_res = requests.post(f"{BASE_URL}/api/interview/create", headers=headers, json=create_payload)
    assert create_res.status_code == 201, f"Create interview failed: {create_res.text}"
    session = create_res.json()
    session_id = session["id"]
    print(f"[PASS] Interview Created! ID: {session_id}, Total Questions: {session['total_questions']}")

    # 4. Start Interview Session
    start_res = requests.post(f"{BASE_URL}/api/interview/{session_id}/start", headers=headers)
    assert start_res.status_code == 200
    print(f"[PASS] Session Started: status = {start_res.json()['status']}")

    # 5. Test Anti-Cheating Integrity Event Logging
    print("\n[Test 3] Testing Anti-Cheating Integrity Logging (/api/interview/{id}/integrity-event)...")
    integ_res = requests.post(f"{BASE_URL}/api/interview/{session_id}/integrity-event", headers=headers, json={
        "event_type": "TAB_SWITCH",
        "details": {"reason": "switched to reference docs", "turn": 1}
    })
    assert integ_res.status_code == 201, f"Integrity logging failed: {integ_res.text}"
    print(f"[PASS] Integrity Event Recorded: {integ_res.json()['event_type']}")

    # 6. Execute 10-Question Turn-by-Turn Loop
    print("\n[Test 4] Executing 10-Turn Adaptive Question Cycle...")

    sample_answers = [
        "I have designed distributed event-driven systems using Apache Kafka, PostgreSQL sharding, and React micro-frontends with high availability.",
        "To prevent cache stampedes, I implement distributed mutex locks with Redis Redlock and pre-warm cache keys using probabilistic early expiration.",
        "We handle horizontal database scaling using consistent hashing for tenant-level sharding, along with asynchronous read replicas and CDC pipelines.",
        "In multi-threaded services, thread safety is achieved through immutable data structures, atomic primitives, and non-blocking ring buffers.",
        "Arrays provide O(1) random memory access due to contiguous cache lines, whereas Linked Lists require pointer chasing and have higher cache miss rates.",
        "For database transactions, ACID properties guarantee that money transfers are atomic via two-phase commit and WAL write-ahead logging.",
        "We handle eventual consistency using the Saga pattern with idempotent consumer retries and dead-letter queues in RabbitMQ.",
        "When microservices fail, we apply circuit breakers with Resilience4j, graceful degradation to stale caches, and automated fallback endpoints.",
        "To monitor P99 latency regressions, we use OpenTelemetry distributed tracing with Jaeger, Prometheus metrics, and Grafana SLO alert triggers.",
        "In high-concurrency flash sales, we enforce token bucket rate limiting at Cloudflare edge and queue checkout requests asynchronously in Redis."
    ]

    asked_question_ids = []
    asked_question_texts = []
    current_q = session["questions"][0]

    for turn in range(1, 11):
        q_id = current_q["id"]
        q_text = current_q["question_text"]
        asked_question_ids.append(q_id)
        asked_question_texts.append(q_text)

        print(f"\n--- [TURN {turn}/10] ---")
        print(f"Question ID: {q_id} | Q{turn}")
        print(f"Question: \"{q_text}\"")

        # Submit answer
        ans_text = sample_answers[turn - 1]
        ans_res = requests.post(f"{BASE_URL}/api/interview/{session_id}/answer", headers=headers, json={
            "question_id": q_id,
            "transcript_text": ans_text,
            "audio_duration_seconds": 18.5,
            "asked_question_ids": asked_question_ids
        })

        assert ans_res.status_code == 200, f"Submit answer failed on turn {turn}: {ans_res.text}"
        eval_data = ans_res.json()
        print(f"[PASS] Evaluation Score: {eval_data.get('score')}/100 | Tech: {eval_data.get('technical_score')}/10 | Problem Solving: {eval_data.get('problem_solving_score')}/10")
        
        if turn < 10:
            assert eval_data.get("is_completed") is False, f"Unexpected completion at turn {turn}"
            assert eval_data.get("next_question") is not None, f"Missing next question at turn {turn}"
            next_q = eval_data["next_question"]
            
            # Verify uniqueness
            assert next_q["id"] not in asked_question_ids, f"DUPLICATE QUESTION ID DETECTED: {next_q['id']}"
            assert next_q["question_text"] not in asked_question_texts, f"DUPLICATE QUESTION TEXT DETECTED: {next_q['question_text']}"
            current_q = next_q
        else:
            print(f"[PASS] Turn 10 completed. Session marked as completed: {eval_data.get('is_completed')}")

    # 7. Finalize & Synthesize Executive Report
    print("\n[Test 5] Finalizing Interview & Generating Executive Assessment Report...")
    complete_res = requests.post(f"{BASE_URL}/api/interview/{session_id}/complete", headers=headers)
    assert complete_res.status_code == 200, f"Complete interview failed: {complete_res.text}"
    report = complete_res.json()

    print("\n" + "=" * 70)
    print("EXECUTIVE ASSESSMENT REPORT VERIFICATION")
    print("=" * 70)
    print(f"Candidate: {report.get('candidate_name')}")
    print(f"Target Role: {report.get('target_role')}")
    print(f"Overall Score: {report.get('overall_score')}/100")
    print(f"Technical Score: {report.get('technical_score')}/100")
    print(f"Communication Score: {report.get('communication_score')}/100")
    print(f"Hiring Readiness Verdict: {report.get('verdict')}")
    print(f"Hiring Readiness Badge: {report.get('hiring_readiness')}")
    print(f"Questions Evaluated: {len(report.get('question_breakdown', []))}/10")
    print(f"Strengths: {len(report.get('strengths', []))} items")
    print(f"Recommended Topics: {report.get('recommended_topics')}")
    print("=" * 70)

    assert len(set(asked_question_ids)) == 10, f"Expected 10 unique question IDs, got {len(set(asked_question_ids))}"
    assert len(set(asked_question_texts)) == 10, f"Expected 10 unique question texts, got {len(set(asked_question_texts))}"
    assert len(report.get("question_breakdown", [])) == 10, f"Expected 10 evaluated questions in report"
    print("\n[ALL 10 TURNS & VERIFICATION CHECKS PASSED 100% SUCCESSFULLY!]\n")

if __name__ == "__main__":
    run_10q_universal_interview_test()
