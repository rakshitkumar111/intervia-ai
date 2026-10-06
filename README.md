# AI-Powered Humanoid Virtual Interviewer for Intelligent Candidate Assessment

An autonomous, production-grade AI interview platform featuring a **procedural humanoid avatar** with active lip-synchronization, **real-time speech recognition (STT)**, **neural speech synthesis (TTS)**, **resume NLP analysis**, **adaptive dynamic question generation**, **6-dimensional answer evaluation**, and **downloadable PDF assessment reports**.

---

## Key Features

- **Procedural Humanoid Avatar**: 2.5D rigged canvas avatar with realistic eye blinking, gaze tracking, breathing, state animations (`IDLE`, `TALKING`, `LISTENING`, `THINKING`), and speech audio-reactive lip-sync visemes.
- **Dual-Mode Speech Pipeline**: Continuous Speech-to-Text (STT) via Web Speech API and Neural Text-to-Speech (TTS) with realtime audio waveform visualizers.
- **Dynamic AI Interview Engine**: Adapts questions based on candidate role, difficulty (Junior, Mid-Level, Senior), and extracted resume skills. Intelligently injects deep-dive follow-up questions.
- **6-Dimensional Multi-Criteria Scoring**: Evaluates Relevance, Correctness, Technical Depth, Clarity, Completeness, and Confidence.
- **Resume NLP Parser**: Extracts skills, projects, and education from `.pdf`, `.docx`, and `.txt` files.
- **Executive PDF Report Generator**: Generates comprehensive assessment reports with score breakdown, hiring verdicts, strengths, weaknesses, and skill gaps.
- **Role-Based Admin Command Center**: Candidate directory, live session inspection, system audit logs, and platform telemetry.

---

## Quickstart & Demo Credentials

Pre-seeded accounts are ready for instant demonstration:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Candidate Account** | `candidate@interviewer.ai` | `Candidate@12345` |
| **System Administrator** | `admin@interviewer.ai` | `Admin@12345` |

---

## Installation & Running

### 1. Backend (FastAPI + SQLAlchemy)

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
Backend API will be running at `http://127.0.0.1:8000`. Interactive Swagger docs available at `http://127.0.0.1:8000/docs`.

### 2. Frontend (React + TypeScript + Vite + Tailwind)

```bash
cd frontend
npm install
npm run dev
```
Frontend Web application will be running at `http://localhost:5173`.

### 3. One-Click Launch (Windows)

Simply double click `run_project.bat` in the project root directory to launch both Backend and Frontend servers concurrently.

---

## Project Structure

```
ai-humanoid-interviewer/
├── backend/
│   ├── app/
│   │   ├── config.py              # Environment configuration
│   │   ├── database.py            # Database engine & session maker
│   │   ├── main.py                # FastAPI app entry point & seed data
│   │   ├── models/                # SQLAlchemy ORM models (User, Interview, Resume, Logs)
│   │   ├── schemas/               # Pydantic validation schemas
│   │   ├── routes/                # REST API endpoints (Auth, Resume, Interview, Dashboard, Admin, Speech)
│   │   ├── services/
│   │   │   ├── auth_service.py    # Password hashing & JWT tokens
│   │   │   ├── resume_service.py  # PDF/DOCX extraction & skill taxonomy
│   │   │   ├── pdf_service.py     # ReportLab PDF report generator
│   │   │   └── ai/                # AI Provider Abstraction (Gemini, OpenAI, Fallback, Engine)
│   │   └── utils/                 # Security & logging helpers
│   ├── tests/                     # Pytest automated test suite
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── avatar/            # HumanoidAvatar, LipSyncController, AudioWaveform, AvatarControls
│   │   │   ├── interview/         # LiveQuestionCard, SpeechInputArea, CandidateVideoFeed, SessionProgress
│   │   │   ├── dashboard/         # MetricCards, PerformanceRadar, SkillBreakdown, RecentInterviews
│   │   │   ├── admin/             # CandidateTable, SessionInspector, SystemLogsViewer
│   │   │   └── common/            # Navbar, Footer
│   │   ├── pages/                 # Landing, Login, Register, Dashboard, Resume, Setup, Live, Report, Profile, Admin
│   │   ├── services/              # API clients & Web Speech Engine
│   │   ├── context/               # AuthContext & Interview State
│   │   └── types/                 # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── architecture.md            # System architecture & Mermaid flowcharts
│   ├── database.md                # Database ER schema & index design
│   ├── api.md                     # REST API documentation
│   ├── ai-engine.md               # AI scoring mathematical formulas & algorithms
│   ├── testing.md                 # Test plan & automated test execution
│   └── team-contribution.md       # 4-Member project contribution & viva Q&A
├── README.md
└── run_project.bat
```

---

## Running Automated Tests

```bash
# Run backend pytest suite
cd backend
python -m pytest -v tests/

# Run frontend build & TypeScript check
cd frontend
npm run build
```
