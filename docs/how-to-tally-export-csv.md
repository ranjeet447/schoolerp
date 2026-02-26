# How To: Tally Export (CSV)

## Current format (important)

SchoolERP currently exports **CSV** for Tally-ready accounting workflows.

- Endpoint: `GET /v1/admin/payments/tally-export?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Content-Type: `text/csv`
- Service implementation: `services/api/internal/service/finance/tally.go` (`ExportReceiptsToTallyCSV`)

This is **not** a Tally XML voucher export pipeline yet.

## What the export includes

- Receipt date
- Receipt number
- Student name
- Admission number
- Amount
- Payment mode
- Tally ledger mapping (fee head -> ledger)

## Setup checklist

1. Configure fee head to Tally ledger mappings in finance settings.
2. Generate/export receipts for the date range.
3. Download CSV from finance reports/export.
4. Import into your accounting process/tooling (manual Tally mapping/import workflow as per your accountant process).

## Known limitation

- No XML voucher generation in current codebase.
- No export history table for generated files yet.
