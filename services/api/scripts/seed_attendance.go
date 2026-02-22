package main

import (
"context"
"fmt"
"os"

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
		fmt.Printf("Error connecting to database: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()

	// 1. Get Tenant
	var tenantID string
	err = pool.QueryRow(ctx, "SELECT id FROM tenants LIMIT 1").Scan(&tenantID)
	if err != nil {
		fmt.Printf("Error getting tenant: %v\n", err)
		return
	}

	// 2. Get Section
	var sectionID string
	err = pool.QueryRow(ctx, `
		SELECT s.id 
		FROM sections s
		JOIN students st ON st.section_id = s.id
		WHERE s.tenant_id = $1 AND st.status = 'active'
		GROUP BY s.id
		HAVING COUNT(st.id) > 0
		LIMIT 1
	`, tenantID).Scan(&sectionID)
	if err != nil {
		fmt.Printf("Error getting section: %v\n", err)
		return
	}

	// 3. Get User
	var userID string
	err = pool.QueryRow(ctx, "SELECT id FROM users LIMIT 1").Scan(&userID)
	if err != nil {
		fmt.Printf("Error getting user: %v\n", err)
		return
	}

	fmt.Printf("Tenant: %s, Section: %s, User: %s\n", tenantID, sectionID, userID)

	// 4. Create Session
	var sessionID string
	err = pool.QueryRow(ctx, `
		INSERT INTO attendance_sessions (tenant_id, class_section_id, date, marked_by)
		VALUES ($1, $2, CURRENT_DATE, $3)
		ON CONFLICT (class_section_id, date) DO UPDATE SET updated_at = NOW()
		RETURNING id
	`, tenantID, sectionID, userID).Scan(&sessionID)
	if err != nil {
		fmt.Printf("Error creating session: %v\n", err)
		return
	}

	// 5. Delete old entries
	_, err = pool.Exec(ctx, "DELETE FROM attendance_entries WHERE session_id = $1", sessionID)
	
	// 6. Get students
	rows, err := pool.Query(ctx, "SELECT id FROM students WHERE section_id = $1 AND status = 'active'", sectionID)
	if err != nil {
		fmt.Printf("Error getting students: %v\n", err)
		return
	}
	defer rows.Close()

	var studentIDs []string
	for rows.Next() {
		var id string
		rows.Scan(&id)
		studentIDs = append(studentIDs, id)
	}

	// 7. Insert attendance
	for i, sid := range studentIDs {
		status := "present"
		if i == 1 { status = "absent" }
		if i == 2 { status = "late" }
		
		_, err = pool.Exec(ctx, "INSERT INTO attendance_entries (session_id, student_id, status) VALUES ($1, $2, $3)", sessionID, sid, status)
		if err != nil {
			fmt.Printf("Error inserting attendance for student %s: %v\n", sid, err)
		}
	}

	fmt.Printf("Successfully marked attendance for %d students in section %s\n", len(studentIDs), sectionID)
}
