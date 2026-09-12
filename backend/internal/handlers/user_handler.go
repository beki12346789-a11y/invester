package handlers

import (
	"encoding/json"
	"investment-platform/internal/middleware"
	"investment-platform/internal/repositories"
	"investment-platform/internal/services"
	"net/http"
	"strconv"

	"github.com/google/uuid"
)

type UserHandler struct {
	walletService   *services.WalletService
	investmentService *services.InvestmentService
	transactionRepo *repositories.TransactionRepository
	withdrawalRepo  *repositories.WithdrawalRepository
}

func NewUserHandler(
	walletService *services.WalletService,
	investmentService *services.InvestmentService,
	transactionRepo *repositories.TransactionRepository,
	withdrawalRepo *repositories.WithdrawalRepository,
) *UserHandler {
	return &UserHandler{
		walletService:     walletService,
		investmentService: investmentService,
		transactionRepo:   transactionRepo,
		withdrawalRepo:    withdrawalRepo,
	}
}

func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	claims, _ := middleware.GetUserClaims(r)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":           claims.UserID,
		"phone_number": claims.PhoneNumber,
		"role":         claims.Role,
	})
}

func (h *UserHandler) GetWallet(w http.ResponseWriter, r *http.Request) {
	claims, _ := middleware.GetUserClaims(r)
	userID, _ := uuid.Parse(claims.UserID)

	wallet, err := h.walletService.GetWallet(userID)
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch wallet"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wallet)
}

func (h *UserHandler) GetInvestments(w http.ResponseWriter, r *http.Request) {
	claims, _ := middleware.GetUserClaims(r)
	userID, _ := uuid.Parse(claims.UserID)

	investments, err := h.investmentService.GetUserInvestments(userID)
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch investments"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(investments)
}

func (h *UserHandler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	claims, _ := middleware.GetUserClaims(r)
	userID, _ := uuid.Parse(claims.UserID)

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit == 0 {
		limit = 50
	}

	transactions, err := h.transactionRepo.GetByUserID(userID, limit, offset)
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch transactions"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(transactions)
}

func (h *UserHandler) GetWithdrawals(w http.ResponseWriter, r *http.Request) {
	claims, _ := middleware.GetUserClaims(r)
	userID, _ := uuid.Parse(claims.UserID)

	withdrawals, err := h.withdrawalRepo.GetByUserID(userID)
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch withdrawals"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(withdrawals)
}
