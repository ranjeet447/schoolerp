package attendance

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/foundation/audit"
)

func toPgUUID(s string) pgtype.UUID {
	u, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}
	}
	return pgtype.UUID{Bytes: u, Valid: true}
}

// ==================== Staff Attendance ====================

type StaffAttendanceService struct {
	pool  *pgxpool.Pool
	audit *audit.Logger
}

func NewStaffAttendanceService(pool *pgxpool.Pool, audit *audit.Logger) *StaffAttendanceService {
	return &StaffAttendanceService{pool: pool, audit: audit}
}

type StaffAttendanceEntry struct {
	EmployeeID   string `json:"employee_id"`
	EmployeeName string `json:"employee_name"`
	Department   string `json:"department"`
	Status       string `json:"status"`
	CheckInTime  string `json:"check_in_time"`
	CheckOutTime string `json:"check_out_time"`
	Remarks      string `json:"remarks"`
}

type StaffAttendanceSession struct {
	ID        string                 `json:"id"`
	TenantID  string                 `json:"tenant_id"`
	Date      string                 `json:"date"`
	MarkedBy  string                 `json:"marked_by"`
	Entries   []StaffAttendanceEntry `json:"entries"`
	CreatedAt string                 `json:"created_at"`
}

type MarkStaffAttendanceParams struct {
	TenantID  string
	Date      time.Time
	Entries   []StaffAttendanceEntry
	UserID    string
	RequestID string
	IP        string
}

func (s *StaffAttendanceService) MarkAttendance(ctx context.Context, p MarkStaffAttendanceParams) error {
	if len(p.Entries) == 0 {
		return fmt.Errorf("no entries provided")
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	dateStr := p.Date.Format("2006-01-02")

	// Upsert session
	var sessionID string
	err = tx.QueryRow(ctx,
		`INSERT INTO staff_attendance_sessions (tenant_id, date, marked_by)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (tenant_id, date) DO UPDATE SET marked_by = $3
		 RETURNING id`,
		p.TenantID, dateStr, p.UserID,
	).Scan(&sessionID)
	if err != nil {
		return fmt.Errorf("create staff attendance session: %w", err)
	}

	// Delete existing entries for this session
	_, err = tx.Exec(ctx, `DELETE FROM staff_attendance_entries WHERE session_id = $1`, sessionID)
	if err != nil {
		return err
	}

	// Insert entries
	for _, e := range p.Entries {
		allowed := map[string]bool{"present": true, "absent": true, "late": true, "half_day": true, "on_leave": true}
		if !allowed[e.Status] {
			e.Status = "present"
		}

		_, err = tx.Exec(ctx,
			`INSERT INTO staff_attendance_entries (session_id, employee_id, status, check_in_time, check_out_time, remarks)
			 VALUES ($1, $2, $3, NULLIF($4, '')::time, NULLIF($5, '')::time, NULLIF($6, ''))`,
			sessionID, e.EmployeeID, e.Status, e.CheckInTime, e.CheckOutTime, e.Remarks)
		if err != nil {
			return fmt.Errorf("insert staff attendance entry for %s: %w", e.EmployeeID, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}

	// Audit log
	s.audit.Log(ctx, audit.Entry{
		TenantID:     toPgUUID(p.TenantID),
		UserID:       toPgUUID(p.UserID),
		Action:       "staff_attendance.mark",
		ResourceType: "staff_attendance",
		RequestID:    p.RequestID,
		IPAddress:    p.IP,
		After:        map[string]interface{}{"date": dateStr, "entries": len(p.Entries)},
	})

	return nil
}

func (s *StaffAttendanceService) GetSession(ctx context.Context, tenantID string, date time.Time) (*StaffAttendanceSession, error) {
	dateStr := date.Format("2006-01-02")

	var sess StaffAttendanceSession
	err := s.pool.QueryRow(ctx,
		`SELECT id, tenant_id, date, COALESCE(marked_by::text, ''), created_at
		 FROM staff_attendance_sessions WHERE tenant_id = $1 AND date = $2`,
		tenantID, dateStr,
	).Scan(&sess.ID, &sess.TenantID, &sess.Date, &sess.MarkedBy, &sess.CreatedAt)
	if err != nil {
		return nil, nil // No session for this date
	}

	rows, err := s.pool.Query(ctx,
		`SELECT e.employee_id, emp.full_name, COALESCE(emp.department, ''), e.status,
		        COALESCE(e.check_in_time::text, ''), COALESCE(e.check_out_time::text, ''), COALESCE(e.remarks, '')
		 FROM staff_attendance_entries e
		 JOIN employees emp ON emp.id = e.employee_id
		 WHERE e.session_id = $1
		 ORDER BY emp.full_name`, sess.ID)
	if err != nil {
		return &sess, nil
	}
	defer rows.Close()

	for rows.Next() {
		var entry StaffAttendanceEntry
		if err := rows.Scan(&entry.EmployeeID, &entry.EmployeeName, &entry.Department,
			&entry.Status, &entry.CheckInTime, &entry.CheckOutTime, &entry.Remarks); err != nil {
			continue
		}
		sess.Entries = append(sess.Entries, entry)
	}
	if sess.Entries == nil {
		sess.Entries = []StaffAttendanceEntry{}
	}
	return &sess, nil
}

type StaffAttendanceStats struct {
	Date         string `json:"date"`
	TotalStaff   int    `json:"total_staff"`
	Present      int    `json:"present"`
	Absent       int    `json:"absent"`
	Late         int    `json:"late"`
	HalfDay      int    `json:"half_day"`
	OnLeave      int    `json:"on_leave"`
	AttendancePct float64 `json:"attendance_pct"`
}

func (s *StaffAttendanceService) GetDailyStats(ctx context.Context, tenantID string, date time.Time) (StaffAttendanceStats, error) {
	dateStr := date.Format("2006-01-02")
	stats := StaffAttendanceStats{Date: dateStr}

	// Count total active employees
	err := s.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM employees WHERE tenant_id = $1 AND status = 'active'`, tenantID,
	).Scan(&stats.TotalStaff)
	if err != nil {
		return stats, err
	}

	// Get session
	var sessionID string
	err = s.pool.QueryRow(ctx,
		`SELECT id FROM staff_attendance_sessions WHERE tenant_id = $1 AND date = $2`,
		tenantID, dateStr,
	).Scan(&sessionID)
	if err != nil {
		return stats, nil // No session = no stats
	}

	// Count by status
	rows, err := s.pool.Query(ctx,
		`SELECT status, COUNT(*) FROM staff_attendance_entries WHERE session_id = $1 GROUP BY status`, sessionID)
	if err != nil {
		return stats, nil
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			continue
		}
		switch status {
		case "present":
			stats.Present = count
		case "absent":
			stats.Absent = count
		case "late":
			stats.Late = count
		case "half_day":
			stats.HalfDay = count
		case "on_leave":
			stats.OnLeave = count
		}
	}

	if stats.TotalStaff > 0 {
		stats.AttendancePct = float64(stats.Present+stats.Late+stats.HalfDay) / float64(stats.TotalStaff) * 100
	}
	return stats, nil
}

func (s *StaffAttendanceService) GetMonthlyReport(ctx context.Context, tenantID string, year, month int) ([]map[string]interface{}, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT e.employee_id, emp.full_name, COALESCE(emp.department, ''),
		        SUM(CASE WHEN e.status = 'present' THEN 1 ELSE 0 END) as present_days,
		        SUM(CASE WHEN e.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
		        SUM(CASE WHEN e.status = 'late' THEN 1 ELSE 0 END) as late_days,
		        SUM(CASE WHEN e.status = 'half_day' THEN 1 ELSE 0 END) as half_days,
		        SUM(CASE WHEN e.status = 'on_leave' THEN 1 ELSE 0 END) as leave_days,
		        COUNT(*) as total_days
		 FROM staff_attendance_entries e
		 JOIN staff_attendance_sessions s ON s.id = e.session_id
		 JOIN employees emp ON emp.id = e.employee_id
		 WHERE s.tenant_id = $1 AND EXTRACT(YEAR FROM s.date) = $2 AND EXTRACT(MONTH FROM s.date) = $3
		 GROUP BY e.employee_id, emp.full_name, emp.department
		 ORDER BY emp.full_name`,
		tenantID, year, month)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var report []map[string]interface{}
	for rows.Next() {
		var empID, name, dept string
		var present, absent, late, halfDay, onLeave, total int
		if err := rows.Scan(&empID, &name, &dept, &present, &absent, &late, &halfDay, &onLeave, &total); err != nil {
			continue
		}
		report = append(report, map[string]interface{}{
			"employee_id":  empID,
			"employee_name": name,
			"department":    dept,
			"present_days":  present,
			"absent_days":   absent,
			"late_days":     late,
			"half_days":     halfDay,
			"leave_days":    onLeave,
			"total_days":    total,
		})
	}
	if report == nil {
		report = []map[string]interface{}{}
	}
	return report, nil
}

// ==================== Period-wise Attendance ====================

type PeriodAttendanceEntry struct {
	StudentID string `json:"student_id"`
	Status    string `json:"status"`
	Remarks   string `json:"remarks"`
}

type MarkPeriodAttendanceParams struct {
	TenantID       string
	ClassSectionID string
	Date           time.Time
	PeriodNumber   int
	SubjectID      string
	Entries        []PeriodAttendanceEntry
	UserID         string
	RequestID      string
	IP             string
}

func (s *StaffAttendanceService) MarkPeriodAttendance(ctx context.Context, p MarkPeriodAttendanceParams) error {
	if len(p.Entries) == 0 {
		return fmt.Errorf("no entries provided")
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	dateStr := p.Date.Format("2006-01-02")

	// Upsert period session
	var sessionID string
	subjectID := interface{}(nil)
	if p.SubjectID != "" {
		subjectID = p.SubjectID
	}

	err = tx.QueryRow(ctx,
		`INSERT INTO period_attendance_sessions (tenant_id, class_section_id, date, period_number, subject_id, marked_by)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (class_section_id, date, period_number) DO UPDATE SET marked_by = $6, subject_id = $5
		 RETURNING id`,
		p.TenantID, p.ClassSectionID, dateStr, p.PeriodNumber, subjectID, p.UserID,
	).Scan(&sessionID)
	if err != nil {
		return fmt.Errorf("create period attendance session: %w", err)
	}

	// Delete + re-insert
	_, _ = tx.Exec(ctx, `DELETE FROM period_attendance_entries WHERE session_id = $1`, sessionID)

	for _, e := range p.Entries {
		_, err = tx.Exec(ctx,
			`INSERT INTO period_attendance_entries (session_id, student_id, status, remarks)
			 VALUES ($1, $2, $3, NULLIF($4, ''))`,
			sessionID, e.StudentID, e.Status, e.Remarks)
		if err != nil {
			return fmt.Errorf("insert period attendance entry: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}

	s.audit.Log(ctx, audit.Entry{
		TenantID:     toPgUUID(p.TenantID),
		UserID:       toPgUUID(p.UserID),
		Action:       "period_attendance.mark",
		ResourceType: "period_attendance",
		RequestID:    p.RequestID,
		IPAddress:    p.IP,
		After:        map[string]interface{}{"date": dateStr, "period": p.PeriodNumber, "entries": len(p.Entries)},
	})

	return nil
}

type PeriodAttendanceSession struct {
	ID             string                  `json:"id"`
	ClassSectionID string                  `json:"class_section_id"`
	Date           string                  `json:"date"`
	PeriodNumber   int                     `json:"period_number"`
	SubjectID      string                  `json:"subject_id"`
	Entries        []PeriodAttendanceEntry `json:"entries"`
}

func (s *StaffAttendanceService) GetPeriodSession(ctx context.Context, tenantID, classSectionID string, date time.Time, period int) (*PeriodAttendanceSession, error) {
	dateStr := date.Format("2006-01-02")
	var sess PeriodAttendanceSession
	err := s.pool.QueryRow(ctx,
		`SELECT id, class_section_id, date, period_number, COALESCE(subject_id::text, '')
		 FROM period_attendance_sessions WHERE tenant_id = $1 AND class_section_id = $2 AND date = $3 AND period_number = $4`,
		tenantID, classSectionID, dateStr, period,
	).Scan(&sess.ID, &sess.ClassSectionID, &sess.Date, &sess.PeriodNumber, &sess.SubjectID)
	if err != nil {
		return nil, nil
	}

	rows, err := s.pool.Query(ctx,
		`SELECT student_id, status, COALESCE(remarks, '') FROM period_attendance_entries WHERE session_id = $1`, sess.ID)
	if err != nil {
		return &sess, nil
	}
	defer rows.Close()

	for rows.Next() {
		var e PeriodAttendanceEntry
		if err := rows.Scan(&e.StudentID, &e.Status, &e.Remarks); err != nil {
			continue
		}
		sess.Entries = append(sess.Entries, e)
	}
	if sess.Entries == nil {
		sess.Entries = []PeriodAttendanceEntry{}
	}
	return &sess, nil
}
