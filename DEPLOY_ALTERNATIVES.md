# Alternative free deployment options

Short guidance to deploy without a credit card.

- Frontend (no card needed):
  - GitHub Pages via the included GitHub Actions workflow (`.github/workflows/deploy-frontend.yml`). It builds `frontend` and publishes `frontend/dist` to the `gh-pages` branch automatically on every push to `main`.
  - Cloudflare Pages / Netlify / Vercel can also host the frontend for free; connect the repository in their UI to auto-deploy.

- Backend (options, may require creating a free account):
  - Vercel (Serverless Functions): connect repo, set `BACKEND_ROOT=backend` and environment variables (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`), then deploy. Vercel's hobby tier typically does not require adding a credit card for GitHub-connected deployments.
  - Supabase: create a free Postgres database and set `DATABASE_URL` for the backend; Supabase free tier does not require a credit card for small projects.
  - PlanetScale (MySQL) + Prisma is another option; PlanetScale has a free tier.

- Minimal quick path (recommended):
  1. Let me deploy the frontend now to GitHub Pages (already added). That requires no external account or card.
  2. If you want the API online, we can prepare a `vercel.json` and lightweight serverless adapter to run the backend's public endpoints on Vercel and connect it to Supabase/PlanetScale for the database.

If you want, I can:
- Enable the GitHub Pages deployment now (commit already pushed). After GitHub Actions runs, I can confirm the Pages URL.
- Prepare `vercel.json` and a serverless adapter for the backend and push it so you can connect the repo to Vercel for a card-free deploy.
