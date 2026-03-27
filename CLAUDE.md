# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SIQ 2.0 - Sistema Integrado de Qualificações** — a full-stack aviation management system for Esquadra 502 (Portuguese Air Force) that manages flights, crew qualifications, and operational data.

## Development Commands

### Frontend (`frontend/`)

```bash
npm run dev          # Dev server on :5173 (proxies /api → :5051)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run (CI)
npm run preview      # Preview production build
```

### Backend (`api/`)

```bash
python wsgi.py                                        # Start API on :5051
alembic upgrade head                                  # Apply migrations
alembic revision --autogenerate -m "description"      # Generate migration
pytest                                                 # Run tests
ruff check api/                                        # Lint
ruff format api/                                       # Format
mypy api/                                              # Type check (strict)
```

### Full stack via Docker

```bash
docker-compose up -d   # Start API + frontend + MySQL (ports 5051, 5173, 3306)
```

A separate `database/docker-compose.yml` spins up PostgreSQL only (port 5432).

## Environment Variables

**`api/.env`** (required):
```
DB_URL=postgresql+psycopg2://user:pass@host:5432/dbname
JWT_KEY=<min 32 chars>
APPLY_CORS=true
DEV=1
```

**`frontend/.env`** (required):
```
VITE_API_URL=http://localhost:5051/api
```

## Architecture

### Tech Stack

- **Frontend**: React 19, Vite 7, React Router 7, Chakra UI v3, TanStack React Query, React Hook Form
- **Backend**: Python 3.12+, Flask 3.1+, SQLAlchemy 2.0+, Alembic, Flask-JWT-Extended

### Frontend Layer Responsibilities

The frontend is divided into four strict layers:

| Layer | Path | Responsibility |
|-------|------|----------------|
| **App** | `src/app/` | Router (`createBrowserRouter` lives here only), providers, env config |
| **Layout** | `src/layout/` | Visual chrome (Header, Sidebar, Navbar). No data fetching, no permission checks. |
| **Features** | `src/features/<name>/` | Complete business domain ownership |
| **Shared** | `src/shared/` | Generic reusable code with zero domain knowledge |

### Feature Structure (mandatory)

```
src/features/<feature>/
  api/
    queries/          # React Query hooks
    mutations/        # React Query mutations
    <feature>.service.ts  # HTTP calls (Axios only)
  components/
  hooks/
  pages/
  forms/              # For React Hook Form with 15+ fields
  mappers/
  permissions.ts      # Permission string constants
  routes.ts
  index.ts            # PUBLIC API — only file external code may import from
```

### Feature Public API (critical rule)

External code **must** import from the feature index only:

```js
// Correct
import { FlightsPage } from "@/features/flights"

// Forbidden — internal paths are private
import FlightsPage from "@/features/flights/pages/FlightsPage"
```

### Data Fetching

- All HTTP calls live in `features/<feature>/api/<feature>.service.ts`
- Pages/components use React Query hooks from `api/queries/` and `api/mutations/`
- `fetch()` or `axios()` inside components or layouts is forbidden
- Layouts must never call data-fetching hooks

### RBAC

- Permissions are **strings** (e.g., `"flights.read"`, `"flights.write"`), never roles
- Frontend checks permissions, not roles
- Each feature defines its permission strings in `permissions.ts`
- Backend enforces via `@require_role()` and `@admin_required` decorators in `policies.py`
- Frontend and backend feature names, permissions, and routes must stay aligned

### Backend Layer Responsibilities

```
api/app/features/<feature>/
  routes.py      # HTTP only — no DB, no business logic
  service.py     # Business logic — no HTTP, no direct DB
  repository.py  # SQLAlchemy DB access only
  models.py      # SQLAlchemy models
  schemas.py     # Request/response schemas
  policies.py    # Permission/authorization decorators
```

### JWT

- Access token: 15-minute expiry (Bearer header)
- Refresh token: 30-day expiry (cookie `siq2_refresh_token`)

### Vite Path Aliases

`@` → `src/`, `@features` → `src/features/`, `@shared` → `src/shared/`, `@layout` → `src/layout/`, `@app` → `src/app/`

### Theme

Glass Admin design system lives in `frontend/src/theme2/` with semantic tokens, color palettes, and Chakra UI component recipes (button, badge, card, sidebar, etc.).

## Chakra UI v3 Reference

Full Chakra UI v3 API docs are in `frontend/docs/llms-full.txt`. Read this file before writing any Chakra UI component code.
