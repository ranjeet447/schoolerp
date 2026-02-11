package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/jackc/pgx/v5"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run main.go <sql_file>")
		os.Exit(1)
	}

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

	sqlFile := os.Args[1]
	content, err := os.ReadFile(sqlFile)
	if err != nil {
		fmt.Printf("Unable to read SQL file: %v\n", err)
		os.Exit(1)
	}

	// Simple semicolon split (careful with strings/functions)
	statements := strings.Split(string(content), ";")

	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(stmt, "--") || strings.ToUpper(stmt) == "BEGIN" || strings.ToUpper(stmt) == "COMMIT" {
			continue
		}

		_, err := conn.Exec(ctx, stmt)
		if err != nil {
			fmt.Printf("Error executing statement: %v\nStatement: %s\n", err, stmt)
		} else {
			fmt.Printf("Successfully executed statement: %s...\n", stmt[:min(len(stmt), 20)])
		}
	}

	fmt.Println("Execution complete.")
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
