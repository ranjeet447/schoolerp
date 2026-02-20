package tenant

import (
	"fmt"
	"net"
	"regexp"
	"strings"
)

var (
	subdomainPattern = regexp.MustCompile(`^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$`)
	domainPattern    = regexp.MustCompile(`^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$`)
)

var reservedSubdomains = map[string]struct{}{
	"www":      {},
	"api":      {},
	"app":      {},
	"admin":    {},
	"platform": {},
	"system":   {},
	"mail":     {},
	"smtp":     {},
	"ftp":      {},
	"support":  {},
}

func normalizeSubdomain(raw string) (string, error) {
	subdomain := strings.ToLower(strings.TrimSpace(raw))
	if subdomain == "" {
		return "", fmt.Errorf("%w: subdomain is required", ErrInvalidTenant)
	}
	if !subdomainPattern.MatchString(subdomain) {
		return "", fmt.Errorf("%w: invalid subdomain format", ErrInvalidTenant)
	}
	if _, reserved := reservedSubdomains[subdomain]; reserved {
		return "", fmt.Errorf("%w: subdomain is reserved", ErrInvalidTenant)
	}
	return subdomain, nil
}

func normalizeDomain(raw string) (string, error) {
	domain := strings.ToLower(strings.TrimSpace(raw))
	if domain == "" {
		return "", nil
	}

	domain = strings.TrimPrefix(domain, "https://")
	domain = strings.TrimPrefix(domain, "http://")
	if slash := strings.IndexByte(domain, '/'); slash >= 0 {
		domain = domain[:slash]
	}
	if host, _, err := net.SplitHostPort(domain); err == nil {
		domain = host
	}
	domain = strings.TrimSuffix(domain, ".")

	if domain == "" || domain == "localhost" || net.ParseIP(domain) != nil {
		return "", fmt.Errorf("%w: invalid domain", ErrInvalidTenant)
	}
	if !domainPattern.MatchString(domain) {
		return "", fmt.Errorf("%w: invalid domain format", ErrInvalidTenant)
	}
	return domain, nil
}
