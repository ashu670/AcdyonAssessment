# AcdyonAssessment — Resilient Multi-Source Job Ingestion System

A resilient multi-source job ingestion engine. Ingests live job postings directly from public ATS endpoints (**Greenhouse**, **Lever**, **Ashby**), normalizes them into a common schema, handles failures gracefully with circuit breakers, and provides an interactive failure simulation sandbox and dashboard.

> **No fake data. No mocks. Every job ingested comes from live, publicly accessible ATS job board endpoints.**

---

## Phase 2 Multi-Source Architecture

```
                               ┌────────────────────────────────────────────────────────┐
                               │                AcdyonAssessment Core                 │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                ┌──────────▼───────────┐
                                                │ Source Orchestrator  │
                                                └──────────┬───────────┘
                                                           │
                                               Try sources in priority
                                                  order with health &
                                                   circuit breakers
                                                           │
                      ┌────────────────────────────────────┼────────────────────────────────────┐
                      ▼                                    ▼                                    ▼
              Priority 1 Source                    Priority 2 Source                    Priority 3 Source
           Greenhouse Public API                    Lever Public API                    Ashby Public API
           (boards-api.greenhouse.io)             (api.lever.co/v0/postings)         (api.ashbyhq.com/posting-api)
                 [stripe]                             [spotify]                            [linear]
                      │                                    │                                    │
           ┌──────────┴──────────┐              ┌──────────┴──────────┐              ┌──────────┴──────────┐
           │  GreenhouseAdapter  │              │    LeverAdapter     │              │    AshbyAdapter     │
           └──────────┬──────────┘              └──────────┬──────────┘              └──────────┬──────────┘
                      │                                    │                                    │
                 (If 429/Timeout)                     (If 500/Timeout)                      │
                      └──────────────────┬─────────────────┘                                    │
                                         ▼                                                      │
                                 Automatic Fallback                                             │
                                         │                                                      │
                                         └─────────────────────────┬────────────────────────────┘
                                                                   │
                                                           Normalised Job Data
                                                                   │
                                                        ┌──────────▼───────────┐
                                                        │  Ingestion Service   │
                                                        └──────────┬───────────┘
                                                                   │ Deduplication & Content Hash
                                                        ┌──────────▼───────────┐
                                                        │    PostgreSQL 18     │
                                                        │ (Job, IngestionRun,  │
                                                        │  SourceHealth tables)│
                                                        └──────────────────────┘
```

---

## Key Features

1. **Pluggable Source Adapters**: `GreenhouseAdapter`, `LeverAdapter`, and `AshbyAdapter` implement the unified `SourceAdapter` base class.
2. **Automatic Fallback Chain**: Sequential priority execution (`Greenhouse` ➔ `Lever` ➔ `Ashby`). If a primary source fails, the orchestrator seamlessly falls back to the next permitted source.
3. **Circuit Breakers**: Per-source circuit breakers prevent resource waste on degraded endpoints:
   - **Threshold**: 3 consecutive failures opens the circuit (`CIRCUIT_OPEN`).
   - **Cooldown**: 60-second cooldown period.
   - **Self-Healing**: Automatically performs a `HALF_OPEN` trial request upon cooldown expiry.
4. **Audit History & Observability**: Every execution records an `IngestionRun` entry in PostgreSQL with per-source outcome timestamps, job counts, HTTP statuses, and duration.
5. **Interactive Failure Sandbox**: Built-in developer simulation panel to test live failover scenarios (`Timeout`, `HTTP 429`, `HTTP 500`, `Network Error`, `Schema Error`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 22, Express 4 |
| ORM & Database | Prisma 5 + PostgreSQL 18 |
| Logging | Pino structured logging |
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| ATS Sources | Greenhouse API (`stripe`), Lever API (`spotify`), Ashby API (`linear`) |

---

## Setup & Running Instructions

### 1. Configure Environment Variables
Edit `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:Password123@localhost:5432/AcdyonAssessment"
PORT=3001
GREENHOUSE_BOARD_TOKEN=stripe
LEVER_BOARD_TOKEN=spotify
ASHBY_BOARD_TOKEN=linear
GREENHOUSE_API_TIMEOUT_MS=10000
LEVER_API_TIMEOUT_MS=10000
ASHBY_API_TIMEOUT_MS=10000
CIRCUIT_BREAKER_THRESHOLD=3
CIRCUIT_BREAKER_COOLDOWN_MS=60000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
```

### 2. Database Migration
```bash
cd backend
npx prisma migrate dev --name add_ingestion_history
```

### 3. Run Backend & Frontend
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Dashboard accessible at `http://localhost:5173`.

---

## REST API Endpoints

### Orchestrated Ingestion & Health
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ingestion/run` | Triggers multi-source fallback ingestion |
| `GET` | `/api/ingestion/runs` | Returns paginated run history with per-source attempts |
| `GET` | `/api/ingestion/runs/:id` | Returns single run details |
| `GET` | `/api/ingestion/health` | Returns real-time `SourceHealth` & circuit breaker state |

### Jobs API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs` | Paginated, filterable job listings (`search`, `location`, `company`) |
| `GET` | `/api/jobs/search` | Alias for keyword search (`q=...`) |
| `GET` | `/api/jobs/:id` | Single job details |

### Failure Simulation Sandbox (Dev Mode)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sandbox/override` | Inject failure (`sourceType`, `failureType`, `status`) |
| `DELETE` | `/api/sandbox/override/:source` | Clear override for specific source |
| `DELETE` | `/api/sandbox/overrides` | Clear all active overrides |
| `GET` | `/api/sandbox/overrides` | Fetch active overrides |

---

## Live Assessment Demo Scenarios

### Scenario A: Standard Execution (Greenhouse Priority 1)
```bash
curl -X POST http://localhost:3001/api/ingestion/run
```
*Greenhouse succeeds and ingests Stripe jobs.*

### Scenario B: Simulated Failover (Greenhouse 429 ➔ Lever Timeout ➔ Ashby Success)
```bash
# 1. Force Greenhouse into Rate Limited (429)
curl -X POST http://localhost:3001/api/sandbox/override \
  -H "Content-Type: application/json" \
  -d '{"sourceType":"greenhouse","failureType":"http_error","status":429}'

# 2. Force Lever into Timeout (504)
curl -X POST http://localhost:3001/api/sandbox/override \
  -H "Content-Type: application/json" \
  -d '{"sourceType":"lever","failureType":"timeout"}'

# 3. Execute Run
curl -X POST http://localhost:3001/api/ingestion/run
```
*Greenhouse fails (429), Lever fails (504), Ashby succeeds and ingests Linear jobs.*

### Scenario C: Circuit Breaker Trip
- Trigger 3 failures on a source.
- Observe status changing to `CIRCUIT_OPEN`.
- Next run skips the source instantly without making outbound HTTP calls until the 60-second cooldown expires.

---

## Production Deployment (Vercel + Render)

### Frontend (Vercel)
- **Framework**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**:
  ```env
  VITE_API_URL=https://<render-backend-url>.onrender.com
  ```

### Backend (Render)
- **Framework**: Node.js / Express
- **Root Directory**: `backend`
- **Environment Variable**:
  ```env
  FRONTEND_ORIGIN=https://<vercel-frontend-url>.vercel.app
  ```

### Database
- **Provider**: Render PostgreSQL

