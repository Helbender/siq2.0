# CLAUDE.md

**SIQ 2.0 - Sistema Integrado de Qualificações** — full-stack aviation management system for Esquadra 502 (Portuguese Air Force). Manages flights, crew qualifications, and operational data.

## Tech Stack

- **Frontend**: React 19, Vite 7, React Router 7, Chakra UI v3, TanStack React Query, React Hook Form
- **Backend**: Python 3.12+, Flask 3.1+, SQLAlchemy 2.0+, Alembic, Flask-JWT-Extended

## Quick Start

```bash
# Full stack
docker-compose up -d   # API + frontend + MySQL (ports 5051, 5173, 3306)

# Database only
cd database && docker-compose up -d   # PostgreSQL on :5432
```

## Sub-project Guides

- **Frontend**: [`frontend/CLAUDE.md`](frontend/CLAUDE.md)
- **Backend**: [`api/CLAUDE.md`](api/CLAUDE.md)

## RBAC (shared contract)

- Permissions are **strings** (e.g., `"flights.read"`, `"flights.write"`), never roles
- Frontend checks permissions; backend enforces them
- Feature names, permission strings, and routes must stay aligned across both sides

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
