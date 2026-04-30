# PRE-DEPLOYMENT LOCAL TEST

Run this before deploying to Render.com to verify everything works locally.

## What This Tests

✓ Frontend builds successfully  
✓ Backend dependencies are correct  
✓ Bilingual localization works  
✓ Environment variables are configured  
✓ Git is ready for deployment  

## Prerequisites

- Node.js 20+ installed
- PostgreSQL running locally (for backend testing)
- Git configured and authenticated

## Quick Test Steps

### Test 1: Frontend Production Build (3 min)

```bash
cd frontend
npm install
npm run build
```

Expected: `dist/index.html` created, zero errors

### Test 2: Backend Service Startup (2 min)

```bash
cd ../backend
npm install
npm run db:generate
npm start
```

Expected: "QMS API listening on port 5000"

Press Ctrl+C to stop

### Test 3: Check Localization Files (1 min)

Verify these files exist:
```
frontend/src/store/uiStore.js     ← Language state
frontend/src/utils/i18n.js        ← i18n function
frontend/src/pages/DashboardPage.jsx  ← Bilingual
```

### Test 4: Verify render.yaml (1 min)

Check file exists:
```
render.yaml
```

Content should have:
- `name: iso-qms-api`
- `name: iso-qms-frontend`
- `buildCommand: npm install...`

### Test 5: Git Status (1 min)

```bash
cd ../..
git status
```

Should show: "nothing to commit, working tree clean"

Latest commit should be: "261dff7 chore: Normalize line endings"

## Full Local Test (10 minutes)

Want to test the full stack running locally?

### Terminal 1: Backend

```bash
cd backend
export DATABASE_URL="postgresql://user:password@localhost:5432/qms_dev"
npm start
```

### Terminal 2: Frontend  

```bash
cd frontend
npm run dev
```

### Terminal 3: Test in Browser

Open: http://localhost:5173

Test:
- Page loads
- Click language selector (top right)
- Switch EN/FR
- Page changes language instantly
- Check console (F12) - no errors

## Expected Test Results

| Test | Expected | Status |
|------|----------|--------|
| Frontend build | 1.44s, no errors | ✓ |
| Backend start | "listening on 5000" | ✓ |
| Localization | Files exist, bilingual works | ✓ |
| render.yaml | Both services configured | ✓ |
| Git status | Clean, all committed | ✓ |

## Troubleshooting

**"Cannot find module"**
- Run `npm install` in that directory
- Check Node.js version: `node --version` (should be 20+)

**"Port 5000 already in use"**
- Change to different port: `PORT=5001 npm start`
- Or kill existing process: `lsof -i :5000`

**"DATABASE_URL not set"**
- Local testing is optional - just skip backend test
- Render will provide DATABASE_URL automatically

**"npm ERR! ERESOLVE"**
- Try: `npm install --legacy-peer-deps`

## After These Tests Pass

You're 100% ready to deploy! Proceed to:

👉 **DEPLOY_IMMEDIATELY.md**

---

**Estimated Time:** 10-15 minutes  
**Complexity:** Easy  
**Prerequisites:** Node.js 20+
