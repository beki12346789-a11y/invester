package repositories

import (
	"database/sql"
	"investment-platform/internal/models"
	"time"

	"github.com/google/uuid"
)

type InvestmentRepository struct {
	db *sql.DB
}

func NewInvestmentRepository(db *sql.DB) *InvestmentRepository {
	return &InvestmentRepository{db: db}
}

func (r *InvestmentRepository) Create(tx *sql.Tx, investment *models.Investment) error {
	return tx.QueryRow(`
		INSERT INTO investments (user_id, package_id, amount, target_percentage, target_return, status)
		VALUES ($1, $2, $3, $4, $5, 'active')
		RETURNING id, start_date, created_at, updated_at
	`, investment.UserID, investment.PackageID, investment.Amount,
		investment.TargetPercentage, investment.TargetReturn).Scan(
		&investment.ID, &investment.StartDate, &investment.CreatedAt, &investment.UpdatedAt,
	)
}

func (r *InvestmentRepository) GetByUserID(userID uuid.UUID) ([]*models.Investment, error) {
	rows, err := r.db.Query(`
		SELECT i.id, i.user_id, i.package_id, i.amount, i.target_percentage, i.target_return,
		       i.actual_profit_loss, i.status, i.start_date, i.end_date, i.created_at, i.updated_at,
		       p.name as package_name
		FROM investments i
		JOIN investment_packages p ON i.package_id = p.id
		WHERE i.user_id = $1
		ORDER BY i.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var investments []*models.Investment
	for rows.Next() {
		inv := &models.Investment{}
		err := rows.Scan(
			&inv.ID, &inv.UserID, &inv.PackageID, &inv.Amount, &inv.TargetPercentage,
			&inv.TargetReturn, &inv.ActualProfitLoss, &inv.Status, &inv.StartDate,
			&inv.EndDate, &inv.CreatedAt, &inv.UpdatedAt, &inv.PackageName,
		)
		if err != nil {
			return nil, err
		}
		investments = append(investments, inv)
	}

	return investments, rows.Err()
}

func (r *InvestmentRepository) GetTotalInvestedByUserID(userID uuid.UUID) (float64, error) {
	var total float64
	err := r.db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0) FROM investments WHERE user_id = $1 AND status = 'active'
	`, userID).Scan(&total)
	return total, err
}

func (r *InvestmentRepository) GetTotalActiveInvestments() (float64, error) {
	var total float64
	err := r.db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0) FROM investments WHERE status = 'active'
	`).Scan(&total)
	return total, err
}

func (r *InvestmentRepository) GetTodayInvestments() (float64, int, error) {
	var total float64
	var count int
	today := time.Now().Format("2006-01-02")
	
	err := r.db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0), COUNT(*)
		FROM investments
		WHERE DATE(created_at) = $1
	`, today).Scan(&total, &count)
	
	return total, count, err
}
