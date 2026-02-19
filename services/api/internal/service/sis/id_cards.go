package sis

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type IDCardService struct {
	db    *pgxpool.Pool
	audit *audit.Logger
}

func NewIDCardService(db *pgxpool.Pool, audit *audit.Logger) *IDCardService {
	return &IDCardService{db: db, audit: audit}
}

type IDCardTemplate struct {
	ID        string                 `json:"id"`
	Name      string                 `json:"name"`
	UserType  string                 `json:"user_type"`
	Layout    string                 `json:"layout"`
	BgURL     string                 `json:"bg_image_url"`
	Config    map[string]interface{} `json:"config"`
	IsDefault bool                   `json:"is_default"`
}

func (s *IDCardService) CreateTemplate(ctx context.Context, tenantID string, t IDCardTemplate, userID, reqID, ip string) (IDCardTemplate, error) {
	var id string
	query := `INSERT INTO id_card_templates (tenant_id, name, user_type, layout, bg_image_url, config, is_default) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`
	err := s.db.QueryRow(ctx, query, tenantID, t.Name, t.UserType, t.Layout, t.BgURL, t.Config, t.IsDefault).Scan(&id)
	if err != nil {
		return IDCardTemplate{}, err
	}
	t.ID = id

	s.audit.Log(ctx, audit.Entry{
		TenantID:     toPgUUID(tenantID),
		UserID:       toPgUUID(userID),
		RequestID:    reqID,
		Action:       "id_card_template.create",
		ResourceType: "id_card_template",
		ResourceID:   toPgUUID(id),
		After:        t,
		IPAddress:    ip,
	})

	return t, nil
}

func (s *IDCardService) ListTemplates(ctx context.Context, tenantID string) ([]IDCardTemplate, error) {
	query := `SELECT id, name, user_type, layout, bg_image_url, config, is_default FROM id_card_templates WHERE tenant_id = $1`
	rows, err := s.db.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []IDCardTemplate
	for rows.Next() {
		var t IDCardTemplate
		err := rows.Scan(&t.ID, &t.Name, &t.UserType, &t.Layout, &t.BgURL, &t.Config, &t.IsDefault)
		if err != nil {
			return nil, err
		}
		templates = append(templates, t)
	}
	return templates, nil
}

func (s *IDCardService) DeleteTemplate(ctx context.Context, tenantID, id string, userID, reqID, ip string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM id_card_templates WHERE id = $1 AND tenant_id = $2`, id, tenantID)
	if err != nil {
		return err
	}

	s.audit.Log(ctx, audit.Entry{
		TenantID:     toPgUUID(tenantID),
		UserID:       toPgUUID(userID),
		RequestID:    reqID,
		Action:       "id_card_template.delete",
		ResourceType: "id_card_template",
		ResourceID:   toPgUUID(id),
		IPAddress:    ip,
	})

	return nil
}
