package main

import (
	"context"
	"database/sql"
	"fmt"
	"investment-platform/internal/config"
	"investment-platform/internal/database"
	"investment-platform/internal/handlers"
	"investment-platform/internal/middleware"
	"investment-platform/internal/repositories"
	"investment-platform/internal/services"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
	"github.com/rs/cors"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to database
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	log.Println("Connected to database successfully")

	// Initialize admin user
	if err := database.InitializeAdmin(db, cfg); err != nil {
		log.Printf("Warning: Failed to initialize admin user: %v", err)
	}

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	walletRepo := repositories.NewWalletRepository(db)
	packageRepo := repositories.NewPackageRepository(db)
	investmentRepo := repositories.NewInvestmentRepository(db)
	transactionRepo := repositories.NewTransactionRepository(db)
	productRepo := repositories.NewProductRepository(db)
	purchaseRepo := repositories.NewPurchaseRepository(db)
	saleRepo := repositories.NewSaleRepository(db)
	withdrawalRepo := repositories.NewWithdrawalRepository(db)
	auditRepo := repositories.NewAuditRepository(db)
	depositRepo := repositories.NewDepositRepository(db)
	bankAccountRepo := repositories.NewBankAccountRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo, walletRepo, cfg)
	walletService := services.NewWalletService(walletRepo, transactionRepo)
	investmentService := services.NewInvestmentService(investmentRepo, packageRepo, walletService, transactionRepo)
	productService := services.NewProductService(productRepo, purchaseRepo, saleRepo, transactionRepo)
	withdrawalService := services.NewWithdrawalService(withdrawalRepo, walletService, transactionRepo)
	adminService := services.NewAdminService(userRepo, investmentRepo, transactionRepo, productRepo, withdrawalRepo)
	depositService := services.NewDepositService(depositRepo, walletRepo, transactionRepo, walletService)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService, auditRepo)
	userHandler := handlers.NewUserHandler(walletService, investmentService, transactionRepo, withdrawalRepo)
	investmentHandler := handlers.NewInvestmentHandler(investmentService, packageRepo)
	withdrawalHandler := handlers.NewWithdrawalHandler(withdrawalService)
	adminHandler := handlers.NewAdminHandler(adminService, productService, withdrawalService, auditRepo)
	depositHandler := handlers.NewDepositHandler(depositService, bankAccountRepo)

	// Setup router
	r := mux.NewRouter()

	// Database middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), "db", db)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	})

	// Public routes
	r.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}).Methods("GET")

	r.HandleFunc("/api/auth/register", authHandler.Register).Methods("POST")
	r.HandleFunc("/api/auth/login", authHandler.Login).Methods("POST")
	r.HandleFunc("/api/auth/forgot-password", authHandler.ForgotPassword).Methods("POST")
	r.HandleFunc("/api/auth/reset-password", authHandler.ResetPassword).Methods("POST")

	// Protected user routes
	userRouter := r.PathPrefix("/api").Subrouter()
	userRouter.Use(middleware.AuthMiddleware(cfg.JWTSecret))

	userRouter.HandleFunc("/me", userHandler.GetProfile).Methods("GET")
	userRouter.HandleFunc("/me/wallet", userHandler.GetWallet).Methods("GET")
	userRouter.HandleFunc("/me/investments", userHandler.GetInvestments).Methods("GET")
	userRouter.HandleFunc("/me/transactions", userHandler.GetTransactions).Methods("GET")
	userRouter.HandleFunc("/me/withdrawals", userHandler.GetWithdrawals).Methods("GET")
	userRouter.HandleFunc("/me/change-password", authHandler.ChangePassword).Methods("POST")

	userRouter.HandleFunc("/packages", investmentHandler.GetPackages).Methods("GET")
	userRouter.HandleFunc("/investments", investmentHandler.CreateInvestment).Methods("POST")
	userRouter.HandleFunc("/withdrawals", withdrawalHandler.CreateWithdrawal).Methods("POST")
	
	// Deposit routes
	userRouter.HandleFunc("/bank-accounts", depositHandler.GetBankAccounts).Methods("GET")
	userRouter.HandleFunc("/deposits", depositHandler.CreateDeposit).Methods("POST")
	userRouter.HandleFunc("/me/deposits", depositHandler.GetMyDeposits).Methods("GET")

	// Admin routes
	adminRouter := r.PathPrefix("/api/admin").Subrouter()
	adminRouter.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	adminRouter.Use(middleware.AdminMiddleware)

	adminRouter.HandleFunc("/dashboard", adminHandler.GetDashboard).Methods("GET")
	adminRouter.HandleFunc("/today", adminHandler.GetTodayActivity).Methods("GET")
	adminRouter.HandleFunc("/users", adminHandler.GetUsers).Methods("GET")
	adminRouter.HandleFunc("/users/{id}", adminHandler.GetUserDetails).Methods("GET")

	adminRouter.HandleFunc("/products", adminHandler.GetProducts).Methods("GET")
	adminRouter.HandleFunc("/products", adminHandler.CreateProduct).Methods("POST")
	adminRouter.HandleFunc("/inventory", adminHandler.GetInventory).Methods("GET")

	adminRouter.HandleFunc("/purchases", adminHandler.GetPurchases).Methods("GET")
	adminRouter.HandleFunc("/purchases", adminHandler.CreatePurchase).Methods("POST")

	adminRouter.HandleFunc("/sales", adminHandler.GetSales).Methods("GET")
	adminRouter.HandleFunc("/sales", adminHandler.CreateSale).Methods("POST")

	adminRouter.HandleFunc("/withdrawals", adminHandler.GetWithdrawals).Methods("GET")
	adminRouter.HandleFunc("/withdrawals/{id}/approve", adminHandler.ApproveWithdrawal).Methods("POST")
	adminRouter.HandleFunc("/withdrawals/{id}/reject", adminHandler.RejectWithdrawal).Methods("POST")
	adminRouter.HandleFunc("/withdrawals/{id}/complete", adminHandler.CompleteWithdrawal).Methods("POST")

	adminRouter.HandleFunc("/packages/{id}", adminHandler.UpdatePackage).Methods("PUT")

	adminRouter.HandleFunc("/transactions", adminHandler.GetAllTransactions).Methods("GET")
	
	// Admin deposit management
	adminRouter.HandleFunc("/deposits", depositHandler.GetAllDeposits).Methods("GET")
	adminRouter.HandleFunc("/deposits/approve", depositHandler.ApproveDeposit).Methods("POST")
	adminRouter.HandleFunc("/deposits/reject", depositHandler.RejectDeposit).Methods("POST")

	// CORS - Allow all origins for development (both localhost and WiFi IP)
	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: false, // Must be false when AllowedOrigins is "*"
	}).Handler(r)

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server starting on %s", addr)
	if err := http.ListenAndServe(addr, corsHandler); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
