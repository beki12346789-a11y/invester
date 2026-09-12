package services

import (
	"database/sql"
	"errors"
	"investment-platform/internal/models"
	"investment-platform/internal/repositories"
)

type ProductService struct {
	productRepo     *repositories.ProductRepository
	purchaseRepo    *repositories.PurchaseRepository
	saleRepo        *repositories.SaleRepository
	transactionRepo *repositories.TransactionRepository
}

func NewProductService(
	productRepo *repositories.ProductRepository,
	purchaseRepo *repositories.PurchaseRepository,
	saleRepo *repositories.SaleRepository,
	transactionRepo *repositories.TransactionRepository,
) *ProductService {
	return &ProductService{
		productRepo:     productRepo,
		purchaseRepo:    purchaseRepo,
		saleRepo:        saleRepo,
		transactionRepo: transactionRepo,
	}
}

func (s *ProductService) CreatePurchase(db *sql.DB, purchase *models.Purchase) error {
	// Calculate total cost
	purchase.PurchaseAmount = float64(purchase.Quantity) * purchase.PricePerUnit
	purchase.TotalCost = purchase.PurchaseAmount + purchase.ShippingCost + purchase.CustomsCost + purchase.OtherExpenses

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Create purchase record
	if err := s.purchaseRepo.Create(tx, purchase); err != nil {
		return err
	}

	// Update product inventory
	if err := s.productRepo.UpdateInventory(tx, purchase.ProductID, purchase.Quantity, true); err != nil {
		return err
	}

	// Update average cost
	var totalPurchased int
	var currentAvgCost float64
	err = tx.QueryRow(`SELECT total_purchased, average_cost FROM products WHERE id = $1`, purchase.ProductID).
		Scan(&totalPurchased, &currentAvgCost)
	if err != nil {
		return err
	}

	newAvgCost := ((currentAvgCost * float64(totalPurchased-purchase.Quantity)) + purchase.TotalCost) / float64(totalPurchased)
	if err := s.productRepo.UpdateAverageCost(tx, purchase.ProductID, newAvgCost); err != nil {
		return err
	}

	return tx.Commit()
}

func (s *ProductService) CreateSale(db *sql.DB, sale *models.Sale) error {
	// Get product
	product, err := s.productRepo.GetByID(sale.ProductID)
	if err != nil {
		return err
	}
	if product == nil {
		return errors.New("product not found")
	}

	// Check inventory
	if product.CurrentQuantity < sale.Quantity {
		return errors.New("insufficient inventory")
	}

	// Calculate values
	sale.Revenue = float64(sale.Quantity) * sale.PricePerUnit
	sale.CostOfGoods = product.AverageCost * float64(sale.Quantity)
	sale.GrossProfit = sale.Revenue - sale.CostOfGoods - sale.SellingExpenses

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Create sale record
	if err := s.saleRepo.Create(tx, sale); err != nil {
		return err
	}

	// Update product inventory
	if err := s.productRepo.UpdateInventory(tx, sale.ProductID, sale.Quantity, false); err != nil {
		return err
	}

	return tx.Commit()
}
