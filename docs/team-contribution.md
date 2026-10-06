# Four-Member Team Architecture & Viva Defense Guide

This project is structured modularly to demonstrate clear division of labor and individual accountability suitable for B.Tech final-year viva defense.

---

## 1. Member Responsibilities & Module Ownership

| Member | Primary Focus Area | Key Modules & Deliverables |
| :--- | :--- | :--- |
| **Member 1** | **Frontend UI/UX & Live Stage** | React 18 + TypeScript, Tailwind CSS, 3-Column Live Interview Stage, Candidate & Admin Dashboards, Recharts Visualizations. |
| **Member 2** | **Backend & Database Infrastructure** | FastAPI REST Framework, SQLAlchemy Models, SQLite/PostgreSQL, JWT Authentication, Security, Admin & Candidate APIs. |
| **Member 3** | **AI Interview Engine & NLP** | Resume Parsing Service, Multi-Criteria Answer Scoring (6 Dimensions), Adaptive Question Generator, Dynamic Follow-Up Engine. |
| **Member 4** | **Avatar, Speech & Analytics** | Canvas Rigged Humanoid Avatar, Lip-Sync Viseme Controller, Web Speech STT/TTS, ReportLab PDF Generator, Testing Suite. |

---

## 2. Viva Defense Questions & Technical Answers

### Q1: How does the virtual interviewer achieve lip-synchronization with spoken speech?
**Answer**: When a question is synthesized via Web Speech Synthesis, the backend generates phonetic viseme timestamps via `/api/speech/viseme-timeline`. The frontend `LipSyncController` interpolates mouth width, open height, roundness, and lip tension using linear interpolation ($\alpha = 0.35$). Furthermore, during live speech, audio frequencies are analyzed in real-time to modulate mouth amplitude.

### Q2: How does the system generate dynamic follow-up questions?
**Answer**: After every answer turn, the AI engine evaluates the candidate's response. If the response contains ambiguities, is too brief ($W < 7$), or mentions pivotal architectural concepts (e.g. *Polymorphism, Hash Map, MVCC, Transactions*), the AI engine formulates a targeted follow-up question, increments total questions, and shifts remaining questions dynamically.

### Q3: How are candidate answers evaluated?
**Answer**: Rather than relying on simple string matching, the evaluator computes six independent dimension scores (Relevance, Correctness, Technical Depth, Clarity, Completeness, Confidence) and calculates a weighted composite score ($S_{composite}$). It also produces constructive feedback, identifies missing concepts, and synthesizes an executive hiring recommendation.

### Q4: How is resume parsing implemented?
**Answer**: The system accepts PDF, DOCX, and TXT files. `pypdf` and `pdfplumber` extract the text stream, which is processed by NLP regex matching against a comprehensive technology taxonomy. Extracted skills, academic degrees, and project titles are saved to the candidate's profile and utilized to personalize interview questions.
