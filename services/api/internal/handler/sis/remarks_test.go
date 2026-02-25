package sis

import (
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

func mustUUID(t *testing.T, s string) pgtype.UUID {
	t.Helper()
	var u pgtype.UUID
	if err := u.Scan(s); err != nil {
		t.Fatalf("scan uuid %q: %v", s, err)
	}
	return u
}

func TestChildrenContainStudentID(t *testing.T) {
	childID := "11111111-1111-1111-1111-111111111111"
	children := []db.GetChildrenByParentUserRow{
		{ID: mustUUID(t, childID)},
		{ID: mustUUID(t, "22222222-2222-2222-2222-222222222222")},
	}

	if !childrenContainStudentID(children, childID) {
		t.Fatalf("expected child id to be found")
	}
	if childrenContainStudentID(children, "33333333-3333-3333-3333-333333333333") {
		t.Fatalf("expected unknown child id to be rejected")
	}
	if childrenContainStudentID(children, "not-a-uuid") {
		t.Fatalf("expected invalid child id to be rejected")
	}
}

func TestRemarksContainID(t *testing.T) {
	remarkID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	remarks := []db.ListStudentRemarksRow{
		{ID: mustUUID(t, remarkID)},
		{ID: mustUUID(t, "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")},
	}

	if !remarksContainID(remarks, remarkID) {
		t.Fatalf("expected remark id to be found")
	}
	if remarksContainID(remarks, "cccccccc-cccc-cccc-cccc-cccccccccccc") {
		t.Fatalf("expected unknown remark id to be rejected")
	}
	if remarksContainID(remarks, "bad") {
		t.Fatalf("expected invalid remark id to be rejected")
	}
}
