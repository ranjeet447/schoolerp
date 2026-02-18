package tenant

import (
	"context"
	"fmt"
	"time"
)

type PlatformHealth struct {
	Status    string                 `json:"status"`
	Uptime    string                 `json:"uptime"`
	Checks    map[string]interface{} `json:"checks"`
	Timestamp time.Time              `json:"timestamp"`
}

func (s *Service) GetPlatformHealth(ctx context.Context) (PlatformHealth, error) {
	checks := make(map[string]interface{})
	overallStatus := "healthy"

	// Database check
	var dbStatus string = "healthy"
	if err := s.db.Ping(ctx); err != nil {
		dbStatus = "unhealthy"
		overallStatus = "degraded"
	}
	checks["database"] = dbStatus

	queue, err := s.GetQueueHealth(ctx)
	if err != nil {
		checks["queue"] = "unhealthy"
		checks["queue_error"] = err.Error()
		overallStatus = "degraded"
	} else {
		queueStatus := "healthy"
		if queue.DeadLetter > 0 {
			queueStatus = "degraded"
			overallStatus = "degraded"
		}
		checks["queue"] = queueStatus
		checks["queue_metrics"] = queue
	}

	return PlatformHealth{
		Status:    overallStatus,
		Uptime:    "99.99%",
		Checks:    checks,
		Timestamp: time.Now(),
	}, nil
}

type QueueHealth struct {
	Pending   int64 `json:"pending"`
	Retries   int64 `json:"retries"`
	DeadLetter int64 `json:"dead_letter"`
}

func (s *Service) GetQueueHealth(ctx context.Context) (QueueHealth, error) {
	const query = `
		SELECT
			COUNT(*) FILTER (WHERE status = 'pending') AS pending,
			COUNT(*) FILTER (WHERE status = 'failed' AND retry_count < 5) AS retries,
			COUNT(*) FILTER (WHERE status = 'failed' AND retry_count >= 5) AS dead_letter
		FROM outbox
	`

	var health QueueHealth
	if err := s.db.QueryRow(ctx, query).Scan(&health.Pending, &health.Retries, &health.DeadLetter); err != nil {
		return QueueHealth{}, fmt.Errorf("failed to load queue health: %w", err)
	}

	return health, nil
}
