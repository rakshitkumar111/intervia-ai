import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

def test_email_whatsapp_invite_flow():
    # 1. Admin login
    login_res = client.post("/api/auth/login", json={"email": "admin@interviewer.ai", "password": "Admin@12345"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create invite with candidate_phone
    phone = "+91 98765 43210"
    payload = {
        "candidate_name": "Priya Ananth",
        "candidate_email": "priya.ananth@example.com",
        "candidate_phone": phone,
        "target_role": "Lead DevOps Engineer",
        "domain": "Cloud Infrastructure",
        "experience_level": "Senior",
        "mode": "Technical",
        "difficulty": "Hard",
        "language": "English",
        "total_questions": 3,
        "expires_in_days": 5
    }
    create_res = client.post("/api/recruiter/invites", json=payload, headers=headers)
    assert create_res.status_code == 201
    data = create_res.json()
    invite_id = data["id"]
    invite_token = data["invite_token"]
    candidate_url = data["candidate_url"]

    # Verify fields
    assert data["candidate_name"] == "Priya Ananth"
    assert data["candidate_phone"] == phone
    assert data["email_status"] == "not_sent"
    assert data["whatsapp_status"] == "not_sent"
    assert f"/interview/{invite_token}" in candidate_url
    assert "localhost" not in candidate_url or settings.PUBLIC_FRONTEND_URL.startswith("http://localhost")

    # 3. Test mark-whatsapp endpoint
    wa_res = client.post(f"/api/recruiter/invites/{invite_id}/mark-whatsapp", headers=headers)
    assert wa_res.status_code == 200
    assert wa_res.json()["success"] is True
    assert wa_res.json()["whatsapp_status"] == "sent"

    # 4. Test send-email endpoint
    email_res = client.post(f"/api/recruiter/invites/{invite_id}/send-email", headers=headers)
    assert email_res.status_code == 200
    # If SMTP is not configured, email_status is "failed" with helpful error; if configured, "sent"
    assert "email_status" in email_res.json()

    # 5. Verify get_invites list includes updated statuses and candidate_phone
    list_res = client.get("/api/recruiter/invites", headers=headers)
    assert list_res.status_code == 200
    matched = [i for i in list_res.json() if i["id"] == invite_id]
    assert len(matched) == 1
    item = matched[0]
    assert item["candidate_phone"] == phone
    assert item["whatsapp_status"] == "sent"
    assert item["candidate_url"] == candidate_url

    # 6. Unauthenticated candidate flow
    # Pre-flight check
    info_res = client.get(f"/api/recruiter/invite-info/{invite_token}")
    assert info_res.status_code == 200
    assert info_res.json()["candidate_name"] == "Priya Ananth"

    # Start/Join interview without login
    join_res = client.post(f"/api/recruiter/join/{invite_token}")
    assert join_res.status_code == 200
    join_data = join_res.json()
    assert join_data["valid"] is True
    assert "access_token" in join_data
    assert "interview_id" in join_data
