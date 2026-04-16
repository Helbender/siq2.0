# Frontend CLAUDE.md

React 19 + Vite 7 SPA. Dev server on `:5173`, proxies `/api` → `:5051`.

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest watch mode
npm run test:run     # Vitest single run (CI)
npm run preview      # Preview production build
```

## Environment

```
# frontend/.env
VITE_API_URL=http://localhost:5051/api
```

## Layer Architecture

| Layer        | Path                   | Responsibility                                                                   |
| ------------ | ---------------------- | -------------------------------------------------------------------------------- |
| **App**      | `src/app/`             | Router (`createBrowserRouter` lives here only), providers, env config            |
| **Layout**   | `src/layout/`          | Visual chrome (Header, Sidebar, Navbar). No data fetching, no permission checks. |
| **Features** | `src/features/<name>/` | Complete business domain ownership                                               |
| **Shared**   | `src/shared/`          | Generic reusable code with zero domain knowledge                                 |

## Feature Structure (mandatory)

```
src/features/<feature>/
  api/
    queries/              # React Query hooks
    mutations/            # React Query mutations
    <feature>.service.ts  # HTTP calls (Axios only)
  components/
  hooks/
  pages/
  forms/                  # React Hook Form (15+ fields)
  mappers/
  permissions.ts          # Permission string constants
  routes.ts
  index.ts                # PUBLIC API — only file external code may import from
```

## Critical Rules

**Public API imports only** — external code must import from `index.ts`:

```ts
// Correct
import { FlightsPage } from "@/features/flights";

// Forbidden
import FlightsPage from "@/features/flights/pages/FlightsPage";
```

**Data fetching** — all HTTP calls in `<feature>.service.ts`; components use React Query hooks; `fetch()`/`axios()` inside components or layouts is forbidden; layouts must never call data-fetching hooks.

**RBAC** — each feature defines permission strings in `permissions.ts`; check permissions, not roles.

## Path Aliases

`@` → `src/`, `@features` → `src/features/`, `@shared` → `src/shared/`, `@layout` → `src/layout/`, `@app` → `src/app/`

## Theme

Glass Admin design system in `src/theme2/` — semantic tokens, color palettes, Chakra UI component recipes (button, badge, card, sidebar, etc.).

## Design System

Always refer to `DESIGN.md` before creating or modifying any UI component, page, or layout. When generating new UI elements, ensure they follow the design tokens, component patterns, and visual language documented in `DESIGN.md`. Never introduce new colors, spacing values, typography styles, or component variants that are not already defined there. If a design decision is not covered by `DESIGN.md`, ask before proceeding.

## Chakra UI v3

Full API docs in `docs/llms-full.txt`. Read before writing any Chakra UI component code.
