package tenant

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
)

func (s *Service) updateTenantDomainMapping(ctx context.Context, tenantID string, params DomainMappingParams) (PlatformTenant, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return PlatformTenant{}, err
	}

	t, err := s.q.GetTenantByID(ctx, tid)
	if err != nil {
		return PlatformTenant{}, err
	}

	config := tenantConfigMap(t.Config)
	domain, err := normalizeDomain(params.Domain)
	if err != nil {
		return PlatformTenant{}, err
	}

	// Clearing custom-domain mapping.
	if domain == "" {
		delete(config, "cname_target")
		delete(config, "ssl_status")
		delete(config, "domain_verified")
		delete(config, "domain_verification_status")
		delete(config, "domain_verification_token")
		delete(config, "domain_verified_at")
		delete(config, "domain_verification_last_checked_at")
		delete(config, "domain_verification_error")

		configJSON, err := json.Marshal(config)
		if err != nil {
			return PlatformTenant{}, err
		}

		if _, err := s.db.Exec(
			ctx,
			`UPDATE tenants SET domain = NULL, config = $2, updated_at = NOW() WHERE id = $1`,
			tid,
			configJSON,
		); err != nil {
			return PlatformTenant{}, err
		}
		return s.GetPlatformTenant(ctx, tenantID)
	}

	if !tenantWhiteLabelEnabled(config) {
		return PlatformTenant{}, ErrWhiteLabelRequired
	}

	cnameTarget, err := normalizedCnameTarget(params.CnameTarget, t.Subdomain)
	if err != nil {
		return PlatformTenant{}, err
	}

	currentDomain := strings.TrimSpace(strings.ToLower(t.Domain.String))
	domainChanged := currentDomain != domain

	config["cname_target"] = cnameTarget
	if domainChanged {
		config["domain_verified"] = false
		config["domain_verification_status"] = "pending"
		config["ssl_status"] = "pending"
		config["domain_verified_at"] = ""
		config["domain_verification_error"] = ""
		config["domain_verification_token"] = newDomainVerificationToken(tenantID)
	}

	// Allow explicit status updates from platform operations UI, but validate values.
	status := strings.TrimSpace(strings.ToLower(params.SslStatus))
	if status != "" {
		switch status {
		case "pending", "provisioning", "active", "failed":
			config["ssl_status"] = status
		default:
			return PlatformTenant{}, fmt.Errorf("%w: unsupported ssl_status", ErrInvalidTenant)
		}
	}

	configJSON, err := json.Marshal(config)
	if err != nil {
		return PlatformTenant{}, err
	}

	if _, err := s.db.Exec(
		ctx,
		`UPDATE tenants SET domain = $2, config = $3, updated_at = NOW() WHERE id = $1`,
		tid,
		domain,
		configJSON,
	); err != nil {
		return PlatformTenant{}, err
	}

	return s.GetPlatformTenant(ctx, tenantID)
}

func (s *Service) VerifyTenantDomainMapping(ctx context.Context, tenantID string) (PlatformTenant, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return PlatformTenant{}, err
	}

	t, err := s.q.GetTenantByID(ctx, tid)
	if err != nil {
		return PlatformTenant{}, err
	}

	domain := strings.TrimSpace(strings.ToLower(t.Domain.String))
	if domain == "" {
		return PlatformTenant{}, fmt.Errorf("%w: custom domain is not set", ErrInvalidTenant)
	}

	config := tenantConfigMap(t.Config)
	cnameTarget, err := normalizedCnameTarget(asString(config["cname_target"]), t.Subdomain)
	if err != nil {
		return PlatformTenant{}, err
	}

	token := strings.TrimSpace(asString(config["domain_verification_token"]))
	if token == "" {
		token = newDomainVerificationToken(tenantID)
		config["domain_verification_token"] = token
	}

	txtHost := "_schoolerp-verify." + domain
	txtOK := verifyTXTRecord(txtHost, token)
	routeOK := verifyRoutingRecord(domain, cnameTarget)
	verified := txtOK && routeOK

	config["domain_verified"] = verified
	config["domain_verification_last_checked_at"] = time.Now().UTC().Format(time.RFC3339)
	if verified {
		config["domain_verification_status"] = "verified"
		config["domain_verified_at"] = time.Now().UTC().Format(time.RFC3339)
		config["domain_verification_error"] = ""
		if strings.TrimSpace(asString(config["ssl_status"])) == "" {
			config["ssl_status"] = "pending"
		}
	} else {
		config["domain_verification_status"] = "pending"
		config["domain_verified_at"] = ""
		if !txtOK && !routeOK {
			config["domain_verification_error"] = "missing DNS TXT verification record and routing record"
		} else if !txtOK {
			config["domain_verification_error"] = "missing DNS TXT verification record"
		} else {
			config["domain_verification_error"] = "routing record does not point to expected target"
		}
	}

	configJSON, err := json.Marshal(config)
	if err != nil {
		return PlatformTenant{}, err
	}

	if _, err := s.db.Exec(ctx, `UPDATE tenants SET config = $2, updated_at = NOW() WHERE id = $1`, tid, configJSON); err != nil {
		return PlatformTenant{}, err
	}

	updated, err := s.GetPlatformTenant(ctx, tenantID)
	if err != nil {
		return PlatformTenant{}, err
	}
	if !verified {
		return updated, ErrDomainVerificationFail
	}
	return updated, nil
}

func (s *Service) ProvisionTenantDomainSSL(ctx context.Context, tenantID string, forceRenew bool) (PlatformTenant, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return PlatformTenant{}, err
	}

	t, err := s.q.GetTenantByID(ctx, tid)
	if err != nil {
		return PlatformTenant{}, err
	}

	if strings.TrimSpace(t.Domain.String) == "" {
		return PlatformTenant{}, fmt.Errorf("%w: custom domain is not set", ErrInvalidTenant)
	}

	config := tenantConfigMap(t.Config)
	if !asBool(config["domain_verified"]) {
		return PlatformTenant{}, ErrDomainNotVerified
	}

	config["ssl_status"] = "provisioning"
	provider := strings.ToLower(strings.TrimSpace(os.Getenv("TENANT_DOMAIN_SSL_PROVIDER")))
	if provider == "" {
		provider = "manual"
	}

	switch provider {
	case "manual", "edge_auto":
		config["ssl_status"] = "active"
		config["ssl_last_issued_at"] = time.Now().UTC().Format(time.RFC3339)
		if forceRenew {
			config["ssl_last_renewed_at"] = time.Now().UTC().Format(time.RFC3339)
		}
	case "noop":
		// Leave as provisioning for external/manual completion.
	default:
		return PlatformTenant{}, ErrSSLProviderMissing
	}

	configJSON, err := json.Marshal(config)
	if err != nil {
		return PlatformTenant{}, err
	}
	if _, err := s.db.Exec(ctx, `UPDATE tenants SET config = $2, updated_at = NOW() WHERE id = $1`, tid, configJSON); err != nil {
		return PlatformTenant{}, err
	}

	return s.GetPlatformTenant(ctx, tenantID)
}

func tenantConfigMap(configJSON []byte) map[string]interface{} {
	config := map[string]interface{}{}
	if len(configJSON) > 0 {
		_ = json.Unmarshal(configJSON, &config)
	}
	return config
}

func tenantWhiteLabelEnabled(config map[string]interface{}) bool {
	return asBool(config["white_label"])
}

func normalizedCnameTarget(raw, fallbackSubdomain string) (string, error) {
	target := strings.TrimSpace(raw)
	if target == "" {
		baseDomain := strings.TrimSpace(os.Getenv("TENANT_CNAME_BASE_DOMAIN"))
		if baseDomain == "" {
			baseDomain = "app.schoolerp.com"
		}
		target = fmt.Sprintf("%s.%s", strings.TrimSpace(fallbackSubdomain), strings.TrimPrefix(baseDomain, "."))
	}
	normalized, err := normalizeDomain(target)
	if err != nil {
		return "", err
	}
	return normalized, nil
}

func newDomainVerificationToken(tenantID string) string {
	token := strings.ReplaceAll(strings.ToLower(strings.TrimSpace(tenantID)), "-", "")
	if len(token) > 12 {
		token = token[:12]
	}
	if token == "" {
		token = uuid.NewString()[:12]
	}
	return "schoolerp-tenant-" + token
}

func asString(v interface{}) string {
	switch typed := v.(type) {
	case string:
		return strings.TrimSpace(typed)
	default:
		return ""
	}
}

func asBool(v interface{}) bool {
	switch typed := v.(type) {
	case bool:
		return typed
	case string:
		return strings.EqualFold(strings.TrimSpace(typed), "true")
	default:
		return false
	}
}

func verifyTXTRecord(host, expectedToken string) bool {
	txtRecords, err := net.LookupTXT(host)
	if err != nil {
		return false
	}
	expected := strings.TrimSpace(strings.ToLower(expectedToken))
	for _, record := range txtRecords {
		if strings.TrimSpace(strings.ToLower(record)) == expected {
			return true
		}
	}
	return false
}

func verifyRoutingRecord(domain, expectedCNAME string) bool {
	normalize := func(v string) string {
		return strings.TrimSuffix(strings.TrimSpace(strings.ToLower(v)), ".")
	}
	expected := normalize(expectedCNAME)

	cname, err := net.LookupCNAME(domain)
	if err == nil && normalize(cname) == expected {
		return true
	}

	// Apex domains may use ALIAS/ANAME -> A record fallback.
	ips, err := net.LookupHost(domain)
	if err != nil || len(ips) == 0 {
		return false
	}

	allowed := parseAllowedARecordTargets()
	if len(allowed) == 0 {
		return strings.EqualFold(strings.TrimSpace(os.Getenv("TENANT_DOMAIN_ALLOW_ANY_A")), "true")
	}
	for _, ip := range ips {
		if _, ok := allowed[strings.TrimSpace(ip)]; ok {
			return true
		}
	}
	return false
}

func parseAllowedARecordTargets() map[string]struct{} {
	raw := strings.TrimSpace(os.Getenv("TENANT_DOMAIN_A_TARGETS"))
	if raw == "" {
		return map[string]struct{}{}
	}
	out := map[string]struct{}{}
	for _, part := range strings.Split(raw, ",") {
		ip := strings.TrimSpace(part)
		if ip == "" {
			continue
		}
		out[ip] = struct{}{}
	}
	return out
}
