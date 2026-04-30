# FINAL DEPLOYMENT INSTRUCTIONS - Complete Setup

Your application is ready. Complete this ONE-TIME setup to get it live.

## What Needs to Happen

1. **Render sees your GitHub repository** (render.yaml will be auto-detected)
2. **Render creates the services** (backend + frontend from render.yaml)
3. **Render deploys the services** (automatic build and deployment)
4. **App goes live** (you get live URLs)

After this one-time setup, **all future pushes to GitHub will auto-redeploy automatically** via GitHub Actions workflow.

---

## COMPLETE SETUP IN 6 STEPS

### Step 1: Create Free Render Account

Go to: https://render.com

- Sign up or log in with GitHub
- Authorize Render to access your GitHub account

### Step 2: Go to Dashboard

After login, you're at: https://dashboard.render.com

### Step 3: Create New Blueprint

Look for blue **"New +"** button in top right

- Click it
- Select **"Blueprint"** from dropdown

### Step 4: Connect Repository

- Click **"Connect Repository"**
- Find your repo: `iso` (or whatever it's named)
- Click to select it
- Click **"Connect"**

### Step 5: Review Configuration

Render will show services from your `render.yaml`:

- `iso-qms-api` (backend web service)
- `iso-qms-frontend` (frontend static site)

Review and click **"Deploy"**

### Step 6: Wait for Deployment

- Watch the build logs (4-6 minutes)
- When done, you get TWO URLs:
  - Backend: `https://iso-qms-api-xxxxx.render.com`
  - Frontend: `https://iso-qms-frontend-xxxxx.render.com`

**DONE! Your app is live!**

---

## Test it Works

1. Open the **Frontend URL** in browser
2. You should see login page
3. Click language selector (top right)
4. Switch EN/FR
5. Page changes language instantly
6. ✅ Working!

---

## After First Deployment

From now on:

- Any push to `main` branch automatically triggers GitHub Actions
- GitHub Actions notifies Render
- Render auto-redeploys your services
- No manual deployment needed!

---

## Troubleshooting

**"I don't see the New + button"**

- Make sure you're logged in
- Try refreshing page
- You might need to accept Render's terms

**"Blueprint option not visible"**

- Update browser
- Try different browser
- Check you're on dashboard.render.com

**"Deployment fails in Render"**

- Check build logs in Render dashboard
- Most common: DATABASE_URL not set
- Render will show exact error

**"Frontend URL shows blank page"**

- Wait 1-2 more minutes
- Hard refresh (Ctrl+Shift+Delete)
- Check Network tab in DevTools for API errors

---

## Where to Find Help

- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com
- **GitHub Actions Logs:** Your repo → Actions tab

---

## Your Files Are Ready

✅ Frontend: Production build done (dist/ folder)
✅ Backend: Prisma configured
✅ Config: render.yaml complete
✅ Automation: GitHub Actions workflow ready
✅ Code: All 17 commits on GitHub

Everything is prepared. Just do the 6 steps above.

---

## Next: GO TO RENDER.COM AND DEPLOY!

https://dashboard.render.com

**Button sequence:** New + Blueprint → Connect Repo → Deploy

That's it!

---

**Status:** Application is production-ready for deployment
**Time to live:** ~10 minutes (5 min signup/setup + 4-6 min deploy)
**Future updates:** Automatic via GitHub Actions
