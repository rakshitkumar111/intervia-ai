import sys
import os
import json
import httpx
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.interview import Interview, IntegrityEvent
from app.models.user import User
from app.services.ai.fallback_provider import FallbackAIProvider

def test_ai_proctoring_system():
    print("\n=======================================================")
    print("TESTING PHASE 3.2: ADVANCED AI PROCTORING & INTEGRITY")
    print("=======================================================")

    client = TestClient(app)

    # 1. Login to get auth token
    login_res = client.post("/api/auth/login", json={"email": "candidate@interviewer.ai", "password": "Candidate@12345"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Candidate Authentication: PASS")

    # 2. Create Interview Session for testing proctoring
    create_res = client.post("/api/interview/create", headers=headers, json={
        "target_role": "Full Stack Engineer",
        "mode": "Technical",
        "difficulty": "Medium",
        "total_questions": 3,
        "language": "English"
    })
    assert create_res.status_code == 201, f"Interview creation failed: {create_res.text}"
    interview_id = create_res.json()["id"]
    print(f"[PASS] Proctoring Session Initialized: ID={interview_id}")

    # 3. Test Logging Various Real-Time Computer Vision Proctoring Events
    events_to_test = [
        ("PROCTORING_LOOKING_LEFT", {"gaze_status": "LOOKING_LEFT", "confidence": 0.92, "duration_seconds": 2.4}),
        ("PROCTORING_LOOKING_RIGHT", {"gaze_status": "LOOKING_RIGHT", "confidence": 0.88, "duration_seconds": 1.8}),
        ("PROCTORING_LOOKING_DOWN", {"gaze_status": "LOOKING_DOWN", "confidence": 0.95, "duration_seconds": 3.1}),
        ("PROCTORING_FACE_ABSENT", {"gaze_status": "FACE_ABSENT", "confidence": 0.99, "duration_seconds": 4.0}),
        ("PROCTORING_MULTIPLE_FACES", {"gaze_status": "MULTIPLE_FACES", "confidence": 0.90, "detected_count": 2}),
        ("TAB_SWITCH", {"window_state": "hidden", "url": "https://google.com"}),
        ("AUDIO_ANOMALY", {"noise_level_db": 115, "speaker_count_estimate": 2})
    ]

    for ev_type, details in events_to_test:
        ev_res = client.post(
            f"/api/interview/{interview_id}/integrity-event",
            headers=headers,
            json={"event_type": ev_type, "details": details}
        )
        assert ev_res.status_code == 201, f"Failed logging {ev_type}: {ev_res.text}"
        data = ev_res.json()
        assert data["event_type"] == ev_type
        print(f"[PASS] Logged {ev_type}: PASS (ID={data['id']})")

    # 4. Verify Database Persistence of Integrity Incidents
    db = SessionLocal()
    logged_events = db.query(IntegrityEvent).filter(IntegrityEvent.interview_id == interview_id).all()
    assert len(logged_events) >= len(events_to_test)
    print(f"[PASS] DB Integrity Persistence: PASS ({len(logged_events)} events recorded)")
    db.close()

    # 5. Verify Executive Report Integrity Scoring
    provider = FallbackAIProvider()
    dummy_evals = [
        {"score": 85.0, "technical_score": 8.5, "communication_score": 8.0, "problem_solving_score": 8.5, "confidence_score": 8.0, "question_text": "Q1", "answer_text": "A1"}
    ]
    report = provider.synthesize_final_report("Priya Sharma", "Full Stack Engineer", "Technical", "Full Stack", "Medium", dummy_evals)
    assert report.get("overall_score", 0) > 0
    assert report.get("verdict") is not None
    print(f"[PASS] Final Assessment Report Synthesis: PASS (Verdict: {report['verdict']})")

    print("\nALL PHASE 3.2 AI PROCTORING & INTEGRITY TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_ai_proctoring_system()
