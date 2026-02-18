package tenant

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type PlatformNotificationTemplate struct {
	ID        uuid.UUID `json:"id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Subject   *string   `json:"subject"`
	Body      string    `json:"body"`
	Variables []string  `json:"variables"`
	IsSystem  bool      `json:"is_system"`
	CreatedAt pgtype.Timestamptz `json:"created_at"`
	UpdatedAt pgtype.Timestamptz `json:"updated_at"`
}

type PlatformDocumentTemplate struct {
	ID           uuid.UUID `json:"id"`
	Code         string    `json:"code"`
	Name         string    `json:"name"`
	Type         string    `json:"type"`
	Schema       map[string]interface{} `json:"schema"`
	TemplateHTML string    `json:"template_html"`
	CreatedAt    pgtype.Timestamptz `json:"created_at"`
	UpdatedAt    pgtype.Timestamptz `json:"updated_at"`
}

type PlatformNotificationSettings struct {
	Email    map[string]interface{} `json:"email"`
	SMS      map[string]interface{} `json:"sms"`
	WhatsApp map[string]interface{} `json:"whatsapp"`
}

func (s *Service) GetPlatformNotificationSettings(ctx context.Context) (PlatformNotificationSettings, error) {
	out := PlatformNotificationSettings{
		Email:    map[string]interface{}{},
		SMS:      map[string]interface{}{},
		WhatsApp: map[string]interface{}{},
	}

	const query = `
		SELECT key, value
		FROM platform_settings
		WHERE key = ANY($1::text[])
	`
	keys := []string{
		"notifications.email",
		"notifications.sms",
		"notifications.whatsapp",
	}

	rows, err := s.db.Query(ctx, query, keys)
	if err != nil {
		return out, err
	}
	defer rows.Close()

	for rows.Next() {
		var key string
		var value []byte
		if err := rows.Scan(&key, &value); err != nil {
			return out, err
		}
		switch key {
		case "notifications.email":
			_ = json.Unmarshal(value, &out.Email)
		case "notifications.sms":
			_ = json.Unmarshal(value, &out.SMS)
		case "notifications.whatsapp":
			_ = json.Unmarshal(value, &out.WhatsApp)
		}
	}

	return out, nil
}

func (s *Service) ListNotificationTemplates(ctx context.Context) ([]PlatformNotificationTemplate, error) {
	const query = `
		SELECT id, code, name, type, subject, body, variables, is_system, created_at, updated_at
		FROM platform_notification_templates
		ORDER BY code ASC
	`
	rows, err := s.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []PlatformNotificationTemplate
	for rows.Next() {
		var t PlatformNotificationTemplate
		var vars []byte
		if err := rows.Scan(&t.ID, &t.Code, &t.Name, &t.Type, &t.Subject, &t.Body, &vars, &t.IsSystem, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(vars, &t.Variables)
		if t.Variables == nil {
			t.Variables = []string{}
		}
		templates = append(templates, t)
	}
	return templates, nil
}

func (s *Service) ListDocumentTemplates(ctx context.Context) ([]PlatformDocumentTemplate, error) {
	const query = `
		SELECT id, code, name, type, schema, template_html, created_at, updated_at
		FROM platform_document_templates
		ORDER BY code ASC
	`
	rows, err := s.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []PlatformDocumentTemplate
	for rows.Next() {
		var t PlatformDocumentTemplate
		var schema []byte
		if err := rows.Scan(&t.ID, &t.Code, &t.Name, &t.Type, &schema, &t.TemplateHTML, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(schema, &t.Schema)
		if t.Schema == nil {
			t.Schema = map[string]interface{}{}
		}
		templates = append(templates, t)
	}
	return templates, nil
}

func (s *Service) UpdatePlatformNotificationSettings(ctx context.Context, settings PlatformNotificationSettings, updatedBy string) error {
	var uid pgtype.UUID
	_ = uid.Scan(strings.TrimSpace(updatedBy))

	const upsert = `
		INSERT INTO platform_settings (key, value, updated_by, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (key)
		DO UPDATE SET
			value = EXCLUDED.value,
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
	`

	write := func(key string, value map[string]interface{}) error {
		raw, _ := json.Marshal(value)
		_, err := s.db.Exec(ctx, upsert, key, raw, uid)
		return err
	}

	if err := write("notifications.email", settings.Email); err != nil {
		return err
	}
	if err := write("notifications.sms", settings.SMS); err != nil {
		return err
	}
	if err := write("notifications.whatsapp", settings.WhatsApp); err != nil {
		return err
	}

	return nil
}
