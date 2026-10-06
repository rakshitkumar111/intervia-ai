import os
import sys
import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, init_db
from app.models.user import User
from app.models.interview import Interview, InterviewQuestion, CandidateAnswer, AnswerEvaluation, InterviewReport, IntegrityEvent
from app.models.recruiter import InterviewInvite
from app.utils.security import create_access_token

def test_recruiter_portal_flow():
    print("\n--- Running Step 5 Verification: Recruiter & HR Portal ---")
    init_db()
    client = TestClient(app)
    db = SessionLocal()

    try:
        # 1. Fetch or create test recruiter user
        recruiter = db.query(User).filter(User.email == "recruiter_test@interviewer.ai").first()
        if not recruiter:
            recruiter = User(
                email="recruiter_test@interviewer.ai",
                hashed_password="mockhashedpassword123",
                full_name="Alex Recruiter",
                role="recruiter"
            )
            db.add(recruiter)
            db.commit()
            db.refresh(recruiter)

        token = create_access_token(subject=str(recruiter.id), role=recruiter.role)
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Test POST /api/recruiter/invites
        invite_data = {
            "candidate_name": "Priya Sharma",
            "candidate_email": "priya.sharma@example.com",
            "target_role": "Senior Cloud DevOps Engineer",
            "domain": "Technology",
            "experience_level": "Senior",
            "mode": "Technical",
            "difficulty": "Hard",
            "language": "English",
            "total_questions": 3,
            "expires_in_days": 5
        }
        resp = client.post("/api/recruiter/invites", json=invite_data, headers=headers)
        assert resp.status_code == 201, f"Failed creating invite: {resp.text}"
        invite_res = resp.json()
        print(" [PASSED] Generated interview invite:")
        print(f"   Token: {invite_res['invite_token']}")
        print(f"   URL: {invite_res['invite_url']}")
        print(f"   Expires: {invite_res['expires_at']}")

        invite_token = invite_res["invite_token"]
        assert invite_token is not None
        assert invite_res["candidate_name"] == "Priya Sharma"

        # 3. Test GET /api/recruiter/invites
        resp_list = client.get("/api/recruiter/invites", headers=headers)
        assert resp_list.status_code == 200, f"Failed listing invites: {resp_list.text}"
        invites_list = resp_list.json()
        assert len(invites_list) >= 1
        assert any(i["invite_token"] == invite_token for i in invites_list)
        print(f" [PASSED] Listed {len(invites_list)} invites for recruiter.")

        # 4. Test GET /api/recruiter/join/{invite_token}
        resp_join = client.get(f"/api/recruiter/join/{invite_token}")
        assert resp_join.status_code == 200, f"Failed candidate join: {resp_join.text}"
        join_res = resp_join.json()
        assert join_res["valid"] is True
        assert join_res["candidate_name"] == "Priya Sharma"
        assert join_res["interview_id"] is not None
        interview_id = join_res["interview_id"]
        print(f" [PASSED] Candidate successfully joined via invite link -> interview_id: {interview_id}")

        # 5. Populate mock completed answers & evaluation for replay and leaderboard testing
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        assert interview is not None
        interview.status = "completed"
        interview.completed_at = datetime.datetime.utcnow()
        interview.overall_score = 88.5
        
        q1 = db.query(InterviewQuestion).filter(InterviewQuestion.interview_id == interview_id).first()
        if q1:
            ans1 = CandidateAnswer(
                interview_id=interview_id,
                question_id=q1.id,
                transcript_text="We implement multi-region Kubernetes clusters with ArgoCD GitOps, Terraform state locking in S3, and Prometheus alerting for zero-downtime canary rollouts.",
                audio_duration_seconds=42.0
            )
            db.add(ans1)
            db.flush()

            eval1 = AnswerEvaluation(
                answer_id=ans1.id,
                score=90.0,
                technical_score=9.5,
                communication_score=9.0,
                problem_solving_score=8.5,
                feedback="Excellent depth in CI/CD pipeline automation and Kubernetes deployment strategies."
            )
            db.add(eval1)

        # Add integrity event
        ie = IntegrityEvent(
            interview_id=interview_id,
            event_type="TAB_SWITCH",
            details={"reason": "Candidate temporarily changed active browser window"}
        )
        db.add(ie)

        # Add report
        report = InterviewReport(
            interview_id=interview_id,
            candidate_name="Priya Sharma",
            target_role="Senior Cloud DevOps Engineer",
            overall_score=88.5,
            technical_score=9.2,
            communication_score=8.8,
            problem_solving_score=8.5,
            verdict="Strong Hire",
            executive_summary="Candidate demonstrated exceptional architectural expertise."
        )
        db.add(report)
        db.commit()

        # 6. Test GET /api/recruiter/leaderboard
        resp_lb = client.get("/api/recruiter/leaderboard", headers=headers)
        assert resp_lb.status_code == 200, f"Failed fetching leaderboard: {resp_lb.text}"
        lb_list = resp_lb.json()
        assert len(lb_list) >= 1
        top_candidate = next((c for c in lb_list if c["interview_id"] == interview_id), None)
        assert top_candidate is not None
        assert top_candidate["overall_score"] == 88.5
        assert top_candidate["verdict"] == "Strong Hire"
        assert top_candidate["integrity_score"] > 80.0
        print(f" [PASSED] Candidate Leaderboard validated: Rank 1 - {top_candidate['candidate_name']} | Score: {top_candidate['overall_score']} | Verdict: {top_candidate['verdict']} | Integrity: {top_candidate['integrity_score']}%")

        # 7. Test GET /api/recruiter/replay/{interview_id}
        resp_replay = client.get(f"/api/recruiter/replay/{interview_id}", headers=headers)
        assert resp_replay.status_code == 200, f"Failed fetching replay: {resp_replay.text}"
        replay_res = resp_replay.json()
        assert replay_res["interview_id"] == interview_id
        assert len(replay_res["answers"]) >= 1
        assert replay_res["answers"][0]["speaking_pace_wpm"] > 0
        print(f" [PASSED] Candidate Session Replay validated: {len(replay_res['answers'])} answers captured with telemetry (Pace: {replay_res['answers'][0]['speaking_pace_wpm']} WPM).")

        print("\n ALL STEP 5 RECRUITER PORTAL BACKEND TESTS PASSED 100%!")

    finally:
        db.close()

if __name__ == "__main__":
    test_recruiter_portal_flow()
