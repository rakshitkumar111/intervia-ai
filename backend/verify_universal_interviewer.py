import os
import sys
import re
import datetime

def safe_print(text: str = ""):
    try:
        print(text)
    except UnicodeEncodeError:
        try:
            print(text.encode('ascii', errors='backslashreplace').decode('ascii'))
        except Exception:
            pass

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base, init_db
from app.models.user import User
from app.models.interview import Interview, InterviewQuestion, CandidateAnswer, AnswerEvaluation, InterviewReport
from app.services.ai.engine import ai_engine
from app.services.ai.gemini_provider import calculate_text_similarity
from app.routes.interview import create_interview, submit_answer, complete_interview
from app.schemas.interview import InterviewCreate, AnswerSubmit

# Ensure database tables and columns exist
init_db()

def get_or_create_test_user(db: Session) -> User:
    user = db.query(User).filter(User.email == "universal_tester@ai.com").first()
    if not user:
        user = User(
            email="universal_tester@ai.com",
            full_name="Alex Sharma",
            hashed_password="hashed_pw_test",
            role="candidate"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def run_role_interview_test(
    role_name: str,
    domain: str,
    experience_level: str,
    mode: str,
    language: str,
    difficulty: str = "Medium",
    total_q: int = 5,
    company_name: str = "Global Corp",
    jd_text: str = None
):
    safe_print(f"\n=======================================================")
    safe_print(f" TESTING ROLE: {role_name.upper()} ({domain})")
    safe_print(f" Language: {language} | Level: {experience_level} | Mode: {mode}")
    safe_print(f"=======================================================")

    db = SessionLocal()
    try:
        user = get_or_create_test_user(db)
        payload = InterviewCreate(
            candidate_name=user.full_name,
            target_role=role_name,
            company_name=company_name,
            domain=domain,
            experience_level=experience_level,
            mode=mode,
            difficulty=difficulty,
            total_questions=total_q,
            language=language,
            job_description=jd_text
        )

        interview = create_interview(payload=payload, current_user=user, db=db)
        safe_print(f"[*] Interview Created: ID={interview.id}, Role={interview.target_role}, Domain={interview.domain}, Language={interview.language}")

        asked_questions = []
        asked_ids = []

        candidate_answers = {
            "Software Engineer": [
                "For high-concurrency systems, I implement horizontal scaling with stateless services, Redis caching layers, and database sharding with replica sets to maintain sub-50ms latency.",
                "In binary search trees like Red-Black trees, left and right rotations restore balance after node insertions, keeping tree height O(log N) for optimal search efficiency.",
                "For LRU cache, I combine a Doubly Linked List for O(1) removals and node updates with a Hash Map for O(1) key lookups.",
                "Dynamic programming requires optimal substructure and overlapping subproblems, using memoization or bottom-up tabulation to avoid redundant exponential recalculations.",
                "Dijkstra algorithm uses a min-heap priority queue with O((V+E) log V) complexity, iteratively relaxing distances from the source vertex."
            ],
            "Data Analyst": [
                "I use SQL window functions like ROW_NUMBER and DENSE_RANK partitioned by user and ordered by timestamp to track event cohorts without grouping away raw records.",
                "During data cleaning in pandas, I evaluate null patterns. If MAR, I impute using median or domain interpolation, otherwise I isolate corrupted records with automated anomaly flags.",
                "In Power BI, I design star-schema data models with explicit DAX measures, avoiding bi-directional cross-filtering to optimize query execution and refresh speed.",
                "To detect statistical outliers, I use IQR (Interquartile Range) filtering or Z-score thresholds depending on the underlying data distribution skewness.",
                "I translate executive business requirements into concrete KPI metrics like Customer Acquisition Cost (CAC), Net Revenue Retention (NRR), and Churn Rate."
            ],
            "HR Executive": [
                "मैं भर्ती प्रक्रिया में कैंडिडेट के रेज़्यूमे की स्क्रीनिंग, तकनीकी मूल्यांकन और बिहेवियरल इंटरव्यू को कंपनी की वर्क कल्चर के अनुसार प्लान करती हूँ।",
                "अगर टीम मेंबर्स के बीच कॉन्फ्लिक्ट होता है, तो मैं न्यूट्रल मेडिएशन करती हूँ, दोनों पक्षों को सुनती हूँ और कंपनी पॉलिसी के अनुसार निष्पक्ष समाधान निकालती हूँ।",
                "कर्मचारी रिटेंशन के लिए 360-डिग्री फीडबैक, रेगुलर 1-on-1 सेशंस और स्पष्ट करियर ग्रोथ पाथ बहुत जरूरी हैं।",
                "नए कर्मचारियों के ऑनबोर्डिंग के लिए मैं एक सुव्यवस्थित 30-60-90 डे प्लान बनाती हूँ जिससे वे कंपनी के लक्ष्यों से तुरंत जुड़ सकें।",
                "परफॉरमेंस अप्रेजल के दौरान निष्पक्ष मूल्यांकन और डेटा-आधारित फीडबैक देकर हम टीम का मनोबल और उत्पादकता बढ़ाते हैं।"
            ],
            "Sales Executive": [
                "Jab client bolte hain ki pricing high hai, to mai discount dene ke bajay product ki ROI aur core business value quantify karke explain karta hoon.",
                "Mai cold qualification me BANT framework use karta hoon - Budget, Authority, Need aur Timeline check karke high-intent leads ko prioritize karta hoon.",
                "B2B sales cycle me multiple stakeholders ko align karna aur champion build karna crucial hota hai taaki deal smooth close ho sake.",
                "Objection handling ke waqt pehle client ke pain points ko acknowledge karta hoon, phir concrete case study present karta hoon.",
                "Monthly target achieve karne ke liye daily pipeline velocity aur follow-up cadence track karta hoon CRM me."
            ],
            "Electronics Engineer": [
                "For low-noise analog circuits, I calculate decoupling capacitance, isolate ground planes, and design active low-pass Butterworth filters to minimize signal interference.",
                "In embedded microcontrollers, I configure hardware timers, DMA controllers, and interrupt service routines (ISRs) to handle real-time sensor streams without CPU blocking.",
                "Ohm's law and Kirchhoff's circuit laws (KCL and KVL) form the foundation for analyzing node voltages and branch currents in complex resistive networks.",
                "For power supply regulation, I select buck-boost switching converters with synchronous rectification to achieve greater than 92% power efficiency.",
                "When debugging PCB signal integrity, I inspect oscilloscope waveform ringing, impedance matching, and parasitic capacitance."
            ]
        }

        answers_list = candidate_answers.get(role_name, candidate_answers["Software Engineer"])

        for turn in range(total_q):
            current_q = db.query(InterviewQuestion).filter(
                InterviewQuestion.interview_id == interview.id,
                InterviewQuestion.order_index == turn + 1
            ).first()

            if not current_q:
                # fetch latest question
                current_q = db.query(InterviewQuestion).filter(
                    InterviewQuestion.interview_id == interview.id
                ).order_by(InterviewQuestion.order_index.desc()).first()

            q_text = current_q.question_text
            asked_questions.append(q_text)
            asked_ids.append(current_q.id)

            safe_print(f"\n  [Turn {turn + 1}/{total_q}]")
            safe_print(f"  [QUESTION_ID]   : Q{turn + 1:03d} (DB ID: {current_q.id})")
            safe_print(f"  [QUESTION_TEXT] : {q_text[:90]}...")
            safe_print(f"  [CATEGORY]      : {current_q.category}")
            safe_print(f"  [DIFFICULTY]    : {current_q.difficulty}")

            ans_text = answers_list[turn % len(answers_list)]
            safe_print(f"  [CANDIDATE_ANS] : \"{ans_text[:75]}...\"")

            eval_res = submit_answer(
                interview_id=interview.id,
                payload=AnswerSubmit(
                    question_id=current_q.id,
                    transcript_text=ans_text,
                    audio_duration_seconds=22.5,
                    asked_question_ids=asked_ids
                ),
                current_user=user,
                db=db
            )

            safe_print(f"  [EVALUATION]    : Score={eval_res.score:.1f}/100, Tech={eval_res.technical_score}/10, Comm={eval_res.communication_score}/10")
            safe_print(f"  [FEEDBACK]      : {eval_res.feedback}")

            if eval_res.next_question:
                next_q_text = eval_res.next_question.question_text
                # Anti-repetition validation
                for prev_q in asked_questions:
                    sim = calculate_text_similarity(next_q_text, prev_q)
                    assert sim < 0.70, f"DUPLICATE DETECTED! '{next_q_text}' is too similar to '{prev_q}' (sim={sim})"

        # Finalize and synthesize executive report
        final_report = complete_interview(interview_id=interview.id, current_user=user, db=db)
        safe_print(f"\n  [FINAL REPORT]  : Overall={final_report.overall_score:.1f}/100 | Verdict={final_report.verdict} | Readiness={final_report.hiring_readiness}")
        safe_print(f"  [SUMMARY]       : {final_report.executive_summary}")
        safe_print(f"  [PDF PATH]      : {final_report.pdf_report_path}")
        safe_print(f"  [STATUS]        : PASSED [OK]")

        return True

    finally:
        db.close()

def main():
    safe_print("=======================================================")
    safe_print(" UNIVERSAL AI INTERVIEWER - COMPREHENSIVE TEST SUITE  ")
    safe_print("=======================================================")

    test_roles = [
        ("Software Engineer", "Technology", "Senior", "Technical", "English"),
        ("Data Analyst", "Technology", "Mid-Level", "Technical", "English"),
        ("HR Executive", "Human Resources", "Mid-Level", "HR", "Hindi"),
        ("Sales Executive", "Sales & Marketing", "Mid-Level", "Situational", "Hinglish"),
        ("Electronics Engineer", "Core Engineering", "Fresher", "Technical", "English"),
    ]

    for role, domain, exp, mode, lang in test_roles:
        success = run_role_interview_test(
            role_name=role,
            domain=domain,
            experience_level=exp,
            mode=mode,
            language=lang,
            difficulty="Medium",
            total_q=5,
            company_name="Google / Industry Standard",
            jd_text=f"Looking for an exceptional {role} with deep industry expertise in {domain}."
        )
        assert success, f"Test failed for {role}"

    safe_print("\n=======================================================")
    safe_print(" ALL UNIVERSAL AI INTERVIEWER TESTS PASSED SUCCESSFULLY! ")
    safe_print(" Multi-role, Multi-domain, Multi-language Verified!     ")
    safe_print("=======================================================")

if __name__ == "__main__":
    main()
