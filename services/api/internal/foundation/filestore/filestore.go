package filestore

import (
	"context"
	"io"
)

type FileInfo struct {
	ID        string
	Name      string
	Size      int64
	MimeType  string
	PublicURL string
}

type Provider interface {
	Upload(ctx context.Context, name string, r io.Reader) (FileInfo, error)
	GetURL(ctx context.Context, id string) (string, error)
	Delete(ctx context.Context, id string) error
}
