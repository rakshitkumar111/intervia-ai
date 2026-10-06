import sqlite3
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.utils.logger import logger

# Create engine with connect_args for SQLite multi-thread support
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def migrate_sqlite_schema():
    """Dynamically adds missing columns to existing SQLite tables without losing data."""
    if not settings.DATABASE_URL.startswith("sqlite"):
        return

    inspector = inspect(engine)
    
    # Table-to-Column migration map
    migrations = {
        "interviews": [
            ("candidate_name", "VARCHAR(100)"),
            ("company_name", "VARCHAR(100)"),
            ("domain", "VARCHAR(100) DEFAULT 'Technology'"),
            ("experience_level", "VARCHAR(50) DEFAULT 'Mid-Level'"),
            ("language", "VARCHAR(50) DEFAULT 'English'"),
            ("duration_mode", "VARCHAR(50) DEFAULT 'Standard'"),
            ("job_description", "TEXT"),
            ("is_practice_mode", "BOOLEAN DEFAULT 0")
        ],
        "interview_questions": [
            ("question_number", "INTEGER DEFAULT 1"),
            ("evaluation_criteria", "JSON DEFAULT '[]'"),
            ("hint", "TEXT")
        ],
        "answer_evaluations": [
            ("technical_score", "FLOAT DEFAULT 0.0"),
            ("correctness_score", "FLOAT DEFAULT 0.0"),
            ("relevance_score", "FLOAT DEFAULT 0.0"),
            ("problem_solving_score", "FLOAT DEFAULT 0.0"),
            ("communication_score", "FLOAT DEFAULT 0.0"),
            ("depth_score", "FLOAT DEFAULT 0.0"),
            ("practical_score", "FLOAT DEFAULT 0.0"),
            ("confidence_score", "FLOAT DEFAULT 0.0"),
            ("suggested_ideal_answer", "TEXT")
        ],
        "interview_reports": [
            ("candidate_name", "VARCHAR(100)"),
            ("target_role", "VARCHAR(100)"),
            ("domain", "VARCHAR(100)"),
            ("experience_level", "VARCHAR(50)"),
            ("language", "VARCHAR(50) DEFAULT 'English'"),
            ("hiring_readiness", "VARCHAR(50) DEFAULT 'Needs Improvement'"),
            ("technical_gaps", "JSON DEFAULT '[]'"),
            ("communication_feedback", "TEXT"),
            ("recommended_topics", "JSON DEFAULT '[]'")
        ]
    }

    with engine.connect() as conn:
        for table_name, cols in migrations.items():
            if table_name in inspector.get_table_names():
                existing_cols = {col["name"] for col in inspector.get_columns(table_name)}
                for col_name, col_type in cols:
                    if col_name not in existing_cols:
                        try:
                            alter_stmt = text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type};")
                            conn.execute(alter_stmt)
                            conn.commit()
                            logger.info(f"Migrated SQLite Table [{table_name}]: Added column '{col_name}' ({col_type})")
                        except Exception as e:
                            logger.warning(f"Error altering table {table_name} for column {col_name}: {e}")

def init_db():
    # Import all models to ensure they are registered with Base.metadata
    from app.models import user, resume, interview, system
    Base.metadata.create_all(bind=engine)
    migrate_sqlite_schema()
