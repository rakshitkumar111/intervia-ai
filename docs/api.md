# REST API Specification

The backend exposes a fully documented RESTful API conforming to OpenAPI 3.0 / Swagger. The interactive Swagger UI is available at `http://localhost:8000/docs`.

---

## 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new candidate account & returns JWT | No |
| `POST` | `/api/auth/login` | Authenticate user credentials & return JWT | No |
| `GET` | `/api/auth/me` | Retrieve profile of authenticated user | Bearer JWT |
| `PUT` | `/api/auth/profile` | Update candidate target role, skills, bio | Bearer JWT |

---

## 2. Resume Processing Endpoints (`/api/resume`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/resume/upload` | Upload PDF/DOCX/TXT and perform NLP analysis | Bearer JWT |
| `GET` | `/api/resume/my-resumes` | Retrieve all resumes uploaded by current user | Bearer JWT |
| `GET` | `/api/resume/{id}` | Get specific resume and extracted skills | Bearer JWT |
| `DELETE`| `/api/resume/{id}` | Delete uploaded resume | Bearer JWT |

---

## 3. Interview Lifecycle Endpoints (`/api/interview`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/interview/create` | Initialize adaptive session & generate plan | Bearer JWT |
| `GET` | `/api/interview/{id}` | Retrieve session state & questions | Bearer JWT |
| `POST` | `/api/interview/{id}/start` | Transition status to `in_progress` | Bearer JWT |
| `POST` | `/api/interview/{id}/answer` | Submit transcript, evaluate & check follow-up | Bearer JWT |
| `POST` | `/api/interview/{id}/complete` | Finalize assessment, score & render PDF | Bearer JWT |
| `GET` | `/api/interview/{id}/report` | Fetch finalized executive report | Bearer JWT |
| `GET` | `/api/interview/report/{id}/download-pdf` | Download formatted assessment PDF | Public / Auth |

---

## 4. Speech & Avatar Viseme Endpoints (`/api/speech`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/speech/viseme-timeline` | Calculates phoneme viseme timestamps for lip-sync | No |
| `POST` | `/api/speech/transcribe` | Server-side audio fallback endpoint | No |

---

## 5. Dashboard & Analytics Endpoints (`/api/dashboard`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Aggregate candidate performance & readiness | Bearer JWT |
| `GET` | `/api/dashboard/recent-interviews` | Recent interview session summaries | Bearer JWT |

---

## 6. Administrative Portal Endpoints (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Global platform metrics & distributions | Admin Role |
| `GET` | `/api/admin/candidates` | List all candidates and individual scores | Admin Role |
| `GET` | `/api/admin/interviews` | Inspect all simulated interview sessions | Admin Role |
| `GET` | `/api/admin/logs` | Security audit trail and system events | Admin Role |
| `POST` | `/api/admin/settings` | Update system configuration variables | Admin Role |
