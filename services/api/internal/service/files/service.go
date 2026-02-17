package files

import (
	"context"
	"fmt"
	"io"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/filestore"
	"github.com/schoolerp/api/internal/foundation/quota"
)

type FileService struct {
	q     db.Querier
	store filestore.Provider
	quota *quota.Service
}

func NewFileService(q db.Querier, store filestore.Provider, quotaSvc *quota.Service) *FileService {
	return &FileService{q: q, store: store, quota: quotaSvc}
}

type UploadParams struct {
	TenantID    string
	Name        string
	MimeType    string
	UploadedBy  string
	Content     io.Reader
	ContentSize int64
}

func (s *FileService) Upload(ctx context.Context, p UploadParams) (db.File, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UploadedBy)

	if s.quota != nil && p.ContentSize > 0 {
		if err := s.quota.CheckStorageQuota(ctx, p.TenantID, p.ContentSize); err != nil {
			return db.File{}, err
		}
	}

	// 1. Upload to physical storage
	info, err := s.store.Upload(ctx, p.Name, p.Content)
	if err != nil {
		return db.File{}, fmt.Errorf("storage upload failed: %w", err)
	}

	if s.quota != nil {
		if err := s.quota.CheckStorageQuota(ctx, p.TenantID, info.Size); err != nil {
			_ = s.store.Delete(ctx, info.ID)
			return db.File{}, err
		}
	}

	// 2. Create database record
	file, err := s.q.CreateFile(ctx, db.CreateFileParams{
		TenantID:   tUUID,
		Bucket:     "default", // Could be dynamic
		Key:        info.ID,
		Name:       p.Name,
		MimeType:   pgtype.Text{String: p.MimeType, Valid: true},
		Size:       pgtype.Int8{Int64: info.Size, Valid: true},
		UploadedBy: uUUID,
	})
	if err != nil {
		// Cleanup storage if database fails
		_ = s.store.Delete(ctx, info.ID)
		return db.File{}, fmt.Errorf("database record creation failed: %w", err)
	}

	return file, nil
}

func (s *FileService) GetFile(ctx context.Context, tenantID, fileID string) (db.File, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	fUUID := pgtype.UUID{}
	fUUID.Scan(fileID)

	return s.q.GetFile(ctx, db.GetFileParams{
		ID:       fUUID,
		TenantID: tUUID,
	})
}
