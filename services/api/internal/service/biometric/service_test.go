package biometric

import (
	"testing"
	"time"
)

func TestBiometricAttendanceSQLIncludesIdempotentClauses(t *testing.T) {
	if !hasSQLFragment(studentAttendanceUpsertSQL, "on conflict (session_id, student_id)") {
		t.Fatalf("student attendance SQL must upsert by session/student for duplicate punches")
	}
	if !hasSQLFragment(studentAttendanceUpsertSQL, "do update set status = 'present'") {
		t.Fatalf("student attendance SQL must preserve idempotent present state")
	}
	if !hasSQLFragment(staffAttendanceCheckInSQL, "least(staff_attendance.check_in, $3)") {
		t.Fatalf("staff check-in SQL must keep earliest punch (clock drift protection)")
	}
	if !hasSQLFragment(staffAttendanceCheckOutSQL, "greatest(check_out, $3)") {
		t.Fatalf("staff check-out SQL must keep latest punch (clock drift protection)")
	}
}

func TestDeviceOnlineStatus(t *testing.T) {
	now := time.Date(2026, 2, 26, 12, 0, 0, 0, time.UTC)
	if got := deviceOnlineStatus(now, now.Add(-9*time.Minute)); got != "online" {
		t.Fatalf("expected online, got %q", got)
	}
	if got := deviceOnlineStatus(now, now.Add(-11*time.Minute)); got != "offline" {
		t.Fatalf("expected offline, got %q", got)
	}
}

func TestIfString(t *testing.T) {
	if got := ifString(true, "a", "b"); got != "a" {
		t.Fatalf("expected a, got %#v", got)
	}
	if got := ifString(false, "a", "b"); got != "b" {
		t.Fatalf("expected b, got %#v", got)
	}
}
