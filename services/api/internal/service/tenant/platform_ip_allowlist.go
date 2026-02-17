package tenant

import (
	"context"
	"errors"
	"net/netip"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

var (
	ErrInvalidAllowlistID = errors.New("invalid allowlist id")
	ErrInvalidCIDRBlock   = errors.New("invalid cidr block")
)

type PlatformIPAllowlistEntry struct {
	ID          string `json:"id"`
	RoleName    string `json:"role_name"`
	CIDRBlock   string `json:"cidr_block"`
	Description string `json:"description,omitempty"`
	CreatedBy   string `json:"created_by,omitempty"`
	CreatedAt   string `json:"created_at"`
}

type CreatePlatformIPAllowlistParams struct {
	RoleName    string `json:"role_name"`
	CIDRBlock   string `json:"cidr_block"`
	Description string `json:"description"`
	CreatedBy   string `json:"-"`
}

func (s *Service) ListPlatformIPAllowlist(ctx context.Context, roleName string) ([]PlatformIPAllowlistEntry, error) {
	tenantID, err := ensureSystemTenantID(ctx, s.db)
	if err != nil {
		return nil, err
	}

	rows, err := s.q.ListIPAllowlists(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	roleFilter := strings.ToLower(strings.TrimSpace(roleName))
	out := make([]PlatformIPAllowlistEntry, 0)
	for _, row := range rows {
		if roleFilter != "" && strings.ToLower(strings.TrimSpace(row.RoleName)) != roleFilter {
			continue
		}
		out = append(out, mapIPAllowlistRow(row))
	}
	return out, nil
}

func (s *Service) CreatePlatformIPAllowlist(ctx context.Context, params CreatePlatformIPAllowlistParams) (PlatformIPAllowlistEntry, error) {
	roleName := strings.ToLower(strings.TrimSpace(params.RoleName))
	if !isValidPlatformRoleCode(roleName) {
		return PlatformIPAllowlistEntry{}, ErrPlatformRoleNotAllowed
	}

	cidrRaw := strings.TrimSpace(params.CIDRBlock)
	if cidrRaw == "" {
		return PlatformIPAllowlistEntry{}, ErrInvalidCIDRBlock
	}

	prefix, err := netip.ParsePrefix(cidrRaw)
	if err != nil {
		addr, parseErr := netip.ParseAddr(cidrRaw)
		if parseErr != nil {
			return PlatformIPAllowlistEntry{}, ErrInvalidCIDRBlock
		}
		prefix = netip.PrefixFrom(addr, addr.BitLen())
	}

	tenantID, err := ensureSystemTenantID(ctx, s.db)
	if err != nil {
		return PlatformIPAllowlistEntry{}, err
	}

	var createdBy pgtype.UUID
	_ = createdBy.Scan(strings.TrimSpace(params.CreatedBy))

	created, err := s.q.CreateIPAllowlist(ctx, db.CreateIPAllowlistParams{
		TenantID:    tenantID,
		RoleName:    roleName,
		CidrBlock:   prefix,
		Description: pgtype.Text{String: strings.TrimSpace(params.Description), Valid: strings.TrimSpace(params.Description) != ""},
		CreatedBy:   createdBy,
	})
	if err != nil {
		return PlatformIPAllowlistEntry{}, err
	}
	return mapIPAllowlistRow(created), nil
}

func (s *Service) DeletePlatformIPAllowlist(ctx context.Context, allowlistID string) error {
	var id pgtype.UUID
	if err := id.Scan(strings.TrimSpace(allowlistID)); err != nil || !id.Valid {
		return ErrInvalidAllowlistID
	}

	tenantID, err := ensureSystemTenantID(ctx, s.db)
	if err != nil {
		return err
	}

	return s.q.DeleteIPAllowlist(ctx, db.DeleteIPAllowlistParams{ID: id, TenantID: tenantID})
}

func mapIPAllowlistRow(row db.IpAllowlist) PlatformIPAllowlistEntry {
	entry := PlatformIPAllowlistEntry{
		ID:        row.ID.String(),
		RoleName:  strings.TrimSpace(row.RoleName),
		CIDRBlock: row.CidrBlock.String(),
		CreatedAt: row.CreatedAt.Time.UTC().Format("2006-01-02T15:04:05Z07:00"),
	}
	if row.Description.Valid {
		entry.Description = strings.TrimSpace(row.Description.String)
	}
	if row.CreatedBy.Valid {
		entry.CreatedBy = row.CreatedBy.String()
	}
	return entry
}
