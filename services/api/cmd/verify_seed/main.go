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
		Label string
		SQL   string
	}{
		{"Platform Plans", "SELECT COUNT(*) FROM platform_plans"},
		{"Tenants", "SELECT COUNT(*) FROM tenants"},
		{"Subscriptions", "SELECT COUNT(*) FROM tenant_subscriptions"},
		{"Support Tickets", "SELECT COUNT(*) FROM support_tickets"},
		{"Signup Requests", "SELECT COUNT(*) FROM tenant_signup_requests"},
		{"Platform Settings", "SELECT COUNT(*) FROM platform_settings"},
	}

	fmt.Println("=== SEED DATA VERIFICATION ===")
	for _, q := range queries {
		var count int64
		err := conn.QueryRow(ctx, q.SQL).Scan(&count)
		if err != nil {
			fmt.Printf("%-20s: ERROR (%v)\n", q.Label, err)
		} else {
			fmt.Printf("%-20s: %d rows\n", q.Label, count)
		}
	}
	fmt.Println("==============================")
}
