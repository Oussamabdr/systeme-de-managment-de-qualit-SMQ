Deployment instructions — Backend (Supabase Postgres) & Frontend (Vercel)

Overview

- Use Supabase for managed Postgres (database only). Keep the existing Node + Prisma backend and connect it to Supabase via `DATABASE_URL`.
- Deploy frontend to Vercel (workflow exists: `.github/workflows/deploy_vercel.yml`).
- The repo includes `render.yaml` if you prefer Render for the backend; either Render or Vercel can host the Node app — ensure `DATABASE_URL` is set in the service env.

Required secrets / env vars

- `DATABASE_URL` — Postgres connection string for Supabase (add to GitHub Secrets and to your host/service env). Used by the new GitHub Action to run Prisma migrations.
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — for the Vercel deploy action (frontend).
- If deploying to Render, configure `DATABASE_URL` and `JWT_SECRET` in the Render service settings.

Steps to deploy

1. Create a Supabase project (if you haven't already). Copy the Postgres connection string (Database -> Connection string) — this is your `DATABASE_URL`.
2. In the GitHub repository, go to Settings → Secrets and variables → Actions and add `DATABASE_URL` (and any other secrets).
3. If using Render for the backend: paste the `DATABASE_URL` in the Render service env variables (render dashboard) and trigger a deploy. `render.yaml` in the repo describes the services.
4. If using Vercel for frontend: ensure `VERCEL_*` secrets are set in GitHub; the existing workflow will deploy the `frontend` directory on push to `main`.
5. The repository now includes a workflow `.github/workflows/prisma-migrate-on-push.yml` that runs `npx prisma migrate deploy` on push to `main` when `DATABASE_URL` is present.

Notes

- If you prefer Supabase Edge Functions instead of running the Node app, we can scaffold function endpoints, but Prisma doesn't run in Edge. The minimal risk path is to keep the Node backend and use Supabase only as the Postgres provider.
- For safety, review the migrations and test them against a dev database before running on production.
