# Supabase Edge Functions scaffold

This folder contains a minimal `health` function for Supabase Edge Functions.

Current architecture:

- Keep the existing Node + Prisma backend as the main API.
- Use Supabase for managed Postgres (`DATABASE_URL`).
- This function is only a starter scaffold; it is not wired into the app yet.

To deploy this later with the Supabase CLI, run `supabase init` at the repository root and then deploy functions from the `supabase/functions` directory.
