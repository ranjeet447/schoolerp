package tenant

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type PlatformAnnouncement struct {
	ID            uuid.UUID          `json:"id"`
	Title         string             `json:"title"`
	Content       string             `json:"content"`
	TargetCohorts []string           `json:"target_cohorts"`
	TargetTenants []uuid.UUID        `json:"target_tenants"`
	StartsAt      pgtype.Timestamptz `json:"starts_at"`
	EndsAt        pgtype.Timestamptz `json:"ends_at"`
	IsActive      bool               `json:"is_active"`
	CreatedBy     *uuid.UUID         `json:"created_by"`
	CreatedAt     pgtype.Timestamptz `json:"created_at"`
}

type PlatformChangelog struct {
	ID          uuid.UUID          `json:"id"`
	Version     string             `json:"version"`
	Title       string             `json:"title"`
	Content     string             `json:"content"`
	Type        string             `json:"type"`
	PublishedAt pgtype.Timestamptz `json:"published_at"`
	CreatedBy   *uuid.UUID         `json:"created_by"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
}

func (s *Service) ListAnnouncements(ctx context.Context) ([]PlatformAnnouncement, error) {
	const query = `
		SELECT id, title, content, target_cohorts, target_tenants, starts_at, ends_at, is_active, created_by, created_at
		FROM platform_announcements
		ORDER BY created_at DESC
	`
	rows, err := s.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []PlatformAnnouncement
	for rows.Next() {
		var a PlatformAnnouncement
		if err := rows.Scan(&a.ID, &a.Title, &a.Content, &a.TargetCohorts, &a.TargetTenants, &a.StartsAt, &a.EndsAt, &a.IsActive, &a.CreatedBy, &a.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, nil
}

func (s *Service) ListChangelogs(ctx context.Context) ([]PlatformChangelog, error) {
	const query = `
		SELECT id, version, title, content, type, published_at, created_by, created_at
		FROM platform_changelogs
		ORDER BY published_at DESC
	`
	rows, err := s.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []PlatformChangelog
	for rows.Next() {
		var c PlatformChangelog
		if err := rows.Scan(&c.ID, &c.Version, &c.Title, &c.Content, &c.Type, &c.PublishedAt, &c.CreatedBy, &c.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

func (s *Service) CreateAnnouncement(ctx context.Context, a PlatformAnnouncement, creatorID string) (uuid.UUID, error) {
	var uid pgtype.UUID
	_ = uid.Scan(strings.TrimSpace(creatorID))

	const query = `
		INSERT INTO platform_announcements (title, content, target_cohorts, target_tenants, starts_at, ends_at, is_active, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`
	var id uuid.UUID
	err := s.db.QueryRow(ctx, query, a.Title, a.Content, a.TargetCohorts, a.TargetTenants, a.StartsAt, a.EndsAt, a.IsActive, uid).Scan(&id)
	return id, err
}
