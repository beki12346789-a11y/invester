package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID                  uuid.UUID  `json:"id"`
	PhoneNumber         string     `json:"phone_number"`
	PasswordHash        string     `json:"-"`
	FullName            string     `json:"full_name"`
	Role                string     `json:"role"`   // "user" or "admin"
	Status              string     `json:"status"` // "active", "inactive", or "pending_migration"
	PasswordResetCode   *string    `json:"-"`      // Hashed reset code
	ResetCodeExpiry     *time.Time `json:"-"`      // Expiry time for reset code
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

type Wallet struct {
	ID             uuid.UUID `json:"id"`
	UserID         uuid.UUID `json:"user_id"`
	Balance        float64   `json:"balance"`
	TotalDeposited float64   `json:"total_deposited"`
	TotalInvested  float64   `json:"total_invested"`
	TotalWithdrawn float64   `json:"total_withdrawn"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type InvestmentPackage struct {
	ID               uuid.UUID `json:"id"`
	Name             string    `json:"name"`
	NameAm           string    `json:"name_am"`
	Description      string    `json:"description"`
	DescriptionAm    string    `json:"description_am"`
	ImageURL         string    `json:"image_url"`
	MinimumAmount    float64   `json:"minimum_amount"`
	TargetPercentage float64   `json:"target_percentage"`
	DurationDays     int       `json:"duration_days"`
	Active           bool      `json:"active"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type Investment struct {
	ID               uuid.UUID `json:"id"`
	UserID           uuid.UUID `json:"user_id"`
	PackageID        uuid.UUID `json:"package_id"`
	Amount           float64   `json:"amount"`
	TargetPercentage float64   `json:"target_percentage"`
	TargetReturn     float64   `json:"target_return"`
	ActualProfitLoss float64   `json:"actual_profit_loss"`
	Status           string    `json:"status"`
	StartDate        time.Time `json:"start_date"`
	EndDate          *time.Time `json:"end_date,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	
	// Joined fields
	PackageName string `json:"package_name,omitempty"`
}

type Transaction struct {
	ID            uuid.UUID  `json:"id"`
	UserID        *uuid.UUID `json:"user_id,omitempty"`
	Type          string     `json:"type"`
	Amount        float64    `json:"amount"`
	BalanceBefore float64    `json:"balance_before"`
	BalanceAfter  float64    `json:"balance_after"`
	ReferenceID   *uuid.UUID `json:"reference_id,omitempty"`
	Description   string     `json:"description"`
	CreatedAt     time.Time  `json:"created_at"`
}

type Product struct {
	ID              uuid.UUID `json:"id"`
	Name            string    `json:"name"`
	SKU             string    `json:"sku"`
	Category        string    `json:"category"`
	CurrentQuantity int       `json:"current_quantity"`
	TotalPurchased  int       `json:"total_purchased"`
	TotalSold       int       `json:"total_sold"`
	AverageCost     float64   `json:"average_cost"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type Purchase struct {
	ID             uuid.UUID `json:"id"`
	ProductID      uuid.UUID `json:"product_id"`
	Supplier       string    `json:"supplier"`
	Country        string    `json:"country"`
	Quantity       int       `json:"quantity"`
	PricePerUnit   float64   `json:"price_per_unit"`
	PurchaseAmount float64   `json:"purchase_amount"`
	ShippingCost   float64   `json:"shipping_cost"`
	CustomsCost    float64   `json:"customs_cost"`
	OtherExpenses  float64   `json:"other_expenses"`
	TotalCost      float64   `json:"total_cost"`
	PurchaseDate   time.Time `json:"purchase_date"`
	Notes          string    `json:"notes"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	
	// Joined fields
	ProductName string `json:"product_name,omitempty"`
	ProductSKU  string `json:"product_sku,omitempty"`
}

type Sale struct {
	ID              uuid.UUID `json:"id"`
	ProductID       uuid.UUID `json:"product_id"`
	Buyer           string    `json:"buyer"`
	Country         string    `json:"country"`
	Quantity        int       `json:"quantity"`
	PricePerUnit    float64   `json:"price_per_unit"`
	Revenue         float64   `json:"revenue"`
	SellingExpenses float64   `json:"selling_expenses"`
	CostOfGoods     float64   `json:"cost_of_goods"`
	GrossProfit     float64   `json:"gross_profit"`
	SaleDate        time.Time `json:"sale_date"`
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	
	// Joined fields
	ProductName string `json:"product_name,omitempty"`
	ProductSKU  string `json:"product_sku,omitempty"`
}

type Withdrawal struct {
	ID              uuid.UUID  `json:"id"`
	UserID          uuid.UUID  `json:"user_id"`
	Amount          float64    `json:"amount"`
	WithdrawalMethod string    `json:"withdrawal_method"`
	AccountDetails  string     `json:"account_details"`
	Status          string     `json:"status"`
	AdminNotes      string     `json:"admin_notes"`
	RequestedAt     time.Time  `json:"requested_at"`
	ProcessedAt     *time.Time `json:"processed_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	
	// Joined fields
	UserName  string `json:"user_name,omitempty"`
	UserPhone string `json:"user_phone,omitempty"`
}

type AuditLog struct {
	ID         uuid.UUID              `json:"id"`
	UserID     *uuid.UUID             `json:"user_id,omitempty"`
	Action     string                 `json:"action"`
	EntityType string                 `json:"entity_type"`
	EntityID   *uuid.UUID             `json:"entity_id,omitempty"`
	Details    map[string]interface{} `json:"details"`
	IPAddress  string                 `json:"ip_address"`
	CreatedAt  time.Time              `json:"created_at"`
}

type Deposit struct {
	ID             uuid.UUID  `json:"id"`
	UserID         uuid.UUID  `json:"user_id"`
	Amount         float64    `json:"amount"`
	PaymentMethod  string     `json:"payment_method"`
	TransactionID  string     `json:"transaction_id"`
	ProofImageURL  *string    `json:"proof_image_url,omitempty"`
	Status         string     `json:"status"`
	AdminNote      *string    `json:"admin_note,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type BankAccount struct {
	ID            uuid.UUID `json:"id"`
	AccountType   string    `json:"account_type"`
	AccountName   string    `json:"account_name"`
	AccountNumber string    `json:"account_number"`
	BankName      *string   `json:"bank_name,omitempty"`
	IsActive      bool      `json:"is_active"`
	Instructions  *string   `json:"instructions,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
