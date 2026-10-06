import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, init_db
from app.models.user import User
from app.utils.security import create_access_token

def test_admin_and_invite_system():
    print("\n--- Verifying Upgraded Admin Portal & Fixed Candidate Invite Flow ---")
    init_db()
    client = TestClient(app)
    db = SessionLocal()

    try:
        # 1. Admin Authentication
        admin = db.query(User).filter(User.email == "admin@interviewer.ai").first()
        assert admin is not None
        admin_token = create_access_token(subject=str(admin.id), role=admin.role)
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 2. Test GET /api/admin/health
        resp_health = client.get("/api/admin/health", headers=admin_headers)
        assert resp_health.status_code == 200, f"Health check failed: {resp_health.text}"
        health_data = resp_health.json()
        assert health_data["ai_status"] == "ONLINE"
        assert "sandbox_status" in health_data
        assert health_data["sandbox_status"]["python"] == "AVAILABLE"
        print(" [PASSED] Admin Live Infrastructure Health: Gemini Online, Python Sandbox Available, Relational DB Connected.")

        # 3. Test GET /api/admin/integrity-metrics
        resp_integ = client.get("/api/admin/integrity-metrics", headers=admin_headers)
        assert resp_integ.status_code == 200
        integ_data = resp_integ.json()
        assert "total_events" in integ_data
        assert "average_integrity_score" in integ_data
        print(f" [PASSED] Admin Security & Anti-Cheating Telemetry: Total Violations Tracked = {integ_data['total_events']}, Avg Score = {integ_data['average_integrity_score']}%")

        # 4. Test POST /api/admin/test-ai (Latency Ping)
        resp_ping = client.post("/api/admin/test-ai", headers=admin_headers)
        assert resp_ping.status_code == 200
        ping_data = resp_ping.json()
        assert ping_data["success"] is True
        print(f" [PASSED] AI Inference Latency Ping: {ping_data['latency_ms']} ms via {ping_data['provider']}")

        # 5. Test Admin User Creation: POST /api/admin/users
        user_payload = {
            "full_name": "Divya Talent Lead",
            "email": "divya.talent@company.com",
            "password": "Password@123",
            "role": "recruiter"
        }
        resp_create_u = client.post("/api/admin/users", json=user_payload, headers=admin_headers)
        if resp_create_u.status_code != 201:
            # If already created in prior run, verify 400
            assert resp_create_u.status_code == 400
            print(" [INFO] User divya.talent@company.com already exists.")
            new_u = db.query(User).filter(User.email == "divya.talent@company.com").first()
            user_id = new_u.id
        else:
            user_id = resp_create_u.json()["user_id"]
            print(f" [PASSED] Admin successfully created new Recruiter account #{user_id}")

        # 6. Test Toggle User Status: PUT /api/admin/users/{user_id}/status
        resp_stat = client.put(f"/api/admin/users/{user_id}/status", json={"is_active": False}, headers=admin_headers)
        assert resp_stat.status_code == 200
        assert resp_stat.json()["is_active"] is False
        # Re-enable
        resp_stat2 = client.put(f"/api/admin/users/{user_id}/status", json={"is_active": True}, headers=admin_headers)
        assert resp_stat2.status_code == 200
        assert resp_stat2.json()["is_active"] is True
        print(f" [PASSED] Admin toggled user status (Suspend -> Activate) successfully.")

        # 7. Test Candidate Invite Link End-to-End
        invite_data = {
            "candidate_name": "Rohan Deshmukh",
            "candidate_email": "rohan.deshmukh@gmail.com",
            "target_role": "Senior Cloud Infrastructure Engineer",
            "domain": "Technology",
            "experience_level": "Senior",
            "mode": "Technical",
            "difficulty": "Hard",
            "language": "English",
            "total_questions": 3,
            "expires_in_days": 5
        }
        resp_inv = client.post("/api/recruiter/invites", json=invite_data, headers=admin_headers)
        assert resp_inv.status_code == 201
        invite_token = resp_inv.json()["invite_token"]
        invite_url = resp_inv.json()["invite_url"]
        assert invite_url == f"/join/{invite_token}"
        print(f" [PASSED] Generated Invite: {invite_url}")

        # Pre-flight metadata fetch
        resp_info = client.get(f"/api/recruiter/invite-info/{invite_token}")
        assert resp_info.status_code == 200
        assert resp_info.json()["candidate_name"] == "Rohan Deshmukh"
        print(" [PASSED] Candidate pre-flight device check page fetched invite metadata.")

        # Candidate clicks "Enter Virtual Interview Room"
        resp_join = client.get(f"/api/recruiter/join/{invite_token}")
        assert resp_join.status_code == 200
        cand_session = resp_join.json()
        assert cand_session["valid"] is True
        assert cand_session["access_token"] is not None
        assert cand_session["interview_id"] is not None
        print(f" [PASSED] Candidate 1-click launch successful! Auto-auth token issued. Interview #{cand_session['interview_id']}")

        print("\n ALL ADMIN & INVITE LINK ENHANCEMENTS VERIFIED 100% WORKING!\n")

    finally:
        db.close()

if __name__ == "__main__":
    test_admin_and_invite_system()
