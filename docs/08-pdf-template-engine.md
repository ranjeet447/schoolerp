# 08 - PDF Template Engine

## Objective
Generate high-fidelity, multilingual PDFs (Receipts, Report Cards, Certificates) with complex Indic script support.

## Strategy: Headless HTML-to-PDF
- **Engine**: Playwright / Puppeteer (Node.js) wrapped in a Go microservice or executed via a sidecar.
- **Styling**: Tailwind CSS for rich, modern design.

## Template Management
- Structured templates stored in `/pkg/pdf/templates`.
- Versioning: `v1.0.0`, `v1.1.0`. Older records retain the PDF generated with the old template for audit.

## Multi-language Support
- **Fonts**: Embedded Noto Sans (Hindi/Tamil/Telugu/etc.) to prevent glyph errors.
- **RTL Support**: Handled via standard CSS.

## Pipeline
1. API inserts `pdf_job`.
2. Worker picks up job.
3. Worker fetches template + data.
4. Worker renders HTML.
5. Worker converts to PDF.
6. Worker uploads to S3 and updates metadata in DB.
