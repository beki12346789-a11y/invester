package handlers

import (
	"encoding/json"
	"investment-platform/internal/middleware"
	"investment-platform/internal/repositories"
	"investment-platform/internal/services"
	"net/http"

	"github.com/google/uuid"
)

type DepositHandler struct {
	depositService    *services.DepositService
	bankAccountRepo   *repositories.BankAccountRepository
}

func NewDepositHandler(depositService *services.DepositService, bankAccountRepo *repositories.BankAccountRepository) *DepositHandler {
	return &DepositHandler{
		depositService:  depositService,
		bankAccountRepo: bankAccountRepo,
	}
}

func (h *DepositHandler) GetBankAccounts(w http.ResponseWriter, r *http.Request) {
	accounts, err := h.bankAccountRepo.GetActive()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(accounts)
}

func (h *DepositHandler) CreateDeposit(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID, _ := uuid.Parse(claims.UserID)

	var req struct {
		Amount        float64 `json:"amount"`
		PaymentMethod string  `json:"payment_method"`
		TransactionID string  `json:"transaction_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	deposit, err := h.depositService.CreateDeposit(userID, req.Amount, req.PaymentMethod, req.TransactionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(deposit)
}

func (h *DepositHandler) GetMyDeposits(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID, _ := uuid.Parse(claims.UserID)

	deposits, err := h.depositService.GetUserDeposits(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(deposits)
}

func (h *DepositHandler) GetAllDeposits(w http.ResponseWriter, r *http.Request) {
	deposits, err := h.depositService.GetAllDeposits()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(deposits)
}

func (h *DepositHandler) ApproveDeposit(w http.ResponseWriter, r *http.Request) {
	depositID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		http.Error(w, "Invalid deposit ID", http.StatusBadRequest)
		return
	}

	var req struct {
		AdminNote *string `json:"admin_note"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	if err := h.depositService.ApproveDeposit(depositID, req.AdminNote); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Deposit approved successfully"})
}

func (h *DepositHandler) RejectDeposit(w http.ResponseWriter, r *http.Request) {
	depositID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		http.Error(w, "Invalid deposit ID", http.StatusBadRequest)
		return
	}

	var req struct {
		AdminNote *string `json:"admin_note"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	if err := h.depositService.RejectDeposit(depositID, req.AdminNote); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Deposit rejected"})
}
