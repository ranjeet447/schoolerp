package sis

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/security"
)

type ConfidentialNote struct {
	ID        string `json:"id"`
	StudentID string `json:"student_id"`
	Content   string `json:"content"`
	CreatedBy string `json:"created_by"`
	CreatedAt string `json:"created_at"`
}

type ConfidentialNotesService struct {
	pool   *pgxpool.Pool
	q      *db.Queries
	crypto *security.Crypto
}

func NewConfidentialNotesService(pool *pgxpool.Pool, crypto *security.Crypto) *ConfidentialNotesService {
	return &ConfidentialNotesService{
		pool:   pool,
		q:      db.New(pool),
		crypto: crypto,
	}
}

func (s *ConfidentialNotesService) AddNote(ctx context.Context, tenantID, studentID, userID, content string) (db.StudentConfidentialNote, error) {
	if content == "" {
		return db.StudentConfidentialNote{}, errors.New("note content cannot be empty")
	}

	// Encrypt
	encrypted, err := s.crypto.Encrypt([]byte(content))
	if err != nil {
		return db.StudentConfidentialNote{}, fmt.Errorf("encryption failed: %w", err)
	}

	// Store as base64 in the text column
	encoded := base64.StdEncoding.EncodeToString(encrypted)

	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	sID := pgtype.UUID{}
	sID.Scan(studentID)
	uID := pgtype.UUID{}
	uID.Scan(userID)

	return s.q.CreateConfidentialNote(ctx, db.CreateConfidentialNoteParams{
		TenantID:         tID,
		StudentID:        sID,
		CreatedBy:        uID,
		EncryptedContent: encoded,
	})
}

func (s *ConfidentialNotesService) ListNotes(ctx context.Context, tenantID, studentID string) ([]ConfidentialNote, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	sID := pgtype.UUID{}
	sID.Scan(studentID)

	dbNotes, err := s.q.ListConfidentialNotes(ctx, db.ListConfidentialNotesParams{
		TenantID:  tID,
		StudentID: sID,
	})
	if err != nil {
		return nil, err
	}

	var notes []ConfidentialNote
	for _, dbn := range dbNotes {
		// Decrypt if needed here, or return encrypted and let frontend handle if they have the key (unlikely)
		// We decrypt here because the service is role-protected
		decoded, err := base64.StdEncoding.DecodeString(dbn.EncryptedContent)
		if err != nil {
			continue // Skip corrupted
		}

		decrypted, err := s.crypto.Decrypt(decoded)
		if err != nil {
			continue // Skip unreadable
		}

		notes = append(notes, ConfidentialNote{
			ID:        dbn.ID.String(),
			StudentID: dbn.StudentID.String(),
			Content:   string(decrypted),
			CreatedBy: dbn.CreatedBy.String(),
			CreatedAt: dbn.CreatedAt.Time.Format("2006-01-02 15:04:05"),
		})
	}

	return notes, nil
}

func (s *ConfidentialNotesService) DeleteNote(ctx context.Context, tenantID, id string) error {
	uID := pgtype.UUID{}
	uID.Scan(id)
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	return s.q.DeleteConfidentialNote(ctx, db.DeleteConfidentialNoteParams{
		ID:       uID,
		TenantID: tID,
	})
}
