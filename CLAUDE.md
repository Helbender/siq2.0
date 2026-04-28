# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**SIQ 2.0 - Sistema Integrado de Qualificações** — full-stack aviation management system for Esquadra 502 (Portuguese Air Force). Manages flights, crew qualifications, and operational data.

## Tech Stack

- **Frontend**: React 19, Vite 7, React Router 7, Chakra UI v3, TanStack React Query, React Hook Form
- **Backend**: Python 3.12+, Flask 3.1+, SQLAlchemy 2.0+, Alembic, Flask-JWT-Extended
- **Database**: PostgreSQL (Supabase in production; local Docker Compose for dev — see `database/`)

## Quick Start

```bash
# Local database (PostgreSQL via Docker)
cd database && docker compose up -d

# Frontend only (requires API running separately)
cd frontend && npm run dev

# Backend only
cd api && uv run python wsgi.py
```

## Development Commands

### Frontend (`cd frontend`)

```bash
npm run dev          # Dev server on :5173
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest watch mode
npm run test:run     # Vitest single run (CI)
```

### Backend (`cd api`)

```bash
uv run python wsgi.py                                        # Start API on :5051
uv run pytest                                                # Run all tests
uv run pytest tests/path/test_file.py::test_name            # Run single test
uv run alembic upgrade head                                  # Apply migrations
uv run alembic revision --autogenerate -m "description"      # Generate migration
uv run alembic downgrade -1                                  # Revert last migration
uv run ruff check app/                                       # Lint
uv run ruff format app/                                      # Format
uv run mypy app/                                             # Type check
```

## Sub-project Guides

- **Frontend**: [`frontend/CLAUDE.md`](frontend/CLAUDE.md) — layer architecture, feature structure, import rules, Chakra v3
- **Backend**: [`api/CLAUDE.md`](api/CLAUDE.md) — layer architecture, RBAC decorators, JWT config

## Core Data Model

The central entities (god nodes by graph connectivity):

- **`Tripulante`** — crew member (pilot or crew); identified by `nip`
- **`TipoTripulante`** — crew type enum (e.g. pilot, tactical controller); determines which qualifications apply
- **`Qualificacao`** — a single qualification definition with validity rules
- **`GrupoQualificacoes`** — groups qualifications by crew type
- **`TripulanteQualificacao`** — junction table linking a crew member to a qualification with expiry/status
- **`Flight`** — a flight record (Modelo 1M format); creating/editing flights triggers qualification reprocessing
- **`FlightPilots`** — many-to-many between flights and crew, stores per-pilot flight stats (VIR, VN, CON times)
- **`FlightAnomaly`** — anomaly descriptions attached to a flight

Qualification validity is computed from flight history. When flights are imported or edited, `reprocess_qualifications` recalculates crew qualification states.

## Feature Domains

Both frontend and backend are organised into the same features:

| Feature | Description | API prefix |
|---------|-------------|------------|
| `auth` | Login, JWT refresh, password reset | `/api/auth` |
| `flights` | Flight CRUD, Modelo 1M import/export, anomaly tracking | `/api/flights` |
| `qualifications` | Qualification catalogue management, reprocessing | `/api/v2` |
| `qualifications-preview` | Expiring quals dashboard (MQP/MQOBP preview) | `/api/qualifications-preview` |
| `crew-qualifications` (FE) / `users` (API) | Crew member management | `/api/users` |
| `dashboard` | Stats, top pilots, date-range summaries | `/api/dashboard` |
| `aircraft_anomalies` | Per-aircraft anomaly aggregation | under `/api/flights` |
| `db-management` | Backup/restore, data export/import | `/api/db-management` |

`aircraft_anomalies` has no own blueprint — its routes live inside `flights/routes.py`. The `qualifications` blueprint registers under `/api/v2` (not `/api/qualifications`).

## RBAC (shared contract)

Role hierarchy (numeric levels, both frontend and backend share these values):

| Role | Level |
|------|-------|
| `SUPER_ADMIN` | 100 |
| `UNIF` | 80 |
| `FLYERS` | 60 |
| `USER` | 40 |
| `READONLY` | 20 |

- Backend enforces via `@require_role(Role.UNIF.level)` / `@require_permission("flights.write")` / `@admin_required` decorators — all in `app/shared/permissions.py`
- Frontend gate: `<Can minLevel={Role.UNIF}>...</Can>` (role-level check) from `@shared/components/Can`
- Permission strings like `"flights.read"` are used in `@require_permission()` and stored in the DB `permissions` table; fall back to role level if not seeded
- Feature names, permission strings, and routes must stay aligned across both sides

## Backend Environment Variables

```
# api/.env
DB_URL=postgresql+psycopg2://user:pass@host:5432/dbname   # direct dev
# Docker Compose uses DB_HOST / DB_PORT / DB_USER / DB_PASS / DB_NAME instead of DB_URL
JWT_KEY=<min 32 chars>
APPLY_CORS=true
DEV=1

# Email (password reset)
SMTP_SERVER=mail.esq502.pt
SMTP_PORT=465          # 465=SSL, 587=TLS
SMTP_USER=noreply@esq502.pt
SMTP_PASSWORD=...

# Google Drive (optional)
ID_PASTA_VOO=<folder-id>
ID_PASTA_PDF=<folder-id>
```

Google Drive requires OAuth credentials at `api/credentials.json`.

## Key Implementation Notes

- **Qualification reprocessing** runs inside `FlightService.reprocess_all_qualifications()` (not in `QualificationService`). It is triggered on every flight create / update / delete.
- **Marshmallow schema fields are camelCase by design** — the API speaks camelCase JSON even though Python code is snake_case. This is intentional; do not "fix" it.
- **Position codes** (`PILOT_USER = ["PI", "PC", "CP", "P", "PA"]`, `CREW_USER = ["OC", "OCI", ...]`) in `api/app/core/config.py` classify crew roles within a flight record.

## graphify

This project has a graphify knowledge graph at `graphify-out/`.

- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
