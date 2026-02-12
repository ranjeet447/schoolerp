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

	sqlFile := os.Getenv("SEED_FILE")
	if sqlFile == "" {
		sqlFile = "infra/migrations/seed_users.sql"
	}
	content, err := os.ReadFile(sqlFile)
	if err != nil {
		fmt.Printf("Unable to read seed file: %v\n", err)
		os.Exit(1)
	}

	if _, err := conn.Exec(ctx, string(content)); err != nil {
		fmt.Printf("Error executing seed file %s: %v\n", sqlFile, err)
		os.Exit(1)
	}

	fmt.Printf("Seeding complete. File executed: %s\n", sqlFile)
}
