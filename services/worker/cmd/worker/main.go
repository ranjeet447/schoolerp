package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	log.Println("Worker starting...")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Capture signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Poll loop
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				processOutbox(ctx)
			}
		}
	}()

	<-stop
	log.Println("Shutting down worker...")
	cancel()
	time.Sleep(1 * time.Second)
	log.Println("Worker exited")
}

func processOutbox(ctx context.Context) {
	// Stub: In real app, query "SELECT * FROM outbox_events WHERE status = 'pending' FOR UPDATE SKIP LOCKED"
	// case "generate_marketing_pdf": generateMarketingPDF(event.Payload)
	// case "demo.booking.created": handleBookingCreated(event.Payload)
}

func handleBookingCreated(payload map[string]interface{}) {
	log.Printf("Sending demo booking confirmation to: %v", payload["email"])
	// 1. Generate .ics file attachment
	// 2. Send email via stub
	// 3. Enqueue reminder jobs (24h, 1h)
}

func generateMarketingPDF(payload map[string]interface{}) {
	log.Printf("Generating marketing PDF for slug: %v", payload["slug"])
}

// CalendarProvider interface for future integrations
type CalendarProvider interface {
	CreateEvent(ctx context.Context, title string, start, end time.Time) (string, error)
	DeleteEvent(ctx context.Context, externalID string) error
}

type NoOpCalendarProvider struct{}

func (n *NoOpCalendarProvider) CreateEvent(ctx context.Context, title string, start, end time.Time) (string, error) {
	return "noop-id", nil
}
func (n *NoOpCalendarProvider) DeleteEvent(ctx context.Context, externalID string) error {
	return nil
}
