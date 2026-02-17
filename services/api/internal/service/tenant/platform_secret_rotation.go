package tenant

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrInvalidSecretRotationRequestID    = errors.New("invalid secret rotation request id")
	ErrSecretRotationReasonRequired      = errors.New("secret rotation reason is required")
	ErrSecretRotationInvalidSecretName   = errors.New("invalid secret name")
	ErrSecretRotationRequestNotFound     = errors.New("secret rotation request not found")
	ErrSecretRotationInvalidDecision     = errors.New("invalid secret rotation review decision")
	ErrSecretRotationNotPending          = errors.New("secret rotation request is not pending")
	ErrSecretRotationSelfApproval        = errors.New("secret rotation request cannot be approved by the requester")
	ErrSecretRotationNotApproved         = errors.New("secret rotation request is not approved")
	ErrSecretRotationAlreadyExecuted     = errors.New("secret rotation request is already executed")
	ErrSecretRotationConfirmationNeeded  = errors.New("secret rotation confirmation is required")
	ErrSecretRotationInvalidConfirmation = errors.New("secret rotation confirmation did not match")
	ErrSecretRotationAlreadyInProgress   = errors.New("secret rotation request already exists for this secret")
)

type CreatePlatformSecretRotationRequestParams struct {
	SecretName  string `json:"secret_name"` // jwt, data_encryption
	Reason      string `json:"reason"`
	RequestedBy string `json:"-"`
}

type ReviewPlatformSecretRotationRequestParams struct {
	Decision   string `json:"decision"` // approve, reject
	Notes      string `json:"notes"`
	ReviewedBy string `json:"-"`
}

type ExecutePlatformSecretRotationRequestParams struct {
	Confirmation string `json:"confirmation"`
	ExecutedBy   string `json:"-"`
}

type PlatformSecretRotationPayload struct {
	SecretName           string `json:"secret_name"`
	Reason               string `json:"reason"`
	Notes                string `json:"notes,omitempty"`
	RequestedAt          string `json:"requested_at"`
	ApprovedAt           string `json:"approved_at,omitempty"`
	ExecutedAt           string `json:"executed_at,omitempty"`
	GeneratedFormat      string `json:"generated_format,omitempty"`      // base64_32_bytes
	GeneratedFingerprint string `json:"generated_fingerprint,omitempty"` // sha256(raw_bytes) hex
	EnvVar               string `json:"env_var,omitempty"`               // JWT_SECRETS, DATA_ENCRYPTION_KEYS
}

type PlatformSecretRotationRequestRow struct {
	ID               string                        `json:"id"`
	Status           string                        `json:"status"`
	RequestedBy      string                        `json:"requested_by"`
	RequestedByName  string                        `json:"requested_by_name,omitempty"`
	RequestedByEmail string                        `json:"requested_by_email,omitempty"`
	ApprovedBy       string                        `json:"approved_by,omitempty"`
	ApprovedByName   string                        `json:"approved_by_name,omitempty"`
	ApprovedByEmail  string                        `json:"approved_by_email,omitempty"`
	Payload          PlatformSecretRotationPayload `json:"payload"`
	CreatedAt        time.Time                     `json:"created_at"`
	ApprovedAt       *time.Time                    `json:"approved_at,omitempty"`
}

type ExecutePlatformSecretRotationResult struct {
	Request         PlatformSecretRotationRequestRow `json:"request"`
	GeneratedSecret string                           `json:"generated_secret"`
	EnvVar          string                           `json:"env_var"`
	Instructions    []string                         `json:"instructions"`
}

func normalizeSecretName(raw string) (string, string, bool) {
	name := strings.ToLower(strings.TrimSpace(raw))
	switch name {
	case "jwt", "jwt_secret", "jwt_signing":
		return "jwt", "JWT_SECRETS", true
	case "data_encryption", "data_encryption_key", "encryption", "data_key":
		return "data_encryption", "DATA_ENCRYPTION_KEYS", true
	default:
		return "", "", false
	}
}

func parseSecretRotationUUID(raw string) (pgtype.UUID, error) {
	var id pgtype.UUID
	if err := id.Scan(strings.TrimSpace(raw)); err != nil || !id.Valid {
		return pgtype.UUID{}, ErrInvalidSecretRotationRequestID
	}
	return id, nil
}

func (s *Service) CreatePlatformSecretRotationRequest(ctx context.Context, params CreatePlatformSecretRotationRequestParams) (PlatformSecretRotationRequestRow, error) {
	secretName, envVar, ok := normalizeSecretName(params.SecretName)
	if !ok {
		return PlatformSecretRotationRequestRow{}, ErrSecretRotationInvalidSecretName
	}

	reason := strings.TrimSpace(params.Reason)
	if reason == "" {
		return PlatformSecretRotationRequestRow{}, ErrSecretRotationReasonRequired
	}

	var requestedBy pgtype.UUID
	_ = requestedBy.Scan(strings.TrimSpace(params.RequestedBy))

	// Guardrail: only one pending/approved request per secret at a time.
	const existing = `
		SELECT COUNT(*)::int
		FROM platform_action_approvals
		WHERE action_type = 'secret_rotation'
		  AND status IN ('pending', 'approved')
		  AND payload->>'secret_name' = $1
	`
	var count int
	if err := s.db.QueryRow(ctx, existing, secretName).Scan(&count); err == nil && count > 0 {
		return PlatformSecretRotationRequestRow{}, ErrSecretRotationAlreadyInProgress
	}

	payload := PlatformSecretRotationPayload{
		SecretName:  secretName,
		Reason:      reason,
		RequestedAt: time.Now().UTC().Format(time.RFC3339),
		EnvVar:      envVar,
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return PlatformSecretRotationRequestRow{}, err
	}

	const insert = `
		INSERT INTO platform_action_approvals (
			action_type,
			payload,
			requested_by,
			status,
			reason,
			created_at
		)
		VALUES (
			'secret_rotation',
			$1,
			$2,
			'pending',
			$3,
			NOW()
		)
		RETURNING id::text, status, created_at
	`

	var out PlatformSecretRotationRequestRow
	out.Payload = payload
	out.RequestedBy = strings.TrimSpace(params.RequestedBy)
	if err := s.db.QueryRow(ctx, insert, payloadJSON, requestedBy, reason).Scan(&out.ID, &out.Status, &out.CreatedAt); err != nil {
		return PlatformSecretRotationRequestRow{}, err
	}
	return out, nil
}

type ListPlatformSecretRotationRequestsFilters struct {
	SecretName string
	Status     string
	Limit      int32
	Offset     int32
}

func (s *Service) ListPlatformSecretRotationRequests(ctx context.Context, filters ListPlatformSecretRotationRequestsFilters) ([]PlatformSecretRotationRequestRow, error) {
	limit := filters.Limit
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	secretFilter := ""
	if strings.TrimSpace(filters.SecretName) != "" {
		if normalized, _, ok := normalizeSecretName(filters.SecretName); ok {
			secretFilter = normalized
		}
	}
	statusFilter := strings.ToLower(strings.TrimSpace(filters.Status))

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
			pa.approved_at
		FROM platform_action_approvals pa
		LEFT JOIN users req ON req.id = pa.requested_by
		LEFT JOIN users app ON app.id = pa.approved_by
		WHERE pa.action_type = 'secret_rotation'
		  AND ($3 = '' OR pa.payload->>'secret_name' = $3)
		  AND ($4 = '' OR pa.status = $4)
		ORDER BY pa.created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := s.db.Query(ctx, query, limit, offset, secretFilter, statusFilter)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]PlatformSecretRotationRequestRow, 0)
	for rows.Next() {
		var row PlatformSecretRotationRequestRow
		var payloadRaw []byte
		var approvedAt pgtype.Timestamptz
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
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(payloadRaw, &row.Payload)
		if approvedAt.Valid {
			v := approvedAt.Time
			row.ApprovedAt = &v
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Service) GetPlatformSecretRotationRequest(ctx context.Context, requestID string) (PlatformSecretRotationRequestRow, error) {
	rid, err := parseSecretRotationUUID(requestID)
	if err != nil {
		return PlatformSecretRotationRequestRow{}, err
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
			pa.approved_at
		FROM platform_action_approvals pa
		LEFT JOIN users req ON req.id = pa.requested_by
		LEFT JOIN users app ON app.id = pa.approved_by
		WHERE pa.action_type = 'secret_rotation'
		  AND pa.id = $1
		LIMIT 1
	`

	var row PlatformSecretRotationRequestRow
	var payloadRaw []byte
	var approvedAt pgtype.Timestamptz
	if err := s.db.QueryRow(ctx, query, rid).Scan(
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
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformSecretRotationRequestRow{}, ErrSecretRotationRequestNotFound
		}
		return PlatformSecretRotationRequestRow{}, err
	}
	_ = json.Unmarshal(payloadRaw, &row.Payload)
	if approvedAt.Valid {
		v := approvedAt.Time
		row.ApprovedAt = &v
	}
	return row, nil
}

func (s *Service) ReviewPlatformSecretRotationRequest(ctx context.Context, requestID string, params ReviewPlatformSecretRotationRequestParams) (PlatformSecretRotationRequestRow, error) {
	rid, err := parseSecretRotationUUID(requestID)
	if err != nil {
		return PlatformSecretRotationRequestRow{}, err
	}

	decision := strings.ToLower(strings.TrimSpace(params.Decision))
	if decision != "approve" && decision != "reject" {
		return PlatformSecretRotationRequestRow{}, ErrSecretRotationInvalidDecision
	}

	var reviewer pgtype.UUID
	_ = reviewer.Scan(strings.TrimSpace(params.ReviewedBy))

	const selectReq = `
		SELECT
			status,
			COALESCE(requested_by::text, '') AS requested_by,
			payload
		FROM platform_action_approvals
		WHERE id = $1
		  AND action_type = 'secret_rotation'
		LIMIT 1
	`
	var status string
	var requestedBy string
	var payloadRaw []byte
	if err := s.db.QueryRow(ctx, selectReq, rid).Scan(&status, &requestedBy, &payloadRaw); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformSecretRotationRequestRow{}, ErrSecretRotationRequestNotFound
		}
		return PlatformSecretRotationRequestRow{}, err
	}

	if !strings.EqualFold(status, "pending") {
		return PlatformSecretRotationRequestRow{}, ErrSecretRotationNotPending
	}
	if strings.EqualFold(strings.TrimSpace(requestedBy), strings.TrimSpace(params.ReviewedBy)) && decision == "approve" {
		return PlatformSecretRotationRequestRow{}, ErrSecretRotationSelfApproval
	}

	var payload PlatformSecretRotationPayload
	_ = json.Unmarshal(payloadRaw, &payload)
	payload.Notes = strings.TrimSpace(params.Notes)

	updateStatus := "rejected"
	if decision == "approve" {
		updateStatus = "approved"
		payload.ApprovedAt = time.Now().UTC().Format(time.RFC3339)
	}
	mergedRaw, err := json.Marshal(payload)
	if err != nil {
		return PlatformSecretRotationRequestRow{}, err
	}

	const update = `
		UPDATE platform_action_approvals
		SET status = $2,
		    approved_by = $3,
		    approved_at = NOW(),
		    payload = $4
		WHERE id = $1
		  AND action_type = 'secret_rotation'
	`
	if _, err := s.db.Exec(ctx, update, rid, updateStatus, reviewer, mergedRaw); err != nil {
		return PlatformSecretRotationRequestRow{}, err
	}
	return s.GetPlatformSecretRotationRequest(ctx, requestID)
}

func generateBase64Secret32() (string, string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", "", err
	}
	secret := base64.StdEncoding.EncodeToString(raw)
	sum := sha256.Sum256(raw)
	fingerprint := hex.EncodeToString(sum[:])
	return secret, fingerprint, nil
}

func (s *Service) ExecutePlatformSecretRotation(ctx context.Context, requestID string, params ExecutePlatformSecretRotationRequestParams) (ExecutePlatformSecretRotationResult, error) {
	rid, err := parseSecretRotationUUID(requestID)
	if err != nil {
		return ExecutePlatformSecretRotationResult{}, err
	}

	confirmation := strings.TrimSpace(params.Confirmation)
	if confirmation == "" {
		return ExecutePlatformSecretRotationResult{}, ErrSecretRotationConfirmationNeeded
	}

	var executor pgtype.UUID
	_ = executor.Scan(strings.TrimSpace(params.ExecutedBy))

	const selectReq = `
		SELECT status, payload
		FROM platform_action_approvals
		WHERE id = $1
		  AND action_type = 'secret_rotation'
		LIMIT 1
	`
	var status string
	var payloadRaw []byte
	if err := s.db.QueryRow(ctx, selectReq, rid).Scan(&status, &payloadRaw); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ExecutePlatformSecretRotationResult{}, ErrSecretRotationRequestNotFound
		}
		return ExecutePlatformSecretRotationResult{}, err
	}

	if strings.EqualFold(status, "executed") {
		return ExecutePlatformSecretRotationResult{}, ErrSecretRotationAlreadyExecuted
	}
	if !strings.EqualFold(status, "approved") {
		return ExecutePlatformSecretRotationResult{}, ErrSecretRotationNotApproved
	}

	var payload PlatformSecretRotationPayload
	_ = json.Unmarshal(payloadRaw, &payload)
	secretName, envVar, ok := normalizeSecretName(payload.SecretName)
	if !ok {
		return ExecutePlatformSecretRotationResult{}, ErrSecretRotationInvalidSecretName
	}
	payload.SecretName = secretName
	payload.EnvVar = envVar

	expected := "ROTATE " + strings.ToUpper(secretName)
	if confirmation != expected {
		return ExecutePlatformSecretRotationResult{}, ErrSecretRotationInvalidConfirmation
	}

	secret, fingerprint, err := generateBase64Secret32()
	if err != nil {
		return ExecutePlatformSecretRotationResult{}, err
	}

	payload.ExecutedAt = time.Now().UTC().Format(time.RFC3339)
	payload.GeneratedFormat = "base64_32_bytes"
	payload.GeneratedFingerprint = fingerprint

	mergedRaw, err := json.Marshal(payload)
	if err != nil {
		return ExecutePlatformSecretRotationResult{}, err
	}

	const update = `
		UPDATE platform_action_approvals
		SET status = 'executed',
		    approved_by = COALESCE(approved_by, $2),
		    payload = $3
		WHERE id = $1
		  AND action_type = 'secret_rotation'
	`
	if _, err := s.db.Exec(ctx, update, rid, executor, mergedRaw); err != nil {
		return ExecutePlatformSecretRotationResult{}, err
	}

	updated, _ := s.GetPlatformSecretRotationRequest(ctx, requestID)

	instructions := []string{
		"Update the backend environment variable " + envVar + " to start with this new secret (keep previous secrets for a grace window).",
		"Redeploy the API service so the new environment configuration takes effect.",
		"After the grace window, remove old secrets from " + envVar + " and redeploy again.",
	}
	if secretName == "data_encryption" {
		instructions = append(instructions, "Plan a controlled re-encryption job before removing old encryption keys.")
	}

	return ExecutePlatformSecretRotationResult{
		Request:         updated,
		GeneratedSecret: secret,
		EnvVar:          envVar,
		Instructions:    instructions,
	}, nil
}
