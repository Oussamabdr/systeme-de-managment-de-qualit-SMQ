# Database Seeding and Login Testing Guide

## Status

- ✅ Backend API: Deployed on Vercel (https://iso-lemon.vercel.app/api)
- ✅ Frontend: Deployed on GitHub Pages
- ✅ Database: Supabase PostgreSQL configured
- ❌ Test Users: Not yet seeded
- ⚠️ CORS Preflight: Vercel infrastructure limitation (OPTIONS requests timeout)

## Step 1: Seed Test Users in Supabase

The following test credentials need to be created in your Supabase database:

**Accounts:**

- Email: `admin@esi.edu` | Password: `Password123!` | Role: ADMIN
- Email: `manager@esi.edu` | Password: `Password123!` | Role: PROJECT_MANAGER
- Email: `member@esi.edu` | Password: `Password123!` | Role: TEAM_MEMBER
- Email: `caq@esi.edu` | Password: `Password123!` | Role: CAQ

**To seed the database:**

1. Go to [Supabase Console](https://supabase.com/dashboard)
2. Select your project (QMS)
3. Click "SQL Editor" → "New Query"
4. Copy and paste the SQL below:

```sql
-- Clear existing data
DELETE FROM "CorrectiveAction";
DELETE FROM "NonConformity";
DELETE FROM "Document";
DELETE FROM "Task";
DELETE FROM "ProjectProcess";
DELETE FROM "Process";
DELETE FROM "Project";
DELETE FROM "User";

-- Insert test users
INSERT INTO "User" ("fullName", "email", "passwordHash", "role", "createdAt", "updatedAt") VALUES
  ('System Admin', 'admin@esi.edu', '$2b$10$Ht57QwGXENAL6CZZ1Lb5ee.iCqCoPAEbpwkDOLIKuNd.X3ottKkCe', 'ADMIN', NOW(), NOW()),
  ('Project Manager', 'manager@esi.edu', '$2b$10$Ht57QwGXENAL6CZZ1Lb5ee.iCqCoPAEbpwkDOLIKuNd.X3ottKkCe', 'PROJECT_MANAGER', NOW(), NOW()),
  ('Team Member', 'member@esi.edu', '$2b$10$Ht57QwGXENAL6CZZ1Lb5ee.iCqCoPAEbpwkDOLIKuNd.X3ottKkCe', 'TEAM_MEMBER', NOW(), NOW()),
  ('Quality Assurance Coordinator', 'caq@esi.edu', '$2b$10$Ht57QwGXENAL6CZZ1Lb5ee.iCqCoPAEbpwkDOLIKuNd.X3ottKkCe', 'CAQ', NOW(), NOW());
```

5. Click "Run" to execute
6. Verify that 4 users were inserted

## Step 2: Test Login via Curl (Verify Database Works)

After seeding, test the login endpoint:

```powershell
curl.exe -i -X POST "https://iso-lemon.vercel.app/api/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@esi.edu","password":"Password123!"}'
```

Expected response:

- **201 Created** with JWT token (successful login)
- or **401 Unauthorized** if password doesn't match

## Step 3: Test Login in Browser (Known Issue)

**⚠️ CORS Preflight Limitation:**
The browser sends an OPTIONS preflight request before the POST request. Currently, Vercel's infrastructure times out on OPTIONS requests. This is a platform limitation, not an application code issue.

**Workarounds:**

1. **Wait for Supabase Edge Functions** (future alternative to Vercel)
2. **Add CORS proxy layer** (nginx/Cloudflare Worker on same origin)
3. **Use Vercel Edge Middleware** (advanced Vercel feature)
4. **Test authentication via API** (use curl/postman until CORS is resolved)

## Current API Endpoints

### Authentication

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user (requires auth token)

### Status

- `GET /api/health` - Health check ✅

### Other

- `GET /api/` - API info
- And all other project management endpoints (protected by auth)

## Token Usage

After successful login, the JWT token will be in the response:

```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": { "id": "...", "email": "admin@esi.edu", ... }
}
```

Use it in subsequent requests:

```
Authorization: Bearer <token>
```

## Next Steps After Seeding

1. Seed database with SQL above
2. Test login with curl (should return 200/201)
3. Copy JWT token from response
4. Use token to access protected endpoints
5. Once CORS is resolved, browser login will work automatically
