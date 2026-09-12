package repositories

import (
	"database/sql"
	"investment-platform/internal/models"
	"time"
)

type PurchaseRepository struct {
	db *sql.DB
}

func NewPurchaseRepository(db *sql.DB) *PurchaseRepository {
	return &PurchaseRepository{db: db}
}

func (r *PurchaseRepository) Create(tx *sql.Tx, purchase *models.Purchase) error {
	return tx.QueryRow(`
		INSERT INTO purchases (
			product_id, supplier, country, quantity, price_per_unit, purchase_amount,
			shipping_cost, customs_cost, other_expenses, total_cost, purchase_date, notes
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, created_at, updated_at
	`, purchase.ProductID, purchase.Supplier, purchase.Country, purchase.Quantity,
		purchase.PricePerUnit, purchase.PurchaseAmount, purchase.ShippingCost,
		purchase.CustomsCost, purchase.OtherExpenses, purchase.TotalCost,
		purchase.PurchaseDate, purchase.Notes).Scan(
		&purchase.ID, &purchase.CreatedAt, &purchase.UpdatedAt,
	)
}

func (r *PurchaseRepository) GetAll(limit, offset int) ([]*models.Purchase, error) {
	rows, err := r.db.Query(`
		SELECT p.id, p.product_id, p.supplier, p.country, p.quantity, p.price_per_unit,
		       p.purchase_amount, p.shipping_cost, p.customs_cost, p.other_expenses,
		       p.total_cost, p.purchase_date, p.notes, p.created_at, p.updated_at,
		       pr.name as product_name, pr.sku as product_sku
		FROM purchases p
		JOIN products pr ON p.product_id = pr.id
		ORDER BY p.purchase_date DESC, p.created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var purchases []*models.Purchase
	for rows.Next() {
		p := &models.Purchase{}
		err := rows.Scan(
			&p.ID, &p.ProductID, &p.Supplier, &p.Country, &p.Quantity,
			&p.PricePerUnit, &p.PurchaseAmount, &p.ShippingCost, &p.CustomsCost,
			&p.OtherExpenses, &p.TotalCost, &p.PurchaseDate, &p.Notes,
			&p.CreatedAt, &p.UpdatedAt, &p.ProductName, &p.ProductSKU,
		)
		if err != nil {
			return nil, err
		}
		purchases = append(purchases, p)
	}

	return purchases, rows.Err()
}

func (r *PurchaseRepository) GetTodayPurchases() (float64, int, error) {
	var total float64
	var count int
	today := time.Now().Format("2006-01-02")
	
	err := r.db.QueryRow(`
		SELECT COALESCE(SUM(total_cost), 0), COUNT(*)
		FROM purchases
		WHERE purchase_date = $1
	`, today).Scan(&total, &count)
	
	return total, count, err
}
