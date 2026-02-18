package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Println("DATABASE_URL is not set")
		os.Exit(1)
	}

	ctx := context.Background()
	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		fmt.Printf("Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)

	queries := []struct {
		name string
		sql  string
	}{
		{"Platform Plans", "SELECT COUNT(*) FROM platform_plans"},
		{"Tenants", "SELECT COUNT(*) FROM tenants"},
		{"Subscriptions", "SELECT COUNT(*) FROM tenant_subscriptions"},
		{"Support Tickets", "SELECT COUNT(*) FROM support_tickets"},
		{"Signup Requests", "SELECT COUNT(*) FROM tenant_signup_requests"},
		{"Platform Settings", "SELECT COUNT(*) FROM platform_settings"},
		{"Users", "SELECT COUNT(*) FROM users"},
		{"SaaS Admin User", "SELECT COUNT(*) FROM users WHERE email = 'saas_admin@schoolerp.com'"},
		{"Role Assignments", "SELECT COUNT(*) FROM role_assignments"},
		{"Super Admin Assignments", "SELECT COUNT(*) FROM role_assignments ra JOIN roles r ON r.id = ra.role_id WHERE r.code = 'super_admin'"},
		{"Platform Permissions", "SELECT COUNT(*) FROM permissions WHERE code LIKE 'platform:%'"},
		{"Super Admin Platform Perms", "SELECT COUNT(*) FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id WHERE r.code = 'super_admin' AND p.code LIKE 'platform:%'"},
		{"Active Sessions", "SELECT COUNT(*) FROM sessions WHERE expires_at > NOW()"},
	}

	fmt.Println("=== SEED DATA VERIFICATION ===")
	for _, q := range queries {
		var count int64
		err := conn.QueryRow(ctx, q.sql).Scan(&count)
		if err != nil {
			fmt.Printf("%-25s: ERROR (%v)\n", q.name, err)
		} else {
			fmt.Printf("%-25s: %d rows\n", q.name, count)
		}
	}
	fmt.Println("==============================")
}
