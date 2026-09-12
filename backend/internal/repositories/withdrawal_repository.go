package repositories

import (
	"database/sql"
	"investment-platform/internal/models"
	"time"

	"github.com/google/uuid"
)

type WithdrawalRepository struct {
	db *sql.DB
}

func NewWithdrawalRepository(db *sql.DB) *WithdrawalRepository {
	return &WithdrawalRepository{db: db}
}

func (r *WithdrawalRepository) Create(withdrawal *models.Withdrawal) error {
	return r.db.QueryRow(`
		INSERT INTO withdrawals (user_id, amount, withdrawal_method, account_details, status)
		VALUES ($1, $2, $3, $4, 'pending')
		RETURNING id, requested_at, created_at, updated_at
	`, withdrawal.UserID, withdrawal.Amount, withdrawal.WithdrawalMethod, withdrawal.AccountDetails).Scan(
		&withdrawal.ID, &withdrawal.RequestedAt, &withdrawal.CreatedAt, &withdrawal.UpdatedAt,
	)
}

func (r *WithdrawalRepository) GetByUserID(userID uuid.UUID) ([]*models.Withdrawal, error) {
	rows, err := r.db.Query(`
		SELECT id, user_id, amount, withdrawal_method, account_details, status,
		       admin_notes, requested_at, processed_at, created_at, updated_at
		FROM withdrawals
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var withdrawals []*models.Withdrawal
	for rows.Next() {
		w := &models.Withdrawal{}
		err := rows.Scan(
			&w.ID, &w.UserID, &w.Amount, &w.WithdrawalMethod, &w.AccountDetails,
			&w.Status, &w.AdminNotes, &w.RequestedAt, &w.ProcessedAt,
			&w.CreatedAt, &w.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		withdrawals = append(withdrawals, w)
	}

	return withdrawals, rows.Err()
}

func (r *WithdrawalRepository) GetAll(status string) ([]*models.Withdrawal, error) {
	query := `
		SELECT w.id, w.user_id, w.amount, w.withdrawal_method, w.account_details, w.status,
		       w.admin_notes, w.requested_at, w.processed_at, w.created_at, w.updated_at,
		       u.full_name as user_name, u.phone_number as user_phone
		FROM withdrawals w
		JOIN users u ON w.user_id = u.id
	`
	
	args := []interface{}{}
	if status != "" {
		query += ` WHERE w.status = $1`
		args = append(args, status)
	}
	
	query += ` ORDER BY w.created_at DESC`

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var withdrawals []*models.Withdrawal
	for rows.Next() {
		w := &models.Withdrawal{}
		err := rows.Scan(
			&w.ID, &w.UserID, &w.Amount, &w.WithdrawalMethod, &w.AccountDetails,
			&w.Status, &w.AdminNotes, &w.RequestedAt, &w.ProcessedAt,
			&w.CreatedAt, &w.UpdatedAt, &w.UserName, &w.UserPhone,
		)
		if err != nil {
			return nil, err
		}
		withdrawals = append(withdrawals, w)
	}

	return withdrawals, rows.Err()
}

func (r *WithdrawalRepository) GetByID(id uuid.UUID) (*models.Withdrawal, error) {
	w := &models.Withdrawal{}
	err := r.db.QueryRow(`
		SELECT id, user_id, amount, withdrawal_method, account_details, status,
		       admin_notes, requested_at, processed_at, created_at, updated_at
		FROM withdrawals WHERE id = $1
	`, id).Scan(
		&w.ID, &w.UserID, &w.Amount, &w.WithdrawalMethod, &w.AccountDetails,
		&w.Status, &w.AdminNotes, &w.RequestedAt, &w.ProcessedAt,
		&w.CreatedAt, &w.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return w, err
}

func (r *WithdrawalRepository) UpdateStatus(id uuid.UUID, status, adminNotes string) error {
	now := time.Now()
	_, err := r.db.Exec(`
		UPDATE withdrawals 
		SET status = $1, admin_notes = $2, processed_at = $3, updated_at = $4
		WHERE id = $5
	`, status, adminNotes, now, now, id)
	return err
}

func (r *WithdrawalRepository) GetPendingTotal() (float64, int, error) {
	var total float64
	var count int
	
	err := r.db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0), COUNT(*)
		FROM withdrawals
		WHERE status = 'pending'
	`).Scan(&total, &count)
	
	return total, count, err
}

func (r *WithdrawalRepository) GetTodayWithdrawals() (float64, int, error) {
	var total float64
	var count int
	today := time.Now().Format("2006-01-02")
	
	err := r.db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0), COUNT(*)
		FROM withdrawals
		WHERE status = 'completed' AND DATE(processed_at) = $1
	`, today).Scan(&total, &count)
	
	return total, count, err
}
