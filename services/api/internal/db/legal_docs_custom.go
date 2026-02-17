package db

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type LegalDocVersionRow struct {
	ID                 string
	DocKey             string
	Title              string
	Version            string
	ContentURL         string
	RequiresAcceptance bool
	IsActive           bool
	PublishedAt        pgtype.Timestamptz
	CreatedBy          string
	CreatedAt          pgtype.Timestamptz
}

type CreateLegalDocVersionParams struct {
	DocKey             string
	Title              string
	Version            string
	ContentURL         string
	RequiresAcceptance bool
	CreatedBy          pgtype.UUID
}

func (q *Queries) ListLegalDocVersions(ctx context.Context, docKey string, includeInactive bool, limit int32, offset int32) ([]LegalDocVersionRow, error) {
	if limit <= 0 || limit > 500 {
		limit = 200
	}
	if offset < 0 {
		offset = 0
	}

	docKey = strings.ToLower(strings.TrimSpace(docKey))

	const query = `
		SELECT
			ldv.id::text,
			ldv.doc_key,
			ldv.title,
			ldv.version,
			ldv.content_url,
			ldv.requires_acceptance,
			ldv.is_active,
			ldv.published_at,
			COALESCE(ldv.created_by::text, '') AS created_by,
			ldv.created_at
		FROM legal_doc_versions ldv
		WHERE ($1::text = '' OR ldv.doc_key = $1)
		  AND ($2::boolean = TRUE OR ldv.is_active = TRUE)
		ORDER BY ldv.doc_key ASC, ldv.published_at DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := q.db.Query(ctx, query, docKey, includeInactive, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]LegalDocVersionRow, 0)
	for rows.Next() {
		var row LegalDocVersionRow
		if err := rows.Scan(
			&row.ID,
			&row.DocKey,
			&row.Title,
			&row.Version,
			&row.ContentURL,
			&row.RequiresAcceptance,
			&row.IsActive,
			&row.PublishedAt,
			&row.CreatedBy,
			&row.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (q *Queries) DeactivateLegalDocVersions(ctx context.Context, docKey string) error {
	docKey = strings.ToLower(strings.TrimSpace(docKey))
	_, err := q.db.Exec(ctx, `UPDATE legal_doc_versions SET is_active = FALSE WHERE doc_key = $1 AND is_active = TRUE`, docKey)
	return err
}

func (q *Queries) CreateLegalDocVersion(ctx context.Context, arg CreateLegalDocVersionParams) (LegalDocVersionRow, error) {
	docKey := strings.ToLower(strings.TrimSpace(arg.DocKey))
	title := strings.TrimSpace(arg.Title)
	version := strings.TrimSpace(arg.Version)
	contentURL := strings.TrimSpace(arg.ContentURL)

	const query = `
		INSERT INTO legal_doc_versions (
			doc_key,
			title,
			version,
			content_url,
			requires_acceptance,
			is_active,
			published_at,
			created_by,
			created_at
		)
		VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), $6, NOW())
		RETURNING
			id::text,
			doc_key,
			title,
			version,
			content_url,
			requires_acceptance,
			is_active,
			published_at,
			COALESCE(created_by::text, '') AS created_by,
			created_at
	`

	var row LegalDocVersionRow
	err := q.db.QueryRow(ctx, query, docKey, title, version, contentURL, arg.RequiresAcceptance, arg.CreatedBy).Scan(
		&row.ID,
		&row.DocKey,
		&row.Title,
		&row.Version,
		&row.ContentURL,
		&row.RequiresAcceptance,
		&row.IsActive,
		&row.PublishedAt,
		&row.CreatedBy,
		&row.CreatedAt,
	)
	return row, err
}

type LatestLegalDocVersionRow struct {
	DocKey             string
	Title              string
	Version            string
	ContentURL         string
	RequiresAcceptance bool
	PublishedAt        pgtype.Timestamptz
}

func (q *Queries) ListLatestActiveLegalDocVersions(ctx context.Context) ([]LatestLegalDocVersionRow, error) {
	const query = `
		SELECT DISTINCT ON (ldv.doc_key)
			ldv.doc_key,
			ldv.title,
			ldv.version,
			ldv.content_url,
			ldv.requires_acceptance,
			ldv.published_at
		FROM legal_doc_versions ldv
		WHERE ldv.is_active = TRUE
		ORDER BY ldv.doc_key, ldv.published_at DESC
	`

	rows, err := q.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]LatestLegalDocVersionRow, 0)
	for rows.Next() {
		var row LatestLegalDocVersionRow
		if err := rows.Scan(&row.DocKey, &row.Title, &row.Version, &row.ContentURL, &row.RequiresAcceptance, &row.PublishedAt); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

type UserLegalAcceptanceRow struct {
	DocKey     string
	Version    string
	AcceptedAt pgtype.Timestamptz
}

func (q *Queries) ListUserLegalAcceptances(ctx context.Context, userID pgtype.UUID) ([]UserLegalAcceptanceRow, error) {
	const query = `
		SELECT doc_key, version, accepted_at
		FROM user_legal_acceptances
		WHERE user_id = $1
		ORDER BY accepted_at DESC
	`

	rows, err := q.db.Query(ctx, query, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	defer rows.Close()

	out := make([]UserLegalAcceptanceRow, 0)
	for rows.Next() {
		var row UserLegalAcceptanceRow
		if err := rows.Scan(&row.DocKey, &row.Version, &row.AcceptedAt); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

type CreateUserLegalAcceptanceParams struct {
	UserID    pgtype.UUID
	DocKey    string
	Version   string
	IPAddress string
	UserAgent string
	Metadata  map[string]interface{}
}

func (q *Queries) CreateUserLegalAcceptance(ctx context.Context, arg CreateUserLegalAcceptanceParams) error {
	docKey := strings.ToLower(strings.TrimSpace(arg.DocKey))
	version := strings.TrimSpace(arg.Version)

	metadata := arg.Metadata
	if metadata == nil {
		metadata = map[string]interface{}{}
	}
	raw, _ := json.Marshal(metadata)

	_, err := q.db.Exec(ctx, `
		INSERT INTO user_legal_acceptances (user_id, doc_key, version, accepted_at, ip_address, user_agent, metadata)
		VALUES ($1, $2, $3, NOW(), $4, $5, $6)
		ON CONFLICT (user_id, doc_key, version) DO NOTHING
	`, arg.UserID, docKey, version, strings.TrimSpace(arg.IPAddress), strings.TrimSpace(arg.UserAgent), raw)
	return err
}
