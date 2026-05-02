# Vercel + Supabase setup (card-free path)

These steps prepare the repository to deploy the backend on Vercel (serverless functions) and use a free Supabase Postgres database. No credit card is required for typical hobby usage.

1. Connect repository to Vercel
   - Log in to Vercel and import the GitHub repository `Oussamabdr/systeme-de-managment-de-qualit-SMQ`.
   - Vercel will detect the `vercel.json` and the `api/` folder. It will build serverless functions from `api/index.js`.

2. Set Environment Variables (Project Settings → Environment)
   - `DATABASE_URL` — Postgres connection string from Supabase (see below).
   - `JWT_SECRET` — a strong secret for signing JWTs (replace the default).
   - `CORS_ORIGIN` — comma-separated allowed origins (e.g., your GitHub Pages URL or `*` for initial testing).
   - `JWT_EXPIRES_IN` — optional (default `1d`).
   - `UPLOAD_DIR` — optional (default `uploads`). Note: Vercel serverless functions have ephemeral filesystem; use external object storage for persistent uploads.

3. Create a free Postgres database with Supabase
   - Sign up at https://supabase.com and create a new project (free tier). Copy the `DATABASE_URL` (connection string) from Supabase Project Settings → Database → Connection string.
   - Run Prisma migrations locally or in CI to initialize tables. You can run Prisma commands from your machine and push the resulting production database schema to Supabase.

4. Deploy
   - After connecting the repo and setting the env vars, trigger a deployment in Vercel. The `/api` endpoints will be served as serverless functions.

Notes & caveats
   - Serverless functions: file uploads won't persist across invocations. For file storage, use an external provider (S3-compatible or Supabase Storage).
   - Prisma on serverless: consider using connection pooling (pgbouncer) or the Supabase connection pooler to avoid too many connections.
