package handlers

import (
	"database/sql"
	"encoding/json"
	"investment-platform/internal/models"
	"investment-platform/internal/repositories"
	"investment-platform/internal/services"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

type AdminHandler struct {
	adminService      *services.AdminService
	productService    *services.ProductService
	withdrawalService *services.WithdrawalService
	auditRepo         *repositories.AuditRepository
}

func NewAdminHandler(
	adminService *services.AdminService,
	productService *services.ProductService,
	withdrawalService *services.WithdrawalService,
	auditRepo *repositories.AuditRepository,
) *AdminHandler {
	return &AdminHandler{
		adminService:      adminService,
		productService:    productService,
		withdrawalService: withdrawalService,
		auditRepo:         auditRepo,
	}
}

func (h *AdminHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	stats, err := h.adminService.GetDashboardStats()
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch dashboard stats"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func (h *AdminHandler) GetTodayActivity(w http.ResponseWriter, r *http.Request) {
	activity, err := h.adminService.GetTodayActivity()
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch today activity"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(activity)
}

func (h *AdminHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	
	if limit == 0 {
		limit = 50
	}

	users, total, err := h.adminService.GetUsers(search, limit, offset)
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch users"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"users": users,
		"total": total,
		"limit": limit,
		"offset": offset,
	})
}

func (h *AdminHandler) GetUserDetails(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"Invalid user ID"}`, http.StatusBadRequest)
		return
	}

	details, err := h.adminService.GetUserDetails(userID)
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch user details"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(details)
}

type CreateProductRequest struct {
	Name     string `json:"name"`
	SKU      string `json:"sku"`
	Category string `json:"category"`
}

func (h *AdminHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var req CreateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	product := &models.Product{
		Name:     req.Name,
		SKU:      req.SKU,
		Category: req.Category,
	}

	db := r.Context().Value("db").(*sql.DB)
	productRepo := repositories.NewProductRepository(db)

	if err := productRepo.Create(product); err != nil {
		http.Error(w, `{"error":"Failed to create product"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(product)
}

func (h *AdminHandler) GetProducts(w http.ResponseWriter, r *http.Request) {
	db := r.Context().Value("db").(*sql.DB)
	productRepo := repositories.NewProductRepository(db)

	products, err := productRepo.GetAll()
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch products"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func (h *AdminHandler) GetInventory(w http.ResponseWriter, r *http.Request) {
	db := r.Context().Value("db").(*sql.DB)
	productRepo := repositories.NewProductRepository(db)

	products, err := productRepo.GetAll()
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch inventory"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

type CreatePurchaseRequest struct {
	ProductID     string  `json:"product_id"`
	Supplier      string  `json:"supplier"`
	Country       string  `json:"country"`
	Quantity      int     `json:"quantity"`
	PricePerUnit  float64 `json:"price_per_unit"`
	ShippingCost  float64 `json:"shipping_cost"`
	CustomsCost   float64 `json:"customs_cost"`
	OtherExpenses float64 `json:"other_expenses"`
	PurchaseDate  string  `json:"purchase_date"`
	Notes         string  `json:"notes"`
}

func (h *AdminHandler) CreatePurchase(w http.ResponseWriter, r *http.Request) {
	var req CreatePurchaseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	productID, err := uuid.Parse(req.ProductID)
	if err != nil {
		http.Error(w, `{"error":"Invalid product ID"}`, http.StatusBadRequest)
		return
	}

	purchaseDate, err := time.Parse("2006-01-02", req.PurchaseDate)
	if err != nil {
		http.Error(w, `{"error":"Invalid date format"}`, http.StatusBadRequest)
		return
	}

	purchase := &models.Purchase{
		ProductID:     productID,
		Supplier:      req.Supplier,
		Country:       req.Country,
		Quantity:      req.Quantity,
		PricePerUnit:  req.PricePerUnit,
		ShippingCost:  req.ShippingCost,
		CustomsCost:   req.CustomsCost,
		OtherExpenses: req.OtherExpenses,
		PurchaseDate:  purchaseDate,
		Notes:         req.Notes,
	}

	db := r.Context().Value("db").(*sql.DB)
	if err := h.productService.CreatePurchase(db, purchase); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(purchase)
}

func (h *AdminHandler) GetPurchases(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	
	if limit == 0 {
		limit = 50
	}

	db := r.Context().Value("db").(*sql.DB)
	purchaseRepo := repositories.NewPurchaseRepository(db)

	purchases, err := purchaseRepo.GetAll(limit, offset)
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch purchases"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(purchases)
}

type CreateSaleRequest struct {
	ProductID       string  `json:"product_id"`
	Buyer           string  `json:"buyer"`
	Country         string  `json:"country"`
	Quantity        int     `json:"quantity"`
	PricePerUnit    float64 `json:"price_per_unit"`
	SellingExpenses float64 `json:"selling_expenses"`
	SaleDate        string  `json:"sale_date"`
	Notes           string  `json:"notes"`
}

func (h *AdminHandler) CreateSale(w http.ResponseWriter, r *http.Request) {
	var req CreateSaleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	productID, err := uuid.Parse(req.ProductID)
	if err != nil {
		http.Error(w, `{"error":"Invalid product ID"}`, http.StatusBadRequest)
		return
	}

	saleDate, err := time.Parse("2006-01-02", req.SaleDate)
	if err != nil {
		http.Error(w, `{"error":"Invalid date format"}`, http.StatusBadRequest)
		return
	}

	sale := &models.Sale{
		ProductID:       productID,
		Buyer:           req.Buyer,
		Country:         req.Country,
		Quantity:        req.Quantity,
		PricePerUnit:    req.PricePerUnit,
		SellingExpenses: req.SellingExpenses,
		SaleDate:        saleDate,
		Notes:           req.Notes,
	}

	db := r.Context().Value("db").(*sql.DB)
	if err := h.productService.CreateSale(db, sale); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(sale)
}

func (h *AdminHandler) GetSales(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	
	if limit == 0 {
		limit = 50
	}

	db := r.Context().Value("db").(*sql.DB)
	saleRepo := repositories.NewSaleRepository(db)

	sales, err := saleRepo.GetAll(limit, offset)
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch sales"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}

func (h *AdminHandler) GetWithdrawals(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	db := r.Context().Value("db").(*sql.DB)
	withdrawalRepo := repositories.NewWithdrawalRepository(db)

	withdrawals, err := withdrawalRepo.GetAll(status)
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch withdrawals"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(withdrawals)
}

type UpdateWithdrawalRequest struct {
	AdminNotes string `json:"admin_notes"`
}

func (h *AdminHandler) ApproveWithdrawal(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"Invalid withdrawal ID"}`, http.StatusBadRequest)
		return
	}

	var req UpdateWithdrawalRequest
	json.NewDecoder(r.Body).Decode(&req)

	if err := h.withdrawalService.ApproveWithdrawal(id, req.AdminNotes); err != nil {
		http.Error(w, `{"error":"Failed to approve withdrawal"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "approved"})
}

func (h *AdminHandler) RejectWithdrawal(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"Invalid withdrawal ID"}`, http.StatusBadRequest)
		return
	}

	var req UpdateWithdrawalRequest
	json.NewDecoder(r.Body).Decode(&req)

	if err := h.withdrawalService.RejectWithdrawal(id, req.AdminNotes); err != nil {
		http.Error(w, `{"error":"Failed to reject withdrawal"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "rejected"})
}

func (h *AdminHandler) CompleteWithdrawal(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"Invalid withdrawal ID"}`, http.StatusBadRequest)
		return
	}

	var req UpdateWithdrawalRequest
	json.NewDecoder(r.Body).Decode(&req)

	db := r.Context().Value("db").(*sql.DB)
	if err := h.withdrawalService.CompleteWithdrawal(db, id, req.AdminNotes); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "completed"})
}

func (h *AdminHandler) GetAllTransactions(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	
	if limit == 0 {
		limit = 100
	}

	db := r.Context().Value("db").(*sql.DB)
	transactionRepo := repositories.NewTransactionRepository(db)

	transactions, err := transactionRepo.GetAll(limit, offset)
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch transactions"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(transactions)
}

type UpdatePackageRequest struct {
	Name          string  `json:"name"`
	NameAm        string  `json:"name_am"`
	Description   string  `json:"description"`
	DescriptionAm string  `json:"description_am"`
	ImageURL      string  `json:"image_url"`
	MinimumAmount float64 `json:"minimum_amount"`
	TargetPercentage float64 `json:"target_percentage"`
	DurationDays  int     `json:"duration_days"`
	Active        bool    `json:"active"`
}

func (h *AdminHandler) UpdatePackage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	pkgID, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"Invalid package ID"}`, http.StatusBadRequest)
		return
	}

	var req UpdatePackageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	pkg := &models.InvestmentPackage{
		ID:               pkgID,
		Name:             req.Name,
		NameAm:           req.NameAm,
		Description:      req.Description,
		DescriptionAm:    req.DescriptionAm,
		ImageURL:         req.ImageURL,
		MinimumAmount:    req.MinimumAmount,
		TargetPercentage: req.TargetPercentage,
		DurationDays:     req.DurationDays,
		Active:           req.Active,
	}

	db := r.Context().Value("db").(*sql.DB)
	packageRepo := repositories.NewPackageRepository(db)

	if err := packageRepo.Update(pkg); err != nil {
		http.Error(w, `{"error":"Failed to update package"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pkg)
}
