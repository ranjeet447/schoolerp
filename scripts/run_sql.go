package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run run_sql.go <path_to_sql_file>")
		os.Exit(1)
	}

	sqlFile := os.Args[1]
	content, err := os.ReadFile(sqlFile)
	if err != nil {
		fmt.Printf("Error reading file %s: %v\n", sqlFile, err)
		os.Exit(1)
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Println("DATABASE_URL must be set")
		os.Exit(1)
	}

	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		fmt.Printf("Error connecting to database: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	ctx := context.Background()
	if err := db.PingContext(ctx); err != nil {
		fmt.Printf("Error pinging database: %v\n", err)
		os.Exit(1)
	}

	// Execute the entire file as a single command block
	_, err = db.ExecContext(ctx, string(content))
	if err != nil {
		fmt.Printf("Error executing SQL: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Successfully executed %s\n", filepath.Base(sqlFile))
}
