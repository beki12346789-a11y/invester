# ⚡ Quick Deployment Reference

## 🎯 Your Stack
- **Database**: Nhost (PostgreSQL)
- **Backend**: Render.com (Go)
- **Frontend**: Vercel (Next.js)

---

## 📋 Deployment Order

### 1️⃣ Database (Nhost) - 10 min
```
1. Sign up: https://app.nhost.io/signup
2. Create project: "investment-platform"
3. Get connection string
4. Run migrations in SQL Editor:
   - Copy/paste database/schema.sql
   - Copy/paste database/seed.sql
```

### 2️⃣ Backend (Render) - 10 min
```
1. Sign up: https://render.com/register
2. New Web Service → Connect GitHub
3. Settings:
   - Runtime: Go
   - Build: cd backend && go build -o server cmd/server/main.go
   - Start: ./backend/server
4. Environment Variables:
   PORT=8080
   JWT_SECRET=your-secret-key
   DATABASE_URL=<nhost-connection-string>
   ADMIN_PHONE=0912345678
   ADMIN_PASSWORD=admin123
   ADMIN_NAME=System Administrator
5. Deploy and copy URL
```

### 3️⃣ Frontend (Vercel) - 5 min
```
1. Sign up: https://vercel.com/signup
2. Import GitHub repo
3. Settings:
   - Framework: Next.js
   - Root: frontend
4. Environment Variable:
   NEXT_PUBLIC_API_URL=<your-backend-url>
5. Deploy and copy URL
```

### 4️⃣ Update CORS - 2 min
```
1. Edit backend/cmd/server/main.go
2. Update AllowedOrigins with your Vercel URL
3. git push origin main
4. Wait for Render auto-deploy
```

---

## 🔗 URLs You Need

| Service | URL | Purpose |
|---------|-----|---------|
| Nhost Dashboard | https://app.nhost.io | Manage database |
| Render Dashboard | https://dashboard.render.com | Manage backend |
| Vercel Dashboard | https://vercel.com/dashboard | Manage frontend |
| Your GitHub | https://github.com/beki12346789-a11y/invester | Source code |
| Telegram | https://t.me/+yLNR6hcimS04Njc0 | Support |

---

## 🔑 Credentials

### Admin Login:
- Phone: `0912345678`
- Password: `admin123`
- ⚠️ **Change after first login!**

### Test User (create via register):
- Phone: `09XXXXXXXX` (any valid Ethiopian number)
- Gets 100 Birr welcome bonus

---

## ✅ Testing Checklist

After deployment, test these:

**User Features:**
- [ ] Register new account
- [ ] Login
- [ ] View 100 Birr bonus
- [ ] Browse packages
- [ ] Submit deposit request
- [ ] View transactions
- [ ] Request withdrawal

**Admin Features:**
- [ ] Admin login
- [ ] View dashboard
- [ ] Approve deposit
- [ ] Reject withdrawal
- [ ] View all users
- [ ] Check security alerts

---

## 🚨 Common Issues

| Issue | Fix |
|-------|-----|
| Frontend can't connect to backend | Check NEXT_PUBLIC_API_URL in Vercel |
| Backend shows 503 | Check DATABASE_URL in Render |
| CORS error | Update AllowedOrigins with Vercel URL |
| Database not connected | Verify Nhost connection string |
| Backend sleeping | Free tier - first request wakes it (30s) |

---

## 💰 Costs (All FREE Tiers)

- **Nhost**: $0 (2GB DB, 1GB transfer)
- **Render**: $0 (750 hours/month, spins down)
- **Vercel**: $0 (unlimited deploys)

**Total: $0/month** 🎉

---

## 📞 Get Help

- Full guide: `cat DEPLOY-NHOST.md`
- Nhost docs: https://docs.nhost.io
- Render docs: https://render.com/docs
- Vercel docs: https://vercel.com/docs
- Telegram: https://t.me/+yLNR6hcimS04Njc0

---

**🚀 Total deployment time: ~30 minutes**
