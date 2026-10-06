import sqlite3
from app.config import SQLITE_DB_PATH
from app.database import engine, Base
from app.models.interview import Interview, InterviewQuestion, CandidateAnswer, AnswerEvaluation, InterviewReport, IntegrityEvent
from app.models.user import User, CandidateProfile
from app.models.resume import Resume
from app.models.system import SystemLog, SystemSetting

def migrate():
    print(f"Migrating database at: {SQLITE_DB_PATH}")
    
    # 1. Create all missing tables
    Base.metadata.create_all(bind=engine)
    print("[PASS] Base.metadata.create_all executed.")

    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()

    # 2. Add columns if not present in interviews table
    cursor.execute("PRAGMA table_info(interviews)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "is_practice_mode" not in columns:
        print("Adding column 'is_practice_mode' to interviews...")
        cursor.execute("ALTER TABLE interviews ADD COLUMN is_practice_mode BOOLEAN DEFAULT 0")

    # 3. Add columns to interview_questions table
    cursor.execute("PRAGMA table_info(interview_questions)")
    q_columns = [col[1] for col in cursor.fetchall()]
    if "hint" not in q_columns:
        print("Adding column 'hint' to interview_questions...")
        cursor.execute("ALTER TABLE interview_questions ADD COLUMN hint TEXT")

    # 4. Add columns to answer_evaluations table
    cursor.execute("PRAGMA table_info(answer_evaluations)")
    e_columns = [col[1] for col in cursor.fetchall()]
    if "suggested_ideal_answer" not in e_columns:
        print("Adding column 'suggested_ideal_answer' to answer_evaluations...")
        cursor.execute("ALTER TABLE answer_evaluations ADD COLUMN suggested_ideal_answer TEXT")

    conn.commit()
    conn.close()
    print("[PASS] Database migration completed successfully.")

if __name__ == "__main__":
    migrate()
