package main

import (
"context"
"fmt"
"io"
"net/http"
"os"
"time"

"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/schoolerp?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		fmt.Printf("Error connecting to DB: %v\n", err)
		return
	}
	defer pool.Close()

	var tenantID, sectionID, userID string
	pool.QueryRow(ctx, "SELECT id FROM tenants LIMIT 1").Scan(&tenantID)
	pool.QueryRow(ctx, "SELECT id FROM users LIMIT 1").Scan(&userID)
	pool.QueryRow(ctx, "SELECT class_section_id FROM attendance_sessions WHERE tenant_id = $1 ORDER BY updated_at DESC LIMIT 1", tenantID).Scan(&sectionID)

	month := time.Now().Format("2006-01")
	url := fmt.Sprintf("http://localhost:8080/v1/admin/attendance/monthly-summary?class_section_id=%s&month=%s", sectionID, month)
	
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("X-Tenant-ID", tenantID)
	req.Header.Set("X-User-ID", userID)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("HTTP Error: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Status: %d\n", resp.StatusCode)
	fmt.Printf("Response Body:\n%s\n", string(body))
}
