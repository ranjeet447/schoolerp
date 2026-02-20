package automation

import (
	"testing"
	"time"
)

func TestIsValidCronExpression(t *testing.T) {
	tests := []struct {
		expr  string
		valid bool
	}{
		{expr: "*/5 * * * *", valid: true},
		{expr: "0 9 * * mon-fri", valid: true},
		{expr: "0 0 1 * *", valid: true},
		{expr: "* * *", valid: false},
		{expr: "60 * * * *", valid: false},
		{expr: "0 0 * foo *", valid: false},
	}

	for _, tt := range tests {
		if got := isValidCronExpression(tt.expr); got != tt.valid {
			t.Fatalf("isValidCronExpression(%q) = %v, want %v", tt.expr, got, tt.valid)
		}
	}
}

func TestShouldRunNow(t *testing.T) {
	now := time.Date(2026, time.February, 20, 9, 30, 0, 0, time.UTC) // Friday

	if !shouldRunNow("30 9 * * fri", now) {
		t.Fatalf("expected friday schedule to match")
	}
	if shouldRunNow("31 9 * * fri", now) {
		t.Fatalf("did not expect minute-mismatch schedule to match")
	}
	if shouldRunNow("30 9 * * thu", now) {
		t.Fatalf("did not expect weekday-mismatch schedule to match")
	}
}
