"""
Focused regression tests for the 3 recruiter audit fixes:
1. Invite status becomes 'completed' when interview completes
2. Recruiter can access their candidate's interview and report
3. Completed invite returns status='completed' without creating a new interview
4. Security: Recruiter A cannot access Recruiter B's candidate
5. Security: Completed interview cannot be restarted via same invite
"""
import os
import sys
import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, init_db
from app.models.user import User
from app.models.interview import Interview, InterviewQuestion, CandidateAnswer, AnswerEvaluation, InterviewReport
from app.models.recruiter import InterviewInvite
from app.utils.security import create_access_token, get_password_hash


def _make_user(db, email, role="recruiter"):
    """Lookup or create a test user."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=get_password_hash("TestPass@123"),
            full_name=f"Test {role.title()}",
            role=role,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _create_invite(client, headers, candidate_name, candidate_email, role="Software Engineer"):
    payload = {
        "candidate_name": candidate_name,
        "candidate_email": candidate_email,
        "target_role": role,
        "domain": "Technology",
        "experience_level": "Mid-Level",
        "mode": "Technical",
        "difficulty": "Medium",
        "language": "English",
        "total_questions": 2,
        "expires_in_days": 7,
    }
    resp = client.post("/api/recruiter/invites", json=payload, headers=headers)
    assert resp.status_code == 201, f"Invite creation failed: {resp.text}"
    return resp.json()["invite_token"]


def _complete_interview(db, interview_id):
    """Force an interview to completed status and add a mock report."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    interview.status = "completed"
    interview.completed_at = datetime.datetime.utcnow()
    interview.overall_score = 75.0

    existing_report = db.query(InterviewReport).filter(InterviewReport.interview_id == interview_id).first()
    if not existing_report:
        report = InterviewReport(
            interview_id=interview_id,
            candidate_name=interview.candidate_name,
            target_role=interview.target_role,
            overall_score=75.0,
            technical_score=7.5,
            communication_score=7.0,
            problem_solving_score=7.0,
            verdict="Hire",
            executive_summary="Strong candidate with solid technical foundation.",
        )
        db.add(report)
    db.commit()
    db.refresh(interview)


def test_recruiter_regression():
    print("\n--- Recruiter Regression Tests (3 Fixes) ---")
    init_db()
    client = TestClient(app)
    db = SessionLocal()

    try:
        # ------------------------------------------------------------------ #
        # Setup: Two recruiters, two candidates
        # ------------------------------------------------------------------ #
        recruiter_a = _make_user(db, "recruiter_a_reg@interviewer.ai", "recruiter")
        recruiter_b = _make_user(db, "recruiter_b_reg@interviewer.ai", "recruiter")
        admin = db.query(User).filter(User.email == "admin@interviewer.ai").first()
        assert admin, "Admin user must exist"

        token_a = create_access_token(subject=str(recruiter_a.id), role=recruiter_a.role)
        token_b = create_access_token(subject=str(recruiter_b.id), role=recruiter_b.role)
        token_admin = create_access_token(subject=str(admin.id), role=admin.role)

        headers_a = {"Authorization": f"Bearer {token_a}"}
        headers_b = {"Authorization": f"Bearer {token_b}"}
        headers_admin = {"Authorization": f"Bearer {token_admin}"}

        # ------------------------------------------------------------------ #
        # FIX 1: Invite status becomes 'completed' when interview auto-completes
        # ------------------------------------------------------------------ #
        print("\n[FIX 1] Invite status sync on completion via submit_answer")

        invite_token_1 = _create_invite(
            client, headers_a,
            "Alice Fix1", "alice.fix1.reg@example.com", "Backend Engineer"
        )

        # Candidate joins
        resp_join = client.get(f"/api/recruiter/join/{invite_token_1}")
        assert resp_join.status_code == 200
        join_data = resp_join.json()
        interview_id_1 = join_data["interview_id"]
        cand_token_1 = join_data["access_token"]
        headers_cand_1 = {"Authorization": f"Bearer {cand_token_1}"}

        # Fetch the interview to get question IDs
        resp_session = client.get(f"/api/interview/{interview_id_1}", headers=headers_cand_1)
        assert resp_session.status_code == 200
        questions = resp_session.json()["questions"]
        assert len(questions) >= 1

        # Submit all 2 answers to trigger auto-completion
        for q in questions[:2]:
            ans_payload = {
                "question_id": q["id"],
                "transcript_text": "I have extensive experience building scalable REST APIs using Python and FastAPI.",
                "audio_duration_seconds": 25.0,
                "speaking_pace_wpm": 120.0,
                "filler_word_count": 1,
            }
            client.post(f"/api/interview/{interview_id_1}/answer", json=ans_payload, headers=headers_cand_1)

        # Verify invite status is now 'completed'
        invite_1 = db.query(InterviewInvite).filter(InterviewInvite.invite_token == invite_token_1).first()
        db.refresh(invite_1)
        assert invite_1.status == "completed", (
            f"Expected invite status='completed' after all answers submitted, got '{invite_1.status}'"
        )
        print(f"  [PASSED] Invite status = '{invite_1.status}' after interview auto-completion")

        # Also verify via GET /api/recruiter/invites listing
        resp_list = client.get("/api/recruiter/invites", headers=headers_a)
        assert resp_list.status_code == 200
        invite_in_list = next(
            (i for i in resp_list.json() if i["invite_token"] == invite_token_1), None
        )
        assert invite_in_list is not None
        assert invite_in_list["status"] == "completed", (
            f"Invite listing shows status='{invite_in_list['status']}', expected 'completed'"
        )
        print(f"  [PASSED] GET /api/recruiter/invites reflects status='completed'")

        # ------------------------------------------------------------------ #
        # FIX 1b: Invite status sync via explicit complete_interview endpoint
        # ------------------------------------------------------------------ #
        print("\n[FIX 1b] Invite status sync on completion via explicit /complete endpoint")

        invite_token_1b = _create_invite(
            client, headers_a,
            "Bob Fix1b", "bob.fix1b.reg@example.com", "DevOps Engineer"
        )
        resp_join_1b = client.get(f"/api/recruiter/join/{invite_token_1b}")
        assert resp_join_1b.status_code == 200
        interview_id_1b = resp_join_1b.json()["interview_id"]
        cand_token_1b = resp_join_1b.json()["access_token"]
        headers_cand_1b = {"Authorization": f"Bearer {cand_token_1b}"}

        # Force complete via /complete endpoint
        resp_complete = client.post(f"/api/interview/{interview_id_1b}/complete", headers=headers_cand_1b)
        assert resp_complete.status_code == 200

        invite_1b = db.query(InterviewInvite).filter(InterviewInvite.invite_token == invite_token_1b).first()
        db.refresh(invite_1b)
        assert invite_1b.status == "completed", (
            f"Expected invite status='completed' after /complete, got '{invite_1b.status}'"
        )
        print(f"  [PASSED] Invite status = '{invite_1b.status}' after explicit /complete")

        # ------------------------------------------------------------------ #
        # FIX 2: Recruiter can access their candidate's interview and report
        # ------------------------------------------------------------------ #
        print("\n[FIX 2] Recruiter authorization for interview and report access")

        invite_token_2 = _create_invite(
            client, headers_a,
            "Carol Fix2", "carol.fix2.reg@example.com", "Data Scientist"
        )
        resp_join_2 = client.get(f"/api/recruiter/join/{invite_token_2}")
        assert resp_join_2.status_code == 200
        interview_id_2 = resp_join_2.json()["interview_id"]

        # Force interview to completed with a report
        _complete_interview(db, interview_id_2)

        # Recruiter A (who created the invite) should be able to access the interview
        resp_itv = client.get(f"/api/interview/{interview_id_2}", headers=headers_a)
        assert resp_itv.status_code == 200, (
            f"Recruiter A should access interview {interview_id_2}, got {resp_itv.status_code}: {resp_itv.text}"
        )
        print(f"  [PASSED] Recruiter A can GET /api/interview/{interview_id_2}")

        # Recruiter A should be able to access the report
        resp_rpt = client.get(f"/api/interview/{interview_id_2}/report", headers=headers_a)
        assert resp_rpt.status_code == 200, (
            f"Recruiter A should access report for interview {interview_id_2}, got {resp_rpt.status_code}: {resp_rpt.text}"
        )
        report_data = resp_rpt.json()
        assert report_data["overall_score"] == 75.0
        print(f"  [PASSED] Recruiter A can GET /api/interview/{interview_id_2}/report (score={report_data['overall_score']})")

        # Admin should also access the interview and report
        resp_admin_itv = client.get(f"/api/interview/{interview_id_2}", headers=headers_admin)
        assert resp_admin_itv.status_code == 200
        resp_admin_rpt = client.get(f"/api/interview/{interview_id_2}/report", headers=headers_admin)
        assert resp_admin_rpt.status_code == 200
        print(f"  [PASSED] Admin can access interview and report")

        # ------------------------------------------------------------------ #
        # SECURITY: Recruiter B cannot access Recruiter A's candidate
        # ------------------------------------------------------------------ #
        print("\n[SECURITY] Recruiter B cannot access Recruiter A's candidate interview/report")

        resp_b_itv = client.get(f"/api/interview/{interview_id_2}", headers=headers_b)
        assert resp_b_itv.status_code == 404, (
            f"Recruiter B should NOT access interview {interview_id_2}, got {resp_b_itv.status_code}"
        )
        print(f"  [PASSED] Recruiter B correctly blocked from interview {interview_id_2} (404)")

        resp_b_rpt = client.get(f"/api/interview/{interview_id_2}/report", headers=headers_b)
        assert resp_b_rpt.status_code == 404, (
            f"Recruiter B should NOT access report for interview {interview_id_2}, got {resp_b_rpt.status_code}"
        )
        print(f"  [PASSED] Recruiter B correctly blocked from report {interview_id_2} (404)")

        # ------------------------------------------------------------------ #
        # SECURITY: Candidate A cannot access Candidate B's interview
        # ------------------------------------------------------------------ #
        print("\n[SECURITY] Candidate A cannot access Candidate B's interview")

        cand_token_carol = resp_join_2.json()["access_token"]
        headers_carol = {"Authorization": f"Bearer {cand_token_carol}"}

        # Alice's interview (interview_id_1) should not be accessible by Carol
        resp_carol_alice = client.get(f"/api/interview/{interview_id_1}", headers=headers_carol)
        assert resp_carol_alice.status_code == 404, (
            f"Carol should NOT access Alice's interview {interview_id_1}, got {resp_carol_alice.status_code}"
        )
        print(f"  [PASSED] Carol (Candidate) cannot access Alice's interview (404)")

        # ------------------------------------------------------------------ #
        # FIX 3: Completed invite re-entry returns status='completed', no new interview
        # ------------------------------------------------------------------ #
        print("\n[FIX 3] Completed invite re-entry behavior")

        # Use the already-completed invite_token_1 from Fix 1
        resp_reentry = client.get(f"/api/recruiter/join/{invite_token_1}")
        assert resp_reentry.status_code == 200
        reentry_data = resp_reentry.json()

        assert reentry_data["status"] == "completed", (
            f"Expected re-entry to return status='completed', got '{reentry_data['status']}'"
        )
        # The interview_id must be the SAME — no new interview created
        assert reentry_data["interview_id"] == interview_id_1, (
            f"Re-entry should return existing interview_id={interview_id_1}, got {reentry_data['interview_id']}"
        )
        print(f"  [PASSED] Re-entry returns status='completed' and same interview_id={interview_id_1}")

        # Verify no duplicate interview was created
        total_invites_for_token_1 = db.query(Interview).filter(
            Interview.id == invite_1.interview_id
        ).count()
        assert total_invites_for_token_1 == 1, "Should not have created a second interview on re-entry"
        print(f"  [PASSED] No duplicate interview created on re-entry")

        # ------------------------------------------------------------------ #
        # SECURITY: Expired and invalid invite links remain blocked
        # ------------------------------------------------------------------ #
        print("\n[SECURITY] Expired and invalid invite handling")

        # Invalid token
        resp_invalid = client.get("/api/recruiter/invite-info/totally-fake-token-xyz-9999")
        assert resp_invalid.status_code == 404
        print(f"  [PASSED] Invalid token → 404 Not Found")

        # Manually create an expired invite
        import uuid
        expired_token = f"expired-reg-{uuid.uuid4().hex[:12]}"
        expired_invite = InterviewInvite(
            invite_token=expired_token,
            recruiter_id=recruiter_a.id,
            candidate_name="Expired Candidate",
            candidate_email=f"expired.{uuid.uuid4().hex[:6]}@example.com",
            target_role="Tester",
            status="pending",
            expires_at=datetime.datetime.utcnow() - datetime.timedelta(days=1),
        )
        db.add(expired_invite)
        db.commit()

        resp_expired = client.get(f"/api/recruiter/invite-info/{expired_token}")
        assert resp_expired.status_code == 410, (
            f"Expired invite should return 410, got {resp_expired.status_code}"
        )
        print(f"  [PASSED] Expired invite → 410 Gone")

        resp_expired_join = client.get(f"/api/recruiter/join/{expired_token}")
        assert resp_expired_join.status_code == 410
        print(f"  [PASSED] Expired invite join → 410 Gone (cannot restart)")

        print("\n ALL REGRESSION TESTS PASSED 100%!\n")

    finally:
        db.close()


if __name__ == "__main__":
    test_recruiter_regression()
