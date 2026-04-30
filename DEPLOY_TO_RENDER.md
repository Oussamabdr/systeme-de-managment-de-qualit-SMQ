# 🚀 DEPLOY TO RENDER - COMPLETE STEP-BY-STEP GUIDE

## ⚡ QUICK FACTS

- **Time required:** 15 minutes
- **Cost:** FREE (Render offers free tier)
- **Difficulty:** Easy (just 3 clicks + GitHub login)
- **Status:** ✅ All code ready | ✅ render.yaml configured | ✅ GitHub Actions setup

---

## STEP 1: Go to Render Dashboard

1. Open: **https://render.com**
2. Click **"Get Started"** (top right)
3. Click **"GitHub"** to sign in with your GitHub account
4. Authorize Render access to your GitHub repositories

---

## STEP 2: Create a Blueprint Deployment

Once logged in to Render:

1. Click **"New +"** in the top navigation
2. Select **"Blueprint"** (NOT "Web Service" - Blueprint is simpler!)
3. Select your repository: **`systeme-de-managment-de-qualit-SMQ`**
4. Branch: **`main`** (default)
5. Click **"Deploy"**

That's it! Render will read your `render.yaml` and deploy BOTH services automatically:

- **Backend API** (iso-qms-api) - Node.js + PostgreSQL
- **Frontend** (iso-qms-frontend) - Vue.js static site

---

## STEP 3: Wait for Deployment (4-6 minutes)

Render will:

1. ✅ Install backend dependencies
2. ✅ Create PostgreSQL database
3. ✅ Run database migrations
4. ✅ Seed initial data
5. ✅ Build frontend
6. ✅ Deploy both services

**You can watch the logs in real-time in the Render dashboard.**

---

## STEP 4: Get Your Live URLs

After deployment completes:

- **Backend API:** `https://iso-qms-api-xxxxx.onrender.com`
- **Frontend:** `https://iso-qms-frontend-xxxxx.onrender.com`

Both URLs will be shown in your Render dashboard.

---

## STEP 5: Test Your Live App

Visit your frontend URL:

```
https://iso-qms-frontend-xxxxx.onrender.com
```

You should see:

- ✅ Login page OR dashboard (if already authenticated)
- ✅ All pages load correctly
- ✅ Documents upload works
- ✅ Tasks, processes, and non-conformities display

---

## STEP 6: (Optional) Connect Your Domain

If you have a custom domain:

1. Go to Service Settings in Render
2. Add your domain
3. Update DNS records (Render will show you how)

---

## TROUBLESHOOTING

### Deploy Failed?

- **Check logs:** Click the service in Render → View Logs
- **Common issues:**
  - Database connection: Check `DATABASE_URL` is set
  - Build failure: Check `npm install` succeeds (check logs)
  - Port issues: Backend should be on port 3000 (check render.yaml)

### Frontend shows 404?

- Make sure `VITE_API_URL` is set correctly to your backend URL
- Clear browser cache and reload

### Backend returns 500 errors?

- Check database migrations ran: `npx prisma migrate deploy`
- Check env variables are set in Render dashboard

---

## IMPORTANT: AFTER FIRST DEPLOYMENT

### 1. Update Frontend API URL (if needed)

If your backend URL changes:

- Edit `frontend/.env.production`
- Or set `VITE_API_URL` in Render environment variables
- Redeploy frontend

### 2. Database Backups

Render manages PostgreSQL for you, but:

- Enable daily backups in Render dashboard
- Test a restore occasionally

### 3. GitHub Auto-Deploy

Every time you push to `main`, Render will automatically redeploy!

---

## YOUR PROJECT IS PRODUCTION-READY ✅

No additional configuration needed. Your app includes:

- ✅ Authentication (JWT)
- ✅ Database (PostgreSQL)
- ✅ File uploads (S3 ready - just add credentials)
- ✅ Responsive UI
- ✅ API documentation
- ✅ Error handling
- ✅ CORS configured

---

## WHAT'S INCLUDED IN render.yaml

### Backend Service (iso-qms-api)

```yaml
- Web service on port 3000
- Node.js environment
- npm start command
- Database migrations auto-run
- Seed data auto-loads
```

### Frontend Service (iso-qms-frontend)

```yaml
- Static site hosting
- Vue.js build output
- Cache headers optimized
- Auto connects to backend API
```

---

## NEED HELP?

1. **Render docs:** https://render.com/docs
2. **Check service logs:** Render dashboard → Service → Logs
3. **Environment variable issues?** Render dashboard → Environment
4. **Still stuck?** Create an issue on GitHub with the Render log output

---

## YOU'RE READY! 🎉

Your application is fully configured and ready for production. Just follow the steps above and you'll have a live app in 15 minutes!

**Next step:** Go to https://render.com and click "Get Started"
