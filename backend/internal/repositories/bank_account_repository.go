package repositories

import (
	"database/sql"
	"investment-platform/internal/models"
)

type BankAccountRepository struct {
	db *sql.DB
}

func NewBankAccountRepository(db *sql.DB) *BankAccountRepository {
	return &BankAccountRepository{db: db}
}

func (r *BankAccountRepository) GetActive() ([]models.BankAccount, error) {
	rows, err := r.db.Query(`
		SELECT id, account_type, account_name, account_number, bank_name, is_active, instructions, created_at, updated_at
		FROM bank_accounts
		WHERE is_active = true
		ORDER BY account_type
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []models.BankAccount
	for rows.Next() {
		var account models.BankAccount
		err := rows.Scan(
			&account.ID,
			&account.AccountType,
			&account.AccountName,
			&account.AccountNumber,
			&account.BankName,
			&account.IsActive,
			&account.Instructions,
			&account.CreatedAt,
			&account.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		accounts = append(accounts, account)
	}
	return accounts, nil
}

func (r *BankAccountRepository) GetAll() ([]models.BankAccount, error) {
	rows, err := r.db.Query(`
		SELECT id, account_type, account_name, account_number, bank_name, is_active, instructions, created_at, updated_at
		FROM bank_accounts
		ORDER BY account_type
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []models.BankAccount
	for rows.Next() {
		var account models.BankAccount
		err := rows.Scan(
			&account.ID,
			&account.AccountType,
			&account.AccountName,
			&account.AccountNumber,
			&account.BankName,
			&account.IsActive,
			&account.Instructions,
			&account.CreatedAt,
			&account.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		accounts = append(accounts, account)
	}
	return accounts, nil
}
