// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package filestore

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

type LocalProvider struct {
	BaseDir string
	BaseURL string
}

func NewLocalProvider(baseDir, baseURL string) (*LocalProvider, error) {
	if err := os.MkdirAll(baseDir, 0755); err != nil {
		return nil, err
	}
	return &LocalProvider{BaseDir: baseDir, BaseURL: baseURL}, nil
}

func (p *LocalProvider) Upload(ctx context.Context, name string, r io.Reader) (FileInfo, error) {
	id := uuid.New().String()
	ext := filepath.Ext(name)
	fileName := id + ext
	filePath := filepath.Join(p.BaseDir, fileName)

	out, err := os.Create(filePath)
	if err != nil {
		return FileInfo{}, err
	}
	defer out.Close()

	size, err := io.Copy(out, r)
	if err != nil {
		return FileInfo{}, err
	}

	return FileInfo{
		ID:        id,
		Name:      name,
		Size:      size,
		PublicURL: fmt.Sprintf("%s/%s", p.BaseURL, fileName),
	}, nil
}

func (p *LocalProvider) GetURL(ctx context.Context, id string) (string, error) {
	// In local mode, we assume files are in BaseDir with ID as prefix or name
	// This is a simplified version.
	return fmt.Sprintf("%s/%s", p.BaseURL, id), nil
}

func (p *LocalProvider) Delete(ctx context.Context, id string) error {
	// Real implementation would need to know the extension or find the file
	return os.Remove(filepath.Join(p.BaseDir, id))
}
