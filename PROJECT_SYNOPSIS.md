# PROJECT SYNOPSIS
## Autonomous AI Virtual Humanoid Interviewer Platform
**A Next-Generation Conversational AI System for Proctored Technical Screening and Automated Candidate Evaluation**

---

### 1. Title of the Project
**Design and Implementation of an Autonomous AI-Powered Virtual Humanoid Interviewer Platform with Multi-Dimensional Evaluation and Recruiter Intelligence**

---

### 2. Introduction & Background
In the contemporary software engineering and IT landscape, technical recruitment is heavily bottlenecked by initial screening interviews. Human-led screening processes require hundreds of hours from senior software architects, suffer from cognitive fatigue, and are inherently prone to subjective evaluation bias.

This project introduces an **Autonomous AI Virtual Humanoid Interviewer**, an enterprise-ready web platform that automates the end-to-end first-round technical assessment. The system presents candidates with a real-time conversational video humanoid interviewer powered by **WebRTC DirectPlayback**, captures verbal speech via in-browser Speech-to-Text (STT), dynamically generates adaptive questions using Google's **Gemini 3.8 Flash** Large Language Model (LLM), and synthesizes comprehensive multi-dimensional diagnostic reports under strict **HireVue-style confidentiality standards**.

---

### 3. Problem Statement
Traditional human-conducted initial screening workflows present several severe limitations:
1. **High Engineering Overhead:** Senior software engineers spend 20–30 hours per month taking repetitive entry-level screening rounds rather than contributing to core production code.
2. **Subjective Human Bias & Inconsistency:** Different interviewers assess candidates across disparate standards, influenced by fatigue, personal biases, and inconsistent difficulty baselines.
3. **Scheduling Friction:** Co-ordinating schedules between global candidates and busy hiring managers introduces 5–14 days of turnaround latency per hiring pipeline.
4. **Data Security & Coaching Leaks:** Existing generic mock interview tools expose internal evaluation rubrics directly to candidates, compromising organizational hiring integrity.

---

### 4. Objectives of the Project
The primary objectives of this project are:
* To develop an interactive, real-time humanoid video interviewer avatar with lip-synchronized speech and audio visualizer feedback.
* To engineer an adaptive question engine powered by **Google Gemini 3.8 Flash** with session memory to prevent question repetition and trigger context-aware follow-ups.
* To implement a **Speech Telemetry Engine** capable of real-time speech transcription, speaking pace measurement (Words Per Minute), and filler vocalization (*um, uh*) tracking.
* To design an **8-Dimensional Cognitive Scoring Matrix** (Technical Depth, Correctness, Relevance, Problem-Solving, Communication, Depth, Practicality, and Confidence).
* To enforce the enterprise **HireVue Protocol**, providing candidates with a formal tracking confirmation code while maintaining strict data isolation from internal diagnostic evaluations.
* To create an automated recruiter dispatch system utilizing **real Gmail SMTP (STARTTLS/SSL)** and **WhatsApp deep links**, coupled with one-click boardroom-ready **PDF report generation**.

---

### 5. Methodology & System Architecture

#### 5.1 System Workflow
1. **Dispatch:** A recruiter defines the target job role, difficulty, and question count. The system generates a cryptographically unique token URL and dispatches it via real Gmail SMTP and WhatsApp (`wa.me`).
2. **Access:** The remote candidate joins instantly over an encrypted Cloudflare HTTPS WAN tunnel without pre-registration friction.
3. **Conversational Interview:** The humanoid interviewer speaks each prompt aloud. The candidate responds verbally via microphone. Web Speech STT transcribes the audio in real-time.
4. **Evaluation:** The Gemini 3.8 Flash engine benchmarks the answer transcript against role-specific technical rubrics across 8 dimensions.
5. **Confidential Submission:** The candidate receives a formal submission confirmation receipt (`HV-***`).
6. **Reporting:** The recruiter portal updates its live leaderboard, dispatches an automated completion email notification, and provides instant downloadable executive PDF reports.

#### 5.2 Architectural Diagram
```
+-------------------------------------------------------------------------+
|                         CANDIDATE INTERFACE                             |
|       React 18 + TypeScript + Web Speech API + WebRTC Video Stream      |
+------------------------------------+------------------------------------+
                                     |  HTTPS / WebSocket
                                     v
+-------------------------------------------------------------------------+
|                        BACKEND API (FastAPI)                            |
|       - JWT Authentication & RBAC (Admin, Recruiter, Candidate)         |
|       - Interview Orchestrator & State Machine                          |
|       - Background Tasks (SMTP Mailer, ReportLab PDF Engine)            |
+------------------+-----------------+-------------------+----------------+
                   |                 |                   |
                   v                 v                   v
      +--------------------+  +--------------+  +--------------------+
      |  Google Gemini     |  | Universal    |  | SQLite /           |
      |  3.8 Flash LLM     |  | Fallback NLP |  | SQLAlchemy 2.0     |
      |  (Cloud Cognitive) |  | (Local Stand)|  | (Relational Store) |
      +--------------------+  +--------------+  +--------------------+
```

---

### 6. Technology Stack

| Layer | Technologies Used |
|---|---|
| **Backend Framework** | Python 3.10, FastAPI, Uvicorn (ASGI) |
| **Object Relational Mapping (ORM)** | SQLAlchemy 2.0, SQLite (`interviewer.db`) |
| **AI Cognitive Services** | Google Gemini 3.8 Flash (`gemini-3.8-flash`), Rule-Based NLP Fallback |
| **Avatar & Streaming Protocol** | D-ID WebRTC DirectPlayback SDK, Local Realistic Female Audio-Visual Avatar |
| **Frontend UI Client** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons |
| **Speech & Audio Services** | HTML5 Web Audio API, Browser Web Speech STT, SpeechSynthesis TTS |
| **Reporting & Document Engine** | Python ReportLab (PDF Generation), Jinja2 |
| **Communication Gateway** | Python `smtplib` (Gmail App Password, STARTTLS 587 / SSL 465), WhatsApp API |
| **Network & Deployment Tunnel** | Cloudflare Quick Tunnel (`cloudflared`), HTTPS WAN Expose |
| **Testing & Quality Assurance** | Pytest (43/43 Passing Tests), TypeScript Compiler (`tsc --noEmit`) |

---

### 7. Key Features & Novelty of the Work
1. **Dual-Layer Cognitive Resilience:** Incorporates a live cloud LLM (Gemini 3.8 Flash) with an automatic 15-second timeout failover to an algorithmic Universal Fallback Engine, ensuring zero interview interruptions during network spikes.
2. **Enterprise Confidentiality Gate:** Complete decoupling of candidate and recruiter data—candidates are restricted from viewing hiring verdicts or scoring metrics to prevent coaching exploitation.
3. **Speech Telemetry & Behavioral Analytics:** Analyzes not only technical content but also speaking pace (WPM), filler frequency, and verbal fluency.
4. **Boardroom-Ready Reporting:** Instantly creates downloadable PDF dossiers detailing strengths, weaknesses, technical gaps, and actionable hiring committee recommendations.

---

### 8. Project Timeline & Phase Milestones

```
+--------------------+-----------------------------------------------+-----------+
| Phase              | Key Deliverables                              | Status    |
+--------------------+-----------------------------------------------+-----------+
| Phase 1: Planning  | Requirement specification & Schema design     | Completed |
| Phase 2: Engine    | FastAPI endpoints & Gemini LLM prompt chains  | Completed |
| Phase 3: Avatar    | WebRTC video avatar & Speech-to-Text client   | Completed |
| Phase 4: Recruiter | Gmail SMTP, WhatsApp links & HireVue security | Completed |
| Phase 5: Audit     | 43/43 Pytest test suite & PDF reporting fix   | Completed |
+--------------------+-----------------------------------------------+-----------+
```

---

### 9. Expected Outcomes & Impact
* **90% Reduction in First-Round Screening Turnaround:** Candidates complete interviews on demand without scheduling overhead.
* **100% Objective Standardized Evaluation:** Consistent rubrics applied across all technical candidates.
* **Engineering Bandwidth Reclamation:** Frees hundreds of engineering hours per recruitment cycle for high-value development work.
* **Comprehensive Recruiter Dashboards:** Real-time visibility into hiring pipelines with verifiable PDF diagnostic records.

---

### 10. References
1. Vaswani, A. et al. (2017). *"Attention Is All You Need."* Advances in Neural Information Processing Systems (NeurIPS).
2. Google DeepMind (2024). *"Gemini 1.5 & Flash Models Technical Report."* Google Research.
3. FastAPI Documentation (2024). *"Modern, Fast (high-performance) Web Framework for Python."* Tiangolo.
4. HireVue Research (2023). *"Enterprise Assessment Standards and AI Proctoring Best Practices."*
5. W3C Web Speech API Specification (2023). *"Speech Recognition and Speech Synthesis Interfaces."*
