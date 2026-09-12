package services

import (
	"investment-platform/internal/models"
	"investment-platform/internal/repositories"

	"github.com/google/uuid"
)

type AdminService struct {
	userRepo        *repositories.UserRepository
	investmentRepo  *repositories.InvestmentRepository
	transactionRepo *repositories.TransactionRepository
	productRepo     *repositories.ProductRepository
	withdrawalRepo  *repositories.WithdrawalRepository
}

func NewAdminService(
	userRepo *repositories.UserRepository,
	investmentRepo *repositories.InvestmentRepository,
	transactionRepo *repositories.TransactionRepository,
	productRepo *repositories.ProductRepository,
	withdrawalRepo *repositories.WithdrawalRepository,
) *AdminService {
	return &AdminService{
		userRepo:        userRepo,
		investmentRepo:  investmentRepo,
		transactionRepo: transactionRepo,
		productRepo:     productRepo,
		withdrawalRepo:  withdrawalRepo,
	}
}

type DashboardStats struct {
	TotalUsers            int     `json:"total_users"`
	TotalDeposits         float64 `json:"total_deposits"`
	TotalInvestments      float64 `json:"total_investments"`
	TradingCapital        float64 `json:"trading_capital"`
	InventoryValue        float64 `json:"inventory_value"`
	TotalSales            float64 `json:"total_sales"`
	TradingProfit         float64 `json:"trading_profit"`
	PendingWithdrawals    float64 `json:"pending_withdrawals"`
	PendingWithdrawalCount int    `json:"pending_withdrawal_count"`
}

type TodayActivity struct {
	NewUsers            int     `json:"new_users"`
	Deposits            float64 `json:"deposits"`
	Investments         float64 `json:"investments"`
	InvestmentCount     int     `json:"investment_count"`
	ProductPurchases    float64 `json:"product_purchases"`
	PurchaseCount       int     `json:"purchase_count"`
	ProductSales        float64 `json:"product_sales"`
	SaleCount           int     `json:"sale_count"`
	TradingProfit       float64 `json:"trading_profit"`
	WithdrawalRequests  float64 `json:"withdrawal_requests"`
	WithdrawalReqCount  int     `json:"withdrawal_request_count"`
	CompletedWithdrawals float64 `json:"completed_withdrawals"`
	CompletedWithCount  int     `json:"completed_withdrawal_count"`
}

func (s *AdminService) GetDashboardStats() (*DashboardStats, error) {
	stats := &DashboardStats{}

	// Total users (excluding admin)
	users, _, err := s.userRepo.GetAll("", 1000, 0)
	if err != nil {
		return nil, err
	}
	stats.TotalUsers = len(users)

	// Total investments
	totalInvest, err := s.investmentRepo.GetTotalActiveInvestments()
	if err != nil {
		return nil, err
	}
	stats.TotalInvestments = totalInvest
	stats.TradingCapital = totalInvest

	// Inventory value
	invValue, err := s.productRepo.GetTotalInventoryValue()
	if err != nil {
		return nil, err
	}
	stats.InventoryValue = invValue

	// Pending withdrawals
	pendingTotal, pendingCount, err := s.withdrawalRepo.GetPendingTotal()
	if err != nil {
		return nil, err
	}
	stats.PendingWithdrawals = pendingTotal
	stats.PendingWithdrawalCount = pendingCount

	return stats, nil
}

func (s *AdminService) GetTodayActivity() (*TodayActivity, error) {
	activity := &TodayActivity{}

	// Today investments
	invAmount, invCount, err := s.investmentRepo.GetTodayInvestments()
	if err != nil {
		return nil, err
	}
	activity.Investments = invAmount
	activity.InvestmentCount = invCount

	// Today deposits
	deposits, err := s.transactionRepo.GetTodayDeposits()
	if err != nil {
		return nil, err
	}
	activity.Deposits = deposits

	return activity, nil
}


type UserWithStats struct {
	*models.User
	TotalDeposited float64 `json:"total_deposited"`
	TotalInvested  float64 `json:"total_invested"`
	CurrentBalance float64 `json:"current_balance"`
	TotalWithdrawn float64 `json:"total_withdrawn"`
}

type UserDetails struct {
	User         *models.User          `json:"user"`
	Wallet       *models.Wallet        `json:"wallet"`
	Investments  []*models.Investment  `json:"investments"`
	Transactions []*models.Transaction `json:"transactions"`
	Withdrawals  []*models.Withdrawal  `json:"withdrawals"`
}

func (s *AdminService) GetUsers(search string, limit, offset int) ([]*UserWithStats, int, error) {
	users, total, err := s.userRepo.GetAll(search, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	// This is a simplified version - in production you'd join with wallets table
	var usersWithStats []*UserWithStats
	for _, user := range users {
		usersWithStats = append(usersWithStats, &UserWithStats{
			User: user,
		})
	}

	return usersWithStats, total, nil
}

func (s *AdminService) GetUserDetails(userID uuid.UUID) (*UserDetails, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil || user == nil {
		return nil, err
	}

	details := &UserDetails{
		User: user,
	}

	return details, nil
}
