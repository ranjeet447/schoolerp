package auth

import (
	"context"
	"fmt"
	"net/netip"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type IPGuard struct {
	q db.Querier
}

func NewIPGuard(q db.Querier) *IPGuard {
	return &IPGuard{q: q}
}

// CreateAllowlistEntry adds a new IP range to the allowlist.
func (g *IPGuard) CreateAllowlistEntry(ctx context.Context, tenantID, roleName, cidr, desc, createdBy string) (db.IpAllowlist, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(createdBy)

	// Validate CIDR using netip
	prefix, err := netip.ParsePrefix(cidr)
	if err != nil {
		// Try parsing as single IP
		addr, err := netip.ParseAddr(cidr)
		if err == nil {
			// Convert single IP to /32 or /128
			prefix = netip.PrefixFrom(addr, addr.BitLen())
		} else {
			return db.IpAllowlist{}, fmt.Errorf("invalid CIDR or IP address: %s", cidr)
		}
	}
	
	entry, err := g.q.CreateIPAllowlist(ctx, db.CreateIPAllowlistParams{
		TenantID:    tUUID,
		RoleName:    roleName,
		CidrBlock:   prefix,
		Description: pgtype.Text{String: desc, Valid: desc != ""},
		CreatedBy:   uUUID,
	})
	if err != nil {
		return db.IpAllowlist{}, err
	}

	return entry, nil
}

// CheckIPAccess checks if an IP is allowed for a user.
func (g *IPGuard) CheckIPAccess(ctx context.Context, tenantID, roleName, ipStr string) (bool, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	addr, err := netip.ParseAddr(ipStr)
	if err != nil {
		return false, fmt.Errorf("invalid IP address: %s", ipStr)
	}

	// 1. Check if specific allow rule matches
	allowed, err := g.q.CheckIPAllowlist(ctx, db.CheckIPAllowlistParams{
		TenantID: tUUID,
		RoleName: roleName,
		Ip:       addr,
	})
	if err != nil {
		return false, err
	}
	if allowed {
		return true, nil
	}

	// 2. Check if ANY rules exist for this tenant+role
	rules, err := g.q.ListIPAllowlists(ctx, tUUID)
	if err != nil {
		return false, err
	}
	
	roleHasRules := false
	for _, r := range rules {
		if r.RoleName == roleName {
			roleHasRules = true
			break
		}
	}

	if !roleHasRules {
		return true, nil // No rules = Open access
	}

	return false, nil // Rules exist but didn't match -> Deny
}
