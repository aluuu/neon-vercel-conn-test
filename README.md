# Neon × Vercel connectivity test app

Minimal Next.js app for testing the **Neon Vercel Connect Account / Marketplace
integration** end-to-end. It runs a `SELECT NOW()` query against whatever
`DATABASE_URL` Vercel injects into the deployment and reports the result.

Used to verify LKB-12649 work — that credential env vars Neon writes into
Vercel (DATABASE_URL etc.) work at runtime, and that the Vercel "Production
only" toggle correctly blocks preview deployments from reading them when set.

## Routes

| Route | Purpose |
|---|---|
| `/` | Homepage — runs the DB probe and renders the result, plus env-var presence table |
| `/api/db` | JSON DB probe — `{ ok, durationMs, result: { now, db, user, serverVersion } }` |
| `/api/env` | JSON env-var presence (no values) — useful for confirming which vars the integration wired |

## Why no build-time DB connection

The DB probe runs at **request time only** (`export const dynamic =
"force-dynamic"` on every route). This means `next build` succeeds even when
`DATABASE_URL` points at an unreachable host (e.g., `*.localtest.me` in a
local Tilt setup) — only the runtime request fails if the DB isn't reachable.

## Local dev

```bash
pnpm install   # or npm install / yarn install
DATABASE_URL='postgresql://...' pnpm dev
```

Then `curl http://localhost:3000/api/db`.

## Deploy to Vercel

1. Install the Neon Vercel integration on your Vercel account / team.
2. Create a new Vercel project from this repo.
3. Connect the project to a Neon database via the integration — it'll inject
   `DATABASE_URL` and friends automatically.
4. Deploy. Hit the deployment URL — the homepage should show a successful DB
   probe result.

## Testing the Production-only toggle (LKB-12649)

Once deployed:

1. Hit the production URL → DB probe succeeds.
2. Push a commit to a non-main git branch → preview deployment fires.
3. Hit the preview URL → DB probe still succeeds (default behavior).
4. In Vercel dashboard, toggle the connected Neon resource to "Production only".
5. Trigger another preview deployment.
6. Hit the new preview URL — DB probe should fail (env var hidden), but
   `/api/env` should show `DATABASE_URL` as missing. Confirms the Sensitive
   policy is enforced.

## Stack

- Next.js 15 (App Router)
- `postgres` driver (3.4.x)
- TypeScript

No DB connection at build time, no static generation, minimal deps.
