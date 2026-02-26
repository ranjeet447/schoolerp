package biometric

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type BiometricService struct {
	pool  *pgxpool.Pool
	audit *audit.Logger
}

const (
	studentAttendanceUpsertSQL = `
		INSERT INTO attendance_entries (session_id, student_id, status, remarks)
		SELECT s.id, $2, 'present', 'Automated Biometric'
		FROM attendance_sessions s
		JOIN students st ON s.class_section_id = st.section_id
		WHERE st.id = $2 AND s.tenant_id = $1 AND s.date = $3::date
		ON CONFLICT (session_id, student_id) DO UPDATE SET status = 'present'
	`
	staffAttendanceCheckInSQL = `
		INSERT INTO staff_attendance (tenant_id, employee_id, attendance_date, status, check_in)
		VALUES ($1, $2, $3::date, 'present', $3)
		ON CONFLICT (tenant_id, employee_id, attendance_date) DO UPDATE SET check_in = LEAST(staff_attendance.check_in, $3)
	`
	staffAttendanceCheckOutSQL = `
		UPDATE staff_attendance 
		SET check_out = GREATEST(check_out, $3)
		WHERE tenant_id = $1 AND employee_id = $2 AND attendance_date = $3::date
	`
)

func NewBiometricService(pool *pgxpool.Pool, audit *audit.Logger) *BiometricService {
	return &BiometricService{pool: pool, audit: audit}
}

type LogEntry struct {
	DeviceID   string    `json:"device_id"`
	Identifier string    `json:"identifier"`
	Direction  string    `json:"direction"`
	Timestamp  time.Time `json:"timestamp"`
}

func (s *BiometricService) IngestLog(ctx context.Context, tenantID string, entry LogEntry) (string, error) {
	// 1. Resolve identifier
	var entityID, entityType string

	// Check students
	err := s.pool.QueryRow(ctx, `
		SELECT id, 'student' FROM students 
		WHERE tenant_id = $1 AND (rfid_tag = $2 OR biometric_id = $2)
	`, tenantID, entry.Identifier).Scan(&entityID, &entityType)

	if err != nil {
		// Check employees
		err = s.pool.QueryRow(ctx, `
			SELECT id, 'employee' FROM employees 
			WHERE tenant_id = $1 AND (rfid_tag = $2 OR biometric_id = $2)
		`, tenantID, entry.Identifier).Scan(&entityID, &entityType)
	}

	// 2. Persist log
	var logID string
	err = s.pool.QueryRow(ctx, `
		INSERT INTO biometric_logs (tenant_id, device_id, raw_identifier, entity_type, entity_id, direction, logged_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, tenantID, entry.DeviceID, entry.Identifier,
		ifString(entityID != "", entityType, ""),
		ifString(entityID != "", entityID, nil),
		entry.Direction, entry.Timestamp).Scan(&logID)

	if err != nil {
		return "", fmt.Errorf("failed to save log: %w", err)
	}

	// 3. Trigger Attendance Logic (Asynchronous recommended in production)
	if entityID != "" {
		if entityType == "student" {
			go s.markStudentAttendance(context.Background(), tenantID, entityID, entry.Timestamp)
		} else {
			go s.markStaffAttendance(context.Background(), tenantID, entityID, entry.Timestamp, entry.Direction)
		}
	}

	return logID, nil
}

func (s *BiometricService) markStudentAttendance(ctx context.Context, tenantID, studentID string, ts time.Time) {
	// Resolves student's section and marks them present in today's session
	// This is a bridge to the Attendance service
	// For now, we'll implement the direct DB update to ensure simplicity in this phase
	_, _ = s.pool.Exec(ctx, studentAttendanceUpsertSQL, tenantID, studentID, ts)
}

func (s *BiometricService) markStaffAttendance(ctx context.Context, tenantID, employeeID string, ts time.Time, direction string) {
	// Staff attendance check-in/out logic
	if direction == "in" {
		_, _ = s.pool.Exec(ctx, staffAttendanceCheckInSQL, tenantID, employeeID, ts)
	} else {
		_, _ = s.pool.Exec(ctx, staffAttendanceCheckOutSQL, tenantID, employeeID, ts)
	}
}

func ifString(cond bool, a, b interface{}) interface{} {
	if cond {
		return a
	}
	return b
}

func deviceOnlineStatus(now, lastSeen time.Time) string {
	if now.Sub(lastSeen) < 10*time.Minute {
		return "online"
	}
	return "offline"
}

func hasSQLFragment(q, fragment string) bool {
	return strings.Contains(strings.ToLower(q), strings.ToLower(fragment))
}

type DeviceStatus struct {
	DeviceID   string    `json:"device_id"`
	LastSeen   time.Time `json:"last_seen"`
	TotalToday int       `json:"total_today"`
	Status     string    `json:"status"` // "online", "offline"
}

type LogRow struct {
	ID            string    `json:"id"`
	DeviceID      string    `json:"device_id"`
	RawIdentifier string    `json:"raw_identifier"`
	EntityType    string    `json:"entity_type"`
	EntityName    string    `json:"entity_name"`
	Direction     string    `json:"direction"`
	LoggedAt      time.Time `json:"logged_at"`
}

func (s *BiometricService) ListDevices(ctx context.Context, tenantID string) ([]DeviceStatus, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT 
			device_id,
			MAX(logged_at) as last_seen,
			COUNT(*) FILTER (WHERE logged_at::date = CURRENT_DATE) as total_today
		FROM biometric_logs
		WHERE tenant_id = $1
		GROUP BY device_id
		ORDER BY last_seen DESC
	`, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list devices: %w", err)
	}
	defer rows.Close()

	var devices []DeviceStatus
	for rows.Next() {
		var d DeviceStatus
		if err := rows.Scan(&d.DeviceID, &d.LastSeen, &d.TotalToday); err != nil {
			continue
		}
		d.Status = deviceOnlineStatus(time.Now(), d.LastSeen)
		devices = append(devices, d)
	}
	if devices == nil {
		devices = []DeviceStatus{}
	}
	return devices, nil
}

func (s *BiometricService) ListRecentLogs(ctx context.Context, tenantID string) ([]LogRow, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT 
			bl.id, bl.device_id, bl.raw_identifier,
			COALESCE(bl.entity_type, 'unknown'),
			COALESCE(
				CASE WHEN bl.entity_type = 'student' THEN (SELECT full_name FROM students WHERE id = bl.entity_id::uuid)
				     WHEN bl.entity_type = 'employee' THEN (SELECT full_name FROM employees WHERE id = bl.entity_id::uuid)
				     ELSE bl.raw_identifier END,
				bl.raw_identifier
			),
			COALESCE(bl.direction, 'in'),
			bl.logged_at
		FROM biometric_logs bl
		WHERE bl.tenant_id = $1
		ORDER BY bl.logged_at DESC
		LIMIT 50
	`, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list logs: %w", err)
	}
	defer rows.Close()

	var logs []LogRow
	for rows.Next() {
		var l LogRow
		if err := rows.Scan(&l.ID, &l.DeviceID, &l.RawIdentifier, &l.EntityType, &l.EntityName, &l.Direction, &l.LoggedAt); err != nil {
			continue
		}
		logs = append(logs, l)
	}
	if logs == nil {
		logs = []LogRow{}
	}
	return logs, nil
}
