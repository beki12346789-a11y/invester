package repositories

import (
	"database/sql"
	"investment-platform/internal/models"

	"github.com/google/uuid"
)

type PackageRepository struct {
	db *sql.DB
}

func NewPackageRepository(db *sql.DB) *PackageRepository {
	return &PackageRepository{db: db}
}

func (r *PackageRepository) GetAll() ([]*models.InvestmentPackage, error) {
	rows, err := r.db.Query(`
		SELECT id, name, name_am, description, description_am, image_url, 
		       minimum_amount, target_percentage, duration_days, active, created_at, updated_at
		FROM investment_packages
		WHERE active = true
		ORDER BY minimum_amount ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var packages []*models.InvestmentPackage
	for rows.Next() {
		pkg := &models.InvestmentPackage{}
		err := rows.Scan(
			&pkg.ID, &pkg.Name, &pkg.NameAm, &pkg.Description, &pkg.DescriptionAm, &pkg.ImageURL,
			&pkg.MinimumAmount, &pkg.TargetPercentage, &pkg.DurationDays, &pkg.Active, 
			&pkg.CreatedAt, &pkg.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		packages = append(packages, pkg)
	}

	return packages, rows.Err()
}

func (r *PackageRepository) GetByID(id uuid.UUID) (*models.InvestmentPackage, error) {
	pkg := &models.InvestmentPackage{}
	err := r.db.QueryRow(`
		SELECT id, name, name_am, description, description_am, image_url,
		       minimum_amount, target_percentage, duration_days, active, created_at, updated_at
		FROM investment_packages
		WHERE id = $1 AND active = true
	`, id).Scan(
		&pkg.ID, &pkg.Name, &pkg.NameAm, &pkg.Description, &pkg.DescriptionAm, &pkg.ImageURL,
		&pkg.MinimumAmount, &pkg.TargetPercentage, &pkg.DurationDays, &pkg.Active, 
		&pkg.CreatedAt, &pkg.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return pkg, err
}

func (r *PackageRepository) Update(pkg *models.InvestmentPackage) error {
	_, err := r.db.Exec(`
		UPDATE investment_packages 
		SET name = $1, name_am = $2, description = $3, description_am = $4, 
		    image_url = $5, minimum_amount = $6, target_percentage = $7, 
		    duration_days = $8, active = $9, updated_at = CURRENT_TIMESTAMP
		WHERE id = $10
	`, pkg.Name, pkg.NameAm, pkg.Description, pkg.DescriptionAm, pkg.ImageURL,
		pkg.MinimumAmount, pkg.TargetPercentage, pkg.DurationDays, pkg.Active, pkg.ID)
	return err
}
