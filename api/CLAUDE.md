# Backend CLAUDE.md

Python 3.12+ Flask API. Runs on `:5051`.

## Commands

```bash
uv run python wsgi.py                                        # Start API
uv run alembic upgrade head                                  # Apply migrations
uv run alembic revision --autogenerate -m "description"      # Generate migration
uv run alembic downgrade -1                                  # Revert last migration
uv run pytest                                                # Run tests
uv run pytest tests/path/test_file.py::test_name            # Run single test
uv run ruff check app/                                       # Lint
uv run ruff format app/                                      # Format
uv run mypy app/                                             # Type check (strict)
```

## Environment

```
# api/.env
DB_URL=postgresql+psycopg2://user:pass@host:5432/dbname
JWT_KEY=<min 32 chars>
APPLY_CORS=true
DEV=1
```

## Layer Architecture

```
app/features/<feature>/
  routes.py      # HTTP only — no DB, no business logic
  service.py     # Business logic — no HTTP, no direct DB
  repository.py  # SQLAlchemy DB access only
  models.py      # SQLAlchemy models
  schemas.py     # Request/response schemas
  policies.py    # Permission/authorization decorators
```

Each layer is strict — don't mix responsibilities across files.

## RBAC

- Permission enforcement via `@require_role()` and `@admin_required` decorators in `policies.py`
- Permissions align with frontend strings (e.g., `"flights.read"`, `"flights.write"`)

## JWT

- Access token: 15-minute expiry (Bearer header)
- Refresh token: 30-day expiry (cookie `siq2_refresh_token`)
