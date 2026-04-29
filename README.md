# ISO 9001 Quality Governance Information System

Full-stack web application to manage an ISO 9001 certification project for ESI.

## Technology Stack

- Frontend: React + Vite + Tailwind CSS + Zustand
- Backend: Node.js + Express + JWT
- Database: PostgreSQL + Prisma

## Core Functional Modules

- Authentication and role-based access (`ADMIN`, `PROJECT_MANAGER`, `TEAM_MEMBER`, `CAQ`)
- Process CRUD with objectives, inputs, outputs, KPI indicators, and knowledge items
- Project CRUD with process assignment and status tracking
- Task CRUD linked to process/project + Kanban status flow
- Task-level resource monitoring (planned hours vs actual hours)
- Dashboard analytics (progress, delays, KPI table, charts)
- Document upload and attachment to process/task
- Notifications for overdue tasks and delayed projects
- Corrective actions management to pilot trajectory corrections
- Non-conformities register with CAPA linkage and effectiveness verification before closure

## Information System Positioning

This platform is implemented as a real Information System (SI), not only a task app, because it integrates:

- Organizational actors and governance:
  - Role-based control for `ADMIN`, `PROJECT_MANAGER`, `TEAM_MEMBER`, `CAQ`
  - Lifecycle constraints for CAPA and non-conformities (who can verify/close)
- Process modeling and operational workflows:
  - Process sheets with objectives, inputs, outputs, indicators, and knowledge items
  - Links between processes, projects, tasks, documents, non-conformities, and corrective actions
- Data structuring and traceability:
  - Centralized relational data model (PostgreSQL + Prisma)
  - End-to-end traceability from issue detection to corrective action closure
- Decision support and project steering:
  - Dashboard KPIs, delay detection, critical issues, and prioritized recommended plan (`pilotage`)
  - Corrective action management to support trajectory correction decisions
- Quality and compliance logic:
  - ISO-oriented controls (effectiveness verification required before CAPA closure)
  - Non-conformity closure rules preserving audit trail and evidence consistency

In short, the system supports business processes, decision-making, accountability, and compliance management, which are core characteristics of an Information System project.

## Repository Structure

- `backend` Express API + Prisma schema + seed
- `frontend` React dashboard app

## Recommended Workspace Commands

Run from the workspace root (`iso`):

- Install root tooling: `npm install`
- Start local DB schema sync: `npm run db:push`
- Seed sample data: `npm run seed`
- Start backend + frontend together: `npm run dev`

Notes:

- Backend runs on `http://localhost:5000/api`
- Frontend defaults to `http://localhost:5173`
- If `5173` is already in use, Vite auto-switches to the next free port (for example `5174`)

## Backend Setup

1. Configure environment:
   - Copy `backend/.env.example` to `backend/.env`
   - Update `DATABASE_URL` to your local PostgreSQL instance
2. Install and generate client:
   - `cd backend`
   - `npm install`
   - `npm run db:generate`
3. Run migrations and seed:
   - `npm run db:migrate`
   - `npm run db:seed`
4. Start backend:
   - `npm run dev`

Backend base URL: `http://localhost:5000/api`

## Frontend Setup

1. Configure environment:
   - Copy `frontend/.env.example` to `frontend/.env`
2. Install and run:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

Frontend URL: `http://localhost:5173`

## Production Deployment

Recommended setup:

- Backend API on Render
- Frontend on Vercel
- Managed PostgreSQL (Render Postgres, Neon, Supabase, Railway, etc.)

### 1. Deploy Backend (Render)

The repo includes a Render blueprint file at `render.yaml`.

1. Push this repository to GitHub.
2. In Render, create a new Blueprint and select the repo.
3. Set environment variables for the backend service:
   - `DATABASE_URL`: your managed Postgres connection string
   - `CORS_ORIGIN`: your frontend production URL (for example `https://your-app.vercel.app`)
   - `JWT_SECRET`: strong secret value
   - `JWT_EXPIRES_IN`: recommended `1d`
4. Deploy the service.

After deploy:

- Backend API URL will look like `https://your-backend.onrender.com/api`

### 2. Deploy Frontend (Vercel)

The frontend includes SPA rewrite config at `frontend/vercel.json`.

1. Import the same GitHub repository in Vercel.
2. Set project root directory to `frontend`.
3. Add environment variable:
   - `VITE_API_URL=https://your-backend.onrender.com/api`
4. Deploy.

### 3. Post-deploy Checks

1. Open frontend URL from Vercel.
2. Login using seeded users.
3. Verify API health:
   - `https://your-backend.onrender.com/api/health`
4. Confirm CORS is correct if browser requests are blocked.

### 4. Notes for Production Stability

- Use managed Postgres instead of local Prisma dev DB.
- Keep backend and frontend env vars synchronized (`CORS_ORIGIN`, `VITE_API_URL`).
- If you reseed production, ensure you understand overwrite/duplication effects.

## Demo Users (from seed)

- `admin@esi.edu` / `Password123!` (`ADMIN`)
- `manager@esi.edu` / `Password123!` (`PROJECT_MANAGER`)
- `member@esi.edu` / `Password123!` (`TEAM_MEMBER`)
- `caq@esi.edu` / `Password123!` (`CAQ`)

## Demo Non-Conformity & CAPA Data

After running `npm run seed`, you will get ready-to-test samples:

- Non-Conformities:
  - `Missing calibration evidence for measurement device` (`ANALYSIS`, `HIGH`)
  - `Delayed closure of previous audit findings` (`OPEN`, `MEDIUM`)
- Corrective/Preventive Actions:
  - `Recalibrate affected devices and update registry` (`IN_PROGRESS`, linked to NC)
  - `Introduce monthly NC closure review meeting` (`DONE` + `VERIFIED`, verified by `CAQ`)

## Demo Project, Process & Task Cases

After running `npm run seed`, additional scenarios are created for realistic testing:

- Projects with mixed lifecycle states:
  - `ISO 9001 Certification - ESI` (`IN_PROGRESS`)
  - `Supplier Quality Recovery Program` (`DELAYED`)
  - `Document Control Digitalization` (`COMPLETED`)
  - `Risk and Opportunity Program 2027` (`PLANNED`)
- Processes covering different domains:
  - `Academic Program Management`
  - `Internal Audit Management`
  - `Supplier Evaluation`
  - `Document Control`
  - `Risk and Opportunity Management`
- Tasks with different operational cases:
  - Overdue `TODO` tasks (delay case)
  - `IN_PROGRESS` tasks with `actualHours > plannedHours` (overload case)
  - `DONE` tasks with `completedAt` and effort tracking
  - Future planning tasks on planned projects

## Permission Matrix (Actors)

### ADMIN

- Full read/write on processes, projects, tasks, and documents
- Can delete projects and processes
- Can access global dashboard (`/api/dashboard/overview`) and personal dashboard
- Can view all notifications and all documents

### PROJECT_MANAGER

- Can create/update processes, projects, and tasks
- Can assign processes to projects
- Can delete tasks
- Cannot delete projects/processes
- Can access global dashboard (`/api/dashboard/overview`) and personal dashboard
- Can view all notifications and all documents

### TEAM_MEMBER

- Read access to work data needed for execution
- Task scope is limited to assigned tasks (list/get/kanban)
- Can update only task `status` on assigned tasks
- Cannot create or delete tasks
- Can upload documents only to assigned tasks (no direct process upload)
- Document listing is scoped to own uploads and documents attached to assigned tasks
- Can access only personal dashboard (`/api/dashboard/my-overview`)
- Notifications are scoped to own overdue tasks and assigned delayed projects

## Permission Regression Check

Run from `frontend`:

- `npm run test`

This runs `scripts/check-role-controls.mjs`, a non-regression check to ensure role permissions stay aligned between frontend controls and backend authorization.

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Users

- `GET /api/users`

### Processes

- `GET /api/processes`
- `GET /api/processes/:id`
- `POST /api/processes`
- `PATCH /api/processes/:id`
- `DELETE /api/processes/:id`

### Projects

- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/processes`

### Tasks

- `GET /api/tasks`
- `GET /api/tasks/kanban`
- `GET /api/tasks/:id`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Dashboard

- `GET /api/dashboard/overview` (`ADMIN`, `PROJECT_MANAGER`)
- `GET /api/dashboard/my-overview`

Decision-oriented outputs included:

- `pilotage.decisionHealth` (score, level, underperforming KPI count)
- `pilotage.recommendedPlan` (prioritized action guidance for steering)

### Documents

- `GET /api/documents` (scoped for `TEAM_MEMBER`)
- `POST /api/documents/upload` (multipart form with `file` + `taskId` or `processId`)
  - `TEAM_MEMBER`: `taskId` required and must be assigned to the current user

### Notifications

- `GET /api/notifications`

### Corrective Actions

- `GET /api/corrective-actions`
- `GET /api/corrective-actions/:id`
- `POST /api/corrective-actions`
- `PATCH /api/corrective-actions/:id`
- `DELETE /api/corrective-actions/:id`

ISO closure rule:

- A corrective action cannot be closed (`DONE`) unless root cause, effectiveness criteria, and effectiveness verification are completed by `ADMIN` or `CAQ`.
- The verifier (`verifiedById`) must be a user with role `ADMIN` or `CAQ`.

### Non-Conformities

- `GET /api/non-conformities`
- `GET /api/non-conformities/:id`
- `POST /api/non-conformities`
- `PATCH /api/non-conformities/:id`
- `DELETE /api/non-conformities/:id`

ISO non-conformity lifecycle rules:

- A non-conformity can be closed only when all linked CAPA actions are `DONE` and `VERIFIED`.
- A non-conformity with linked CAPA actions cannot be deleted (traceability preservation).

## Notes

- Migration/seed requires a running PostgreSQL database.
- Uploaded files are stored in `backend/uploads` and served via `/uploads/...`.
