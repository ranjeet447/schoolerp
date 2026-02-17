package tenant

import (
	"archive/zip"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrInvalidExportID         = errors.New("invalid export id")
	ErrExportNotFound          = errors.New("export request not found")
	ErrExportReasonRequired    = errors.New("export reason is required")
	ErrExportAlreadyInProgress = errors.New("export is already in progress")
	ErrExportHardExcludedTable = errors.New("requested export includes a restricted table")
)

type CreateTenantDataExportParams struct {
	Reason        string   `json:"reason"`
	IncludeUsers  bool     `json:"include_users"`
	IncludeTables []string `json:"include_tables,omitempty"`
	ExcludeTables []string `json:"exclude_tables,omitempty"`
	Format        string   `json:"format,omitempty"` // currently only zip_ndjson
	RequestedBy   string   `json:"-"`
}

type TenantDataExportPayload struct {
	Reason        string           `json:"reason"`
	IncludeUsers  bool             `json:"include_users"`
	IncludeTables []string         `json:"include_tables,omitempty"`
	ExcludeTables []string         `json:"exclude_tables,omitempty"`
	Format        string           `json:"format"`
	RequestedAt   string           `json:"requested_at"`
	StartedAt     string           `json:"started_at,omitempty"`
	CompletedAt   string           `json:"completed_at,omitempty"`
	Error         string           `json:"error,omitempty"`
	Tables        map[string]int64 `json:"tables,omitempty"`
	TotalRows     int64            `json:"total_rows,omitempty"`
}

type TenantDataExportRequest struct {
	ID               string                  `json:"id"`
	TenantID         string                  `json:"tenant_id"`
	Status           string                  `json:"status"`
	RequestedBy      string                  `json:"requested_by"`
	RequestedByName  string                  `json:"requested_by_name,omitempty"`
	RequestedByEmail string                  `json:"requested_by_email,omitempty"`
	Payload          TenantDataExportPayload `json:"payload"`
	CreatedAt        time.Time               `json:"created_at"`
	CompletedAt      *time.Time              `json:"completed_at,omitempty"`
}

type TenantDataExportTableSummary struct {
	Name string `json:"name"`
	Rows int64  `json:"rows"`
	File string `json:"file"`
}

type TenantDataExportManifest struct {
	TenantID         string                         `json:"tenant_id"`
	TenantName       string                         `json:"tenant_name"`
	TenantSubdomain  string                         `json:"tenant_subdomain"`
	ExportID         string                         `json:"export_id"`
	ExportedAt       string                         `json:"exported_at"`
	RequestedBy      string                         `json:"requested_by"`
	RequestedByEmail string                         `json:"requested_by_email"`
	Reason           string                         `json:"reason"`
	Options          map[string]any                 `json:"options"`
	Tables           []TenantDataExportTableSummary `json:"tables"`
	TotalRows        int64                          `json:"total_rows"`
}

func parseExportUUID(raw string) (pgtype.UUID, error) {
	var id pgtype.UUID
	if err := id.Scan(strings.TrimSpace(raw)); err != nil || !id.Valid {
		return pgtype.UUID{}, ErrInvalidExportID
	}
	return id, nil
}

func normalizeTableNames(names []string) []string {
	out := make([]string, 0, len(names))
	seen := make(map[string]struct{})
	for _, raw := range names {
		v := strings.TrimSpace(raw)
		if v == "" {
			continue
		}
		v = strings.ToLower(v)
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}
	sort.Strings(out)
	return out
}

func hardExcludedExportTables() map[string]struct{} {
	return map[string]struct{}{
		"audit_logs":        {},
		"security_events":   {},
		"outbox_events":     {},
		"integration_logs":  {},
		"platform_api_keys": {},
		"platform_webhooks": {},
		"platform_backups":  {},
	}
}

func (s *Service) CreateTenantDataExportRequest(ctx context.Context, tenantID string, params CreateTenantDataExportParams) (TenantDataExportRequest, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return TenantDataExportRequest{}, err
	}

	reason := strings.TrimSpace(params.Reason)
	if reason == "" {
		return TenantDataExportRequest{}, ErrExportReasonRequired
	}

	format := strings.ToLower(strings.TrimSpace(params.Format))
	if format == "" {
		format = "zip_ndjson"
	}
	if format != "zip_ndjson" {
		format = "zip_ndjson"
	}

	includeTables := normalizeTableNames(params.IncludeTables)
	excludeTables := normalizeTableNames(params.ExcludeTables)

	hardExcluded := hardExcludedExportTables()
	for _, t := range includeTables {
		if _, blocked := hardExcluded[t]; blocked {
			return TenantDataExportRequest{}, ErrExportHardExcludedTable
		}
	}
	for _, t := range excludeTables {
		if _, blocked := hardExcluded[t]; blocked {
			return TenantDataExportRequest{}, ErrExportHardExcludedTable
		}
	}

	var requestedBy pgtype.UUID
	_ = requestedBy.Scan(strings.TrimSpace(params.RequestedBy))

	// Basic guardrail: prevent many exports stacking for the same tenant.
	const existing = `
		SELECT COUNT(*)::int
		FROM platform_backups
		WHERE tenant_id = $1
		  AND action = 'export'
		  AND status IN ('requested', 'running')
		  AND created_at >= NOW() - INTERVAL '15 minutes'
	`
	var inProgress int
	if err := s.db.QueryRow(ctx, existing, tid).Scan(&inProgress); err == nil && inProgress > 0 {
		return TenantDataExportRequest{}, ErrExportAlreadyInProgress
	}

	payload := TenantDataExportPayload{
		Reason:        reason,
		IncludeUsers:  params.IncludeUsers,
		IncludeTables: includeTables,
		ExcludeTables: excludeTables,
		Format:        format,
		RequestedAt:   time.Now().UTC().Format(time.RFC3339),
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return TenantDataExportRequest{}, err
	}

	const insert = `
		INSERT INTO platform_backups (tenant_id, action, status, payload, requested_by)
		VALUES ($1, 'export', 'requested', $2, $3)
		RETURNING id::text, status, created_at
	`
	var out TenantDataExportRequest
	out.TenantID = strings.TrimSpace(tenantID)
	out.RequestedBy = strings.TrimSpace(params.RequestedBy)
	out.Payload = payload
	if err := s.db.QueryRow(ctx, insert, tid, payloadJSON, requestedBy).Scan(&out.ID, &out.Status, &out.CreatedAt); err != nil {
		return TenantDataExportRequest{}, err
	}
	return out, nil
}

func (s *Service) ListTenantDataExportRequests(ctx context.Context, tenantID string, limit, offset int32) ([]TenantDataExportRequest, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return nil, err
	}

	if limit <= 0 || limit > 200 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	const query = `
		SELECT
			pb.id::text,
			pb.status,
			COALESCE(pb.requested_by::text, '') AS requested_by,
			COALESCE(u.full_name, '') AS requested_by_name,
			COALESCE(u.email, '') AS requested_by_email,
			pb.payload,
			pb.created_at,
			pb.completed_at
		FROM platform_backups pb
		LEFT JOIN users u ON u.id = pb.requested_by
		WHERE pb.tenant_id = $1
		  AND pb.action = 'export'
		ORDER BY pb.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(ctx, query, tid, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]TenantDataExportRequest, 0)
	for rows.Next() {
		var row TenantDataExportRequest
		var payloadRaw []byte
		var completedAt pgtype.Timestamptz
		if err := rows.Scan(
			&row.ID,
			&row.Status,
			&row.RequestedBy,
			&row.RequestedByName,
			&row.RequestedByEmail,
			&payloadRaw,
			&row.CreatedAt,
			&completedAt,
		); err != nil {
			return nil, err
		}
		row.TenantID = strings.TrimSpace(tenantID)
		_ = json.Unmarshal(payloadRaw, &row.Payload)
		if completedAt.Valid {
			v := completedAt.Time
			row.CompletedAt = &v
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Service) GetTenantDataExportRequest(ctx context.Context, tenantID, exportID string) (TenantDataExportRequest, pgtype.UUID, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return TenantDataExportRequest{}, pgtype.UUID{}, err
	}
	eid, err := parseExportUUID(exportID)
	if err != nil {
		return TenantDataExportRequest{}, pgtype.UUID{}, err
	}

	const query = `
		SELECT
			pb.id::text,
			pb.status,
			COALESCE(pb.requested_by::text, '') AS requested_by,
			COALESCE(u.full_name, '') AS requested_by_name,
			COALESCE(u.email, '') AS requested_by_email,
			pb.payload,
			pb.created_at,
			pb.completed_at
		FROM platform_backups pb
		LEFT JOIN users u ON u.id = pb.requested_by
		WHERE pb.tenant_id = $1
		  AND pb.action = 'export'
		  AND pb.id = $2
		LIMIT 1
	`
	var row TenantDataExportRequest
	var payloadRaw []byte
	var completedAt pgtype.Timestamptz
	err = s.db.QueryRow(ctx, query, tid, eid).Scan(
		&row.ID,
		&row.Status,
		&row.RequestedBy,
		&row.RequestedByName,
		&row.RequestedByEmail,
		&payloadRaw,
		&row.CreatedAt,
		&completedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return TenantDataExportRequest{}, pgtype.UUID{}, ErrExportNotFound
		}
		return TenantDataExportRequest{}, pgtype.UUID{}, err
	}
	row.TenantID = strings.TrimSpace(tenantID)
	_ = json.Unmarshal(payloadRaw, &row.Payload)
	if completedAt.Valid {
		v := completedAt.Time
		row.CompletedAt = &v
	}
	return row, eid, nil
}

func (s *Service) markTenantExportStatus(ctx context.Context, exportID pgtype.UUID, status string, payloadPatch map[string]any) error {
	patchRaw, err := json.Marshal(payloadPatch)
	if err != nil {
		return err
	}
	const update = `
		UPDATE platform_backups
		SET status = $2,
		    completed_at = CASE WHEN $2 IN ('completed', 'failed') THEN NOW() ELSE completed_at END,
		    payload = COALESCE(payload, '{}'::jsonb) || $3::jsonb
		WHERE id = $1
		  AND action = 'export'
	`
	tag, err := s.db.Exec(ctx, update, exportID, strings.TrimSpace(status), patchRaw)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrExportNotFound
	}
	return nil
}

func (s *Service) UpdateTenantDataExportStatus(ctx context.Context, exportID string, status string, payloadPatch map[string]any) error {
	eid, err := parseExportUUID(exportID)
	if err != nil {
		return err
	}
	return s.markTenantExportStatus(ctx, eid, status, payloadPatch)
}

func (s *Service) StreamTenantDataExportZipNDJSON(ctx context.Context, tenantID string, export TenantDataExportRequest, w io.Writer) (map[string]int64, int64, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return nil, 0, err
	}

	// Resolve tenant identity.
	var tenantName string
	var tenantSubdomain string
	if err := s.db.QueryRow(ctx, `SELECT name, subdomain FROM tenants WHERE id = $1 LIMIT 1`, tid).Scan(&tenantName, &tenantSubdomain); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, ErrTenantNotFound
		}
		return nil, 0, err
	}

	allowedTables, err := s.listTenantScopedTables(ctx)
	if err != nil {
		return nil, 0, err
	}

	hardExcluded := hardExcludedExportTables()
	tables := filterExportTables(allowedTables, export.Payload.IncludeTables, export.Payload.ExcludeTables, hardExcluded)

	zw := zip.NewWriter(w)

	// 1) Tenant record
	if err := writeSingleJSONFile(ctx, zw, "tenant.json", s.db, `SELECT row_to_json(t) FROM (SELECT * FROM tenants WHERE id = $1) t`, tid); err != nil {
		return nil, 0, err
	}

	// 2) Optional tenant users list (safe projection, no credentials).
	if export.Payload.IncludeUsers {
		const usersQuery = `
			SELECT row_to_json(t)
			FROM (
				SELECT DISTINCT u.id, u.email, u.full_name, u.is_active, u.created_at, u.updated_at
				FROM users u
				JOIN role_assignments ra ON ra.user_id = u.id
				WHERE ra.tenant_id = $1
			) t
		`
		if _, err := writeNDJSONFile(ctx, zw, "users.ndjson", s.db, usersQuery, tid); err != nil {
			return nil, 0, err
		}
	}

	// 3) Tenant scoped tables
	counts := make(map[string]int64)
	var totalRows int64
	for _, table := range tables {
		fileName := fmt.Sprintf("tables/%s.ndjson", table)
		quoted := quoteIdentifier(table)
		query := fmt.Sprintf(`SELECT row_to_json(t) FROM (SELECT * FROM %s WHERE tenant_id = $1) t`, quoted)
		rows, err := writeNDJSONFile(ctx, zw, fileName, s.db, query, tid)
		if err != nil {
			return nil, 0, err
		}
		counts[table] = rows
		totalRows += rows
	}

	// 4) Manifest
	manifestTables := make([]TenantDataExportTableSummary, 0, len(tables))
	for _, t := range tables {
		manifestTables = append(manifestTables, TenantDataExportTableSummary{
			Name: t,
			Rows: counts[t],
			File: fmt.Sprintf("tables/%s.ndjson", t),
		})
	}

	manifest := TenantDataExportManifest{
		TenantID:         tenantID,
		TenantName:       tenantName,
		TenantSubdomain:  tenantSubdomain,
		ExportID:         export.ID,
		ExportedAt:       time.Now().UTC().Format(time.RFC3339),
		RequestedBy:      export.RequestedByName,
		RequestedByEmail: export.RequestedByEmail,
		Reason:           export.Payload.Reason,
		Options: map[string]any{
			"include_users":  export.Payload.IncludeUsers,
			"include_tables": export.Payload.IncludeTables,
			"exclude_tables": export.Payload.ExcludeTables,
			"format":         "zip_ndjson",
		},
		Tables:    manifestTables,
		TotalRows: totalRows,
	}

	if err := writeJSONFile(zw, "manifest.json", manifest); err != nil {
		return nil, 0, err
	}

	if err := zw.Close(); err != nil {
		return nil, 0, err
	}

	return counts, totalRows, nil
}

func (s *Service) listTenantScopedTables(ctx context.Context) ([]string, error) {
	const query = `
		SELECT DISTINCT c.table_name
		FROM information_schema.columns c
		JOIN information_schema.tables t
		  ON t.table_schema = c.table_schema
		 AND t.table_name = c.table_name
		WHERE c.table_schema = 'public'
		  AND c.column_name = 'tenant_id'
		  AND t.table_type = 'BASE TABLE'
		ORDER BY c.table_name
	`
	rows, err := s.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]string, 0)
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		name = strings.ToLower(strings.TrimSpace(name))
		if name == "" {
			continue
		}
		out = append(out, name)
	}
	return out, rows.Err()
}

func filterExportTables(allowed []string, include []string, exclude []string, hardExcluded map[string]struct{}) []string {
	allowedSet := make(map[string]struct{}, len(allowed))
	for _, t := range allowed {
		allowedSet[strings.ToLower(strings.TrimSpace(t))] = struct{}{}
	}

	includeNorm := normalizeTableNames(include)
	excludeNorm := normalizeTableNames(exclude)
	excludeSet := make(map[string]struct{}, len(excludeNorm))
	for _, t := range excludeNorm {
		excludeSet[t] = struct{}{}
	}

	out := make([]string, 0)
	if len(includeNorm) > 0 {
		for _, t := range includeNorm {
			if _, ok := allowedSet[t]; !ok {
				continue
			}
			if _, blocked := hardExcluded[t]; blocked {
				continue
			}
			if _, skip := excludeSet[t]; skip {
				continue
			}
			out = append(out, t)
		}
		sort.Strings(out)
		return out
	}

	for _, t := range allowed {
		t = strings.ToLower(strings.TrimSpace(t))
		if t == "" {
			continue
		}
		if _, blocked := hardExcluded[t]; blocked {
			continue
		}
		if _, skip := excludeSet[t]; skip {
			continue
		}
		out = append(out, t)
	}
	sort.Strings(out)
	return out
}

func quoteIdentifier(name string) string {
	// name is already sourced from information_schema; we still quote defensively.
	safe := strings.ReplaceAll(name, `"`, `""`)
	return `"` + safe + `"`
}

func writeJSONFile(zw *zip.Writer, name string, payload any) error {
	fw, err := zw.Create(name)
	if err != nil {
		return err
	}
	enc := json.NewEncoder(fw)
	enc.SetIndent("", "  ")
	return enc.Encode(payload)
}

func writeSingleJSONFile(ctx context.Context, zw *zip.Writer, fileName string, dbTx interface {
	QueryRow(context.Context, string, ...interface{}) pgx.Row
}, query string, args ...any) error {
	var raw []byte
	if err := dbTx.QueryRow(ctx, query, args...).Scan(&raw); err != nil {
		return err
	}
	fw, err := zw.Create(fileName)
	if err != nil {
		return err
	}
	_, err = fw.Write(raw)
	if err != nil {
		return err
	}
	_, err = fw.Write([]byte("\n"))
	return err
}

func writeNDJSONFile(ctx context.Context, zw *zip.Writer, fileName string, dbTx interface {
	Query(context.Context, string, ...interface{}) (pgx.Rows, error)
}, query string, args ...any) (int64, error) {
	fw, err := zw.Create(fileName)
	if err != nil {
		return 0, err
	}

	rows, err := dbTx.Query(ctx, query, args...)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	var count int64
	for rows.Next() {
		var raw []byte
		if err := rows.Scan(&raw); err != nil {
			return 0, err
		}
		if _, err := fw.Write(raw); err != nil {
			return 0, err
		}
		if _, err := fw.Write([]byte("\n")); err != nil {
			return 0, err
		}
		count++
	}
	if err := rows.Err(); err != nil {
		return 0, err
	}
	return count, nil
}
