package repositories

import (
	"database/sql"
	"investment-platform/internal/models"

	"github.com/google/uuid"
)

type DepositRepository struct {
	db *sql.DB
}

func NewDepositRepository(db *sql.DB) *DepositRepository {
	return &DepositRepository{db: db}
}

func (r *DepositRepository) Create(userID uuid.UUID, amount float64, paymentMethod, transactionID string) (*models.Deposit, error) {
	deposit := &models.Deposit{}
	err := r.db.QueryRow(`
		INSERT INTO deposits (user_id, amount, payment_method, transaction_id, status)
		VALUES ($1, $2, $3, $4, 'pending')
		RETURNING id, user_id, amount, payment_method, transaction_id, proof_image_url, status, admin_note, created_at, updated_at
	`, userID, amount, paymentMethod, transactionID).Scan(
		&deposit.ID,
		&deposit.UserID,
		&deposit.Amount,
		&deposit.PaymentMethod,
		&deposit.TransactionID,
		&deposit.ProofImageURL,
		&deposit.Status,
		&deposit.AdminNote,
		&deposit.CreatedAt,
		&deposit.UpdatedAt,
	)
	return deposit, err
}

func (r *DepositRepository) GetByUserID(userID uuid.UUID) ([]models.Deposit, error) {
	rows, err := r.db.Query(`
		SELECT id, user_id, amount, payment_method, transaction_id, proof_image_url, status, admin_note, created_at, updated_at
		FROM deposits
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var deposits []models.Deposit
	for rows.Next() {
		var deposit models.Deposit
		err := rows.Scan(
			&deposit.ID,
			&deposit.UserID,
			&deposit.Amount,
			&deposit.PaymentMethod,
			&deposit.TransactionID,
			&deposit.ProofImageURL,
			&deposit.Status,
			&deposit.AdminNote,
			&deposit.CreatedAt,
			&deposit.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		deposits = append(deposits, deposit)
	}
	return deposits, nil
}

func (r *DepositRepository) GetAll() ([]models.Deposit, error) {
	rows, err := r.db.Query(`
		SELECT d.id, d.user_id, d.amount, d.payment_method, d.transaction_id, d.proof_image_url, d.status, d.admin_note, d.created_at, d.updated_at
		FROM deposits d
		ORDER BY d.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var deposits []models.Deposit
	for rows.Next() {
		var deposit models.Deposit
		err := rows.Scan(
			&deposit.ID,
			&deposit.UserID,
			&deposit.Amount,
			&deposit.PaymentMethod,
			&deposit.TransactionID,
			&deposit.ProofImageURL,
			&deposit.Status,
			&deposit.AdminNote,
			&deposit.CreatedAt,
			&deposit.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		deposits = append(deposits, deposit)
	}
	return deposits, nil
}

func (r *DepositRepository) GetByID(id uuid.UUID) (*models.Deposit, error) {
	deposit := &models.Deposit{}
	err := r.db.QueryRow(`
		SELECT id, user_id, amount, payment_method, transaction_id, proof_image_url, status, admin_note, created_at, updated_at
		FROM deposits
		WHERE id = $1
	`, id).Scan(
		&deposit.ID,
		&deposit.UserID,
		&deposit.Amount,
		&deposit.PaymentMethod,
		&deposit.TransactionID,
		&deposit.ProofImageURL,
		&deposit.Status,
		&deposit.AdminNote,
		&deposit.CreatedAt,
		&deposit.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return deposit, err
}

func (r *DepositRepository) UpdateStatus(id uuid.UUID, status string, adminNote *string) error {
	_, err := r.db.Exec(`
		UPDATE deposits
		SET status = $1, admin_note = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
	`, status, adminNote, id)
	return err
}
