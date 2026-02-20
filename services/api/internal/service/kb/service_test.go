package kb

import (
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

func TestChunkTextProducesOverlappingChunks(t *testing.T) {
	input := ""
	for i := 0; i < 120; i++ {
		input += "knowledgebase-content-"
	}

	chunks := chunkText(input, 80, 10)
	if len(chunks) < 2 {
		t.Fatalf("expected multiple chunks, got %d", len(chunks))
	}
	for i, c := range chunks {
		if c == "" {
			t.Fatalf("chunk %d is empty", i)
		}
	}
}

func TestEvaluateSearchAccess(t *testing.T) {
	settings := db.TenantKbSetting{
		Enabled:       true,
		AllowedRoles:  []string{"tenant_admin", "teacher", "parent", "student"},
		AllowParents:  true,
		AllowStudents: false,
	}

	vis, err := evaluateSearchAccess(settings, "teacher")
	if err != nil {
		t.Fatalf("teacher should be allowed: %v", err)
	}
	if len(vis) != 1 || vis[0] != "internal" {
		t.Fatalf("teacher visibility mismatch: %#v", vis)
	}

	vis, err = evaluateSearchAccess(settings, "parent")
	if err != nil {
		t.Fatalf("parent should be allowed: %v", err)
	}
	if len(vis) != 1 || vis[0] != "parents" {
		t.Fatalf("parent visibility mismatch: %#v", vis)
	}

	_, err = evaluateSearchAccess(settings, "student")
	if err == nil {
		t.Fatal("expected student to be blocked when allow_students=false")
	}

	vis, err = evaluateSearchAccess(settings, "super_admin")
	if err != nil {
		t.Fatalf("super_admin should bypass: %v", err)
	}
	if len(vis) != 3 {
		t.Fatalf("super_admin should see all visibilities, got %#v", vis)
	}
}

func TestMapSettingsDefaultsRoles(t *testing.T) {
	mapped := mapSettings(db.TenantKbSetting{
		Enabled:       false,
		AllowedRoles:  nil,
		AllowParents:  false,
		AllowStudents: false,
		TenantID:      pgtype.UUID{},
	})
	if len(mapped.AllowedRoles) == 0 {
		t.Fatal("expected default allowed roles")
	}
}
