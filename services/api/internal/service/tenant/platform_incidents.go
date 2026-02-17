package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrInvalidPlatformIncidentID           = errors.New("invalid platform incident id")
	ErrInvalidPlatformIncidentPayload      = errors.New("invalid platform incident payload")
	ErrPlatformIncidentNotFound            = errors.New("platform incident not found")
	ErrInvalidPlatformIncidentEventPayload = errors.New("invalid platform incident event payload")
	ErrPlatformIncidentEventNotFound       = errors.New("platform incident event not found")
)

type PlatformIncident struct {
	ID                string     `json:"id"`
	Title             string     `json:"title"`
	Status            string     `json:"status"`
	Severity          string     `json:"severity"`
	Scope             string     `json:"scope"`
	AffectedTenantIDs []string   `json:"affected_tenant_ids"`
	CreatedBy         string     `json:"created_by,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
	ResolvedAt        *time.Time `json:"resolved_at,omitempty"`
}

type PlatformIncidentEvent struct {
	ID             string                 `json:"id"`
	IncidentID     string                 `json:"incident_id"`
	EventType      string                 `json:"event_type"`
	Message        string                 `json:"message"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	CreatedBy      string                 `json:"created_by,omitempty"`
	CreatedByEmail string                 `json:"created_by_email,omitempty"`
	CreatedByName  string                 `json:"created_by_name,omitempty"`
	CreatedAt      time.Time              `json:"created_at"`
}

type PlatformIncidentFilters struct {
	Search   string
	Status   string
	Severity string
	Scope    string
	TenantID string // filter by affected tenant
	Limit    int32
	Offset   int32
}

type CreatePlatformIncidentParams struct {
	Title             string   `json:"title"`
	Status            string   `json:"status,omitempty"`
	Severity          string   `json:"severity,omitempty"`
	Scope             string   `json:"scope,omitempty"`
	AffectedTenantIDs []string `json:"affected_tenant_ids,omitempty"`
	InitialMessage    string   `json:"initial_message,omitempty"`
	CreatedBy         string   `json:"-"`
}

type UpdatePlatformIncidentParams struct {
	Title             *string  `json:"title,omitempty"`
	Status            *string  `json:"status,omitempty"`
	Severity          *string  `json:"severity,omitempty"`
	Scope             *string  `json:"scope,omitempty"`
	AffectedTenantIDs []string `json:"affected_tenant_ids,omitempty"`
	UpdateMessage     string   `json:"update_message,omitempty"`
	UpdatedBy         string   `json:"-"`
}

type IncidentLimitOverrideParams struct {
	TenantIDs  []string `json:"tenant_ids,omitempty"` // Optional: override incident affected tenants.
	LimitKey   string   `json:"limit_key"`
	LimitValue int64    `json:"limit_value"`
	ExpiresAt  string   `json:"expires_at,omitempty"`
	Reason     string   `json:"reason"`
	UpdatedBy  string   `json:"-"`
}

type IncidentLimitOverrideResult struct {
	IncidentID       string   `json:"incident_id"`
	AppliedTenantIDs []string `json:"applied_tenant_ids"`
	LimitKey         string   `json:"limit_key"`
	LimitValue       int64    `json:"limit_value"`
	ExpiresAt        string   `json:"expires_at,omitempty"`
}

type CreatePlatformIncidentEventParams struct {
	EventType string                 `json:"event_type,omitempty"` // update, note, status_change
	Message   string                 `json:"message"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
	CreatedBy string                 `json:"-"`
}

type PlatformIncidentDetail struct {
	Incident PlatformIncident        `json:"incident"`
	Events   []PlatformIncidentEvent `json:"events"`
}

func normalizeIncidentStatus(raw string) (string, bool) {
	status := strings.ToLower(strings.TrimSpace(raw))
	if status == "" {
		return "investigating", true
	}
	switch status {
	case "investigating", "identified", "monitoring", "resolved":
		return status, true
	default:
		return "", false
	}
}

func normalizeIncidentSeverity(raw string) (string, bool) {
	sev := strings.ToLower(strings.TrimSpace(raw))
	if sev == "" {
		return "minor", true
	}
	switch sev {
	case "minor", "major", "critical":
		return sev, true
	default:
		return "", false
	}
}

func normalizeIncidentScope(raw string) (string, bool) {
	scope := strings.ToLower(strings.TrimSpace(raw))
	if scope == "" {
		return "platform", true
	}
	switch scope {
	case "platform", "tenant":
		return scope, true
	default:
		return "", false
	}
}

func validateUUIDStrings(ids []string) ([]string, error) {
	out := make([]string, 0, len(ids))
	seen := make(map[string]struct{}, len(ids))
	for _, raw := range ids {
		v := strings.TrimSpace(raw)
		if v == "" {
			continue
		}
		var id pgtype.UUID
		if err := id.Scan(v); err != nil || !id.Valid {
			return nil, ErrInvalidPlatformIncidentPayload
		}
		normalized := id.String()
		if _, ok := seen[normalized]; ok {
			continue
		}
		seen[normalized] = struct{}{}
		out = append(out, normalized)
	}
	return out, nil
}

func (s *Service) ListPlatformIncidents(ctx context.Context, filters PlatformIncidentFilters) ([]PlatformIncident, error) {
	limit := filters.Limit
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	search := strings.TrimSpace(filters.Search)
	status := strings.ToLower(strings.TrimSpace(filters.Status))
	severity := strings.ToLower(strings.TrimSpace(filters.Severity))
	scope := strings.ToLower(strings.TrimSpace(filters.Scope))

	var tenant pgtype.UUID
	_ = tenant.Scan(strings.TrimSpace(filters.TenantID))
	if strings.TrimSpace(filters.TenantID) != "" && !tenant.Valid {
		return nil, ErrInvalidTenantID
	}

	const query = `
		SELECT
			i.id::text,
			i.title,
			i.status,
			i.severity,
			i.scope,
			COALESCE(i.affected_tenant_ids::text[], '{}') AS affected_tenant_ids,
			COALESCE(i.created_by::text, '') AS created_by,
			i.created_at,
			i.updated_at,
			i.resolved_at
		FROM platform_incidents i
		WHERE ($1::text = '' OR i.title ILIKE '%' || $1 || '%')
		  AND ($2::text = '' OR i.status = $2)
		  AND ($3::text = '' OR i.severity = $3)
		  AND ($4::text = '' OR i.scope = $4)
		  AND ($5::uuid IS NULL OR $5 = ANY(i.affected_tenant_ids))
		ORDER BY i.created_at DESC
		LIMIT $6 OFFSET $7
	`

	rows, err := s.db.Query(ctx, query, search, status, severity, scope, tenant, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]PlatformIncident, 0)
	for rows.Next() {
		var row PlatformIncident
		var createdAt pgtype.Timestamptz
		var updatedAt pgtype.Timestamptz
		var resolvedAt pgtype.Timestamptz
		if err := rows.Scan(
			&row.ID,
			&row.Title,
			&row.Status,
			&row.Severity,
			&row.Scope,
			&row.AffectedTenantIDs,
			&row.CreatedBy,
			&createdAt,
			&updatedAt,
			&resolvedAt,
		); err != nil {
			return nil, err
		}
		if createdAt.Valid {
			row.CreatedAt = createdAt.Time
		}
		if updatedAt.Valid {
			row.UpdatedAt = updatedAt.Time
		}
		if resolvedAt.Valid {
			v := resolvedAt.Time
			row.ResolvedAt = &v
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Service) CreatePlatformIncident(ctx context.Context, params CreatePlatformIncidentParams) (PlatformIncidentDetail, error) {
	title := strings.TrimSpace(params.Title)
	if title == "" {
		return PlatformIncidentDetail{}, ErrInvalidPlatformIncidentPayload
	}
	if len(title) > 200 {
		return PlatformIncidentDetail{}, ErrInvalidPlatformIncidentPayload
	}

	status, ok := normalizeIncidentStatus(params.Status)
	if !ok {
		return PlatformIncidentDetail{}, ErrInvalidPlatformIncidentPayload
	}
	severity, ok := normalizeIncidentSeverity(params.Severity)
	if !ok {
		return PlatformIncidentDetail{}, ErrInvalidPlatformIncidentPayload
	}
	scope, ok := normalizeIncidentScope(params.Scope)
	if !ok {
		return PlatformIncidentDetail{}, ErrInvalidPlatformIncidentPayload
	}

	affected, err := validateUUIDStrings(params.AffectedTenantIDs)
	if err != nil {
		return PlatformIncidentDetail{}, err
	}

	var createdBy pgtype.UUID
	_ = createdBy.Scan(strings.TrimSpace(params.CreatedBy))

	var id string
	err = s.db.QueryRow(ctx, `
		INSERT INTO platform_incidents (
			title,
			status,
			severity,
			scope,
			affected_tenant_ids,
			created_by,
			created_at,
			updated_at,
			resolved_at
		)
		VALUES (
			$1,
			$2,
			$3,
			$4,
			(SELECT COALESCE(array_agg(x::uuid), '{}') FROM unnest($5::text[]) AS x),
			$6,
			NOW(),
			NOW(),
			CASE WHEN $2 = 'resolved' THEN NOW() ELSE NULL END
		)
		RETURNING id::text
	`, title, status, severity, scope, affected, createdBy).Scan(&id)
	if err != nil {
		return PlatformIncidentDetail{}, err
	}

	initial := strings.TrimSpace(params.InitialMessage)
	if initial != "" {
		_, _ = s.CreatePlatformIncidentEvent(ctx, id, CreatePlatformIncidentEventParams{
			EventType: "update",
			Message:   initial,
			Metadata:  map[string]interface{}{},
			CreatedBy: params.CreatedBy,
		})
	}

	return s.GetPlatformIncidentDetail(ctx, id)
}

func (s *Service) UpdatePlatformIncident(ctx context.Context, incidentID string, params UpdatePlatformIncidentParams) (PlatformIncidentDetail, PlatformIncidentDetail, error) {
	var iid pgtype.UUID
	if err := iid.Scan(strings.TrimSpace(incidentID)); err != nil || !iid.Valid {
		return PlatformIncidentDetail{}, PlatformIncidentDetail{}, ErrInvalidPlatformIncidentID
	}

	before, err := s.GetPlatformIncidentDetail(ctx, incidentID)
	if err != nil {
		return PlatformIncidentDetail{}, PlatformIncidentDetail{}, err
	}

	setClauses := make([]string, 0, 6)
	args := make([]interface{}, 0, 8)
	idx := 1

	if params.Title != nil {
		v := strings.TrimSpace(*params.Title)
		if v == "" || len(v) > 200 {
			return PlatformIncidentDetail{}, PlatformIncidentDetail{}, ErrInvalidPlatformIncidentPayload
		}
		setClauses = append(setClauses, fmt.Sprintf("title = $%d", idx))
		args = append(args, v)
		idx++
	}

	var statusChangedTo string
	if params.Status != nil {
		status, ok := normalizeIncidentStatus(*params.Status)
		if !ok {
			return PlatformIncidentDetail{}, PlatformIncidentDetail{}, ErrInvalidPlatformIncidentPayload
		}
		statusChangedTo = status
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", idx))
		args = append(args, status)
		idx++

		if status == "resolved" {
			setClauses = append(setClauses, "resolved_at = NOW()")
		} else {
			// If an incident is re-opened, clear resolved timestamp.
			setClauses = append(setClauses, "resolved_at = NULL")
		}
	}

	if params.Severity != nil {
		sev, ok := normalizeIncidentSeverity(*params.Severity)
		if !ok {
			return PlatformIncidentDetail{}, PlatformIncidentDetail{}, ErrInvalidPlatformIncidentPayload
		}
		setClauses = append(setClauses, fmt.Sprintf("severity = $%d", idx))
		args = append(args, sev)
		idx++
	}

	if params.Scope != nil {
		scope, ok := normalizeIncidentScope(*params.Scope)
		if !ok {
			return PlatformIncidentDetail{}, PlatformIncidentDetail{}, ErrInvalidPlatformIncidentPayload
		}
		setClauses = append(setClauses, fmt.Sprintf("scope = $%d", idx))
		args = append(args, scope)
		idx++
	}

	if params.AffectedTenantIDs != nil {
		affected, err := validateUUIDStrings(params.AffectedTenantIDs)
		if err != nil {
			return PlatformIncidentDetail{}, PlatformIncidentDetail{}, err
		}
		setClauses = append(setClauses, fmt.Sprintf("affected_tenant_ids = (SELECT COALESCE(array_agg(x::uuid), '{}') FROM unnest($%d::text[]) AS x)", idx))
		args = append(args, affected)
		idx++
	}

	if len(setClauses) == 0 && strings.TrimSpace(params.UpdateMessage) == "" {
		return PlatformIncidentDetail{}, PlatformIncidentDetail{}, ErrInvalidPlatformIncidentPayload
	}

	// Always touch updated_at on any PATCH request that actually modifies or appends events.
	if len(setClauses) > 0 {
		setClauses = append(setClauses, "updated_at = NOW()")

		args = append(args, iid)
		query := fmt.Sprintf("UPDATE platform_incidents SET %s WHERE id = $%d", strings.Join(setClauses, ", "), idx)
		tag, err := s.db.Exec(ctx, query, args...)
		if err != nil {
			return PlatformIncidentDetail{}, PlatformIncidentDetail{}, err
		}
		if tag.RowsAffected() == 0 {
			return PlatformIncidentDetail{}, PlatformIncidentDetail{}, ErrPlatformIncidentNotFound
		}
	}

	// Append event message if provided.
	updateMsg := strings.TrimSpace(params.UpdateMessage)
	if updateMsg != "" {
		evType := "update"
		if statusChangedTo != "" {
			evType = "status_change"
		}
		_, _ = s.CreatePlatformIncidentEvent(ctx, incidentID, CreatePlatformIncidentEventParams{
			EventType: evType,
			Message:   updateMsg,
			Metadata:  map[string]interface{}{},
			CreatedBy: params.UpdatedBy,
		})
	}

	after, err := s.GetPlatformIncidentDetail(ctx, incidentID)
	if err != nil {
		return PlatformIncidentDetail{}, PlatformIncidentDetail{}, err
	}
	return before, after, nil
}

func (s *Service) ApplyIncidentLimitOverride(ctx context.Context, incidentID string, params IncidentLimitOverrideParams) (IncidentLimitOverrideResult, error) {
	incidentID = strings.TrimSpace(incidentID)
	var iid pgtype.UUID
	if err := iid.Scan(incidentID); err != nil || !iid.Valid {
		return IncidentLimitOverrideResult{}, ErrInvalidPlatformIncidentID
	}

	limitKey := strings.TrimSpace(strings.ToLower(params.LimitKey))
	if limitKey == "" {
		return IncidentLimitOverrideResult{}, ErrInvalidLimitOverride
	}
	if params.LimitValue < 0 {
		return IncidentLimitOverrideResult{}, ErrInvalidLimitOverride
	}

	expiresAt := strings.TrimSpace(params.ExpiresAt)
	if expiresAt != "" {
		if _, err := time.Parse(time.RFC3339, expiresAt); err != nil {
			return IncidentLimitOverrideResult{}, ErrInvalidLimitOverride
		}
	}

	reason := strings.TrimSpace(params.Reason)
	if reason == "" {
		return IncidentLimitOverrideResult{}, ErrInvalidReason
	}

	targetTenantIDs, err := validateUUIDStrings(params.TenantIDs)
	if err != nil {
		return IncidentLimitOverrideResult{}, ErrInvalidLimitOverride
	}

	if len(targetTenantIDs) == 0 {
		const incQuery = `
			SELECT COALESCE(affected_tenant_ids::text[], '{}') AS affected_tenant_ids
			FROM platform_incidents
			WHERE id = $1
		`
		var affected []string
		if err := s.db.QueryRow(ctx, incQuery, iid).Scan(&affected); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return IncidentLimitOverrideResult{}, ErrPlatformIncidentNotFound
			}
			return IncidentLimitOverrideResult{}, err
		}
		targetTenantIDs = affected
	}

	if len(targetTenantIDs) == 0 {
		return IncidentLimitOverrideResult{}, ErrInvalidLimitOverride
	}

	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return IncidentLimitOverrideResult{}, err
	}
	defer tx.Rollback(ctx)

	for _, rawTenantID := range targetTenantIDs {
		tid, err := parseTenantUUID(rawTenantID)
		if err != nil {
			return IncidentLimitOverrideResult{}, err
		}
		if err := upsertTenantLimitOverride(ctx, tx, tid, limitKey, params.LimitValue, expiresAt, reason, iid.String(), updatedBy); err != nil {
			return IncidentLimitOverrideResult{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return IncidentLimitOverrideResult{}, err
	}

	return IncidentLimitOverrideResult{
		IncidentID:       iid.String(),
		AppliedTenantIDs: targetTenantIDs,
		LimitKey:         limitKey,
		LimitValue:       params.LimitValue,
		ExpiresAt:        expiresAt,
	}, nil
}

func (s *Service) GetPlatformIncidentDetail(ctx context.Context, incidentID string) (PlatformIncidentDetail, error) {
	incident, err := s.getPlatformIncidentByID(ctx, incidentID)
	if err != nil {
		return PlatformIncidentDetail{}, err
	}

	events, err := s.ListPlatformIncidentEvents(ctx, incidentID)
	if err != nil {
		return PlatformIncidentDetail{}, err
	}

	return PlatformIncidentDetail{
		Incident: incident,
		Events:   events,
	}, nil
}

func (s *Service) getPlatformIncidentByID(ctx context.Context, incidentID string) (PlatformIncident, error) {
	var iid pgtype.UUID
	if err := iid.Scan(strings.TrimSpace(incidentID)); err != nil || !iid.Valid {
		return PlatformIncident{}, ErrInvalidPlatformIncidentID
	}

	const query = `
		SELECT
			i.id::text,
			i.title,
			i.status,
			i.severity,
			i.scope,
			COALESCE(i.affected_tenant_ids::text[], '{}') AS affected_tenant_ids,
			COALESCE(i.created_by::text, '') AS created_by,
			i.created_at,
			i.updated_at,
			i.resolved_at
		FROM platform_incidents i
		WHERE i.id = $1
		LIMIT 1
	`

	var out PlatformIncident
	var createdAt pgtype.Timestamptz
	var updatedAt pgtype.Timestamptz
	var resolvedAt pgtype.Timestamptz
	if err := s.db.QueryRow(ctx, query, iid).Scan(
		&out.ID,
		&out.Title,
		&out.Status,
		&out.Severity,
		&out.Scope,
		&out.AffectedTenantIDs,
		&out.CreatedBy,
		&createdAt,
		&updatedAt,
		&resolvedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformIncident{}, ErrPlatformIncidentNotFound
		}
		return PlatformIncident{}, err
	}

	if createdAt.Valid {
		out.CreatedAt = createdAt.Time
	}
	if updatedAt.Valid {
		out.UpdatedAt = updatedAt.Time
	}
	if resolvedAt.Valid {
		v := resolvedAt.Time
		out.ResolvedAt = &v
	}
	return out, nil
}

func (s *Service) ListPlatformIncidentEvents(ctx context.Context, incidentID string) ([]PlatformIncidentEvent, error) {
	var iid pgtype.UUID
	if err := iid.Scan(strings.TrimSpace(incidentID)); err != nil || !iid.Valid {
		return nil, ErrInvalidPlatformIncidentID
	}

	const query = `
		SELECT
			e.id::text,
			e.incident_id::text,
			e.event_type,
			e.message,
			COALESCE(e.metadata, '{}'::jsonb) AS metadata,
			COALESCE(e.created_by::text, '') AS created_by,
			COALESCE(u.email::text, '') AS created_by_email,
			COALESCE(u.full_name, '') AS created_by_name,
			e.created_at
		FROM platform_incident_events e
		LEFT JOIN users u ON u.id = e.created_by
		WHERE e.incident_id = $1
		ORDER BY e.created_at ASC
		LIMIT 1000
	`

	rows, err := s.db.Query(ctx, query, iid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]PlatformIncidentEvent, 0)
	for rows.Next() {
		var row PlatformIncidentEvent
		var metadataJSON []byte
		var createdAt pgtype.Timestamptz
		if err := rows.Scan(
			&row.ID,
			&row.IncidentID,
			&row.EventType,
			&row.Message,
			&metadataJSON,
			&row.CreatedBy,
			&row.CreatedByEmail,
			&row.CreatedByName,
			&createdAt,
		); err != nil {
			return nil, err
		}

		row.Metadata = map[string]interface{}{}
		if len(metadataJSON) > 0 {
			_ = json.Unmarshal(metadataJSON, &row.Metadata)
		}
		if createdAt.Valid {
			row.CreatedAt = createdAt.Time
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Service) CreatePlatformIncidentEvent(ctx context.Context, incidentID string, params CreatePlatformIncidentEventParams) (PlatformIncidentEvent, error) {
	var iid pgtype.UUID
	if err := iid.Scan(strings.TrimSpace(incidentID)); err != nil || !iid.Valid {
		return PlatformIncidentEvent{}, ErrInvalidPlatformIncidentID
	}

	var exists bool
	if err := s.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM platform_incidents WHERE id = $1)`, iid).Scan(&exists); err != nil {
		return PlatformIncidentEvent{}, err
	}
	if !exists {
		return PlatformIncidentEvent{}, ErrPlatformIncidentNotFound
	}

	evType := strings.ToLower(strings.TrimSpace(params.EventType))
	if evType == "" {
		evType = "update"
	}
	switch evType {
	case "update", "note", "status_change":
	default:
		return PlatformIncidentEvent{}, ErrInvalidPlatformIncidentEventPayload
	}

	message := strings.TrimSpace(params.Message)
	if message == "" {
		return PlatformIncidentEvent{}, ErrInvalidPlatformIncidentEventPayload
	}
	if len(message) > 10_000 {
		return PlatformIncidentEvent{}, ErrInvalidPlatformIncidentEventPayload
	}

	metadata := params.Metadata
	if metadata == nil {
		metadata = map[string]interface{}{}
	}
	metaJSON, err := json.Marshal(metadata)
	if err != nil {
		return PlatformIncidentEvent{}, err
	}

	var createdBy pgtype.UUID
	_ = createdBy.Scan(strings.TrimSpace(params.CreatedBy))

	var id string
	err = s.db.QueryRow(ctx, `
		INSERT INTO platform_incident_events (
			incident_id,
			event_type,
			message,
			metadata,
			created_by,
			created_at
		)
		VALUES ($1, $2, $3, $4, $5, NOW())
		RETURNING id::text
	`, iid, evType, message, metaJSON, createdBy).Scan(&id)
	if err != nil {
		return PlatformIncidentEvent{}, err
	}

	_, _ = s.db.Exec(ctx, `UPDATE platform_incidents SET updated_at = NOW() WHERE id = $1`, iid)

	return s.getPlatformIncidentEventByID(ctx, id)
}

func (s *Service) getPlatformIncidentEventByID(ctx context.Context, eventID string) (PlatformIncidentEvent, error) {
	var eid pgtype.UUID
	if err := eid.Scan(strings.TrimSpace(eventID)); err != nil || !eid.Valid {
		return PlatformIncidentEvent{}, ErrInvalidPlatformIncidentEventPayload
	}

	const query = `
		SELECT
			e.id::text,
			e.incident_id::text,
			e.event_type,
			e.message,
			COALESCE(e.metadata, '{}'::jsonb) AS metadata,
			COALESCE(e.created_by::text, '') AS created_by,
			COALESCE(u.email::text, '') AS created_by_email,
			COALESCE(u.full_name, '') AS created_by_name,
			e.created_at
		FROM platform_incident_events e
		LEFT JOIN users u ON u.id = e.created_by
		WHERE e.id = $1
		LIMIT 1
	`

	var out PlatformIncidentEvent
	var metadataJSON []byte
	var createdAt pgtype.Timestamptz
	if err := s.db.QueryRow(ctx, query, eid).Scan(
		&out.ID,
		&out.IncidentID,
		&out.EventType,
		&out.Message,
		&metadataJSON,
		&out.CreatedBy,
		&out.CreatedByEmail,
		&out.CreatedByName,
		&createdAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformIncidentEvent{}, ErrPlatformIncidentEventNotFound
		}
		return PlatformIncidentEvent{}, err
	}

	out.Metadata = map[string]interface{}{}
	if len(metadataJSON) > 0 {
		_ = json.Unmarshal(metadataJSON, &out.Metadata)
	}
	if createdAt.Valid {
		out.CreatedAt = createdAt.Time
	}
	return out, nil
}
