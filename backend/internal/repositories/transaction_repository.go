package repositories

import (
	"database/sql"
	"investment-platform/internal/models"
	"time"

	"github.com/google/uuid"
)

type TransactionRepository struct {
	db *sql.DB
}

func NewTransactionRepository(db *sql.DB) *TransactionRepository {
	return &TransactionRepository{db: db}
}

func (r *TransactionRepository) Create(tx *sql.Tx, transaction *models.Transaction) error {
	return tx.QueryRow(`
		INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_id, description)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`, transaction.UserID, transaction.Type, transaction.Amount, transaction.BalanceBefore,
		transaction.BalanceAfter, transaction.ReferenceID, transaction.Description).Scan(
		&transaction.ID, &transaction.CreatedAt,
	)
}

func (r *TransactionRepository) GetByUserID(userID uuid.UUID, limit, offset int) ([]*models.Transaction, error) {
	rows, err := r.db.Query(`
		SELECT id, user_id, type, amount, balance_before, balance_after, reference_id, description, created_at
		FROM transactions
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []*models.Transaction
	for rows.Next() {
		tx := &models.Transaction{}
		err := rows.Scan(
			&tx.ID, &tx.UserID, &tx.Type, &tx.Amount, &tx.BalanceBefore,
			&tx.BalanceAfter, &tx.ReferenceID, &tx.Description, &tx.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, tx)
	}

	return transactions, rows.Err()
}

func (r *TransactionRepository) GetAll(limit, offset int) ([]*models.Transaction, error) {
	rows, err := r.db.Query(`
		SELECT id, user_id, type, amount, balance_before, balance_after, reference_id, description, created_at
		FROM transactions
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []*models.Transaction
	for rows.Next() {
		tx := &models.Transaction{}
		err := rows.Scan(
			&tx.ID, &tx.UserID, &tx.Type, &tx.Amount, &tx.BalanceBefore,
			&tx.BalanceAfter, &tx.ReferenceID, &tx.Description, &tx.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, tx)
	}

	return transactions, rows.Err()
}

func (r *TransactionRepository) GetTodayDeposits() (float64, error) {
	var total float64
	today := time.Now().Format("2006-01-02")
	
	err := r.db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM transactions
		WHERE type = 'DEPOSIT' AND DATE(created_at) = $1
	`, today).Scan(&total)
	
	return total, err
}
