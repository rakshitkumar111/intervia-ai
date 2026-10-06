# Testing Strategy & Validation Guide

## 1. Test Architecture Overview

The system includes automated test suites covering the database ORM, authentication security, resume parsing, AI question generation, multi-criteria evaluations, and live interview integration flows.

---

## 2. Test Suites

### A. Authentication & Security Tests (`backend/tests/test_auth.py`)
- Direct bcrypt salt hashing and verification.
- JWT token signing, expiration timestamp calculation, and payload decoding.

### B. Resume NLP Extraction Tests (`backend/tests/test_resume.py`)
- Keyword matching against 60+ technology taxonomy.
- Project block extraction and domain classification.

### C. AI Evaluator Tests (`backend/tests/test_ai_evaluator.py`)
- Question plan generation across junior, mid-level, and senior difficulty.
- 6-dimensional scoring boundary checks.
- Dynamic follow-up heuristic triggers.

### D. End-to-End Flow Tests (`backend/tests/test_interview_flow.py`)
- User registration and JWT issuance.
- Interview session initialization.
- Candidate answer submission and scoring.
- Final report synthesis and verdict assignment.

---

## 3. How to Run Automated Tests

### Running Backend Pytest:
```bash
cd backend
python -m pytest -v tests/
```

### Running Frontend Build & Typecheck:
```bash
cd frontend
npm run build
```
