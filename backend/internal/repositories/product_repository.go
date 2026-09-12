package repositories

import (
	"database/sql"
	"investment-platform/internal/models"

	"github.com/google/uuid"
)

type ProductRepository struct {
	db *sql.DB
}

func NewProductRepository(db *sql.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) Create(product *models.Product) error {
	return r.db.QueryRow(`
		INSERT INTO products (name, sku, category, current_quantity, total_purchased, total_sold, average_cost)
		VALUES ($1, $2, $3, 0, 0, 0, 0)
		RETURNING id, created_at, updated_at
	`, product.Name, product.SKU, product.Category).Scan(
		&product.ID, &product.CreatedAt, &product.UpdatedAt,
	)
}

func (r *ProductRepository) GetAll() ([]*models.Product, error) {
	rows, err := r.db.Query(`
		SELECT id, name, sku, category, current_quantity, total_purchased, total_sold, average_cost, created_at, updated_at
		FROM products
		ORDER BY name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []*models.Product
	for rows.Next() {
		p := &models.Product{}
		err := rows.Scan(
			&p.ID, &p.Name, &p.SKU, &p.Category, &p.CurrentQuantity,
			&p.TotalPurchased, &p.TotalSold, &p.AverageCost, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		products = append(products, p)
	}

	return products, rows.Err()
}

func (r *ProductRepository) GetByID(id uuid.UUID) (*models.Product, error) {
	p := &models.Product{}
	err := r.db.QueryRow(`
		SELECT id, name, sku, category, current_quantity, total_purchased, total_sold, average_cost, created_at, updated_at
		FROM products WHERE id = $1
	`, id).Scan(
		&p.ID, &p.Name, &p.SKU, &p.Category, &p.CurrentQuantity,
		&p.TotalPurchased, &p.TotalSold, &p.AverageCost, &p.CreatedAt, &p.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return p, err
}

func (r *ProductRepository) UpdateInventory(tx *sql.Tx, productID uuid.UUID, quantityChange int, isPurchase bool) error {
	if isPurchase {
		_, err := tx.Exec(`
			UPDATE products 
			SET current_quantity = current_quantity + $1,
			    total_purchased = total_purchased + $1
			WHERE id = $2
		`, quantityChange, productID)
		return err
	} else {
		_, err := tx.Exec(`
			UPDATE products 
			SET current_quantity = current_quantity - $1,
			    total_sold = total_sold + $1
			WHERE id = $2
		`, quantityChange, productID)
		return err
	}
}

func (r *ProductRepository) UpdateAverageCost(tx *sql.Tx, productID uuid.UUID, newCost float64) error {
	_, err := tx.Exec(`UPDATE products SET average_cost = $1 WHERE id = $2`, newCost, productID)
	return err
}

func (r *ProductRepository) GetTotalInventoryValue() (float64, error) {
	var total float64
	err := r.db.QueryRow(`
		SELECT COALESCE(SUM(current_quantity * average_cost), 0) FROM products
	`).Scan(&total)
	return total, err
}
