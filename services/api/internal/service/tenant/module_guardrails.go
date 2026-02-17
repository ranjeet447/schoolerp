package tenant

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

func criticalModulesSet() map[string]struct{} {
	configured := strings.TrimSpace(os.Getenv("PLATFORM_CRITICAL_MODULES"))
	if configured == "" {
		configured = "attendance,fees"
	}

	out := map[string]struct{}{}
	for _, raw := range strings.Split(configured, ",") {
		key := strings.ToLower(strings.TrimSpace(raw))
		if key == "" {
			continue
		}
		out[key] = struct{}{}
	}
	return out
}

func ensureCriticalModulesEnabled(modules map[string]interface{}) error {
	if modules == nil {
		return nil
	}

	critical := criticalModulesSet()
	for key, value := range modules {
		moduleKey := strings.ToLower(strings.TrimSpace(key))
		if moduleKey == "" {
			continue
		}
		if _, locked := critical[moduleKey]; !locked {
			continue
		}

		enabled, isBool := parseModuleEnabled(value)
		if isBool && !enabled {
			return fmt.Errorf("%w: %s", ErrCriticalModuleLocked, moduleKey)
		}
	}
	return nil
}

func parseModuleEnabled(value interface{}) (bool, bool) {
	switch typed := value.(type) {
	case bool:
		return typed, true
	case string:
		raw := strings.TrimSpace(strings.ToLower(typed))
		if raw == "true" {
			return true, true
		}
		if raw == "false" {
			return false, true
		}
		return false, false
	case float64:
		return typed != 0, true
	case int:
		return typed != 0, true
	case int64:
		return typed != 0, true
	case map[string]interface{}:
		if nested, ok := typed["enabled"]; ok {
			return parseModuleEnabled(nested)
		}
		return false, false
	default:
		raw := strings.TrimSpace(strings.ToLower(fmt.Sprintf("%v", typed)))
		if raw == "" {
			return false, false
		}
		if parsed, err := strconv.ParseBool(raw); err == nil {
			return parsed, true
		}
		return false, false
	}
}
