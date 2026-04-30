# 🚀 DEPLOY IN 60 SECONDS

## What You're Deploying
✅ Complete bilingual (FR/EN) ISO 9001 QMS application
✅ React frontend + Node.js backend
✅ All code committed and pushed to GitHub
✅ All environment configured
✅ Production build tested

## 3 Steps to Deploy

### 1️⃣ Go to Render.com
```
https://dashboard.render.com
```

### 2️⃣ Create From Blueprint
- Click **"New +"** → **"Blueprint"**
- Click **"Connect Repository"**
- Authorize GitHub (if needed)
- Select this repository
- Click **"Deploy"**

*That's it! Render auto-detects `render.yaml` and deploys both services.*

### 3️⃣ Wait 4-6 Minutes
- Renders shows build logs in real-time
- Look for: ✅ Backend deployed + ✅ Frontend deployed
- You get two URLs at the end:
  - Backend: `https://iso-qms-api-xxxx.render.com`
  - Frontend: `https://iso-qms-frontend-xxxx.render.com`

---

## Test Your Live App

1. **Open Frontend URL** in browser
2. **Test Language Switching** (FR/EN selector)
3. **Try Login** → Check for "Console de Projet SGQ" title
4. **Navigate to Dashboard** → Should be bilingual
5. **Check Network Tab** → API calls should work

---

## If Something Goes Wrong

❌ **Backend build fails:** Check `DATABASE_URL` environment variable  
❌ **Frontend blank:** Check browser console (F12) for errors  
❌ **CORS error:** Update Backend `CORS_ORIGIN` to Frontend URL  
❌ **Language switch broken:** Clear cache (Ctrl+Shift+Delete)  

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed troubleshooting.

---

## Need Help?

- 📖 [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Detailed checklist
- 📖 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Full instructions
- 📋 [DEPLOYMENT_READY.md](DEPLOYMENT_READY.md) - Status overview
- 🔍 [INDEX.md](INDEX.md) - Project overview

---

**Status:** ✅ Ready to deploy  
**Latest Commit:** `1a55ec9`  
**Time to Deployment:** ~60 seconds of setup + 4-6 minutes build time  
**Total:** 5-7 minutes to live production
