package dashboard

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type DashboardService struct {
	pool  *pgxpool.Pool
	audit *audit.Logger
}

func NewDashboardService(pool *pgxpool.Pool, audit *audit.Logger) *DashboardService {
	return &DashboardService{pool: pool, audit: audit}
}

type RealTimeStatus struct {
	Attendance struct {
		Students struct {
			Present int `json:"present"`
			Absent  int `json:"absent"`
			Late    int `json:"late"`
			Total   int `json:"total"`
		} `json:"students"`
		Staff struct {
			Present int `json:"present"`
			Absent  int `json:"absent"`
			Total   int `json:"total"`
		} `json:"staff"`
	} `json:"attendance"`
	Finance struct {
		CollectedToday int `json:"collected_today"`
		TargetMonth    int `json:"target_month"`
		PendingDues    int `json:"pending_dues"`
	} `json:"finance"`
	Academics struct {
		ActiveSubstitutions int `json:"active_substitutions"`
		PendingAbsences     int `json:"pending_absences"`
	} `json:"academics"`
	Security struct {
		ActiveVisitors int `json:"active_visitors"`
		RecentAlerts   int `json:"recent_alerts"`
	} `json:"security"`
}

type StrategicAnalytics struct {
	AcademicHeatmap []struct {
		ClassName    string  `json:"class_name"`
		SubjectName  string  `json:"subject_name"`
		AverageScore float64 `json:"average_score"`
	} `json:"academic_heatmap"`
	FinancialCollection []struct {
		Month  string `json:"month"`
		Amount int64  `json:"amount"`
	} `json:"financial_collection"`
	AdmissionFunnel []struct {
		Status string `json:"status"`
		Count  int    `json:"count"`
	} `json:"admission_funnel"`
}

func (s *DashboardService) GetDailyCommandStatus(ctx context.Context, tenantID string) (*RealTimeStatus, error) {
	status := &RealTimeStatus{}

	// 1. Student Attendance
	err := s.pool.QueryRow(ctx, `
		SELECT 
			COUNT(*) FILTER (WHERE status = 'present'),
			COUNT(*) FILTER (WHERE status = 'absent'),
			COUNT(*) FILTER (WHERE status = 'late'),
			COUNT(*)
		FROM attendance_entries ae
		JOIN attendance_sessions asess ON ae.session_id = asess.id
		WHERE asess.tenant_id = $1 AND asess.date = CURRENT_DATE
	`, tenantID).Scan(&status.Attendance.Students.Present, &status.Attendance.Students.Absent, &status.Attendance.Students.Late, &status.Attendance.Students.Total)
	if err != nil {
		// Log and continue, some tables might be empty
	}

	// 2. Staff Attendance
	err = s.pool.QueryRow(ctx, `
		SELECT 
			COUNT(*) FILTER (WHERE status = 'present'),
			COUNT(*) FILTER (WHERE status = 'absent'),
			COUNT(*)
		FROM staff_attendance
		WHERE tenant_id = $1 AND attendance_date = CURRENT_DATE
	`, tenantID).Scan(&status.Attendance.Staff.Present, &status.Attendance.Staff.Absent, &status.Attendance.Staff.Total)

	// 3. Finance
	err = s.pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(amount_paid), 0)
		FROM receipts
		WHERE tenant_id = $1 AND created_at::date = CURRENT_DATE
	`, tenantID).Scan(&status.Finance.CollectedToday)

	// 4. Academics (Substitutions)
	err = s.pool.QueryRow(ctx, `
		SELECT 
			COUNT(DISTINCT ta.id),
			COUNT(DISTINCT ts.id)
		FROM teacher_absences ta
		LEFT JOIN teacher_substitutions ts ON ta.teacher_id = (
			SELECT teacher_id FROM timetable_entries WHERE id = ts.timetable_entry_id
		) AND ta.absence_date = ts.substitution_date
		WHERE ta.tenant_id = $1 AND ta.absence_date = CURRENT_DATE
	`, tenantID).Scan(&status.Academics.PendingAbsences, &status.Academics.ActiveSubstitutions)

	return status, nil
}

func (s *DashboardService) GetStrategicAnalytics(ctx context.Context, tenantID string) (*StrategicAnalytics, error) {
	analytics := &StrategicAnalytics{}

	// 1. Academic Heatmap
	rows, _ := s.pool.Query(ctx, `
		SELECT c.name, sub.name, AVG(ma.aggregate_marks)::float8
		FROM marks_aggregates ma
		JOIN subjects sub ON ma.subject_id = sub.id
		JOIN students s ON ma.student_id = s.id
		JOIN sections sec ON s.section_id = sec.id
		JOIN classes c ON sec.class_id = c.id
		WHERE ma.tenant_id = $1
		GROUP BY c.name, sub.name
		ORDER BY c.name, sub.name
	`, tenantID)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var h struct {
				ClassName    string  `json:"class_name"`
				SubjectName  string  `json:"subject_name"`
				AverageScore float64 `json:"average_score"`
			}
			if err := rows.Scan(&h.ClassName, &h.SubjectName, &h.AverageScore); err == nil {
				analytics.AcademicHeatmap = append(analytics.AcademicHeatmap, h)
			}
		}
	}

	// 2. Financial Collection (Last 6 Months)
	rows, _ = s.pool.Query(ctx, `
		SELECT to_char(created_at, 'Mon YYYY'), SUM(amount_paid)::bigint
		FROM receipts
		WHERE tenant_id = $1 AND created_at > CURRENT_DATE - INTERVAL '6 months'
		GROUP BY 1, date_trunc('month', created_at)
		ORDER BY date_trunc('month', created_at)
	`, tenantID)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var f struct {
				Month  string `json:"month"`
				Amount int64  `json:"amount"`
			}
			if err := rows.Scan(&f.Month, &f.Amount); err == nil {
				analytics.FinancialCollection = append(analytics.FinancialCollection, f)
			}
		}
	}

	// 3. Admission Funnel
	rows, _ = s.pool.Query(ctx, `
		SELECT status, COUNT(*)
		FROM admission_applications
		WHERE tenant_id = $1
		GROUP BY status
	`, tenantID)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var a struct {
				Status string `json:"status"`
				Count  int    `json:"count"`
			}
			if err := rows.Scan(&a.Status, &a.Count); err == nil {
				analytics.AdmissionFunnel = append(analytics.AdmissionFunnel, a)
			}
		}
	}

	return analytics, nil
}
