package services

import (
	"database/sql"
	"errors"
	"investment-platform/internal/models"
	"investment-platform/internal/repositories"

	"github.com/google/uuid"
)

type WithdrawalService struct {
	withdrawalRepo *repositories.WithdrawalRepository
	walletService  *WalletService
	transactionRepo *repositories.TransactionRepository
}

func NewWithdrawalService(
	withdrawalRepo *repositories.WithdrawalRepository,
	walletService *WalletService,
	transactionRepo *repositories.TransactionRepository,
) *WithdrawalService {
	return &WithdrawalService{
		withdrawalRepo:  withdrawalRepo,
		walletService:   walletService,
		transactionRepo: transactionRepo,
	}
}

func (s *WithdrawalService) CreateWithdrawal(withdrawal *models.Withdrawal) error {
	// Check balance
	wallet, err := s.walletService.GetWallet(withdrawal.UserID)
	if err != nil {
		return err
	}

	if wallet.Balance < withdrawal.Amount {
		return errors.New("insufficient balance")
	}

	return s.withdrawalRepo.Create(withdrawal)
}

func (s *WithdrawalService) ApproveWithdrawal(id uuid.UUID, adminNotes string) error {
	return s.withdrawalRepo.UpdateStatus(id, "approved", adminNotes)
}

func (s *WithdrawalService) RejectWithdrawal(id uuid.UUID, adminNotes string) error {
	return s.withdrawalRepo.UpdateStatus(id, "rejected", adminNotes)
}

func (s *WithdrawalService) CompleteWithdrawal(db *sql.DB, id uuid.UUID, adminNotes string) error {
	// Get withdrawal
	withdrawal, err := s.withdrawalRepo.GetByID(id)
	if err != nil {
		return err
	}
	if withdrawal == nil {
		return errors.New("withdrawal not found")
	}

	if withdrawal.Status != "approved" && withdrawal.Status != "pending" {
		return errors.New("withdrawal must be approved first")
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Deduct from wallet
	if err := s.walletService.DeductBalance(tx, withdrawal.UserID, withdrawal.Amount, "WITHDRAWAL", &withdrawal.ID, "Withdrawal completed"); err != nil {
		return err
	}

	// Update total withdrawn
	_, err = tx.Exec(`UPDATE wallets SET total_withdrawn = total_withdrawn + $1 WHERE user_id = $2`, withdrawal.Amount, withdrawal.UserID)
	if err != nil {
		return err
	}

	// Update withdrawal status
	_, err = tx.Exec(`
		UPDATE withdrawals 
		SET status = 'completed', admin_notes = $1, processed_at = NOW(), updated_at = NOW()
		WHERE id = $2
	`, adminNotes, id)
	if err != nil {
		return err
	}

	return tx.Commit()
}
