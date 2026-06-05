# FinNova

A mobile-first financial management and CEO mindset app for Bangladeshi undergraduate students. Helps users track allowances, control spending, save money, learn financial literacy, and develop a unicorn founder mindset.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/finnova run dev` — run the frontend (port 23742)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Recharts + Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB tables: `allowance.ts`, `expenses.ts`, `goals.ts`
- `artifacts/api-server/src/routes/` — Express route handlers per domain
- `artifacts/finnova/src/` — React frontend, pages in `src/pages/`
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — auto-generated Zod schemas (do not edit)

## Architecture decisions

- OpenAPI-first: all API contracts defined in `openapi.yaml`, types generated with Orval
- All amounts stored as `numeric` in PostgreSQL to avoid floating point issues
- Date columns use PostgreSQL `date` type with `mode: "string"` — filter with `gte`/`lt`, not `LIKE`
- Lessons and achievements are static server-side content (no DB table needed)
- Achievement unlocking is computed dynamically from DB state on each request

## Product

- **Dashboard**: live monthly balance, spending vs allowance, category breakdown pie chart, savings metrics
- **Expenses**: log and filter daily expenses by category and month
- **Budget**: set monthly allowance divided into food, transport, savings, study, personal
- **Goals**: savings goals with progress tracking
- **Learn**: 10 financial literacy lessons + 10 CEO mindset lessons from top founders
- **Achievements**: 10 badges that unlock automatically based on real usage

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- PostgreSQL `date` columns cannot use `LIKE` — use `gte`/`lt` with `YYYY-MM-DD` strings
- After any OpenAPI spec change, always run `pnpm --filter @workspace/api-spec run codegen` before building

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
