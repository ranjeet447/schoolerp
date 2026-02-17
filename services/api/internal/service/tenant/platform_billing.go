package tenant

import (
	"context"
	"time"
)

type PlatformRevenueTrendPoint struct {
	Month         string `json:"month"`
	Collections   int64  `json:"collections"`
	ReceiptsCount int64  `json:"receipts_count"`
}

type PlatformPlanMixPoint struct {
	PlanCode string `json:"plan_code"`
	Count    int64  `json:"count"`
}

type PlatformBillingOverview struct {
	MRR                    int64                       `json:"mrr"`
	ARR                    int64                       `json:"arr"`
	ActiveSubscriptions    int64                       `json:"active_subscriptions"`
	TrialSubscriptions     int64                       `json:"trial_subscriptions"`
	SuspendedSubscriptions int64                       `json:"suspended_subscriptions"`
	ClosedSubscriptions    int64                       `json:"closed_subscriptions"`
	TrialsExpiringIn7Days  int64                       `json:"trials_expiring_in_7_days"`
	RenewalsDueIn30Days    int64                       `json:"renewals_due_in_30_days"`
	MonthlyClosedThisMonth int64                       `json:"monthly_closed_this_month"`
	ChurnRatePercent       float64                     `json:"churn_rate_percent"`
	RevenueTrend           []PlatformRevenueTrendPoint `json:"revenue_trend"`
	PlanMix                []PlatformPlanMixPoint      `json:"plan_mix"`
	GeneratedAt            time.Time                   `json:"generated_at"`
}

func (s *Service) GetPlatformBillingOverview(ctx context.Context) (PlatformBillingOverview, error) {
	const summaryQuery = `
		WITH subs AS (
			SELECT
				ts.status,
				ts.trial_ends_at,
				ts.renews_at,
				ts.updated_at,
				COALESCE(pp.price_monthly, 0) AS price_monthly
			FROM tenant_subscriptions ts
			LEFT JOIN platform_plans pp ON pp.id = ts.plan_id
		)
		SELECT
			COALESCE(SUM(CASE WHEN status = 'active' THEN price_monthly ELSE 0 END), 0)::BIGINT AS mrr,
			COUNT(*) FILTER (WHERE status = 'active')::BIGINT AS active_subscriptions,
			COUNT(*) FILTER (WHERE status = 'trial')::BIGINT AS trial_subscriptions,
			COUNT(*) FILTER (WHERE status = 'suspended')::BIGINT AS suspended_subscriptions,
			COUNT(*) FILTER (WHERE status = 'closed')::BIGINT AS closed_subscriptions,
			COUNT(*) FILTER (WHERE status = 'trial' AND trial_ends_at IS NOT NULL AND trial_ends_at <= NOW() + INTERVAL '7 days')::BIGINT AS trials_expiring_in_7_days,
			COUNT(*) FILTER (WHERE status = 'active' AND renews_at IS NOT NULL AND renews_at <= NOW() + INTERVAL '30 days')::BIGINT AS renewals_due_in_30_days,
			COUNT(*) FILTER (WHERE status = 'closed' AND updated_at >= date_trunc('month', NOW()))::BIGINT AS monthly_closed_this_month
		FROM subs
	`

	var overview PlatformBillingOverview
	if err := s.db.QueryRow(ctx, summaryQuery).Scan(
		&overview.MRR,
		&overview.ActiveSubscriptions,
		&overview.TrialSubscriptions,
		&overview.SuspendedSubscriptions,
		&overview.ClosedSubscriptions,
		&overview.TrialsExpiringIn7Days,
		&overview.RenewalsDueIn30Days,
		&overview.MonthlyClosedThisMonth,
	); err != nil {
		return PlatformBillingOverview{}, err
	}
	overview.ARR = overview.MRR * 12

	totalForChurn := overview.ActiveSubscriptions + overview.ClosedSubscriptions
	if totalForChurn > 0 {
		overview.ChurnRatePercent = (float64(overview.MonthlyClosedThisMonth) / float64(totalForChurn)) * 100.0
	}

	const trendQuery = `
		WITH months AS (
			SELECT generate_series(
				date_trunc('month', NOW()) - INTERVAL '5 months',
				date_trunc('month', NOW()),
				INTERVAL '1 month'
			) AS month_start
		)
		SELECT
			to_char(m.month_start, 'YYYY-MM') AS month,
			COALESCE(SUM(r.amount_paid), 0)::BIGINT AS collections,
			COUNT(r.id)::BIGINT AS receipts_count
		FROM months m
		LEFT JOIN receipts r
			ON date_trunc('month', r.created_at) = m.month_start
		GROUP BY m.month_start
		ORDER BY m.month_start ASC
	`
	rows, err := s.db.Query(ctx, trendQuery)
	if err != nil {
		return PlatformBillingOverview{}, err
	}
	defer rows.Close()

	overview.RevenueTrend = make([]PlatformRevenueTrendPoint, 0)
	for rows.Next() {
		var row PlatformRevenueTrendPoint
		if err := rows.Scan(&row.Month, &row.Collections, &row.ReceiptsCount); err != nil {
			return PlatformBillingOverview{}, err
		}
		overview.RevenueTrend = append(overview.RevenueTrend, row)
	}
	if err := rows.Err(); err != nil {
		return PlatformBillingOverview{}, err
	}

	const planMixQuery = `
		SELECT
			COALESCE(pp.code, 'unassigned') AS plan_code,
			COUNT(*)::BIGINT AS plan_count
		FROM tenant_subscriptions ts
		LEFT JOIN platform_plans pp ON pp.id = ts.plan_id
		GROUP BY COALESCE(pp.code, 'unassigned')
		ORDER BY plan_count DESC, plan_code ASC
	`
	mixRows, err := s.db.Query(ctx, planMixQuery)
	if err != nil {
		return PlatformBillingOverview{}, err
	}
	defer mixRows.Close()

	overview.PlanMix = make([]PlatformPlanMixPoint, 0)
	for mixRows.Next() {
		var row PlatformPlanMixPoint
		if err := mixRows.Scan(&row.PlanCode, &row.Count); err != nil {
			return PlatformBillingOverview{}, err
		}
		overview.PlanMix = append(overview.PlanMix, row)
	}
	if err := mixRows.Err(); err != nil {
		return PlatformBillingOverview{}, err
	}

	overview.GeneratedAt = time.Now().UTC()
	return overview, nil
}
