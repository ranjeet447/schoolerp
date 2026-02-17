package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrInvalidDeletionRequestID     = errors.New("invalid deletion request id")
	ErrDeletionReasonRequired       = errors.New("deletion reason is required")
	ErrDeletionRequestNotFound      = errors.New("deletion request not found")
	ErrDeletionSelfApproval         = errors.New("deletion request cannot be approved by the requester")
	ErrDeletionNotApproved          = errors.New("deletion request is not approved")
	ErrDeletionCooldownActive       = errors.New("deletion request is still in cooldown")
	ErrDeletionAlreadyExecuted      = errors.New("deletion request is already executed")
	ErrDeletionInvalidDecision      = errors.New("invalid deletion review decision")
	ErrDeletionNotPending           = errors.New("deletion request is not pending")
	ErrDeletionConfirmationRequired = errors.New("deletion confirmation is required")
	ErrDeletionInvalidConfirmation  = errors.New("deletion confirmation did not match")
	ErrDeletionAlreadyInProgress    = errors.New("deletion request already exists for this tenant")
)

type CreateTenantDeletionRequestParams struct {
	Reason        string `json:"reason"`
	CooldownHours int    `json:"cooldown_hours"`
	RequestedBy   string `json:"-"`
}

type ReviewTenantDeletionRequestParams struct {
	Decision   string `json:"decision"` // approve, reject
	Notes      string `json:"notes"`
	ReviewedBy string `json:"-"`
}

type ExecuteTenantDeletionParams struct {
	Confirmation string `json:"confirmation"`
	ExecutedBy   string `json:"-"`
}

type TenantDeletionRequestPayload struct {
	Reason        string `json:"reason"`
	Notes         string `json:"notes,omitempty"`
	CooldownHours int    `json:"cooldown_hours"`
	RequestedAt   string `json:"requested_at"`
	ApprovedAt    string `json:"approved_at,omitempty"`
	ExecuteAfter  string `json:"execute_after,omitempty"`
	ExecutedAt    string `json:"executed_at,omitempty"`
}

type TenantDeletionRequestRow struct {
	ID               string                       `json:"id"`
	TenantID         string                       `json:"tenant_id"`
	Status           string                       `json:"status"`
	RequestedBy      string                       `json:"requested_by"`
	RequestedByName  string                       `json:"requested_by_name,omitempty"`
	RequestedByEmail string                       `json:"requested_by_email,omitempty"`
	ApprovedBy       string                       `json:"approved_by,omitempty"`
	ApprovedByName   string                       `json:"approved_by_name,omitempty"`
	ApprovedByEmail  string                       `json:"approved_by_email,omitempty"`
	Payload          TenantDeletionRequestPayload `json:"payload"`
	CreatedAt        time.Time                    `json:"created_at"`
	ApprovedAt       *time.Time                   `json:"approved_at,omitempty"`
	ExecuteAfter     *time.Time                   `json:"execute_after,omitempty"`
}

func parseDeletionRequestUUID(raw string) (pgtype.UUID, error) {
	var id pgtype.UUID
	if err := id.Scan(strings.TrimSpace(raw)); err != nil || !id.Valid {
		return pgtype.UUID{}, ErrInvalidDeletionRequestID
	}
	return id, nil
}

func (s *Service) CreateTenantDeletionRequest(ctx context.Context, tenantID string, params CreateTenantDeletionRequestParams) (TenantDeletionRequestRow, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return TenantDeletionRequestRow{}, err
	}

	reason := strings.TrimSpace(params.Reason)
	if reason == "" {
		return TenantDeletionRequestRow{}, ErrDeletionReasonRequired
	}

	cooldownHours := params.CooldownHours
	if cooldownHours <= 0 {
		cooldownHours = 24
	}
	if cooldownHours > 168 {
		cooldownHours = 168
	}

	var requestedBy pgtype.UUID
	_ = requestedBy.Scan(strings.TrimSpace(params.RequestedBy))

	// Guardrail: only one pending/approved deletion request at a time per tenant.
	const existing = `
		SELECT COUNT(*)::int
		FROM platform_action_approvals
		WHERE action_type = 'tenant_deletion'
		  AND target_tenant_id = $1
		  AND status IN ('pending', 'approved')
	`
	var count int
	if err := s.db.QueryRow(ctx, existing, tid).Scan(&count); err == nil && count > 0 {
		return TenantDeletionRequestRow{}, ErrDeletionAlreadyInProgress
	}

	payload := TenantDeletionRequestPayload{
		Reason:        reason,
		CooldownHours: cooldownHours,
		RequestedAt:   time.Now().UTC().Format(time.RFC3339),
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return TenantDeletionRequestRow{}, err
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
			'tenant_deletion',
			$1,
			$2,
			$3,
			'pending',
			$4,
			NOW()
		)
		RETURNING id::text, status, created_at
	`

	var out TenantDeletionRequestRow
	out.TenantID = strings.TrimSpace(tenantID)
	out.RequestedBy = strings.TrimSpace(params.RequestedBy)
	out.Payload = payload
	if err := s.db.QueryRow(ctx, insert, tid, payloadJSON, requestedBy, reason).Scan(&out.ID, &out.Status, &out.CreatedAt); err != nil {
		return TenantDeletionRequestRow{}, err
	}
	return out, nil
}

func (s *Service) ListTenantDeletionRequests(ctx context.Context, tenantID string, limit, offset int32) ([]TenantDeletionRequestRow, error) {
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
			pa.id::text,
			pa.status,
			COALESCE(pa.requested_by::text, '') AS requested_by,
			COALESCE(req.full_name, '') AS requested_by_name,
			COALESCE(req.email, '') AS requested_by_email,
			COALESCE(pa.approved_by::text, '') AS approved_by,
			COALESCE(app.full_name, '') AS approved_by_name,
			COALESCE(app.email, '') AS approved_by_email,
			pa.payload,
			pa.created_at,
			pa.approved_at,
			pa.expires_at
		FROM platform_action_approvals pa
		LEFT JOIN users req ON req.id = pa.requested_by
		LEFT JOIN users app ON app.id = pa.approved_by
		WHERE pa.action_type = 'tenant_deletion'
		  AND pa.target_tenant_id = $1
		ORDER BY pa.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(ctx, query, tid, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]TenantDeletionRequestRow, 0)
	for rows.Next() {
		var row TenantDeletionRequestRow
		var payloadRaw []byte
		var approvedAt pgtype.Timestamptz
		var executeAfter pgtype.Timestamptz
		if err := rows.Scan(
			&row.ID,
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
			&executeAfter,
		); err != nil {
			return nil, err
		}
		row.TenantID = strings.TrimSpace(tenantID)
		_ = json.Unmarshal(payloadRaw, &row.Payload)
		if approvedAt.Valid {
			v := approvedAt.Time
			row.ApprovedAt = &v
		}
		if executeAfter.Valid {
			v := executeAfter.Time
			row.ExecuteAfter = &v
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Service) ReviewTenantDeletionRequest(ctx context.Context, tenantID, requestID string, params ReviewTenantDeletionRequestParams) (TenantDeletionRequestRow, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return TenantDeletionRequestRow{}, err
	}
	rid, err := parseDeletionRequestUUID(requestID)
	if err != nil {
		return TenantDeletionRequestRow{}, err
	}

	decision := strings.ToLower(strings.TrimSpace(params.Decision))
	if decision != "approve" && decision != "reject" {
		return TenantDeletionRequestRow{}, ErrDeletionInvalidDecision
	}

	var reviewer pgtype.UUID
	_ = reviewer.Scan(strings.TrimSpace(params.ReviewedBy))

	// Load existing request for validation and payload merge.
	const selectReq = `
		SELECT
			status,
			COALESCE(requested_by::text, '') AS requested_by,
			payload
		FROM platform_action_approvals
		WHERE id = $1
		  AND action_type = 'tenant_deletion'
		  AND target_tenant_id = $2
		LIMIT 1
	`
	var status string
	var requestedBy string
	var payloadRaw []byte
	if err := s.db.QueryRow(ctx, selectReq, rid, tid).Scan(&status, &requestedBy, &payloadRaw); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return TenantDeletionRequestRow{}, ErrDeletionRequestNotFound
		}
		return TenantDeletionRequestRow{}, err
	}

	if !strings.EqualFold(status, "pending") {
		return TenantDeletionRequestRow{}, ErrDeletionNotPending
	}

	if strings.EqualFold(strings.TrimSpace(requestedBy), strings.TrimSpace(params.ReviewedBy)) && decision == "approve" {
		return TenantDeletionRequestRow{}, ErrDeletionSelfApproval
	}

	var payload TenantDeletionRequestPayload
	_ = json.Unmarshal(payloadRaw, &payload)
	payload.Notes = strings.TrimSpace(params.Notes)

	updateStatus := "rejected"
	var executeAfter *time.Time
	if decision == "approve" {
		updateStatus = "approved"
		now := time.Now().UTC()
		payload.ApprovedAt = now.Format(time.RFC3339)
		cooldownHours := payload.CooldownHours
		if cooldownHours <= 0 {
			cooldownHours = 24
		}
		scheduled := now.Add(time.Duration(cooldownHours) * time.Hour)
		payload.ExecuteAfter = scheduled.Format(time.RFC3339)
		executeAfter = &scheduled
	}

	mergedRaw, err := json.Marshal(payload)
	if err != nil {
		return TenantDeletionRequestRow{}, err
	}

	const update = `
		UPDATE platform_action_approvals
		SET status = $3,
		    approved_by = $4,
		    approved_at = NOW(),
		    expires_at = $5,
		    payload = $6
		WHERE id = $1
		  AND action_type = 'tenant_deletion'
		  AND target_tenant_id = $2
	`
	var expiresAt pgtype.Timestamptz
	if executeAfter != nil {
		expiresAt = pgtype.Timestamptz{Time: executeAfter.UTC(), Valid: true}
	}
	if _, err := s.db.Exec(ctx, update, rid, tid, updateStatus, reviewer, expiresAt, mergedRaw); err != nil {
		return TenantDeletionRequestRow{}, err
	}

	return s.GetTenantDeletionRequest(ctx, tenantID, requestID)
}

func (s *Service) GetTenantDeletionRequest(ctx context.Context, tenantID, requestID string) (TenantDeletionRequestRow, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return TenantDeletionRequestRow{}, err
	}
	rid, err := parseDeletionRequestUUID(requestID)
	if err != nil {
		return TenantDeletionRequestRow{}, err
	}

	const query = `
		SELECT
			pa.id::text,
			pa.status,
			COALESCE(pa.requested_by::text, '') AS requested_by,
			COALESCE(req.full_name, '') AS requested_by_name,
			COALESCE(req.email, '') AS requested_by_email,
			COALESCE(pa.approved_by::text, '') AS approved_by,
			COALESCE(app.full_name, '') AS approved_by_name,
			COALESCE(app.email, '') AS approved_by_email,
			pa.payload,
			pa.created_at,
			pa.approved_at,
			pa.expires_at
		FROM platform_action_approvals pa
		LEFT JOIN users req ON req.id = pa.requested_by
		LEFT JOIN users app ON app.id = pa.approved_by
		WHERE pa.action_type = 'tenant_deletion'
		  AND pa.target_tenant_id = $1
		  AND pa.id = $2
		LIMIT 1
	`

	var row TenantDeletionRequestRow
	var payloadRaw []byte
	var approvedAt pgtype.Timestamptz
	var executeAfter pgtype.Timestamptz
	if err := s.db.QueryRow(ctx, query, tid, rid).Scan(
		&row.ID,
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
		&executeAfter,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return TenantDeletionRequestRow{}, ErrDeletionRequestNotFound
		}
		return TenantDeletionRequestRow{}, err
	}
	row.TenantID = strings.TrimSpace(tenantID)
	_ = json.Unmarshal(payloadRaw, &row.Payload)
	if approvedAt.Valid {
		v := approvedAt.Time
		row.ApprovedAt = &v
	}
	if executeAfter.Valid {
		v := executeAfter.Time
		row.ExecuteAfter = &v
	}
	return row, nil
}

func (s *Service) ExecuteTenantDeletion(ctx context.Context, tenantID, requestID string, params ExecuteTenantDeletionParams) error {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return err
	}
	rid, err := parseDeletionRequestUUID(requestID)
	if err != nil {
		return err
	}

	confirmation := strings.TrimSpace(params.Confirmation)
	if confirmation == "" {
		return ErrDeletionConfirmationRequired
	}
	expected := "DELETE " + strings.TrimSpace(tenantID)
	if confirmation != expected {
		return ErrDeletionInvalidConfirmation
	}

	var executor pgtype.UUID
	_ = executor.Scan(strings.TrimSpace(params.ExecutedBy))

	const selectReq = `
		SELECT status, payload, expires_at
		FROM platform_action_approvals
		WHERE id = $1
		  AND action_type = 'tenant_deletion'
		  AND target_tenant_id = $2
		LIMIT 1
	`
	var status string
	var payloadRaw []byte
	var executeAfter pgtype.Timestamptz
	if err := s.db.QueryRow(ctx, selectReq, rid, tid).Scan(&status, &payloadRaw, &executeAfter); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrDeletionRequestNotFound
		}
		return err
	}

	if strings.EqualFold(status, "executed") {
		return ErrDeletionAlreadyExecuted
	}
	if !strings.EqualFold(status, "approved") {
		return ErrDeletionNotApproved
	}

	if executeAfter.Valid {
		if time.Now().UTC().Before(executeAfter.Time) {
			return ErrDeletionCooldownActive
		}
	}

	// Execute: soft-close tenant (safe default).
	if err := s.UpsertTenantLifecycle(ctx, tenantID, TenantLifecycleParams{
		Status:    "closed",
		UpdatedBy: strings.TrimSpace(params.ExecutedBy),
	}); err != nil {
		return err
	}

	var payload TenantDeletionRequestPayload
	_ = json.Unmarshal(payloadRaw, &payload)
	payload.ExecutedAt = time.Now().UTC().Format(time.RFC3339)
	mergedRaw, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	const update = `
		UPDATE platform_action_approvals
		SET status = 'executed',
		    approved_by = COALESCE(approved_by, $3),
		    payload = $4
		WHERE id = $1
		  AND action_type = 'tenant_deletion'
		  AND target_tenant_id = $2
	`
	_, err = s.db.Exec(ctx, update, rid, tid, executor, mergedRaw)
	return err
}
