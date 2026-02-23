package pdf

import (
	"context"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/worker/internal/db"
)

type mockQuerier struct {
	db.Querier
	status string
}

func (m *mockQuerier) UpdatePDFJobStatus(ctx context.Context, arg db.UpdatePDFJobStatusParams) (db.PdfJob, error) {
	m.status = arg.Status.String
	return db.PdfJob{}, nil
}

func (m *mockQuerier) GetPDFTemplate(ctx context.Context, arg db.GetPDFTemplateParams) (db.PdfTemplate, error) {
	if arg.Code == "large" {
		return db.PdfTemplate{HtmlBody: string(make([]byte, 2*1024*1024))}, nil // 2MB
	}
	if arg.Code == "bonafide" {
		return db.PdfTemplate{HtmlBody: "Student: {{.student_name}}"}, nil
	}
	return db.PdfTemplate{HtmlBody: "OK"}, nil
}

func (m *mockQuerier) CreateFile(ctx context.Context, arg db.CreateFileParams) (db.File, error) {
	return db.File{}, nil
}

func TestProcessor_Hardening(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name         string
		job          db.PdfJob
		expectedStatus string
	}{
		{
			name: "Large template rejected",
			job: db.PdfJob{
				ID:           toPgUUID("1"),
				TemplateCode: "large",
				Payload:      []byte("{}"),
			},
			expectedStatus: "failed",
		},
		{
			name: "Bonafide missing variables rejected",
			job: db.PdfJob{
				ID:           toPgUUID("2"),
				TemplateCode: "bonafide",
				Payload:      []byte("{}"),
			},
			expectedStatus: "failed",
		},
		{
			name: "Bonafide valid passes",
			job: db.PdfJob{
				ID:           toPgUUID("3"),
				TemplateCode: "bonafide",
				Payload:      []byte("{\"student_name\": \"Ranjeet\"}"),
			},
			expectedStatus: "completed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m := &mockQuerier{}
			p := NewProcessor(m)
			_ = p.ProcessJob(ctx, tt.job)

			if m.status != tt.expectedStatus {
				t.Errorf("expected status %s, got %s", tt.expectedStatus, m.status)
			}
		})
	}
}

func toPgUUID(s string) pgtype.UUID {
	var u pgtype.UUID
	u.Scan(s)
	return u
}
