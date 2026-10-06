import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ai_provider" in data

def test_auth_and_interview_flow():
    # 1. Register candidate
    email = "test.candidate@test.com"
    reg_resp = client.post("/api/auth/register", json={
        "email": email,
        "password": "TestPassword@123",
        "full_name": "Test Candidate",
        "role": "candidate"
    })
    
    if reg_resp.status_code == 400:
        # Already registered, perform login
        login_resp = client.post("/api/auth/login", json={
            "email": email,
            "password": "TestPassword@123"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
    else:
        assert reg_resp.status_code == 201
        token = reg_resp.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check profile
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email

    # 3. Create interview
    create_resp = client.post("/api/interview/create", json={
        "target_role": "Backend Engineer",
        "mode": "Technical",
        "category": "DBMS",
        "difficulty": "Mid-Level",
        "total_questions": 3,
        "focus_skills": ["SQL", "PostgreSQL", "FastAPI"]
    }, headers=headers)
    assert create_resp.status_code == 201
    interview_data = create_resp.json()
    interview_id = interview_data["id"]
    assert len(interview_data["questions"]) == 3

    # 4. Start interview
    start_resp = client.post(f"/api/interview/{interview_id}/start", headers=headers)
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "in_progress"

    # 5. Answer first question
    first_q_id = interview_data["questions"][0]["id"]
    ans_resp = client.post(f"/api/interview/{interview_id}/answer", json={
        "question_id": first_q_id,
        "transcript_text": "ACID properties stand for Atomicity, Consistency, Isolation, and Durability. Atomicity ensures all-or-nothing transactions.",
        "audio_duration_seconds": 12.5
    }, headers=headers)
    assert ans_resp.status_code == 200
    eval_data = ans_resp.json()
    assert eval_data["score"] > 0

    # 6. Complete interview
    comp_resp = client.post(f"/api/interview/{interview_id}/complete", headers=headers)
    assert comp_resp.status_code == 200
    report_data = comp_resp.json()
    assert "overall_score" in report_data
    assert "verdict" in report_data
    assert report_data["verdict"] in ["Strong Hire", "Hire", "Leaning Hire", "Needs Improvement", "Reject"]
