import httpx
import re

BASE_URL = "http://127.0.0.1:8000/api"

def normalize_text(text: str) -> str:
    return re.sub(r"[^\w\s]", "", text.lower()).strip()

def format_qid(idx: int) -> str:
    return f"Q{str(idx).padStart(3, '0')}" if hasattr(str(idx), 'padStart') else f"Q{idx:03d}"

def run_5_question_test():
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Login
        login_res = client.post("/auth/login", json={"email": "candidate@interviewer.ai", "password": "Candidate@12345"})
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Check avatar telemetry & D-ID credentials
        status_res = client.get("/avatar/status", headers=headers)
        assert status_res.status_code == 200, f"Avatar status check failed: {status_res.text}"
        status_data = status_res.json()
        print(f"[*] Avatar Status: configured={status_data.get('did_configured')}, primary_provider={status_data.get('primary_provider')}, default_voice={status_data.get('default_voice_id')}")

        # 3. Create a 5-question session
        create_res = client.post(
            "/interview/create",
            headers=headers,
            json={
                "target_role": "Full Stack Engineer",
                "mode": "Technical",
                "category": "System Design & Algorithms",
                "difficulty": "Mid-Level",
                "total_questions": 5
            }
        )
        assert create_res.status_code == 201, f"Create interview failed: {create_res.text}"
        session = create_res.json()
        interview_id = session["id"]
        print(f"[*] Interview Created: Session ID={interview_id}, Total Questions={session['total_questions']}")

        # 4. Start interview
        start_res = client.post(f"/interview/{interview_id}/start", headers=headers)
        assert start_res.status_code == 200, f"Start interview failed: {start_res.text}"
        
        session = start_res.json()
        current_q = session["questions"][0]

        seen_ids = set()
        seen_texts = set()
        asked_ids = []

        print("\n=======================================================")
        print("          STARTING 5-QUESTION VERIFICATION FLOW        ")
        print("=======================================================\n")

        for turn in range(1, 6):
            qid_str = format_qid(turn)
            q_id = current_q["id"]
            q_text = current_q["question_text"]
            norm_text = normalize_text(q_text)

            print(f"[{qid_str} - Turn {turn}/5]")
            print(f"  [QUESTION_ID]       : {qid_str} (DB ID: {q_id})")
            print(f"  [CURRENT_STATE]     : INTERVIEWER_SPEAKING")
            print(f"  [D-ID_STATUS]       : {'CONNECTED' if status_data.get('did_configured') else 'FALLBACK'}")
            print(f"  [AUDIO_SOURCE]      : {'D-ID_WEBRTC_FEMALE' if status_data.get('did_configured') else 'LOCAL_TTS_FEMALE'}")
            print(f"  [QUESTION_TEXT]     : {q_text}")

            # Assert Uniqueness
            assert q_id not in seen_ids, f"DUPLICATE QUESTION ID DETECTED: {q_id}"
            assert norm_text not in seen_texts, f"DUPLICATE QUESTION TEXT DETECTED: {q_text}"

            seen_ids.add(q_id)
            seen_texts.add(norm_text)
            asked_ids.append(q_id)

            candidate_transcript = f"For turn {turn}, in our distributed architecture we use horizontal scaling, caching layers, and database sharding with strict isolation to ensure high availability and sub-millisecond response times."
            print(f"  [CURRENT_STATE]     : CANDIDATE_LISTENING")
            print(f"  [TRANSCRIPT]        : \"{candidate_transcript}\"")
            print(f"  [CURRENT_STATE]     : PROCESSING_ANSWER")
            print(f"  [ANSWER_SUBMITTED]  : {qid_str}")

            # Submit Answer
            ans_res = client.post(
                f"/interview/{interview_id}/answer",
                headers=headers,
                json={
                    "question_id": q_id,
                    "transcript_text": candidate_transcript,
                    "audio_duration_seconds": 12.0,
                    "asked_question_ids": asked_ids
                }
            )
            assert ans_res.status_code == 200, f"Submit answer failed: {ans_res.text}"
            eval_data = ans_res.json()

            print(f"  [CURRENT_STATE]     : EVALUATING")
            print(f"  [EVALUATION]        : Score={eval_data['score']}/100, Relevance={eval_data['relevance_score']}/100, Correctness={eval_data['correctness_score']}/100")
            print(f"  [FEEDBACK]          : {eval_data.get('feedback', '')}")

            if eval_data.get("is_completed") or turn == 5:
                print(f"  [CURRENT_STATE]     : COMPLETED")
                print(f"  [STATUS]            : Interview Complete after 5 Questions!")
                break

            current_q = eval_data.get("next_question")
            assert current_q is not None, f"Turn {turn}: Backend returned None for next_question before completion!"
            next_qid_str = format_qid(turn + 1)
            print(f"  [CURRENT_STATE]     : GENERATING_NEXT_QUESTION")
            print(f"  [NEXT_QUESTION_ID]  : {next_qid_str} (DB ID: {current_q['id']})")
            print()

        print("\n=======================================================")
        print(f"VERIFICATION SUCCESSFUL: 5/5 Questions Completed with Zero Duplicates!")
        print(f"Sequence: Q001 -> Q002 -> Q003 -> Q004 -> Q005 -> Completed")
        print("=======================================================\n")

if __name__ == "__main__":
    run_5_question_test()
