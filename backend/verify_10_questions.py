import httpx
import re

BASE_URL = "http://127.0.0.1:8000/api"

def normalize_text(text: str) -> str:
    return re.sub(r"[^\w\s]", "", text.lower()).strip()

def run_test():
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Login candidate
        login_res = client.post("/auth/login", json={"email": "candidate@interviewer.ai", "password": "Candidate@12345"})
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create 10-question technical interview session
        create_res = client.post(
            "/interview/create",
            headers=headers,
            json={
                "target_role": "Senior Full Stack Engineer",
                "mode": "Technical",
                "category": "System Design & Algorithms",
                "difficulty": "Senior",
                "total_questions": 10
            }
        )
        assert create_res.status_code == 201, f"Create interview failed: {create_res.text}"
        session = create_res.json()
        interview_id = session["id"]
        print(f"[*] Interview Created: Session ID={interview_id}, Target Total Questions={session['total_questions']}")

        # 3. Start interview
        start_res = client.post(f"/interview/{interview_id}/start", headers=headers)
        assert start_res.status_code == 200, f"Start interview failed: {start_res.text}"
        
        session = start_res.json()
        current_q = session["questions"][0]

        seen_ids = set()
        seen_texts = set()
        asked_ids = []

        print("\n=======================================================")
        print("          STARTING 10-QUESTION ADAPTIVE FLOW           ")
        print("=======================================================\n")

        for turn in range(1, 11):
            q_id = current_q["id"]
            q_text = current_q["question_text"]
            norm_text = normalize_text(q_text)

            print(f"[TURN {turn}/10]")
            print(f"  [QUESTION ID]   : {q_id}")
            print(f"  [QUESTION TEXT] : {q_text[:90]}...")

            # Assert uniqueness
            assert q_id not in seen_ids, f"DUPLICATE QUESTION ID DETECTED: {q_id}"
            assert norm_text not in seen_texts, f"DUPLICATE QUESTION TEXT DETECTED: {q_text}"

            seen_ids.add(q_id)
            seen_texts.add(norm_text)
            asked_ids.append(q_id)

            # Candidate answers adaptively
            mock_answer = f"In our production microservices architecture, we implement token bucket rate limiting at the API gateway layer, utilize Redis clusters for distributed state caching, and enforce idempotency keys to ensure exactly-once semantics during concurrent transactional spikes."

            # Submit answer
            ans_res = client.post(
                f"/interview/{interview_id}/answer",
                headers=headers,
                json={
                    "question_id": q_id,
                    "transcript_text": mock_answer,
                    "audio_duration_seconds": 15.0,
                    "asked_question_ids": asked_ids
                }
            )
            assert ans_res.status_code == 200, f"Submit answer failed: {ans_res.text}"
            eval_data = ans_res.json()

            print(f"  [EVALUATION]    : Score={eval_data['score']}/100, Relevance={eval_data['relevance_score']}/100, Correctness={eval_data['correctness_score']}/100")
            print(f"  [FEEDBACK]      : {eval_data.get('feedback', '')[:80]}...")

            if eval_data.get("is_completed"):
                print(f"  [STATUS]        : Interview Concluded at Turn {turn}")
                break

            current_q = eval_data.get("next_question")
            assert current_q is not None, f"Turn {turn}: Backend returned None for next_question before completion!"
            print()

        print("\n=======================================================")
        print(f"SUCCESS: {len(seen_ids)} unique consecutive questions evaluated with ZERO duplicates!")
        print(f"Asked Question IDs: {list(seen_ids)}")
        print("=======================================================\n")

if __name__ == "__main__":
    run_test()
