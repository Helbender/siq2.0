# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**SIQ 2.0 - Sistema Integrado de Qualificações** — full-stack aviation management system for Esquadra 502 (Portuguese Air Force). Manages flights, crew qualifications, and operational data.

## Tech Stack

- **Frontend**: React 19, Vite 7, React Router 7, Chakra UI v3, TanStack React Query, React Hook Form
- **Backend**: Python 3.12+, Flask 3.1+, SQLAlchemy 2.0+, Alembic, Flask-JWT-Extended
- **Database**: PostgreSQL (direct dev) or MySQL 5.7 (Docker Compose)

## Quick Start

```bash
# Full stack (API :5051 + frontend :5173 + MySQL :3306)
docker-compose up -d

# Frontend only (requires api running separately)
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

| Feature | Description |
|---------|-------------|
| `auth` | Login, JWT refresh, password reset |
| `flights` | Flight CRUD, Modelo 1M import/export, anomaly tracking |
| `qualifications` | Qualification catalogue management, reprocessing |
| `qualifications-preview` | Expiring quals dashboard (MQP/MQOBP preview) |
| `crew-qualifications` (FE) / `users` (API) | Crew member management |
| `dashboard` | Stats, top pilots, date-range summaries |
| `aircraft_anomalies` | Per-aircraft anomaly aggregation |
| `db-management` | Backup/restore, data export/import |

## RBAC (shared contract)

- Permissions are **strings** (e.g., `"flights.read"`, `"flights.write"`), never roles
- Frontend checks permissions via `<Can>` component; backend enforces via `@require_role()` / `@admin_required` decorators in `policies.py`
- Feature names, permission strings, and routes must stay aligned across both sides

## Google Drive Integration

Optional: set `ID_PASTA_VOO` and `ID_PASTA_PDF` env vars. Flight JSON and PDF reports can be pushed to Drive. Requires OAuth credentials at `api/credentials.json`.

## graphify

This project has a graphify knowledge graph at `graphify-out/`.

- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
