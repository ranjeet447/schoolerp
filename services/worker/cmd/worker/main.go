package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/schoolerp/worker/internal/db"
	"github.com/schoolerp/worker/internal/notification"
	"github.com/schoolerp/worker/internal/service/pdf"
	"github.com/schoolerp/worker/internal/worker"
)

func main() {
	// 0. Setup Logger
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	if os.Getenv("ENV") == "production" {
		log.Logger = zerolog.New(os.Stderr).With().Timestamp().Logger()
	}

	log.Info().Msg("Worker starting...")

	// 1. Database Connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://schoolerp:password@localhost:5432/schoolerp?sslmode=disable"
	}
	
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatal().Err(err).Msg("Unable to connect to database")
	}
	defer pool.Close()

	querier := db.New(pool)
	pdfSvc := pdf.NewProcessor(querier)
	var notifSvc notification.Adapter
	notifWebhookURL := os.Getenv("NOTIFICATION_WEBHOOK_URL")
	if notifWebhookURL != "" {
		notifSvc = notification.NewWebhookAdapter(notifWebhookURL, os.Getenv("NOTIFICATION_WEBHOOK_TOKEN"))
		log.Info().Msg("Notification adapter: webhook")
	} else {
		notifSvc = &notification.StubAdapter{}
		log.Info().Msg("Notification adapter: stub")
	}
	notifConsumer := worker.NewConsumer(querier, notifSvc)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 2. Health Server
	healthServer := &http.Server{
		Addr: ":8081",
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("ok"))
		}),
	}
	go func() {
		log.Info().Msg("Health server starting on :8081")
		if err := healthServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error().Err(err).Msg("Health server failed")
		}
	}()

	// 3. Capture signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// 4. Poll loop
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

	// Start Notification Consumer
	go notifConsumer.Start(ctx)

	<-stop
	log.Info().Msg("Shutting down worker...")
	
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	
	healthServer.Shutdown(shutdownCtx)
	cancel()
	
	log.Info().Msg("Worker exited")
}

func processPoll(ctx context.Context, q db.Querier, pdfSvc *pdf.Processor) {
	jobs, err := q.ListPendingPDFJobs(ctx, 10)
	if err != nil {
		log.Error().Err(err).Msg("Error fetching jobs")
		return
	}

	for _, job := range jobs {
		if err := pdfSvc.ProcessJob(ctx, job); err != nil {
			log.Error().Err(err).Str("job_id", job.ID.String()).Msg("Error processing job")
		}
	}
}
