# Quick Start Guide

## 🚀 Getting Your Investment Platform Live in 30 Minutes

Follow these steps in order without skipping any.

---

## ✅ STEP 1: Fix GitHub Push Issue

Your GitHub token seems invalid. Here are 3 ways to fix it:

### Option A: GitHub CLI (Easiest)
```bash
# Install GitHub CLI
# Ubuntu/Debian: sudo apt install gh
# Mac: brew install gh
# Windows: Download from https://cli.github.com/

# Authenticate
gh auth login

# Create repo and push
gh repo create invester --public --source=. --remote=origin --push
```

### Option B: New Personal Access Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it: "Investment Platform"
4. Select scopes: ✅ repo, ✅ workflow
5. Generate and COPY the token
6. Run:
```bash
git remote remove origin
git remote add origin https://YOUR_NEW_TOKEN@github.com/beki12346789-a11y/invester.git
git push -u origin main
```

### Option C: Use Our Script
```bash
./setup-github.sh
# Follow the prompts
```

---

## ✅ STEP 2: Deploy Database (Render.com)

1. **Sign Up**: https://render.com/register
2. **New PostgreSQL**: Click "New +" → "PostgreSQL"
   - Name: `investment-db`
   - Database: `investment_platform`
   - Region: Oregon (or closest)
   - Plan: **Free**
3. **Create Database** (wait 2-3 minutes)
4. **Save Connection Info**:
   - Go to database page
   - Copy "Internal Database URL" (starts with postgres://)
   - Example: `postgres://user:pass@host/investment_platform`

---

## ✅ STEP 3: Run Database Migrations

### Method A: Using Render Dashboard (Easiest)
1. In your database dashboard, click "Connect"
2. Choose "External Connection"
3. Copy the PSQL command shown
4. On your local machine:
```bash
# Run schema
psql "<YOUR_CONNECTION_STRING>" < database/schema.sql

# Run seed data
psql "<YOUR_CONNECTION_STRING>" < database/seed.sql
```

### Method B: Using Render Shell
1. Database Dashboard → "Shell" tab
2. Copy and paste contents of `database/schema.sql`
3. Press Enter
4. Copy and paste contents of `database/seed.sql`
5. Press Enter

---

## ✅ STEP 4: Deploy Backend (Render.com)

1. **New Web Service**: Click "New +" → "Web Service"
2. **Connect GitHub**: Select your `invester` repository
3. **Configure**:
   - Name: `investment-backend`
   - Region: Same as database (Oregon)
   - Branch: `main`
   - Root Directory: *leave empty*
   - Runtime: **Go**
   - Build Command: 
     ```
     cd backend && go build -o server cmd/server/main.go
     ```
   - Start Command:
     ```
     ./backend/server
     ```
   - Instance Type: **Free**

4. **Environment Variables** (Click "Advanced" → "Add Environment Variable"):
   ```
   PORT=8080
   JWT_SECRET=change-this-to-random-string-in-production-abc123xyz
   DATABASE_URL=<paste your Internal Database URL from Step 2>
   ADMIN_PHONE=0912345678
   ADMIN_PASSWORD=admin123
   ADMIN_NAME=System Administrator
   ```

5. **Create Web Service** (wait 5-10 minutes for first deploy)

6. **Copy Your Backend URL**: 
   - Example: `https://investment-backend.onrender.com`
   - Save this - you'll need it for frontend!

---

## ✅ STEP 5: Deploy Frontend (Vercel)

1. **Sign Up**: https://vercel.com/signup
2. **New Project**: Click "Add New" → "Project"
3. **Import Git Repository**: Select your GitHub `invester` repo
4. **Configure**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `frontend`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

5. **Environment Variables**:
   - Click "Environment Variables"
   - Add:
     ```
     Name: NEXT_PUBLIC_API_URL
     Value: https://investment-backend.onrender.com
     ```
     (Use YOUR backend URL from Step 4.6)

6. **Deploy** (wait 3-5 minutes)

7. **Your Live URL**: 
   - Example: `https://invester.vercel.app`
   - This is your production site!

---

## ✅ STEP 6: Update CORS for Production

Your frontend needs permission to call your backend:

1. **Edit Backend CORS**:
   ```bash
   # Open backend/cmd/server/main.go
   # Find the CORS section and update to:
   ```

2. **Update the file**:
   Replace:
   ```go
   AllowedOrigins:   []string{"*"},
   ```
   
   With:
   ```go
   AllowedOrigins:   []string{
       "https://invester.vercel.app",  // Your actual Vercel URL
       "http://localhost:3000",        // Keep for local dev
   },
   ```

3. **Push Update**:
   ```bash
   git add backend/cmd/server/main.go
   git commit -m "Update CORS for production"
   git push origin main
   ```

4. Render will auto-redeploy (wait 2-3 minutes)

---

## ✅ STEP 7: Test Your Live Site

1. **Visit Your Frontend**: `https://invester.vercel.app` (or your URL)

2. **Register New User**:
   - Phone: 0923456789
   - Password: Test1234
   - Name: Test User
   - Should show "100 Birr" welcome bonus ✅

3. **Test User Features**:
   - ✅ View packages
   - ✅ Make a deposit request
   - ✅ View transactions

4. **Test Admin**:
   - Logout
   - Go to `/admin/login`
   - Phone: 0912345678
   - Password: admin123
   - ✅ Approve deposits
   - ✅ Manage withdrawals
   - ✅ View all users

---

## 🎉 DONE! Your Platform is Live!

### Your URLs:
- **Frontend**: https://invester.vercel.app
- **Backend API**: https://investment-backend.onrender.com
- **Telegram**: https://t.me/+yLNR6hcimS04Njc0

### Default Admin Login:
- Phone: `0912345678`
- Password: `admin123`

⚠️ **IMPORTANT**: Change admin password immediately in production!

---

## 📊 Monitor Your Platform

### Render (Backend):
- Logs: Dashboard → investment-backend → Logs
- Metrics: Dashboard → investment-backend → Metrics
- Database: Dashboard → investment-db → Metrics

### Vercel (Frontend):
- Deployments: Project → Deployments
- Logs: Click any deployment → View Function Logs
- Analytics: Project → Analytics

---

## 🔥 Common Issues & Fixes

### Issue: Frontend shows "Network Error"
**Fix**: Check NEXT_PUBLIC_API_URL in Vercel environment variables

### Issue: Backend shows 503
**Fix**: Check DATABASE_URL is correct in Render environment variables

### Issue: CORS errors in browser
**Fix**: Update AllowedOrigins in backend/cmd/server/main.go

### Issue: Database connection failed
**Fix**: Use "Internal Database URL" not "External Connection String"

### Issue: Render service sleeps
**Fix**: Free tier spins down after 15min inactivity. First request wakes it up (takes 30-60s)

---

## 💰 Costs

- **Render Free Tier**:
  - Backend: Free for 750 hours/month
  - Database: Free for 90 days, then $7/month
  
- **Vercel Free Tier**:
  - Frontend: Unlimited deployments
  - 100GB bandwidth/month
  - No credit card required

---

## 🚀 Next Steps

1. ✅ Share your live URL with users
2. ✅ Join our Telegram: https://t.me/+yLNR6hcimS04Njc0
3. ✅ Change admin password
4. ✅ Add custom domain (optional)
5. ✅ Set up monitoring alerts

---

## 📞 Need Help?

- Read full guide: `DEPLOYMENT.md`
- Telegram support: https://t.me/+yLNR6hcimS04Njc0
- Render docs: https://render.com/docs
- Vercel docs: https://vercel.com/docs

---

**Created with ❤️ for the Ethiopian investment community**
