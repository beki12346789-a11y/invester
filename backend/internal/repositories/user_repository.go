package repositories

import (
	"database/sql"
	"fmt"
	"investment-platform/internal/models"
	"strings"

	"github.com/google/uuid"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// CreateWithPhone creates a new user with phone number
func (r *UserRepository) CreateWithPhone(phoneNumber, passwordHash, fullName, role string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(`
		INSERT INTO users (phone_number, password_hash, full_name, role, status)
		VALUES ($1, $2, $3, $4, 'active')
		RETURNING id, phone_number, full_name, role, status, created_at, updated_at
	`, phoneNumber, passwordHash, fullName, role).Scan(
		&user.ID, &user.PhoneNumber, &user.FullName, &user.Role, &user.Status,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		// Check for unique constraint violation
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			return nil, fmt.Errorf("phone number already registered")
		}
		return nil, err
	}
	return user, nil
}

// GetByPhoneNumber retrieves user by phone number
func (r *UserRepository) GetByPhoneNumber(phoneNumber string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(`
		SELECT id, phone_number, password_hash, full_name, role, status, 
		       password_reset_code, reset_code_expiry, created_at, updated_at
		FROM users WHERE phone_number = $1
	`, phoneNumber).Scan(
		&user.ID, &user.PhoneNumber, &user.PasswordHash, &user.FullName,
		&user.Role, &user.Status, &user.PasswordResetCode, &user.ResetCodeExpiry,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

// GetByID retrieves user by ID
func (r *UserRepository) GetByID(id uuid.UUID) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(`
		SELECT id, phone_number, full_name, role, status, created_at, updated_at
		FROM users WHERE id = $1
	`, id).Scan(
		&user.ID, &user.PhoneNumber, &user.FullName, &user.Role, &user.Status,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

// UpdatePhoneNumber updates user's phone number (for admin migration tool)
func (r *UserRepository) UpdatePhoneNumber(userID uuid.UUID, phoneNumber string) error {
	result, err := r.db.Exec(`
		UPDATE users 
		SET phone_number = $1, status = 'active', updated_at = NOW()
		WHERE id = $2
	`, phoneNumber, userID)
	
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			return fmt.Errorf("phone number already in use")
		}
		return err
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}
	
	return nil
}

// SearchByPhonePrefix searches users by phone number prefix (for admin panel)
func (r *UserRepository) SearchByPhonePrefix(prefix string, limit, offset int) ([]*models.User, int, error) {
	var users []*models.User
	var total int
	
	// Count query
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM users 
		WHERE phone_number LIKE $1 || '%'
	`, prefix).Scan(&total)
	if err != nil {
		return nil, 0, err
	}
	
	// Data query
	rows, err := r.db.Query(`
		SELECT id, phone_number, full_name, role, status, created_at, updated_at
		FROM users
		WHERE phone_number LIKE $1 || '%'
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, prefix, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(&user.ID, &user.PhoneNumber, &user.FullName, &user.Role,
			&user.Status, &user.CreatedAt, &user.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, user)
	}
	
	return users, total, rows.Err()
}

// GetPendingMigrationUsers returns users with pending_migration status
func (r *UserRepository) GetPendingMigrationUsers(limit, offset int) ([]*models.User, int, error) {
	var users []*models.User
	var total int
	
	// Count query
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM users 
		WHERE status = 'pending_migration'
	`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}
	
	// Data query
	rows, err := r.db.Query(`
		SELECT id, phone_number, full_name, role, status, created_at, updated_at
		FROM users
		WHERE status = 'pending_migration'
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(&user.ID, &user.PhoneNumber, &user.FullName, &user.Role,
			&user.Status, &user.CreatedAt, &user.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, user)
	}
	
	return users, total, rows.Err()
}

// GetAll retrieves all users with search and pagination
func (r *UserRepository) GetAll(search string, limit, offset int) ([]*models.User, int, error) {
	var users []*models.User
	var total int

	// Build query
	query := `
		SELECT id, phone_number, full_name, role, status, created_at, updated_at
		FROM users
		WHERE role = 'user'
	`
	countQuery := `SELECT COUNT(*) FROM users WHERE role = 'user'`

	args := []interface{}{}
	if search != "" {
		query += ` AND (phone_number LIKE $1 OR full_name ILIKE $1 OR id::text ILIKE $1)`
		countQuery += ` AND (phone_number LIKE $1 OR full_name ILIKE $1 OR id::text ILIKE $1)`
		args = append(args, "%"+search+"%")
	}

	// Get total count
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	query += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, len(args)+1, len(args)+2)
	args = append(args, limit, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID, &user.PhoneNumber, &user.FullName, &user.Role, &user.Status,
			&user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, user)
	}

	return users, total, rows.Err()
}

// Legacy methods for backward compatibility during migration
// These should be removed after full migration

// Create is deprecated - use CreateWithPhone instead
func (r *UserRepository) Create(phoneNumber, passwordHash, fullName, role string) (*models.User, error) {
	return r.CreateWithPhone(phoneNumber, passwordHash, fullName, role)
}

// GetByEmail is deprecated - use GetByPhoneNumber instead
func (r *UserRepository) GetByEmail(phoneNumber string) (*models.User, error) {
	return r.GetByPhoneNumber(phoneNumber)
}

// UpdatePasswordResetCode stores the hashed reset code and expiry
func (r *UserRepository) UpdatePasswordResetCode(userID uuid.UUID, resetCodeHash string) error {
	_, err := r.db.Exec(`
		UPDATE users 
		SET password_reset_code = $1, reset_code_expiry = NOW() + INTERVAL '15 minutes', updated_at = NOW()
		WHERE id = $2
	`, resetCodeHash, userID)
	return err
}

// UpdatePassword updates the user's password
func (r *UserRepository) UpdatePassword(userID uuid.UUID, passwordHash string) error {
	_, err := r.db.Exec(`
		UPDATE users 
		SET password_hash = $1, updated_at = NOW()
		WHERE id = $2
	`, passwordHash, userID)
	return err
}

// ClearPasswordResetCode removes the reset code after successful reset
func (r *UserRepository) ClearPasswordResetCode(userID uuid.UUID) error {
	_, err := r.db.Exec(`
		UPDATE users 
		SET password_reset_code = NULL, reset_code_expiry = NULL, updated_at = NOW()
		WHERE id = $1
	`, userID)
	return err
}
