package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrInvalidAddonRequestID       = errors.New("invalid add-on request id")
	ErrAddonRequestNotFound        = errors.New("add-on request not found")
	ErrAddonRequestInvalidDecision = errors.New("invalid add-on request decision")
	ErrAddonRequestNotPending      = errors.New("add-on request is not pending")
	ErrAddonRequestSelfApproval    = errors.New("add-on request cannot be approved by requester")
	ErrAddonRequestNotApproved     = errors.New("add-on request is not approved")
	ErrAddonRequestAlreadyActive   = errors.New("add-on request is already activated")
	ErrAddonRequestAddonRequired   = errors.New("addon id is required")
	ErrAddonRequestAddonUnknown    = errors.New("addon id is not recognized")
	ErrAddonRequestAlreadyExists   = errors.New("add-on activation request already exists")
)

type TenantAddonActivationPayload struct {
	AddonID          string                 `json:"addon_id"`
	AddonName        string                 `json:"addon_name"`
	Reason           string                 `json:"reason,omitempty"`
	BillingReference string                 `json:"billing_reference,omitempty"`
	Settings         map[string]interface{} `json:"settings,omitempty"`
	RequestedAt      string                 `json:"requested_at"`
	ApprovedAt       string                 `json:"approved_at,omitempty"`
	ActivatedAt      string                 `json:"activated_at,omitempty"`
	ReviewNotes      string                 `json:"review_notes,omitempty"`
}

type TenantAddonActivationRequestRow struct {
	ID               string                       `json:"id"`
	TenantID         string                       `json:"tenant_id"`
	TenantName       string                       `json:"tenant_name,omitempty"`
	Status           string                       `json:"status"`
	RequestedBy      string                       `json:"requested_by"`
	RequestedByName  string                       `json:"requested_by_name,omitempty"`
	RequestedByEmail string                       `json:"requested_by_email,omitempty"`
	ApprovedBy       string                       `json:"approved_by,omitempty"`
	ApprovedByName   string                       `json:"approved_by_name,omitempty"`
	ApprovedByEmail  string                       `json:"approved_by_email,omitempty"`
	Payload          TenantAddonActivationPayload `json:"payload"`
	CreatedAt        time.Time                    `json:"created_at"`
	ApprovedAt       *time.Time                   `json:"approved_at,omitempty"`
}

type CreateTenantAddonActivationRequestParams struct {
	AddonID          string                 `json:"addon_id"`
	Reason           string                 `json:"reason"`
	BillingReference string                 `json:"billing_reference"`
	Settings         map[string]interface{} `json:"settings"`
	RequestedBy      string                 `json:"-"`
}

type ListAddonActivationRequestsFilters struct {
	TenantID string
	AddonID  string
	Status   string
	Limit    int32
	Offset   int32
}

type ReviewPlatformAddonActivationRequestParams struct {
	Decision         string `json:"decision"` // approve, reject
	Notes            string `json:"notes"`
	BillingReference string `json:"billing_reference"`
	ActivateNow      bool   `json:"activate_now"`
	ReviewedBy       string `json:"-"`
}

type ActivatePlatformAddonActivationRequestParams struct {
	BillingReference string `json:"billing_reference"`
	Notes            string `json:"notes"`
	ActivatedBy      string `json:"-"`
}

func parseAddonRequestUUID(raw string) (pgtype.UUID, error) {
	var id pgtype.UUID
	if err := id.Scan(strings.TrimSpace(raw)); err != nil || !id.Valid {
		return pgtype.UUID{}, ErrInvalidAddonRequestID
	}
	return id, nil
}

func normalizeAddonID(raw string) string {
	return strings.TrimSpace(raw)
}

func findAddonMetadata(addonID string) (PluginMetadata, bool) {
	id := normalizeAddonID(addonID)
	if id == "" {
		return PluginMetadata{}, false
	}
	for _, p := range SystemPlugins {
		if p.ID == id {
			return p, true
		}
	}
	return PluginMetadata{}, false
}

func (s *Service) CreateTenantAddonActivationRequest(ctx context.Context, tenantID string, params CreateTenantAddonActivationRequestParams) (TenantAddonActivationRequestRow, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}

	requestedBy, err := parseUserUUID(params.RequestedBy)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}

	addonID := normalizeAddonID(params.AddonID)
	if addonID == "" {
		return TenantAddonActivationRequestRow{}, ErrAddonRequestAddonRequired
	}
	meta, ok := findAddonMetadata(addonID)
	if !ok {
		return TenantAddonActivationRequestRow{}, ErrAddonRequestAddonUnknown
	}
	addons, err := s.ListTenantAddons(ctx, tenantID)
	if err == nil {
		for _, addon := range addons {
			rawID, _ := addon.Metadata["id"].(string)
			if strings.TrimSpace(rawID) == addonID && addon.Enabled {
				return TenantAddonActivationRequestRow{}, ErrAddonRequestAlreadyActive
			}
		}
	}

	reason := strings.TrimSpace(params.Reason)
	billingReference := strings.TrimSpace(params.BillingReference)
	settings := params.Settings
	if settings == nil {
		settings = map[string]interface{}{}
	}

	const existing = `
		SELECT COUNT(*)::int
		FROM platform_action_approvals
		WHERE action_type = 'tenant_addon_activation'
		  AND target_tenant_id = $1
		  AND status IN ('pending', 'approved')
		  AND payload->>'addon_id' = $2
	`
	var count int
	if err := s.db.QueryRow(ctx, existing, tid, addonID).Scan(&count); err == nil && count > 0 {
		return TenantAddonActivationRequestRow{}, ErrAddonRequestAlreadyExists
	}

	payload := TenantAddonActivationPayload{
		AddonID:          addonID,
		AddonName:        meta.Name,
		Reason:           reason,
		BillingReference: billingReference,
		Settings:         settings,
		RequestedAt:      time.Now().UTC().Format(time.RFC3339),
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}

	const insert = `
		INSERT INTO platform_action_approvals (
			action_type,
			target_tenant_id,
			payload,
			requested_by,
			status,
			reason,
			created_at
		)
		VALUES (
			'tenant_addon_activation',
			$1,
			$2,
			$3,
			'pending',
			$4,
			NOW()
		)
		RETURNING id::text, status, created_at
	`

	var out TenantAddonActivationRequestRow
	out.TenantID = strings.TrimSpace(tenantID)
	out.RequestedBy = strings.TrimSpace(params.RequestedBy)
	out.Payload = payload
	if err := s.db.QueryRow(ctx, insert, tid, payloadJSON, requestedBy, reason).Scan(&out.ID, &out.Status, &out.CreatedAt); err != nil {
		return TenantAddonActivationRequestRow{}, err
	}

	return s.GetAddonActivationRequest(ctx, out.ID)
}

func (s *Service) ListTenantAddonActivationRequests(ctx context.Context, tenantID string, limit, offset int32) ([]TenantAddonActivationRequestRow, error) {
	return s.ListPlatformAddonActivationRequests(ctx, ListAddonActivationRequestsFilters{
		TenantID: tenantID,
		Limit:    limit,
		Offset:   offset,
	})
}

func (s *Service) ListPlatformAddonActivationRequests(ctx context.Context, filters ListAddonActivationRequestsFilters) ([]TenantAddonActivationRequestRow, error) {
	limit := filters.Limit
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	addonFilter := normalizeAddonID(filters.AddonID)
	statusFilter := strings.ToLower(strings.TrimSpace(filters.Status))

	var tenantFilter pgtype.UUID
	hasTenantFilter := false
	if strings.TrimSpace(filters.TenantID) != "" {
		tid, err := parseTenantUUID(filters.TenantID)
		if err != nil {
			return nil, err
		}
		tenantFilter = tid
		hasTenantFilter = true
	}

	const query = `
		SELECT
			pa.id::text,
			COALESCE(pa.target_tenant_id::text, '') AS tenant_id,
			COALESCE(t.name, '') AS tenant_name,
			pa.status,
			COALESCE(pa.requested_by::text, '') AS requested_by,
			COALESCE(req.full_name, '') AS requested_by_name,
			COALESCE(req.email, '') AS requested_by_email,
			COALESCE(pa.approved_by::text, '') AS approved_by,
			COALESCE(app.full_name, '') AS approved_by_name,
			COALESCE(app.email, '') AS approved_by_email,
			pa.payload,
			pa.created_at,
			pa.approved_at
		FROM platform_action_approvals pa
		LEFT JOIN tenants t ON t.id = pa.target_tenant_id
		LEFT JOIN users req ON req.id = pa.requested_by
		LEFT JOIN users app ON app.id = pa.approved_by
		WHERE pa.action_type = 'tenant_addon_activation'
		  AND ($3::bool = FALSE OR pa.target_tenant_id = $4)
		  AND ($5 = '' OR pa.status = $5)
		  AND ($6 = '' OR pa.payload->>'addon_id' = $6)
		ORDER BY pa.created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := s.db.Query(ctx, query, limit, offset, hasTenantFilter, tenantFilter, statusFilter, addonFilter)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]TenantAddonActivationRequestRow, 0)
	for rows.Next() {
		row, err := scanAddonActivationRequestRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Service) GetAddonActivationRequest(ctx context.Context, requestID string) (TenantAddonActivationRequestRow, error) {
	rid, err := parseAddonRequestUUID(requestID)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}

	const query = `
		SELECT
			pa.id::text,
			COALESCE(pa.target_tenant_id::text, '') AS tenant_id,
			COALESCE(t.name, '') AS tenant_name,
			pa.status,
			COALESCE(pa.requested_by::text, '') AS requested_by,
			COALESCE(req.full_name, '') AS requested_by_name,
			COALESCE(req.email, '') AS requested_by_email,
			COALESCE(pa.approved_by::text, '') AS approved_by,
			COALESCE(app.full_name, '') AS approved_by_name,
			COALESCE(app.email, '') AS approved_by_email,
			pa.payload,
			pa.created_at,
			pa.approved_at
		FROM platform_action_approvals pa
		LEFT JOIN tenants t ON t.id = pa.target_tenant_id
		LEFT JOIN users req ON req.id = pa.requested_by
		LEFT JOIN users app ON app.id = pa.approved_by
		WHERE pa.action_type = 'tenant_addon_activation'
		  AND pa.id = $1
	`

	rows, err := s.db.Query(ctx, query, rid)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}
	defer rows.Close()

	if !rows.Next() {
		return TenantAddonActivationRequestRow{}, ErrAddonRequestNotFound
	}
	row, err := scanAddonActivationRequestRow(rows)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}
	return row, nil
}

func (s *Service) ReviewPlatformAddonActivationRequest(ctx context.Context, requestID string, params ReviewPlatformAddonActivationRequestParams) (TenantAddonActivationRequestRow, error) {
	decision := strings.ToLower(strings.TrimSpace(params.Decision))
	if decision != "approve" && decision != "reject" {
		return TenantAddonActivationRequestRow{}, ErrAddonRequestInvalidDecision
	}

	requester, err := parseUserUUID(params.ReviewedBy)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}

	current, err := s.GetAddonActivationRequest(ctx, requestID)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}
	if current.Status != "pending" {
		return TenantAddonActivationRequestRow{}, ErrAddonRequestNotPending
	}
	if decision == "approve" && current.RequestedBy == strings.TrimSpace(params.ReviewedBy) {
		return TenantAddonActivationRequestRow{}, ErrAddonRequestSelfApproval
	}

	payload := current.Payload
	payload.ReviewNotes = strings.TrimSpace(params.Notes)
	if strings.TrimSpace(params.BillingReference) != "" {
		payload.BillingReference = strings.TrimSpace(params.BillingReference)
	}

	now := time.Now().UTC()
	status := "rejected"
	if decision == "approve" {
		payload.ApprovedAt = now.Format(time.RFC3339)
		status = "approved"
	}
	if decision == "approve" && params.ActivateNow {
		payload.ActivatedAt = now.Format(time.RFC3339)
		status = "executed"
		if err := s.UpdatePluginConfig(ctx, current.TenantID, payload.AddonID, true, payload.Settings); err != nil {
			return TenantAddonActivationRequestRow{}, err
		}
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}

	rid, err := parseAddonRequestUUID(requestID)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}

	const update = `
		UPDATE platform_action_approvals
		SET status = $2,
			approved_by = $3,
			approved_at = NOW(),
			reason = $4,
			payload = $5
		WHERE id = $1
		  AND action_type = 'tenant_addon_activation'
	`
	tag, err := s.db.Exec(ctx, update, rid, status, requester, strings.TrimSpace(params.Notes), payloadJSON)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}
	if tag.RowsAffected() == 0 {
		return TenantAddonActivationRequestRow{}, ErrAddonRequestNotFound
	}

	return s.GetAddonActivationRequest(ctx, requestID)
}

func (s *Service) ActivatePlatformAddonActivationRequest(ctx context.Context, requestID string, params ActivatePlatformAddonActivationRequestParams) (TenantAddonActivationRequestRow, error) {
	actor, err := parseUserUUID(params.ActivatedBy)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}

	current, err := s.GetAddonActivationRequest(ctx, requestID)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}

	switch current.Status {
	case "executed":
		return TenantAddonActivationRequestRow{}, ErrAddonRequestAlreadyActive
	case "approved", "pending":
		// continue
	default:
		return TenantAddonActivationRequestRow{}, ErrAddonRequestNotApproved
	}

	payload := current.Payload
	if strings.TrimSpace(params.BillingReference) != "" {
		payload.BillingReference = strings.TrimSpace(params.BillingReference)
	}
	if strings.TrimSpace(params.Notes) != "" {
		payload.ReviewNotes = strings.TrimSpace(params.Notes)
	}
	now := time.Now().UTC()
	if payload.ApprovedAt == "" {
		payload.ApprovedAt = now.Format(time.RFC3339)
	}
	payload.ActivatedAt = now.Format(time.RFC3339)

	if err := s.UpdatePluginConfig(ctx, current.TenantID, payload.AddonID, true, payload.Settings); err != nil {
		return TenantAddonActivationRequestRow{}, err
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}

	rid, err := parseAddonRequestUUID(requestID)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}

	const update = `
		UPDATE platform_action_approvals
		SET status = 'executed',
			approved_by = $2,
			approved_at = NOW(),
			reason = $3,
			payload = $4
		WHERE id = $1
		  AND action_type = 'tenant_addon_activation'
	`
	tag, err := s.db.Exec(ctx, update, rid, actor, strings.TrimSpace(params.Notes), payloadJSON)
	if err != nil {
		return TenantAddonActivationRequestRow{}, err
	}
	if tag.RowsAffected() == 0 {
		return TenantAddonActivationRequestRow{}, ErrAddonRequestNotFound
	}

	return s.GetAddonActivationRequest(ctx, requestID)
}

type addonRowScanner interface {
	Scan(dest ...interface{}) error
}

func scanAddonActivationRequestRow(scanner addonRowScanner) (TenantAddonActivationRequestRow, error) {
	var row TenantAddonActivationRequestRow
	var payloadRaw []byte
	var approvedAt pgtype.Timestamptz
	if err := scanner.Scan(
		&row.ID,
		&row.TenantID,
		&row.TenantName,
		&row.Status,
		&row.RequestedBy,
		&row.RequestedByName,
		&row.RequestedByEmail,
		&row.ApprovedBy,
		&row.ApprovedByName,
		&row.ApprovedByEmail,
		&payloadRaw,
		&row.CreatedAt,
		&approvedAt,
	); err != nil {
		return TenantAddonActivationRequestRow{}, err
	}

	var payload TenantAddonActivationPayload
	if len(payloadRaw) > 0 {
		_ = json.Unmarshal(payloadRaw, &payload)
	}
	if payload.Settings == nil {
		payload.Settings = map[string]interface{}{}
	}
	row.Payload = payload

	if approvedAt.Valid {
		t := approvedAt.Time
		row.ApprovedAt = &t
	}
	return row, nil
}
