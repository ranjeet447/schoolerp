package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/worker/internal/db"
	"github.com/schoolerp/worker/internal/service/pdf"
)

func main() {
	log.Println("Worker starting...")

	// 0. Database Connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://schoolerp:password@localhost:5432/schoolerp?sslmode=disable"
	}
	
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer pool.Close()

	querier := db.New(pool)
	pdfSvc := pdf.NewProcessor(querier)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Capture signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Poll loop
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				processPoll(ctx, querier, pdfSvc)
			}
		}
	}()

	<-stop
	log.Println("Shutting down worker...")
	cancel()
	time.Sleep(1 * time.Second)
	log.Println("Worker exited")
}

func processPoll(ctx context.Context, q db.Querier, pdfSvc *pdf.Processor) {
	// 1. Poll PDF Jobs
	jobs, err := q.ListPendingPDFJobs(ctx, 10) // batch of 10
	if err != nil {
		log.Printf("[Poll] Error fetching jobs: %v", err)
		return
	}

	for _, job := range jobs {
		err := pdfSvc.ProcessJob(ctx, job)
		if err != nil {
			log.Printf("[Poll] Error processing job %s: %v", job.ID, err)
		}
	}

	// 2. Poll Outbox (Placeholder for other events)
	// processOutbox(ctx, q)
}
