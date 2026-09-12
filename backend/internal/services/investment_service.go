package services

import (
	"database/sql"
	"errors"
	"investment-platform/internal/models"
	"investment-platform/internal/repositories"

	"github.com/google/uuid"
)

type InvestmentService struct {
	investmentRepo  *repositories.InvestmentRepository
	packageRepo     *repositories.PackageRepository
	walletService   *WalletService
	transactionRepo *repositories.TransactionRepository
}

func NewInvestmentService(
	investmentRepo *repositories.InvestmentRepository,
	packageRepo *repositories.PackageRepository,
	walletService *WalletService,
	transactionRepo *repositories.TransactionRepository,
) *InvestmentService {
	return &InvestmentService{
		investmentRepo:  investmentRepo,
		packageRepo:     packageRepo,
		walletService:   walletService,
		transactionRepo: transactionRepo,
	}
}

func (s *InvestmentService) CreateInvestment(db *sql.DB, userID, packageID uuid.UUID, amount float64) (*models.Investment, error) {
	// Get package
	pkg, err := s.packageRepo.GetByID(packageID)
	if err != nil {
		return nil, err
	}
	if pkg == nil {
		return nil, errors.New("package not found")
	}

	// Validate amount
	if amount < pkg.MinimumAmount {
		return nil, errors.New("amount below package minimum")
	}

	// Start transaction
	tx, err := db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Deduct from wallet
	targetReturn := amount * pkg.TargetPercentage / 100
	investment := &models.Investment{
		UserID:           userID,
		PackageID:        packageID,
		Amount:           amount,
		TargetPercentage: pkg.TargetPercentage,
		TargetReturn:     targetReturn,
		Status:           "active",
	}

	// Create investment
	if err := s.investmentRepo.Create(tx, investment); err != nil {
		return nil, err
	}

	// Deduct from wallet and create transaction
	if err := s.walletService.DeductBalance(tx, userID, amount, "INVESTMENT", &investment.ID, "Investment in "+pkg.Name); err != nil {
		return nil, err
	}

	// Update total invested
	_, err = tx.Exec(`UPDATE wallets SET total_invested = total_invested + $1 WHERE user_id = $2`, amount, userID)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return investment, nil
}

func (s *InvestmentService) GetUserInvestments(userID uuid.UUID) ([]*models.Investment, error) {
	return s.investmentRepo.GetByUserID(userID)
}
