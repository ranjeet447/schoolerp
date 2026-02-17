package security

import (
	"os"
	"strings"
)

// ResolveJWTSecrets returns a list of secrets that can be used to validate JWTs.
// Order matters: the first secret should be used for signing new tokens.
//
// Supported env vars:
// - JWT_SECRETS: comma-separated list of secrets (preferred for rotation)
// - JWT_SECRET: single secret (legacy)
//
// In non-production environments, falls back to a default dev secret when none is configured.
func ResolveJWTSecrets() ([]string, bool) {
	rawList := strings.TrimSpace(os.Getenv("JWT_SECRETS"))
	secrets := make([]string, 0, 3)
	if rawList != "" {
		for _, part := range strings.Split(rawList, ",") {
			secret := strings.TrimSpace(part)
			if secret != "" {
				secrets = append(secrets, secret)
			}
		}
	}

	if len(secrets) == 0 {
		if legacy := strings.TrimSpace(os.Getenv("JWT_SECRET")); legacy != "" {
			secrets = append(secrets, legacy)
		}
	}

	if len(secrets) == 0 {
		if !strings.EqualFold(strings.TrimSpace(os.Getenv("ENV")), "production") {
			return []string{"default-dev-secret"}, true
		}
		return nil, false
	}

	return secrets, true
}
