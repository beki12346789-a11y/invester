# 🚀 Deployment Guide - Nhost + Render + Vercel

## Your Stack
- **Database**: Nhost (PostgreSQL)
- **Backend**: Render.com (Go API)
- **Frontend**: Vercel (Next.js)

---

## ✅ STEP 1: Deploy Database on Nhost (10 minutes)

### 1.1 Create Nhost Account
1. Go to: https://app.nhost.io/signup
2. Sign up with GitHub (easiest) or email
3. Verify your email

### 1.2 Create New Project
1. Click **"Create New Project"**
2. Fill in:
   - **Name**: `investment-platform`
   - **Region**: Choose closest to you (e.g., EU Central, US East)
   - **Plan**: **Starter (Free)**
3. Click **"Create Project"**
4. Wait 2-3 minutes for provisioning

### 1.3 Get Database Connection String
1. In your project dashboard, click **"Database"** in left menu
2. Click **"Connection String"** tab
3. Copy the **PostgreSQL Connection String**
   - Format: `postgres://user:password@host:5432/database`
4. **Save this - you'll need it for backend!**

### 1.4 Run Database Migrations

**Option A: Using Nhost SQL Editor (Easiest)**
1. In Nhost dashboard, click **"Database"** → **"SQL Editor"**
2. Open `database/schema.sql` from your local project
3. Copy entire contents
4. Paste into Nhost SQL Editor
5. Click **"Run"**
6. Wait for success message
7. Do the same with `database/seed.sql`

**Option B: Using psql locally**
```bash
# Get connection string from Nhost dashboard
psql "postgresql://user:password@host:5432/database" < database/schema.sql
psql "postgresql://user:password@host:5432/database" < database/seed.sql
```

### 1.5 Verify Database
1. In Nhost dashboard → **Database** → **Browser**
2. You should see tables: `users`, `wallets`, `investment_packages`, etc.
3. Click on `investment_packages` - should have 10 rows

✅ **Database Ready!**

---

## ✅ STEP 2: Deploy Backend on Render.com (10 minutes)

### 2.1 Create Render Account
1. Go to: https://render.com/register
2. Sign up with GitHub (recommended)

### 2.2 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `beki12346789-a11y/invester`
3. Configure:
   - **Name**: `investment-backend`
   - **Region**: Same as Nhost or closest
   - **Branch**: `main`
   - **Root Directory**: *leave empty*
   - **Runtime**: **Go**
   - **Build Command**: 
     ```
     cd backend && go build -o server cmd/server/main.go
     ```
   - **Start Command**:
     ```
     ./backend/server
     ```
   - **Instance Type**: **Free**

### 2.3 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add these (one at a time):

| Key | Value |
|-----|-------|
| `PORT` | `8080` |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-this-123` |
| `DATABASE_URL` | *Paste your Nhost connection string* |
| `ADMIN_PHONE` | `0912345678` |
| `ADMIN_PASSWORD` | `admin123` |
| `ADMIN_NAME` | `System Administrator` |

**IMPORTANT**: Replace JWT_SECRET with a strong random string!

### 2.4 Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for first deployment
3. Watch the logs - should see "Connected to database successfully"

### 2.5 Get Your Backend URL
1. After deployment succeeds, copy your URL
2. Format: `https://investment-backend.onrender.com`
3. **Save this - you need it for frontend!**

### 2.6 Test Backend
```bash
# Test health endpoint
curl https://investment-backend.onrender.com/api/health

# Should return: {"status":"ok"}
```

✅ **Backend Ready!**

---

## ✅ STEP 3: Deploy Frontend on Vercel (5 minutes)

### 3.1 Create Vercel Account
1. Go to: https://vercel.com/signup
2. Sign up with GitHub

### 3.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Import `beki12346789-a11y/invester` from GitHub
3. Click **"Import"**

### 3.3 Configure Project
1. **Framework Preset**: Next.js (auto-detected)
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)
5. **Install Command**: `npm install` (default)

### 3.4 Add Environment Variables
Click **"Environment Variables"** section

Add this variable:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | *Your backend URL from Step 2.5* |

Example: `https://investment-backend.onrender.com`

### 3.5 Deploy
1. Click **"Deploy"**
2. Wait 3-5 minutes
3. Watch build logs

### 3.6 Get Your Frontend URL
1. After deployment, you'll see your URL
2. Format: `https://invester.vercel.app` (or custom domain)
3. **This is your live platform!**

✅ **Frontend Ready!**

---

## ✅ STEP 4: Update CORS for Production (2 minutes)

Your backend needs to allow requests from your frontend domain.

### 4.1 Update Backend CORS
1. Open `backend/cmd/server/main.go` in your local editor
2. Find the CORS section (around line 90)
3. Update `AllowedOrigins`:

```go
corsHandler := cors.New(cors.Options{
    AllowedOrigins:   []string{
        "https://invester.vercel.app",  // Your actual Vercel URL
        "http://localhost:3000",        // Keep for local dev
    },
    AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowedHeaders:   []string{"Content-Type", "Authorization"},
    AllowCredentials: true,
}).Handler(r)
```

### 4.2 Push Update
```bash
git add backend/cmd/server/main.go
git commit -m "Update CORS for production"
git push origin main
```

### 4.3 Wait for Auto-Deploy
- Render will automatically detect the push
- Wait 2-3 minutes for redeployment
- Check Render logs to confirm

✅ **CORS Updated!**

---

## ✅ STEP 5: Test Your Live Platform! 🎉

### 5.1 Visit Your Site
Open your Vercel URL: `https://invester.vercel.app`

### 5.2 Test User Registration
1. Click **"Register"**
2. Fill in:
   - Phone: `0923456789`
   - Password: `Test1234`
   - Name: `Test User`
3. Submit
4. Should login automatically
5. Check dashboard - should show **100 Birr** welcome bonus!

### 5.3 Test User Features
- ✅ View packages
- ✅ Make a deposit request
- ✅ View transactions
- ✅ Request withdrawal

### 5.4 Test Admin Panel
1. Logout
2. Go to `/admin/login`
3. Login:
   - Phone: `0912345678`
   - Password: `admin123`
4. Test:
   - ✅ View dashboard stats
   - ✅ See pending deposits
   - ✅ Approve/reject deposits
   - ✅ Manage withdrawals
   - ✅ View all users

---

## 🎊 SUCCESS! Your Platform is LIVE!

### Your URLs:
- **Frontend**: https://invester.vercel.app
- **Backend**: https://investment-backend.onrender.com
- **Database**: Managed on Nhost
- **Telegram**: https://t.me/+yLNR6hcimS04Njc0

### Default Admin:
- Phone: `0912345678`
- Password: `admin123`
- ⚠️ **CHANGE THIS IMMEDIATELY!**

---

## 📊 Monitoring Your Platform

### Nhost (Database)
- Dashboard: https://app.nhost.io
- View: Database metrics, logs, backups
- Free tier: 2GB database, 1GB bandwidth/month

### Render (Backend)
- Dashboard: https://dashboard.render.com
- View: Logs, metrics, deployments
- Free tier: Spins down after 15min inactivity

### Vercel (Frontend)
- Dashboard: https://vercel.com/dashboard
- View: Deployments, analytics, logs
- Free tier: Unlimited deployments, 100GB bandwidth

---

## 🔧 Common Issues & Fixes

### Issue: "Network Error" on frontend
**Fix**: Check NEXT_PUBLIC_API_URL in Vercel environment variables

### Issue: Backend returns 503
**Fix**: 
- Check DATABASE_URL in Render environment variables
- Verify Nhost database is running
- Check Render logs for connection errors

### Issue: CORS errors in browser
**Fix**: 
- Verify you updated AllowedOrigins with your Vercel URL
- Make sure you pushed the change to GitHub
- Wait for Render to redeploy

### Issue: Database connection timeout
**Fix**:
- Use Nhost **connection string**, not connection pooler
- Check Nhost project is active
- Verify database credentials are correct

### Issue: Render service "sleeping"
**Note**: Free tier spins down after 15min. First request wakes it (30-60s delay)

---

## 💰 Costs

### Current Setup (FREE):
- **Nhost Starter**: $0/month (2GB DB, 1GB transfer)
- **Render Free**: $0/month (750 hours, spins down)
- **Vercel Hobby**: $0/month (unlimited deploys)

### When to Upgrade:
- **Nhost**: Upgrade when you need >2GB database or >1GB transfer
- **Render**: Upgrade ($7/mo) to keep backend always on
- **Vercel**: Upgrade for custom domains and more bandwidth

---

## 🔒 Security Checklist

After deployment:
- [ ] Change admin password
- [ ] Update JWT_SECRET to strong random string
- [ ] Enable Nhost authentication if needed
- [ ] Set up Nhost backups
- [ ] Review Render environment variables
- [ ] Monitor error logs regularly
- [ ] Set up uptime monitoring (e.g., UptimeRobot)

---

## 🚀 Next Steps

1. **Share your platform**: Send URL to users
2. **Join community**: https://t.me/+yLNR6hcimS04Njc0
3. **Monitor usage**: Check dashboards daily
4. **Backup database**: Enable Nhost automatic backups
5. **Custom domain**: Add your own domain (optional)

---

## 📞 Need Help?

- **Nhost Docs**: https://docs.nhost.io
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Telegram Support**: https://t.me/+yLNR6hcimS04Njc0

---

**🎉 Congratulations! Your investment platform is now live and ready for users!**
