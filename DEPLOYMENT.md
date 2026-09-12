# Deployment Guide

## Prerequisites
- GitHub Account
- Render.com Account (for backend + database)
- Vercel Account (for frontend)

## Step 1: Push Code to GitHub

Since you're having token issues, here are alternative methods:

### Method A: GitHub CLI (Recommended)
```bash
# Install GitHub CLI first
gh auth login
gh repo create invester --public --source=. --remote=origin
git push -u origin main
```

### Method B: Generate New Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`
4. Copy the new token
5. Use it:
```bash
git remote set-url origin https://YOUR_NEW_TOKEN@github.com/beki12346789-a11y/invester.git
git push -u origin main
```

### Method C: Use SSH
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub  # Add this to GitHub SSH keys
git remote set-url origin git@github.com:beki12346789-a11y/invester.git
git push -u origin main
```

## Step 2: Deploy Backend on Render.com

1. **Create Account**: Go to https://render.com and sign up

2. **Connect GitHub**: Link your GitHub account

3. **Create PostgreSQL Database**:
   - Click "New +" → "PostgreSQL"
   - Name: `investment-db`
   - Database: `investment_platform`
   - User: `postgres`
   - Region: Oregon (or closest to you)
   - Plan: Free
   - Click "Create Database"
   - **SAVE THE CONNECTION STRING** (Internal Database URL)

4. **Run Database Migrations**:
   - Go to your database dashboard
   - Click "Connect" → "External Connection"
   - Use the PSQL command or any PostgreSQL client
   - Run these SQL files in order:
     ```bash
     psql -h <hostname> -U <user> -d investment_platform < database/schema.sql
     psql -h <hostname> -U <user> -d investment_platform < database/seed.sql
     ```

5. **Create Backend Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configuration:
     - Name: `investment-backend`
     - Region: Oregon
     - Branch: `main`
     - Root Directory: Leave empty
     - Runtime: Go
     - Build Command: `cd backend && go build -o server cmd/server/main.go`
     - Start Command: `./backend/server`
     - Plan: Free

6. **Add Environment Variables**:
   ```
   PORT=8080
   JWT_SECRET=your-super-secret-jwt-key-change-this
   DATABASE_URL=<paste-internal-database-url-from-step-3>
   ADMIN_PHONE=0912345678
   ADMIN_PASSWORD=admin123
   ADMIN_NAME=System Administrator
   ```

7. **Deploy**: Click "Create Web Service"

8. **Note Your Backend URL**: Will be something like `https://investment-backend.onrender.com`

## Step 3: Deploy Frontend on Vercel

1. **Create Account**: Go to https://vercel.com and sign up

2. **Import Project**:
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Project**:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://investment-backend.onrender.com
   ```
   (Use your actual backend URL from Step 2.8)

5. **Deploy**: Click "Deploy"

6. **Note Your Frontend URL**: Will be something like `https://invester.vercel.app`

## Step 4: Update CORS Settings

After deployment, you need to update backend CORS to allow your frontend:

1. Edit `backend/cmd/server/main.go`:
```go
corsHandler := cors.New(cors.Options{
    AllowedOrigins:   []string{
        "https://invester.vercel.app",  // Your Vercel URL
        "http://localhost:3000",        // Local development
    },
    AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowedHeaders:   []string{"Content-Type", "Authorization"},
    AllowCredentials: true,
}).Handler(r)
```

2. Commit and push:
```bash
git add backend/cmd/server/main.go
git commit -m "Update CORS for production"
git push origin main
```

3. Render will automatically redeploy

## Step 5: Test Your Deployment

1. Visit your frontend URL
2. Register a new account
3. Test login
4. Try creating an investment
5. Login as admin (0912345678 / admin123)
6. Test admin features

## Troubleshooting

### Backend Issues:
- **503 Error**: Check Render logs, database might not be connected
- **CORS Error**: Update allowed origins in backend
- **Database Connection**: Verify DATABASE_URL is correct

### Frontend Issues:
- **API Calls Failing**: Check NEXT_PUBLIC_API_URL is set correctly
- **Build Failing**: Check for TypeScript errors in Vercel logs

### Database Issues:
- **Migrations Failed**: Manually run SQL files using PSQL
- **Connection Timeout**: Use Internal Database URL, not External

## Monitoring

### Render.com:
- View logs: Dashboard → Your Service → Logs
- Check metrics: Dashboard → Your Service → Metrics
- Database info: Dashboard → Your Database → Info

### Vercel:
- View logs: Project → Deployments → Click deployment → Logs
- Analytics: Project → Analytics

## Costs

- **Render Free Plan**:
  - Backend: Spins down after 15 min inactivity, free 750 hours/month
  - Database: 90 days free, then $7/month
  
- **Vercel Free Plan**:
  - Unlimited deployments
  - 100GB bandwidth/month
  - No credit card required

## Custom Domain (Optional)

### For Frontend (Vercel):
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as shown

### For Backend (Render):
1. Upgrade to paid plan ($7/month)
2. Go to Service Settings → Custom Domain
3. Add your domain
4. Update DNS records

## Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Change ADMIN_PASSWORD from default
- [ ] Enable HTTPS only (automatic on both platforms)
- [ ] Set up monitoring and alerts
- [ ] Regular database backups
- [ ] Review and limit CORS origins
- [ ] Keep dependencies updated

## Need Help?

- Telegram Support: https://t.me/+yLNR6hcimS04Njc0
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
