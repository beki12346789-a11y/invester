package services

import (
	"database/sql"
	"errors"
	"investment-platform/internal/models"
	"investment-platform/internal/repositories"

	"github.com/google/uuid"
)

type WalletService struct {
	walletRepo      *repositories.WalletRepository
	transactionRepo *repositories.TransactionRepository
}

func NewWalletService(walletRepo *repositories.WalletRepository, transactionRepo *repositories.TransactionRepository) *WalletService {
	return &WalletService{
		walletRepo:      walletRepo,
		transactionRepo: transactionRepo,
	}
}

func (s *WalletService) GetWallet(userID uuid.UUID) (*models.Wallet, error) {
	return s.walletRepo.GetByUserID(userID)
}

func (s *WalletService) DeductBalance(tx *sql.Tx, userID uuid.UUID, amount float64, transactionType string, referenceID *uuid.UUID, description string) error {
	// Get current balance
	var balanceBefore float64
	err := tx.QueryRow(`SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE`, userID).Scan(&balanceBefore)
	if err != nil {
		return err
	}

	if balanceBefore < amount {
		return errors.New("insufficient balance")
	}

	// Update wallet
	if err := s.walletRepo.UpdateBalance(tx, userID, -amount, transactionType); err != nil {
		return err
	}

	// Create transaction record
	transaction := &models.Transaction{
		UserID:        &userID,
		Type:          transactionType,
		Amount:        amount,
		BalanceBefore: balanceBefore,
		BalanceAfter:  balanceBefore - amount,
		ReferenceID:   referenceID,
		Description:   description,
	}

	return s.transactionRepo.Create(tx, transaction)
}

func (s *WalletService) AddBalance(tx *sql.Tx, userID uuid.UUID, amount float64, transactionType string, referenceID *uuid.UUID, description string) error {
	// Get current balance
	var balanceBefore float64
	err := tx.QueryRow(`SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE`, userID).Scan(&balanceBefore)
	if err != nil {
		return err
	}

	// Update wallet
	updateType := ""
	switch transactionType {
	case "DEPOSIT":
		updateType = "deposit"
	case "TRADING_PROFIT":
		updateType = ""
	case "ADJUSTMENT":
		updateType = ""
	}

	if updateType != "" {
		if err := s.walletRepo.UpdateBalance(tx, userID, amount, updateType); err != nil {
			return err
		}
	} else {
		_, err := tx.Exec(`UPDATE wallets SET balance = balance + $1 WHERE user_id = $2`, amount, userID)
		if err != nil {
			return err
		}
	}

	// Create transaction record
	transaction := &models.Transaction{
		UserID:        &userID,
		Type:          transactionType,
		Amount:        amount,
		BalanceBefore: balanceBefore,
		BalanceAfter:  balanceBefore + amount,
		ReferenceID:   referenceID,
		Description:   description,
	}

	return s.transactionRepo.Create(tx, transaction)
}
