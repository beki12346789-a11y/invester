package services

import (
	"errors"
	"investment-platform/internal/models"
	"investment-platform/internal/repositories"

	"github.com/google/uuid"
)

type DepositService struct {
	depositRepo   *repositories.DepositRepository
	walletRepo    *repositories.WalletRepository
	txRepo        *repositories.TransactionRepository
	walletService *WalletService
}

func NewDepositService(depositRepo *repositories.DepositRepository, walletRepo *repositories.WalletRepository, txRepo *repositories.TransactionRepository, walletService *WalletService) *DepositService {
	return &DepositService{
		depositRepo:   depositRepo,
		walletRepo:    walletRepo,
		txRepo:        txRepo,
		walletService: walletService,
	}
}

func (s *DepositService) CreateDeposit(userID uuid.UUID, amount float64, paymentMethod, transactionID string) (*models.Deposit, error) {
	if amount <= 0 {
		return nil, errors.New("amount must be greater than 0")
	}

	if paymentMethod != "telebirr" && paymentMethod != "cbe" && paymentMethod != "bank_transfer" {
		return nil, errors.New("invalid payment method")
	}

	if transactionID == "" {
		return nil, errors.New("transaction ID is required")
	}

	return s.depositRepo.Create(userID, amount, paymentMethod, transactionID)
}

func (s *DepositService) GetUserDeposits(userID uuid.UUID) ([]models.Deposit, error) {
	return s.depositRepo.GetByUserID(userID)
}

func (s *DepositService) GetAllDeposits() ([]models.Deposit, error) {
	return s.depositRepo.GetAll()
}

func (s *DepositService) ApproveDeposit(depositID uuid.UUID, adminNote *string) error {
	deposit, err := s.depositRepo.GetByID(depositID)
	if err != nil {
		return err
	}
	if deposit == nil {
		return errors.New("deposit not found")
	}

	if deposit.Status != "pending" {
		return errors.New("deposit already processed")
	}

	// Update deposit status
	if err := s.depositRepo.UpdateStatus(depositID, "approved", adminNote); err != nil {
		return err
	}

	// Get DB connection to create transaction
	// Note: This should be wrapped in a transaction in production
	// For now, we'll update the wallet balance directly
	if err := s.walletRepo.UpdateBalanceSimple(deposit.UserID, deposit.Amount); err != nil {
		return err
	}

	return nil
}

func (s *DepositService) RejectDeposit(depositID uuid.UUID, adminNote *string) error {
	deposit, err := s.depositRepo.GetByID(depositID)
	if err != nil {
		return err
	}
	if deposit == nil {
		return errors.New("deposit not found")
	}

	if deposit.Status != "pending" {
		return errors.New("deposit already processed")
	}

	return s.depositRepo.UpdateStatus(depositID, "rejected", adminNote)
}
