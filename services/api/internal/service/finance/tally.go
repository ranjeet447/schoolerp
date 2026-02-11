package finance

import (
	"bytes"
	"context"
	"encoding/csv"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

func (s *Service) UpsertLedgerMapping(ctx context.Context, tenantID, headID, tallyName string) (db.TallyLedgerMapping, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	hUUID := pgtype.UUID{}
	hUUID.Scan(headID)

	return s.q.UpsertLedgerMapping(ctx, db.UpsertLedgerMappingParams{
		TenantID:        tUUID,
		FeeHeadID:       hUUID,
		TallyLedgerName: tallyName,
	})
}

func (s *Service) ListLedgerMappings(ctx context.Context, tenantID string) ([]db.ListLedgerMappingsRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListLedgerMappings(ctx, tUUID)
}

func (s *Service) ExportReceiptsToTallyCSV(ctx context.Context, tenantID string, from, to time.Time) ([]byte, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	data, err := s.q.GetTallyExportData(ctx, db.GetTallyExportDataParams{
		TenantID:  tUUID,
		CreatedAt: pgtype.Timestamptz{Time: from, Valid: true},
		CreatedAt_2: pgtype.Timestamptz{Time: to, Valid: true},
	})
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	// Header
	writer.Write([]string{"Date", "Receipt No", "Student Name", "Admission No", "Amount", "Mode", "Tally Ledger"})

	for _, row := range data {
		writer.Write([]string{
			row.CreatedAt.Time.Format("2006-01-02"),
			row.ReceiptNumber,
			row.StudentName,
			row.AdmissionNumber,
			fmt.Sprintf("%d", row.AmountPaid),
			row.PaymentMode,
			row.TallyLedgerName.String,
		})
	}

	writer.Flush()
	return buf.Bytes(), nil
}
