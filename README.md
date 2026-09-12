# Investment Trading Platform

A full-stack investment platform with phone-based authentication, bilingual support (English/Amharic), and comprehensive admin management.

## Features

- 📱 Phone-based authentication (Ethiopian format: 07/09 prefixes)
- 🌐 Bilingual support (English & Amharic)
- 💰 Investment packages with tracking
- 💳 Deposit & withdrawal management
- 👨‍💼 Complete admin panel
- 🔒 Secure JWT authentication
- 📊 Real-time transaction tracking
- 📱 Mobile-first responsive design

## Tech Stack

### Backend
- Go (Golang)
- PostgreSQL
- Gorilla Mux (Router)
- JWT Authentication
- Docker

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- React Context API
- React Hot Toast

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Go 1.21+
- Node.js 18+
- PostgreSQL 14+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/beki12346789-a11y/invester.git
cd invester
```

2. Start with Docker Compose:
```bash
docker-compose up -d
```

3. The services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432

### Default Admin Credentials
- Phone: 0912345678
- Password: admin123

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgres://postgres:postgres@db:5432/investment_platform?sslmode=disable
JWT_SECRET=your-secret-key
PORT=8080
ADMIN_PHONE=0912345678
ADMIN_PASSWORD=admin123
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## API Documentation

### Authentication Endpoints
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password with code

### User Endpoints
- GET `/api/me` - Get current user profile
- GET `/api/me/wallet` - Get wallet balance
- GET `/api/me/investments` - Get user investments
- GET `/api/me/deposits` - Get user deposits
- GET `/api/me/withdrawals` - Get user withdrawals
- GET `/api/me/transactions` - Get user transactions

### Investment Endpoints
- GET `/api/packages` - List investment packages
- POST `/api/investments` - Create investment

### Deposit Endpoints
- GET `/api/bank-accounts` - Get bank account details
- POST `/api/deposits` - Submit deposit request
- GET `/api/me/deposits` - Get my deposits

### Withdrawal Endpoints
- POST `/api/withdrawals` - Request withdrawal

### Admin Endpoints
- GET `/api/admin/dashboard` - Admin statistics
- GET `/api/admin/users` - List all users
- GET `/api/admin/deposits` - Manage deposits
- POST `/api/admin/deposits/approve` - Approve deposit
- POST `/api/admin/deposits/reject` - Reject deposit
- GET `/api/admin/withdrawals` - Manage withdrawals
- POST `/api/admin/withdrawals/{id}/approve` - Approve withdrawal
- POST `/api/admin/withdrawals/{id}/reject` - Reject withdrawal

## Database Schema

### Main Tables
- `users` - User accounts
- `wallets` - User wallet balances
- `investment_packages` - Available investment plans
- `investments` - User investments
- `deposits` - Deposit requests
- `withdrawals` - Withdrawal requests
- `transactions` - Transaction history
- `bank_accounts` - Payment account details

## Deployment

### Database (Nhost)
1. Create account at https://app.nhost.io
2. Create new project
3. Run migrations using SQL Editor
4. Copy connection string

### Backend (Render.com)
1. Create new Web Service
2. Connect GitHub repository
3. Build command: `cd backend && go build -o server cmd/server/main.go`
4. Start command: `./backend/server`
5. Add environment variables (including Nhost DATABASE_URL)

### Frontend (Vercel)
1. Import GitHub repository
2. Root directory: `frontend`
3. Framework: Next.js
4. Add NEXT_PUBLIC_API_URL environment variable
5. Deploy

**Full deployment guide**: See `DEPLOY-NHOST.md`

## Features Roadmap

- [x] Phone authentication
- [x] Bilingual support
- [x] Investment packages
- [x] Deposit system
- [x] Withdrawal system
- [x] Admin panel
- [x] Security alerts
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Payment gateway integration
- [ ] Mobile app

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, join our Telegram channel: https://t.me/+yLNR6hcimS04Njc0

## Author

Developed with ❤️ for the Ethiopian investment community
