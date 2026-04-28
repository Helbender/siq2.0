# SIQ 2.0 — Sistema Integrado de Qualificações

Full-stack aviation management system for **Esquadra 502** (Portuguese Air Force). Manages flights, crew qualifications, and operational data.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite 7, React Router 7, Chakra UI v3, TanStack React Query, React Hook Form |
| **Backend** | Python 3.12+, Flask 3.1+, SQLAlchemy 2.0+, Alembic, Flask-JWT-Extended |
| **Database** | PostgreSQL (Supabase) |
| **Hosting** | Render.com (API + frontend as static site) |

## Project Structure

```
siq2.0/
├── api/              # Flask REST API
├── frontend/         # React SPA
├── database/         # Local dev PostgreSQL (Docker Compose)
└── graphify-out/     # Codebase knowledge graph (generated)
```

## Local Development

### Prerequisites

- Node.js 20+, npm
- Python 3.12+, [uv](https://docs.astral.sh/uv/)
- Docker (for local database only)

### 1. Start the local database

```bash
cd database
docker compose up -d
```

### 2. Configure the API

```bash
cp api/.env.example api/.env   # then fill in values
```

Minimum `api/.env`:

```env
DB_URL=postgresql+psycopg2://siq:siq@localhost:5432/siq
JWT_KEY=<at least 32 characters>
APPLY_CORS=true
DEV=1
```

### 3. Run migrations and start the API

```bash
cd api
uv run alembic upgrade head
uv run python wsgi.py          # API on :5051
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev                    # Dev server on :5173, proxies /api → :5051
```

## Commands

### Frontend (`cd frontend`)

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest watch mode
npm run test:run     # Vitest single run (CI)
```

### Backend (`cd api`)

```bash
uv run python wsgi.py                                    # Start API on :5051
uv run pytest                                            # Run all tests
uv run pytest tests/path/test_file.py::test_name        # Run single test
uv run alembic upgrade head                              # Apply migrations
uv run alembic revision --autogenerate -m "description" # New migration
uv run alembic downgrade -1                              # Revert last migration
uv run ruff check app/                                   # Lint
uv run ruff format app/                                  # Format
uv run mypy app/                                         # Type check
```

## Environment Variables

### API (`api/.env`)

```env
# Database
DB_URL=postgresql+psycopg2://user:pass@host:5432/dbname

# Auth
JWT_KEY=<min 32 chars>

# CORS / mode
APPLY_CORS=true
DEV=1

# Email (password reset)
SMTP_SERVER=mail.esq502.pt
SMTP_PORT=465
SMTP_USER=noreply@esq502.pt
SMTP_PASSWORD=...

# Google Drive (optional — PDF/flight log upload)
ID_PASTA_VOO=<folder-id>
ID_PASTA_PDF=<folder-id>
```

Google Drive integration requires OAuth credentials at `api/credentials.json`.

## Feature Domains

| Feature | Description | API prefix |
|---------|-------------|------------|
| `auth` | Login, JWT refresh, password reset | `/api/auth` |
| `flights` | Flight CRUD, Modelo 1M import/export, anomaly tracking | `/api/flights` |
| `qualifications` | Qualification catalogue, reprocessing | `/api/v2` |
| `qualifications-preview` | Expiring quals dashboard (MQP/MQOBP) | `/api/qualifications-preview` |
| `crew-qualifications` / `users` | Crew member management | `/api/users` |
| `dashboard` | Stats, top pilots, date-range summaries | `/api/dashboard` |
| `aircraft_anomalies` | Per-aircraft anomaly aggregation | `/api/flights` |
| `db-management` | Backup/restore, data export/import | `/api/db-management` |

## Further Reading

- [`frontend/CLAUDE.md`](frontend/CLAUDE.md) — frontend layer architecture, feature structure, Chakra v3
- [`api/CLAUDE.md`](api/CLAUDE.md) — backend layer architecture, RBAC decorators, JWT config
- [`frontend/DESIGN.md`](frontend/DESIGN.md) — design system and component conventions
