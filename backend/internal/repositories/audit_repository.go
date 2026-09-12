package repositories

import (
	"database/sql"
	"encoding/json"
	"investment-platform/internal/models"
)

type AuditRepository struct {
	db *sql.DB
}

func NewAuditRepository(db *sql.DB) *AuditRepository {
	return &AuditRepository{db: db}
}

func (r *AuditRepository) Log(log *models.AuditLog) error {
	detailsJSON, err := json.Marshal(log.Details)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(`
		INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, log.UserID, log.Action, log.EntityType, log.EntityID, detailsJSON, log.IPAddress)
	
	return err
}
