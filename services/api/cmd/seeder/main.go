package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		log.Fatalf("Unable to parse DATABASE_URL: %v", err)
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v", err)
	}
	defer pool.Close()

	// Locate the SQL file
	// Assuming running from project root or services/api
	// We'll try to find it relative to where we might be running
	projectRoot, err := findProjectRoot()
	if err != nil {
		log.Fatalf("Could not find project root: %v", err)
	}

	sqlPath := filepath.Join(projectRoot, "infra", "migrations", "seed_users.sql")
	sqlBytes, err := os.ReadFile(sqlPath)
	if err != nil {
		log.Fatalf("Could not read SQL file at %s: %v", sqlPath, err)
	}

	sqlContent := string(sqlBytes)

	fmt.Printf("Executing seed script from %s...\n", sqlPath)

	conn, err := pool.Acquire(context.Background())
	if err != nil {
		log.Fatalf("Unable to acquire connection: %v", err)
	}
	defer conn.Release()

	_, err = conn.Exec(context.Background(), sqlContent)
	if err != nil {
		log.Fatalf("Failed to execute seed script: %v", err)
	}

	fmt.Println("Seed script executed successfully.")
}

func findProjectRoot() (string, error) {
	// Start from current working directory and walk up until we find "go.mod" or "package.json" or "turbo.json"
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for {
		if _, err := os.Stat(filepath.Join(dir, "turbo.json")); err == nil {
			return dir, nil
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("project root not found")
		}
		dir = parent
	}
}
