package finance

import (
	"context"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type BillingReportRow struct {
	ReceiptNumber   string    `json:"receipt_number"`
	AmountPaid      int64     `json:"amount_paid"`
	CreatedAt       time.Time `json:"created_at"`
	PaymentMode     string    `json:"payment_mode"`
	AdmissionNumber string    `json:"admission_number"`
	StudentName     string    `json:"student_name"`
	TallyLedgerName string    `json:"tally_ledger_name"`
}

type BillingReportSummary struct {
	FromDate         string           `json:"from_date"`
	ToDate           string           `json:"to_date"`
	ReceiptCount     int64            `json:"receipt_count"`
	TotalCollections int64            `json:"total_collections"`
	AverageReceipt   float64          `json:"average_receipt"`
	ByMode           map[string]int64 `json:"by_mode"`
}

func (s *Service) GetBillingReport(ctx context.Context, tenantID string, from, to time.Time) (BillingReportSummary, []BillingReportRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	start := time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, from.Location())
	end := time.Date(to.Year(), to.Month(), to.Day(), 23, 59, 59, 0, to.Location())

	data, err := s.q.GetTallyExportData(ctx, db.GetTallyExportDataParams{
		TenantID:    tUUID,
		CreatedAt:   pgtype.Timestamptz{Time: start, Valid: true},
		CreatedAt_2: pgtype.Timestamptz{Time: end, Valid: true},
	})
	if err != nil {
		return BillingReportSummary{}, nil, err
	}

	rows := make([]BillingReportRow, 0, len(data))
	summary := BillingReportSummary{
		FromDate: start.Format("2006-01-02"),
		ToDate:   end.Format("2006-01-02"),
		ByMode:   map[string]int64{},
	}

	for _, item := range data {
		ledgerName := ""
		if item.TallyLedgerName.Valid {
			ledgerName = item.TallyLedgerName.String
		}

		rows = append(rows, BillingReportRow{
			ReceiptNumber:   item.ReceiptNumber,
			AmountPaid:      item.AmountPaid,
			CreatedAt:       item.CreatedAt.Time,
			PaymentMode:     item.PaymentMode,
			AdmissionNumber: item.AdmissionNumber,
			StudentName:     item.StudentName,
			TallyLedgerName: ledgerName,
		})

		summary.ReceiptCount++
		summary.TotalCollections += item.AmountPaid
		mode := strings.ToLower(strings.TrimSpace(item.PaymentMode))
		if mode == "" {
			mode = "unknown"
		}
		summary.ByMode[mode] += item.AmountPaid
	}

	if summary.ReceiptCount > 0 {
		summary.AverageReceipt = float64(summary.TotalCollections) / float64(summary.ReceiptCount)
	}

	return summary, rows, nil
}
