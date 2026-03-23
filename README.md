# LogSentinel AI

A full-stack cybersecurity application that allows SOC analysts to upload log files, automatically parse and analyze them using AI, and surface threats, anomalies, and indicators of compromise in a clean dashboard interface.

**Live demo:** https://log-sentinel-ai-491001.web.app

---

## What it does

LogSentinel accepts `.log` and `.txt` files, extracts structured events from every line, and sends them to an LLM for security analysis. The result is a ranked findings report with severity classifications, confidence scores, a chronological event timeline, and extracted IOCs — delivered in under a minute.

Supported log formats include auth logs, web server logs, application logs, firewall logs, and ZScaler web proxy logs.

---

## AI approach

### How the AI is used

LogSentinel uses a two-stage pipeline:

**Stage 1 — Parsing (deterministic)**
The backend parser extracts objective fields from each log line: timestamps, IP addresses with ports, and raw event text. No security judgments are made at this stage — the parser is intentionally dumb. Full raw lines are preserved so the LLM has complete context.

**Stage 2 — Analysis (LLM)**
Structured events are sent to OpenAI's GPT-4o-mini with a carefully engineered system prompt. The LLM acts as a senior SOC analyst — it reads the full log, correlates events across sessions, and returns a structured JSON response containing:

- `summary` — a 2-4 sentence analyst threat brief
- `findings[]` — ranked security concerns with severity (critical/warning/info) and a confidence score (0.0–1.0)
- `iocs[]` — indicators of compromise with type, value, and context
- `timeline[]` — every notable event in chronological order

**Chunking for large files**
Log files exceeding ~400 events are split into chunks. Each chunk is analyzed independently, then a second LLM call merges the results into a single coherent analysis — deduplicating findings and building a unified timeline.

**Why LLM over rules-based detection**
A rules-based approach requires enumerating every possible attack pattern in advance. An LLM can reason about context, correlate events across sessions, and identify novel attack chains without being pre-programmed. For example, it can recognize that a brute force attempt followed by a successful login followed by `wget` from an external IP is a connected incident — not three separate events.

### Anomaly detection and confidence scores

Every finding includes a confidence score representing the LLM's certainty that the activity is genuinely malicious:

- `0.90–1.00` — high confidence, strong evidence
- `0.70–0.89` — suspicious, warrants investigation  
- `0.50–0.69` — uncertain, possible false positive

The LLM is instructed to correlate events rather than flag individual lines — a brute force that results in a successful login is rated more severely than one that doesn't. Each finding includes specific technical details (exact commands, IPs, usernames, timestamps) explaining why it was flagged.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | FastAPI (Python) |
| Database | PostgreSQL on GCP Cloud SQL |
| AI | OpenAI GPT-4o-mini |
| Frontend hosting | Firebase Hosting |
| Backend hosting | GCP Cloud Run |
| CI/CD | GitHub Actions |

---

## Local setup

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL database (local or remote)
- OpenAI API key

### 1. Clone the repository

```bash
git clone https://github.com/mickdbf/log-sentinel-ai.git
cd log-sentinel-ai
```

### 2. Backend setup

Create and activate a virtual environment:

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Mac/Linux)
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=logsentinel
DB_USER=your_db_user
DB_PASSWORD=your_db_password
SECRET_KEY=your_secret_key_here
OPENAI_API_KEY=sk-...
FRONTEND_URL=http://localhost:5173
```

Generate a secret key:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Initialize the database:

```bash
python -m app.db.init_db
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### 3. Frontend setup

```bash
cd Frontend
npm install
```

Create a `.env` file in the `Frontend/` folder:

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Docker (alternative backend setup)

Build and run the backend with Docker:

```bash
docker build -t logsentinel-api .
docker run -p 8080:8080 --env-file .env logsentinel-api
```

---

## Project structure

```
log-sentinel-ai/
├── app/
│   ├── auth/
│   │   ├── router.py       # JWT auth endpoints (register, login)
│   │   ├── schemas.py      # Pydantic models
│   │   └── utils.py        # bcrypt + JWT helpers
│   ├── analysis/
│   │   ├── router.py       # POST /analysis/upload, GET /analysis/history
│   │   ├── parser.py       # Log file parser — extracts structured fields
│   │   ├── llm.py          # OpenAI integration, chunking, merging
│   │   └── schemas.py      # Analysis response models
│   └── db/
│       ├── database.py     # SQLAlchemy engine setup
│       ├── models.py       # User, Log, Analysis tables
│       └── init_db.py      # Database initialization
├── Frontend/
│   └── src/
│       ├── components/
│       │   └── Navbar.tsx  # Global navbar with auth modal
│       └── pages/
│           ├── SplashPage.tsx  # Landing page
│           └── Dashboard.tsx   # Main analyst dashboard
├── Dockerfile
├── requirements.txt
└── README.md
```

---

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT token |
| POST | `/analysis/upload` | Upload and analyze a log file |
| GET | `/analysis/history` | Get past analyses for current user |
| GET | `/health` | Health check |

All `/analysis` endpoints require a Bearer token in the Authorization header.

---

## Example log files

The `example_logs/` directory contains sample log files for testing:

| File | Type | Contains |
|---|---|---|
| `testlog.txt` | Auth log | Simple brute force attempt |
| `test_complex.log` | Auth log | Multi-stage attack — brute force, compromise, exfiltration |
| `auth_lateral.log` | Auth log | Lateral movement — backdoor key, new privileged user |
| `webserver_short.log` | Web server log | Web scanner probing for vulnerabilities |
| `proxy_large.log` | Web proxy log | Insider threat — data exfiltration via proxy |
| `app_errors.log` | Application log | SQL injection + account takeover chain |
| `zscaler_proxy.log` | ZScaler proxy log | C2 beaconing, malware downloads, exfiltration |
| `mixed_threats.log` | Auth log | Cron persistence, web shell, reverse shell, log wiping |
| `normal_activity.log` | Auth log | Clean log — normal business activity, no threats |

---

## Deployment

The application is deployed on GCP:

- **Frontend** → Firebase Hosting (`https://log-sentinel-ai-491001.web.app`)
- **Backend** → GCP Cloud Run (`https://logsentinel-api-584409740995.us-central1.run.app`)
- **Database** → GCP Cloud SQL (PostgreSQL)

CI/CD is handled by GitHub Actions — pushing to the `prod` branch triggers an automatic build and deploy of both frontend and backend.
