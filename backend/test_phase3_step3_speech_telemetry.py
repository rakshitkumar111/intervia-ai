import sys
import os
import re
from fastapi.testclient import TestClient

from app.main import app

def test_speech_telemetry_and_duplex():
    print("\n=======================================================")
    print("TESTING PHASE 3.3: REAL-TIME SPEECH TELEMETRY & DUPLEX")
    print("=======================================================")

    # 1. Test Client Authentication
    client = TestClient(app)
    login_res = client.post("/api/auth/login", json={"email": "candidate@interviewer.ai", "password": "Candidate@12345"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Candidate Authentication: PASS")

    # 2. Create Interview Session
    create_res = client.post("/api/interview/create", headers=headers, json={
        "target_role": "Backend Software Engineer",
        "mode": "Technical",
        "difficulty": "Medium",
        "total_questions": 3,
        "language": "English"
    })
    assert create_res.status_code == 201, f"Interview creation failed: {create_res.text}"
    interview_data = create_res.json()
    interview_id = interview_data["id"]
    first_q_id = interview_data["questions"][0]["id"]
    print(f"[PASS] Session Initialized: ID={interview_id}, Question ID={first_q_id}")

    # 3. Simulate Candidate Answer with Speech Telemetry (WPM + Filler Words)
    # Spoken text containing 3 filler words ("um", "like", "basically")
    sample_speech = (
        "Um, in my previous microservices project, I designed the RESTful APIs using FastAPI. "
        "Like, we basically used Redis to cache frequently accessed product catalog queries, "
        "which reduced latency by 45 percent."
    )
    
    # 35 words spoken over 15 seconds => 35 / (15/60) = 140 WPM (Optimal Cadence)
    speech_duration = 15.0
    expected_wpm = round((len(sample_speech.split()) / (speech_duration / 60)))

    submit_payload = {
        "question_id": first_q_id,
        "transcript_text": sample_speech,
        "audio_duration_seconds": speech_duration,
        "speaking_pace_wpm": float(expected_wpm),
        "filler_word_count": 3,
        "filler_words_breakdown": {"um": 1, "like": 1, "basically": 1}
    }

    answer_res = client.post(f"/api/interview/{interview_id}/answer", headers=headers, json=submit_payload)
    assert answer_res.status_code == 200, f"Answer submission failed: {answer_res.text}"
    eval_data = answer_res.json()

    assert eval_data.get("speaking_pace_wpm") == float(expected_wpm)
    assert eval_data.get("filler_word_count") == 3
    assert eval_data.get("speech_delivery_feedback") is not None
    assert "filler words" in eval_data.get("speech_delivery_feedback").lower()

    print(f"[PASS] Speech Telemetry Recorded: WPM={eval_data['speaking_pace_wpm']}, Fillers={eval_data['filler_word_count']}")
    print(f"[PASS] Speech Delivery Coaching: \"{eval_data['speech_delivery_feedback']}\"")
    print(f"[PASS] Next Adaptive Question Generated: \"{eval_data['next_question']['question_text'][:50]}...\"")

    print("\nALL PHASE 3.3 SPEECH TELEMETRY & DUPLEX TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_speech_telemetry_and_duplex()
