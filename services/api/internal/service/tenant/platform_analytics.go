package tenant

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type AnalyticsSnapshot struct {
	ID           uuid.UUID              `json:"id"`
	MetricName   string                 `json:"metric_name"`
	MetricValue  float64                `json:"metric_value"`
	Dimensions   map[string]interface{} `json:"dimensions"`
	SnapshotDate time.Time              `json:"snapshot_date"`
}

func (s *Service) GetPlatformAnalytics(ctx context.Context, metricName string, days int) ([]AnalyticsSnapshot, error) {
	const query = `
		SELECT id, metric_name, metric_value, dimensions, snapshot_date
		FROM platform_analytics_snapshots
		WHERE metric_name = $1 AND snapshot_date > CURRENT_DATE - $2 * INTERVAL '1 day'
		ORDER BY snapshot_date ASC
	`
	rows, err := s.db.Query(ctx, query, metricName, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []AnalyticsSnapshot
	for rows.Next() {
		var a AnalyticsSnapshot
		var dims []byte
		var snapshotDate pgtype.Date
		if err := rows.Scan(&a.ID, &a.MetricName, &a.MetricValue, &dims, &snapshotDate); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(dims, &a.Dimensions)
		a.SnapshotDate = snapshotDate.Time
		list = append(list, a)
	}
	return list, nil
}
