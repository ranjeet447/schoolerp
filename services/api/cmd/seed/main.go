package main

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/jackc/pgx/v5"
)

func main() {
	// 1. Load .env manually
	envPath := "../../.env"
	dbURL := ""

	file, err := os.Open(envPath)
	if err != nil {
		fmt.Printf("Error opening .env file: %v\n", err)
		os.Exit(1)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "DATABASE_URL=") {
			dbURL = strings.TrimPrefix(line, "DATABASE_URL=")
			break
		}
	}

	if dbURL == "" {
		fmt.Println("DATABASE_URL not found in .env")
		os.Exit(1)
	}

	fmt.Println("Found DATABASE_URL, connecting...")

	// 2. Connect to DB
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		fmt.Printf("Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)

	fmt.Println("Connected to database.")

	// 3. Read seed SQL
	seedPath := os.Getenv("SEED_FILE")
	if seedPath == "" {
		seedPath = "../../infra/migrations/seed_users.sql"
	}
	sqlBytes, err := os.ReadFile(seedPath)
	if err != nil {
		fmt.Printf("Error reading seed file: %v\n", err)
		os.Exit(1)
	}

	sql := string(sqlBytes)
	fmt.Printf("Reading seed file: %s\n", seedPath)

	// 4. Execute SQL
	_, err = conn.Exec(ctx, sql)
	if err != nil {
		fmt.Printf("Error executing seed script: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Successfully executed seed file: %s\n", seedPath)
}
