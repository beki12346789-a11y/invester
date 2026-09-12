package repositories

import (
	"database/sql"
	"investment-platform/internal/models"

	"github.com/google/uuid"
)

type WalletRepository struct {
	db *sql.DB
}

func NewWalletRepository(db *sql.DB) *WalletRepository {
	return &WalletRepository{db: db}
}

func (r *WalletRepository) Create(userID uuid.UUID) error {
	_, err := r.db.Exec(`
		INSERT INTO wallets (user_id, balance, total_deposited, total_invested, total_withdrawn)
		VALUES ($1, 0, 0, 0, 0)
	`, userID)
	return err
}

func (r *WalletRepository) CreateWithInitialBalance(userID uuid.UUID, initialBalance float64) (*models.Wallet, error) {
	wallet := &models.Wallet{}
	err := r.db.QueryRow(`
		INSERT INTO wallets (user_id, balance, total_deposited, total_invested, total_withdrawn)
		VALUES ($1, $2, $2, 0, 0)
		RETURNING id, user_id, balance, total_deposited, total_invested, total_withdrawn, created_at, updated_at
	`, userID, initialBalance).Scan(
		&wallet.ID, &wallet.UserID, &wallet.Balance, &wallet.TotalDeposited,
		&wallet.TotalInvested, &wallet.TotalWithdrawn, &wallet.CreatedAt, &wallet.UpdatedAt,
	)
	return wallet, err
}

func (r *WalletRepository) GetByUserID(userID uuid.UUID) (*models.Wallet, error) {
	wallet := &models.Wallet{}
	err := r.db.QueryRow(`
		SELECT id, user_id, balance, total_deposited, total_invested, total_withdrawn, created_at, updated_at
		FROM wallets WHERE user_id = $1
	`, userID).Scan(
		&wallet.ID, &wallet.UserID, &wallet.Balance, &wallet.TotalDeposited,
		&wallet.TotalInvested, &wallet.TotalWithdrawn, &wallet.CreatedAt, &wallet.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return wallet, err
}

func (r *WalletRepository) UpdateBalance(tx *sql.Tx, userID uuid.UUID, amount float64, updateType string) error {
	query := `
		UPDATE wallets SET balance = balance + $1
	`
	
	switch updateType {
	case "deposit":
		query += `, total_deposited = total_deposited + $1`
	case "invest":
		query += `, total_invested = total_invested + $1`
	case "withdraw":
		query += `, total_withdrawn = total_withdrawn + $1`
	}
	
	query += ` WHERE user_id = $2`
	
	_, err := tx.Exec(query, amount, userID)
	return err
}

func (r *WalletRepository) GetBalance(userID uuid.UUID) (float64, error) {
	var balance float64
	err := r.db.QueryRow(`SELECT balance FROM wallets WHERE user_id = $1`, userID).Scan(&balance)
	return balance, err
}

func (r *WalletRepository) UpdateBalanceSimple(userID uuid.UUID, amount float64) error {
	_, err := r.db.Exec(`
		UPDATE wallets 
		SET balance = balance + $1, total_deposited = total_deposited + $1
		WHERE user_id = $2
	`, amount, userID)
	return err
}
