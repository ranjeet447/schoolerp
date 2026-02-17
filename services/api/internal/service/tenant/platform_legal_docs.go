package tenant

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

var (
	ErrInvalidLegalDocPayload = errors.New("invalid legal doc payload")
	ErrLegalDocVersionExists  = errors.New("legal doc version already exists")
)

type PlatformLegalDocFilters struct {
	DocKey          string
	IncludeInactive bool
	Limit           int32
	Offset          int32
}

type CreatePlatformLegalDocVersionParams struct {
	DocKey             string `json:"doc_key"`
	Title              string `json:"title"`
	Version            string `json:"version"`
	ContentURL         string `json:"content_url"`
	RequiresAcceptance bool   `json:"requires_acceptance"`
	CreatedBy          string `json:"-"`
}

func (s *Service) ListPlatformLegalDocVersions(ctx context.Context, filters PlatformLegalDocFilters) ([]db.LegalDocVersionRow, error) {
	return s.q.ListLegalDocVersions(ctx, filters.DocKey, filters.IncludeInactive, filters.Limit, filters.Offset)
}

func (s *Service) CreatePlatformLegalDocVersion(ctx context.Context, params CreatePlatformLegalDocVersionParams) (db.LegalDocVersionRow, error) {
	docKey := strings.ToLower(strings.TrimSpace(params.DocKey))
	title := strings.TrimSpace(params.Title)
	version := strings.TrimSpace(params.Version)
	contentURL := strings.TrimSpace(params.ContentURL)

	switch docKey {
	case "terms", "privacy", "dpa":
	default:
		return db.LegalDocVersionRow{}, ErrInvalidLegalDocPayload
	}

	if title == "" || version == "" || contentURL == "" {
		return db.LegalDocVersionRow{}, ErrInvalidLegalDocPayload
	}
	if !strings.HasPrefix(strings.ToLower(contentURL), "https://") {
		return db.LegalDocVersionRow{}, ErrInvalidLegalDocPayload
	}

	var createdBy pgtype.UUID
	_ = createdBy.Scan(strings.TrimSpace(params.CreatedBy))

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return db.LegalDocVersionRow{}, err
	}
	defer tx.Rollback(ctx)

	qtx := s.q.WithTx(tx)

	// Ensure only one active version per doc_key.
	if err := qtx.DeactivateLegalDocVersions(ctx, docKey); err != nil {
		return db.LegalDocVersionRow{}, err
	}

	created, err := qtx.CreateLegalDocVersion(ctx, db.CreateLegalDocVersionParams{
		DocKey:             docKey,
		Title:              title,
		Version:            version,
		ContentURL:         contentURL,
		RequiresAcceptance: params.RequiresAcceptance,
		CreatedBy:          createdBy,
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return db.LegalDocVersionRow{}, ErrLegalDocVersionExists
		}
		if errors.Is(err, pgx.ErrNoRows) {
			return db.LegalDocVersionRow{}, ErrInvalidLegalDocPayload
		}
		return db.LegalDocVersionRow{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return db.LegalDocVersionRow{}, err
	}
	return created, nil
}
