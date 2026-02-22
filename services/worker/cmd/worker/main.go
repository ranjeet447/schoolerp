package main

import (
	"context"
	"encoding/json"
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
	
	var fallbackSvc notification.Adapter
	notifWebhookURL := os.Getenv("NOTIFICATION_WEBHOOK_URL")
	if notifWebhookURL != "" {
		fallbackSvc = notification.NewWebhookAdapter(notifWebhookURL, os.Getenv("NOTIFICATION_WEBHOOK_TOKEN"))
		log.Info().Msg("Fallback notification: webhook")
	} else {
		fallbackSvc = &notification.StubAdapter{}
		log.Info().Msg("Fallback notification: stub")
	}

	notifSvc := notification.NewMultiTenantAdapter(querier, fallbackSvc)
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

	// Cron: Homework + PTM reminders every 10 minutes
	reminderTicker := time.NewTicker(10 * time.Minute)
	defer reminderTicker.Stop()

	go func() {
		// Run once at startup
		processReminders(ctx, querier)
		for {
			select {
			case <-ctx.Done():
				return
			case <-reminderTicker.C:
				processReminders(ctx, querier)
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

func processReminders(ctx context.Context, q db.Querier) {
	// 1. Homework Due-Date Reminders
	homeworks, err := q.GetHomeworkDueSoon(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Error fetching homework due soon")
	} else {
		for _, h := range homeworks {
			students, err := q.GetStudentsMissingSubmissionForHomework(ctx, h.ID)
			if err != nil {
				continue
			}
			for _, st := range students {
				payload, _ := json.Marshal(map[string]interface{}{
					"homework_id":    h.ID,
					"student_id":     st.StudentID,
					"student_name":   st.FullName,
					"due_date":       h.DueDate.Time.Format(time.RFC3339),
					"homework_title": h.Title,
				})
				_, _ = q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
					TenantID:  h.TenantID,
					EventType: "academics.homework.reminder",
					Payload:   payload,
				})
			}
		}
		log.Info().Int("count", len(homeworks)).Msg("Processed homework reminders")
	}

	// 2. PTM Slot Reminders
	slots, err := q.GetPTMSlotsStartingSoon(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Error fetching PTM slots starting soon")
	} else {
		for _, slot := range slots {
			payload, _ := json.Marshal(map[string]interface{}{
				"slot_id":      slot.ID,
				"event_title":  slot.EventTitle,
				"student_name": slot.StudentName,
				"student_id":   slot.StudentID,
				"start_time":   slot.StartTime,
			})
			_, _ = q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
				TenantID:  slot.TenantID,
				EventType: "communication.ptm.reminder",
				Payload:   payload,
			})
		}
		log.Info().Int("count", len(slots)).Msg("Processed PTM reminders")
	}
}

