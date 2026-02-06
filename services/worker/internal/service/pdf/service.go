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

package pdf

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"log"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/worker/internal/db"
)

type Processor struct {
	q db.Querier
}

func NewProcessor(q db.Querier) *Processor {
	return &Processor{q: q}
}

func (p *Processor) ProcessJob(ctx context.Context, job db.PdfJob) error {
	log.Printf("[PDF] Processing job %s (template: %s)", job.ID, job.TemplateCode)

	// 1. Update status to processing
	_, err := p.q.UpdatePDFJobStatus(ctx, db.UpdatePDFJobStatusParams{
		ID:       job.ID,
		TenantID: job.TenantID,
		Status:   pgtype.Text{String: "processing", Valid: true},
	})
	if err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}

	// 2. Fetch Template
	pdfTemplate, err := p.q.GetPDFTemplate(ctx, db.GetPDFTemplateParams{
		TenantID: job.TenantID,
		Code:     job.TemplateCode,
	})
	if err != nil {
		p.markFailed(ctx, job, fmt.Sprintf("template not found: %v", err))
		return err
	}

	// 3. Render HTML
	var payload map[string]interface{}
	if err := json.Unmarshal(job.Payload, &payload); err != nil {
		p.markFailed(ctx, job, fmt.Sprintf("invalid payload: %v", err))
		return err
	}

	tmpl, err := template.New("pdf").Parse(pdfTemplate.HtmlBody)
	if err != nil {
		p.markFailed(ctx, job, fmt.Sprintf("failed to parse template: %v", err))
		return err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, payload); err != nil {
		p.markFailed(ctx, job, fmt.Sprintf("failed to execute template: %v", err))
		return err
	}

	// In real app, we would pipe this to a PDF engine
	// For Release 1, we simulate success and log the rendered output size
	log.Printf("[PDF] Rendered template %s, size: %d bytes", pdfTemplate.Name, buf.Len())
	
	// Simulated PDF file creation
	file, err := p.q.CreateFile(ctx, db.CreateFileParams{
		TenantID: job.TenantID,
		Bucket:   "pdfs",
		Key:      fmt.Sprintf("%s/%s.pdf", job.TenantID, job.ID),
		Name:     fmt.Sprintf("%s.pdf", job.TemplateCode),
		MimeType: pgtype.Text{String: "application/pdf", Valid: true},
		Size:     pgtype.Int8{Int64: 1024, Valid: true}, // Mock size
	})
	if err != nil {
		p.markFailed(ctx, job, fmt.Sprintf("failed to create file record: %v", err))
		return err
	}

	// 4. Update status to completed
	_, err = p.q.UpdatePDFJobStatus(ctx, db.UpdatePDFJobStatusParams{
		ID:       job.ID,
		TenantID: job.TenantID,
		Status:   pgtype.Text{String: "completed", Valid: true},
		FileID:   pgtype.UUID{Bytes: file.ID.Bytes, Valid: true},
	})
	
	return err
}

func (p *Processor) markFailed(ctx context.Context, job db.PdfJob, errMsg string) {
	log.Printf("[PDF] Job %s failed: %s", job.ID, errMsg)
	p.q.UpdatePDFJobStatus(ctx, db.UpdatePDFJobStatusParams{
		ID:           job.ID,
		TenantID:     job.TenantID,
		Status:       pgtype.Text{String: "failed", Valid: true},
		ErrorMessage: pgtype.Text{String: errMsg, Valid: true},
	})
}
