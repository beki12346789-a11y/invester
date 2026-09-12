package handlers

import (
	"encoding/json"
	"investment-platform/internal/middleware"
	"investment-platform/internal/models"
	"investment-platform/internal/services"
	"net/http"

	"github.com/google/uuid"
)

type WithdrawalHandler struct {
	withdrawalService *services.WithdrawalService
}

func NewWithdrawalHandler(withdrawalService *services.WithdrawalService) *WithdrawalHandler {
	return &WithdrawalHandler{
		withdrawalService: withdrawalService,
	}
}

type CreateWithdrawalRequest struct {
	Amount            float64 `json:"amount"`
	WithdrawalMethod  string  `json:"withdrawal_method"`
	AccountDetails    string  `json:"account_details"`
}

func (h *WithdrawalHandler) CreateWithdrawal(w http.ResponseWriter, r *http.Request) {
	claims, _ := middleware.GetUserClaims(r)
	userID, _ := uuid.Parse(claims.UserID)

	var req CreateWithdrawalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	if req.Amount <= 0 {
		http.Error(w, `{"error":"Amount must be positive"}`, http.StatusBadRequest)
		return
	}

	withdrawal := &models.Withdrawal{
		UserID:           userID,
		Amount:           req.Amount,
		WithdrawalMethod: req.WithdrawalMethod,
		AccountDetails:   req.AccountDetails,
	}

	if err := h.withdrawalService.CreateWithdrawal(withdrawal); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(withdrawal)
}
