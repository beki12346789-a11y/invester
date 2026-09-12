package repositories

import (
	"database/sql"
	"investment-platform/internal/models"
	"time"
)

type SaleRepository struct {
	db *sql.DB
}

func NewSaleRepository(db *sql.DB) *SaleRepository {
	return &SaleRepository{db: db}
}

func (r *SaleRepository) Create(tx *sql.Tx, sale *models.Sale) error {
	return tx.QueryRow(`
		INSERT INTO sales (
			product_id, buyer, country, quantity, price_per_unit, revenue,
			selling_expenses, cost_of_goods, gross_profit, sale_date, notes
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at, updated_at
	`, sale.ProductID, sale.Buyer, sale.Country, sale.Quantity, sale.PricePerUnit,
		sale.Revenue, sale.SellingExpenses, sale.CostOfGoods, sale.GrossProfit,
		sale.SaleDate, sale.Notes).Scan(
		&sale.ID, &sale.CreatedAt, &sale.UpdatedAt,
	)
}

func (r *SaleRepository) GetAll(limit, offset int) ([]*models.Sale, error) {
	rows, err := r.db.Query(`
		SELECT s.id, s.product_id, s.buyer, s.country, s.quantity, s.price_per_unit,
		       s.revenue, s.selling_expenses, s.cost_of_goods, s.gross_profit,
		       s.sale_date, s.notes, s.created_at, s.updated_at,
		       pr.name as product_name, pr.sku as product_sku
		FROM sales s
		JOIN products pr ON s.product_id = pr.id
		ORDER BY s.sale_date DESC, s.created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sales []*models.Sale
	for rows.Next() {
		s := &models.Sale{}
		err := rows.Scan(
			&s.ID, &s.ProductID, &s.Buyer, &s.Country, &s.Quantity, &s.PricePerUnit,
			&s.Revenue, &s.SellingExpenses, &s.CostOfGoods, &s.GrossProfit,
			&s.SaleDate, &s.Notes, &s.CreatedAt, &s.UpdatedAt,
			&s.ProductName, &s.ProductSKU,
		)
		if err != nil {
			return nil, err
		}
		sales = append(sales, s)
	}

	return sales, rows.Err()
}

func (r *SaleRepository) GetTodaySales() (float64, float64, int, error) {
	var revenue, profit float64
	var count int
	today := time.Now().Format("2006-01-02")
	
	err := r.db.QueryRow(`
		SELECT COALESCE(SUM(revenue), 0), COALESCE(SUM(gross_profit), 0), COUNT(*)
		FROM sales
		WHERE sale_date = $1
	`, today).Scan(&revenue, &profit, &count)
	
	return revenue, profit, count, err
}

func (r *SaleRepository) GetTotalSalesRevenue() (float64, error) {
	var total float64
	err := r.db.QueryRow(`SELECT COALESCE(SUM(revenue), 0) FROM sales`).Scan(&total)
	return total, err
}

func (r *SaleRepository) GetTotalTradingProfit() (float64, error) {
	var total float64
	err := r.db.QueryRow(`SELECT COALESCE(SUM(gross_profit), 0) FROM sales`).Scan(&total)
	return total, err
}
