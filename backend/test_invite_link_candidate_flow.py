import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, init_db
from app.models.user import User
from app.utils.security import create_access_token

def test_candidate_invite_flow():
    print("\n--- Verifying Candidate Invite Link End-to-End Flow ---")
    init_db()
    client = TestClient(app)
    db = SessionLocal()

    try:
        # 1. Recruiter creates invite
        recruiter = db.query(User).filter(User.email == "admin@interviewer.ai").first()
        assert recruiter is not None
        recruiter_token = create_access_token(subject=str(recruiter.id), role=recruiter.role)
        headers_recruiter = {"Authorization": f"Bearer {recruiter_token}"}

        invite_payload = {
            "candidate_name": "Aarav Gupta",
            "candidate_email": "aarav.gupta@techcorp.com",
            "target_role": "AI Full Stack Architect",
            "domain": "Technology",
            "experience_level": "Senior",
            "mode": "Technical",
            "difficulty": "Hard",
            "language": "English",
            "total_questions": 3,
            "expires_in_days": 7
        }
        resp = client.post("/api/recruiter/invites", json=invite_payload, headers=headers_recruiter)
        assert resp.status_code == 201
        invite_data = resp.json()
        invite_token = invite_data["invite_token"]
        print(f" [PASSED] Generated Invite Token: {invite_token}")
        print(f"   Sharable URL: {invite_data['invite_url']}")

        # 2. Candidate opens invite link (PUBLIC, UNPROTECTED CALL)
        resp_info = client.get(f"/api/recruiter/invite-info/{invite_token}")
        assert resp_info.status_code == 200
        info = resp_info.json()
        assert info["valid"] is True
        assert info["candidate_name"] == "Aarav Gupta"
        assert info["target_role"] == "AI Full Stack Architect"
        print(f" [PASSED] Candidate fetched pre-flight invite info: Role={info['target_role']}, Name={info['candidate_name']}")

        # 3. Candidate clicks 'Enter Virtual Interview Room' -> join endpoint
        resp_join = client.get(f"/api/recruiter/join/{invite_token}")
        assert resp_join.status_code == 200
        join_data = resp_join.json()
        assert join_data["valid"] is True
        assert "access_token" in join_data and join_data["access_token"] is not None
        assert "interview_id" in join_data and join_data["interview_id"] is not None
        candidate_token = join_data["access_token"]
        interview_id = join_data["interview_id"]
        print(f" [PASSED] Candidate auto-authenticated! Generated token issued. Interview ID: {interview_id}")

        # 4. Candidate directly interacts with interview session using issued token
        headers_candidate = {"Authorization": f"Bearer {candidate_token}"}
        resp_session = client.get(f"/api/interview/{interview_id}", headers=headers_candidate)
        assert resp_session.status_code == 200, f"Candidate session fetch failed: {resp_session.text}"
        session_data = resp_session.json()
        assert session_data["candidate_name"] == "Aarav Gupta"
        assert len(session_data["questions"]) > 0
        q1_id = session_data["questions"][0]["id"]
        print(f" [PASSED] Candidate accessed interview session without password or registration hurdle! Q1 ID: {q1_id}")

        # 5. Candidate submits answer
        ans_payload = {
            "question_id": q1_id,
            "transcript_text": "We build AI full stack applications using Next.js on frontend and FastAPI with LangChain and Redis cache on the backend for streaming responses.",
            "audio_duration_seconds": 32.0,
            "speaking_pace_wpm": 130.0,
            "filler_word_count": 0
        }
        resp_ans = client.post(f"/api/interview/{interview_id}/answer", json=ans_payload, headers=headers_candidate)
        assert resp_ans.status_code == 200, f"Answer submit failed: {resp_ans.text}"
        eval_res = resp_ans.json()
        print(f" [PASSED] Candidate answer successfully evaluated! Score: {eval_res.get('score')}/100")

        print("\n CANDIDATE INVITE LINK FLOW VERIFIED 100% WORKING!\n")

    finally:
        db.close()

if __name__ == "__main__":
    test_candidate_invite_flow()
