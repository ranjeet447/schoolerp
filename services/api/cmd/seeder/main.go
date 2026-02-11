package main

import (
	"context"
	"fmt"
	"os"
	"strings"

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

	sqlFile := "infra/migrations/seed_users.sql"
	content, err := os.ReadFile(sqlFile)
	if err != nil {
		fmt.Printf("Unable to read seed file: %v\n", err)
		os.Exit(1)
	}

	// Split by semicolon and run each statement
	// Note: This is a simple split, might fail on complex SQL (like functions or trigers)
	// but seed_users.sql is mostly INSERTs.
	statements := strings.Split(string(content), ";")

	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}

		_, err := conn.Exec(ctx, stmt)
		if err != nil {
			fmt.Printf("Error executing statement: %v\nStatement: %s\n", err, stmt)
			// Continue on error for seed files usually
		}
	}

	fmt.Println("Seeding complete.")
}
