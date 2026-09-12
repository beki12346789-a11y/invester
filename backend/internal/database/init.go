package database

import (
	"database/sql"
	"investment-platform/internal/config"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func InitializeAdmin(db *sql.DB, cfg *config.Config) error {
	// Check if admin exists
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE phone_number = $1)", cfg.AdminPhone).Scan(&exists)
	if err != nil {
		return err
	}

	if exists {
		log.Println("Admin user already exists")
		return nil
	}

	// Create admin user
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(cfg.AdminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var userID string
	err = tx.QueryRow(`
		INSERT INTO users (phone_number, password_hash, full_name, role, status)
		VALUES ($1, $2, $3, 'admin', 'active')
		RETURNING id
	`, cfg.AdminPhone, passwordHash, cfg.AdminName).Scan(&userID)
	if err != nil {
		return err
	}

	// Create wallet for admin
	_, err = tx.Exec(`
		INSERT INTO wallets (user_id, balance, total_deposited, total_invested, total_withdrawn)
		VALUES ($1, 0, 0, 0, 0)
	`, userID)
	if err != nil {
		return err
	}

	if err = tx.Commit(); err != nil {
		return err
	}

	log.Printf("Admin user created: %s", cfg.AdminPhone)
	return nil
}
