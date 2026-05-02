# Cloudflare Workers + Pages setup (card-free)

This file explains how to deploy a minimal backend placeholder to Cloudflare Workers and optionally publish the frontend to Cloudflare Pages.

1) Prerequisites
   - Cloudflare account
   - Install `wrangler` CLI: `npm i -g wrangler` or `npm install --global @cloudflare/wrangler`
   - Get your Cloudflare `account_id` from the dashboard

2) Configure `wrangler.toml`
   - Open `wrangler.toml` and replace `REPLACE_WITH_ACCOUNT_ID` with your Cloudflare `account_id`.

3) Deploy the Worker
   - From the repo root run:

```bash
wrangler deploy --name qms-backend-worker
```

   - The included `workers/index.js` provides a `/api/health` endpoint and a placeholder response for other `/api` paths. You will need to implement full API logic or proxy to Supabase/another service for DB-backed endpoints.

4) Optional: Cloudflare Pages for frontend
   - In the Cloudflare Pages dashboard, create a new Pages project and connect your GitHub repo.
   - Set the build output directory to `frontend/dist` or configure build commands to run `npm ci && npm run build` in the `frontend` folder.

Notes and limitations
   - Cloudflare Workers run on V8 isolates (no Node.js built-ins). Prisma is not supported on Workers; use Supabase or an external database and connect via HTTP or an appropriate client that works in Workers.
   - For a full backend, either:
     - Use Supabase (Postgres) + Edge Functions and keep current Prisma code for local/dev, or
     - Host the Node/Prisma backend on a provider that supports Node (Vercel, Render, Railway) and use Workers/Pages as a CDN/proxy layer.

If you want, I can:
- Deploy this Worker for you if you provide a Cloudflare API token with deploy permissions, or
- Convert key backend endpoints to Supabase Edge Functions (I can scaffold them and push to the repo).
