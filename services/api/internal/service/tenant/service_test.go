package tenant

import (
	"encoding/json"
	"testing"
)

func tenantConfigBytes(t *testing.T, cfg map[string]any) []byte {
	t.Helper()
	raw, err := json.Marshal(cfg)
	if err != nil {
		t.Fatalf("marshal config: %v", err)
	}
	return raw
}

func TestDecodeTenantPreferencesReadsHideAdvancedModules(t *testing.T) {
	prefs := decodeTenantPreferences(tenantConfigBytes(t, map[string]any{
		"ui": map[string]any{
			"hide_advanced_modules": true,
		},
	}))

	if !prefs.UI.HideAdvancedModules {
		t.Fatalf("expected hide_advanced_modules=true, got false")
	}
}

func TestMergeTenantPreferencesPersistsAndPreservesExistingConfig(t *testing.T) {
	merged, err := mergeTenantPreferences(
		tenantConfigBytes(t, map[string]any{
			"branding": map[string]any{
				"name_override": "My School",
			},
			"ui": map[string]any{
				"hide_advanced_modules": false,
			},
		}),
		TenantPreferences{
			UI: TenantUIPreferences{HideAdvancedModules: true},
		},
	)
	if err != nil {
		t.Fatalf("mergeTenantPreferences failed: %v", err)
	}

	var stored map[string]any
	if err := json.Unmarshal(merged, &stored); err != nil {
		t.Fatalf("unmarshal updated config: %v", err)
	}

	uiCfg, _ := stored["ui"].(map[string]any)
	if hidden, _ := uiCfg["hide_advanced_modules"].(bool); !hidden {
		t.Fatalf("expected stored ui.hide_advanced_modules=true, got %#v", stored["ui"])
	}

	brandingCfg, _ := stored["branding"].(map[string]any)
	if brandingCfg["name_override"] != "My School" {
		t.Fatalf("expected branding.name_override to be preserved, got %#v", brandingCfg["name_override"])
	}
}
