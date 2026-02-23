package middleware

import "testing"

func TestIsPublicAuthPath(t *testing.T) {
	tests := []struct {
		path string
		want bool
	}{
		{"/v1/auth/login", true},
		{"/v1/auth/forgot-password", true},
		{"/v1/auth/legal/docs", true},
		{"/v1/auth/legal/accept", true},
		{"/v1/auth/request-otp", true},
		{"/v1/auth/me", false},
		{"/v1/auth/mfa/setup", false},
	}

	for _, tt := range tests {
		if got := isPublicAuthPath(tt.path); got != tt.want {
			t.Fatalf("isPublicAuthPath(%q) = %v, want %v", tt.path, got, tt.want)
		}
	}
}

func TestIsProtectedAPIPath(t *testing.T) {
	tests := []struct {
		path string
		want bool
	}{
		{"/v1/admin/students", true},
		{"/v1/teacher/attendance", true},
		{"/v1/parent/notices", true},
		{"/v1/student/dashboard", true},
		{"/v1/accountant/fees", true},
		{"/v1/auth/me", true},
		{"/v1/auth/mfa/setup", true},
		{"/v1/auth/login", false},
		{"/v1/public/contact", false},
	}

	for _, tt := range tests {
		if got := isProtectedAPIPath(tt.path); got != tt.want {
			t.Fatalf("isProtectedAPIPath(%q) = %v, want %v", tt.path, got, tt.want)
		}
	}
}
