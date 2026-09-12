package handlers

import (
	"database/sql"
	"encoding/json"
	"investment-platform/internal/middleware"
	"investment-platform/internal/repositories"
	"investment-platform/internal/services"
	"net/http"

	"github.com/google/uuid"
)

type InvestmentHandler struct {
	investmentService *services.InvestmentService
	packageRepo       *repositories.PackageRepository
}

func NewInvestmentHandler(investmentService *services.InvestmentService, packageRepo *repositories.PackageRepository) *InvestmentHandler {
	return &InvestmentHandler{
		investmentService: investmentService,
		packageRepo:       packageRepo,
	}
}

func (h *InvestmentHandler) GetPackages(w http.ResponseWriter, r *http.Request) {
	packages, err := h.packageRepo.GetAll()
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch packages"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(packages)
}

type CreateInvestmentRequest struct {
	PackageID string  `json:"package_id"`
	Amount    float64 `json:"amount"`
}

func (h *InvestmentHandler) CreateInvestment(w http.ResponseWriter, r *http.Request) {
	claims, _ := middleware.GetUserClaims(r)
	userID, _ := uuid.Parse(claims.UserID)

	var req CreateInvestmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	packageID, err := uuid.Parse(req.PackageID)
	if err != nil {
		http.Error(w, `{"error":"Invalid package ID"}`, http.StatusBadRequest)
		return
	}

	// Get DB from context (you'll need to add this to your main.go context)
	db := r.Context().Value("db").(*sql.DB)

	investment, err := h.investmentService.CreateInvestment(db, userID, packageID, req.Amount)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(investment)
}
