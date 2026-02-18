package attendance

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/approvals"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/locks"
	"github.com/schoolerp/api/internal/foundation/policy"
)

type Service struct {
	q         db.Querier
	audit     *audit.Logger
	policy    *policy.Evaluator
	approvals *approvals.Service
	locks     *locks.Service
}

func NewService(q db.Querier, audit *audit.Logger, poly *policy.Evaluator, app *approvals.Service, lks *locks.Service) *Service {
	return &Service{q: q, audit: audit, policy: poly, approvals: app, locks: lks}
}

type MarkAttendanceParams struct {
	TenantID       string
	ClassSectionID string
	Date           time.Time
	Entries        []AttendanceEntry
	OverrideReason string

	// Context
	UserID    string
	Role      string
	RequestID string
	IP        string
}

type AttendanceEntry struct {
	StudentID string
	Status    string
	Remarks   string
}

var errAttendanceApprovalRequired = errors.New("attendance change requires approval")

func IsApprovalRequiredError(err error) bool {
	return errors.Is(err, errAttendanceApprovalRequired)
}

func (s *Service) getAttendanceRuleConfig(ctx context.Context, tenantID, role string) (map[string]any, error) {
	decision, err := s.policy.Evaluate(ctx, policy.Context{
		TenantID: tenantID,
		Module:   "attendance",
		Action:   "settings",
		Role:     role,
	})
	if err != nil {
		return nil, err
	}
	if decision.Config == nil {
		return map[string]any{}, nil
	}
	return decision.Config, nil
}

func boolConfig(config map[string]any, key string, fallback bool) bool {
	value, ok := config[key]
	if !ok {
		return fallback
	}
	b, ok := value.(bool)
	if !ok {
		return fallback
	}
	return b
}

func intConfig(config map[string]any, key string, fallback int) int {
	value, ok := config[key]
	if !ok {
		return fallback
	}
	switch v := value.(type) {
	case float64:
		return int(v)
	case int:
		return v
	case string:
		parsed, err := strconv.Atoi(v)
		if err == nil {
			return parsed
		}
	}
	return fallback
}

func isPastConfiguredLockDate(target, now time.Time) bool {
	if now.Day() < 5 {
		return false
	}

	startOfCurrentMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	targetMonth := time.Date(target.Year(), target.Month(), 1, 0, 0, 0, 0, target.Location())
	return targetMonth.Before(startOfCurrentMonth)
}

func attendanceEntryStatusAllowed(status string) bool {
	switch status {
	case "present", "absent", "late", "excused":
		return true
	default:
		return false
	}
}

func (s *Service) MarkAttendance(ctx context.Context, p MarkAttendanceParams) error {
	if strings.TrimSpace(p.ClassSectionID) == "" {
		return errors.New("class_section_id is required")
	}
	if len(p.Entries) == 0 {
		return errors.New("attendance entries are required")
	}

	for _, e := range p.Entries {
		if strings.TrimSpace(e.StudentID) == "" {
			return errors.New("student_id is required for all attendance entries")
		}
		if !attendanceEntryStatusAllowed(strings.TrimSpace(e.Status)) {
			return fmt.Errorf("invalid attendance status: %s", e.Status)
		}
	}

	locked, err := s.locks.IsLocked(ctx, p.TenantID, "attendance", nil)
	if err != nil {
		return err
	}
	if locked {
		return errors.New("attendance module is locked")
	}

	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	csUUID := pgtype.UUID{}
	csUUID.Scan(p.ClassSectionID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	markDecision, err := s.policy.Evaluate(ctx, policy.Context{
		TenantID: p.TenantID,
		Module:   "attendance",
		Action:   "mark",
		Role:     p.Role,
	})
	if err != nil {
		return err
	}
	if !markDecision.Allowed {
		return fmt.Errorf("action denied: %s", markDecision.DenialReason)
	}

	ruleConfig, err := s.getAttendanceRuleConfig(ctx, p.TenantID, p.Role)
	if err != nil {
		return err
	}

	editWindowHours := intConfig(ruleConfig, "edit_window_hours", 48)
	requireReasonForEdits := boolConfig(ruleConfig, "require_reason_for_edits", false) || markDecision.ReasonRequired
	lockPreviousMonths := boolConfig(ruleConfig, "lock_previous_months", false)
	requireApprovalAfterWindow := boolConfig(ruleConfig, "require_approval_after_window", false) || markDecision.RequiresApproval

	_, err = s.q.GetAttendanceSession(ctx, db.GetAttendanceSessionParams{
		TenantID:       tUUID,
		ClassSectionID: csUUID,
		Date:           pgtype.Date{Time: p.Date, Valid: true},
	})
	isEdit := err == nil

	now := time.Now()
	hoursSinceDate := now.Sub(time.Date(p.Date.Year(), p.Date.Month(), p.Date.Day(), 23, 59, 59, 0, now.Location())).Hours()
	outsideWindow := isEdit && editWindowHours >= 0 && hoursSinceDate > float64(editWindowHours)
	monthLocked := lockPreviousMonths && isPastConfiguredLockDate(p.Date, now)

	reason := strings.TrimSpace(p.OverrideReason)
	if (outsideWindow || monthLocked || (isEdit && requireReasonForEdits)) && reason == "" {
		return errors.New("override_reason is required for attendance override")
	}

	if outsideWindow || monthLocked || requireApprovalAfterWindow {
		approvalPayload := map[string]any{
			"class_section_id": p.ClassSectionID,
			"date":             p.Date.Format("2006-01-02"),
			"reason":           reason,
			"entries":          p.Entries,
			"outside_window":   outsideWindow,
			"month_locked":     monthLocked,
		}
		if _, createErr := s.approvals.CreateRequest(ctx, p.TenantID, p.UserID, "attendance", "attendance_override", p.ClassSectionID, approvalPayload); createErr != nil {
			return createErr
		}

		s.audit.Log(ctx, audit.Entry{
			TenantID:     tUUID,
			UserID:       uUUID,
			RequestID:    p.RequestID,
			Action:       "attendance_override_requested",
			ResourceType: "attendance_session",
			ReasonCode:   reason,
			IPAddress:    p.IP,
		})

		return errAttendanceApprovalRequired
	}

	// 2. Create/Update Session
	session, err := s.q.CreateAttendanceSession(ctx, db.CreateAttendanceSessionParams{
		TenantID:       tUUID,
		ClassSectionID: csUUID,
		Date:           pgtype.Date{Time: p.Date, Valid: true},
		MarkedBy:       uUUID,
	})
	if err != nil {
		return err
	}

	// 3. Clear existing entries for this session (if any) and batch insert
	// In a real production app, we might use a transition to keep history
	err = s.q.DeleteAttendanceEntries(ctx, session.ID)
	if err != nil {
		return err
	}

	var batchEntries []db.BatchUpsertAttendanceEntriesParams
	for _, e := range p.Entries {
		stUUID := pgtype.UUID{}
		stUUID.Scan(e.StudentID)
		batchEntries = append(batchEntries, db.BatchUpsertAttendanceEntriesParams{
			SessionID: session.ID,
			StudentID: stUUID,
			Status:    e.Status,
			Remarks:   pgtype.Text{String: e.Remarks, Valid: e.Remarks != ""},
		})
	}

	// SQLC generate uses CopyFrom for BatchUpsert
	_, err = s.q.BatchUpsertAttendanceEntries(ctx, batchEntries)
	if err != nil {
		return err
	}

	// 4. Audit Log
	s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "mark_attendance",
		ResourceType: "attendance_session",
		ResourceID:   session.ID,
		ReasonCode:   reason,
		IPAddress:    p.IP,
	})

	// 5. Outbox Events for Notifications
	for _, e := range p.Entries {
		if e.Status == "absent" {
			payload, _ := json.Marshal(map[string]interface{}{
				"student_id":       e.StudentID,
				"class_section_id": p.ClassSectionID,
				"date":             p.Date.Format("2006-01-02"),
				"marked_by":        p.UserID,
			})
			_, _ = s.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
				TenantID:  tUUID,
				EventType: "attendance.absent",
				Payload:   payload,
			})
		}
	}

	return nil
}

func (s *Service) GetSession(ctx context.Context, tenantID, classSectionID string, date time.Time) (db.AttendanceSession, []db.GetAttendanceEntriesRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	csUUID := pgtype.UUID{}
	csUUID.Scan(classSectionID)

	session, err := s.q.GetAttendanceSession(ctx, db.GetAttendanceSessionParams{
		TenantID:       tUUID,
		ClassSectionID: csUUID,
		Date:           pgtype.Date{Time: date, Valid: true},
	})
	if err != nil {
		return db.AttendanceSession{}, nil, err
	}

	entries, err := s.q.GetAttendanceEntries(ctx, session.ID)
	return session, entries, err
}

func (s *Service) ListPolicies(ctx context.Context, tenantID string) ([]db.Policy, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListPolicies(ctx, tUUID)
}

func (s *Service) UpdatePolicy(ctx context.Context, tenantID, module, action string, logic json.RawMessage, active bool) (db.Policy, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	return s.q.UpdateOrCreatePolicy(ctx, db.UpdateOrCreatePolicyParams{
		TenantID: tUUID,
		Module:   module,
		Action:   action,
		Logic:    logic,
		IsActive: pgtype.Bool{Bool: active, Valid: true},
	})
}

func (s *Service) GetDailyStats(ctx context.Context, tenantID string, date time.Time) (db.GetDailyAttendanceStatsRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	return s.q.GetDailyAttendanceStats(ctx, db.GetDailyAttendanceStatsParams{
		TenantID: tUUID,
		Date:     pgtype.Date{Time: date, Valid: true},
	})
}

func (s *Service) GetEmergencyLockStatus(ctx context.Context, tenantID string) (bool, error) {
	return s.locks.IsLocked(ctx, tenantID, "attendance", nil)
}

func (s *Service) EnableEmergencyLock(ctx context.Context, tenantID, userID, reason string) error {
	locked, err := s.GetEmergencyLockStatus(ctx, tenantID)
	if err != nil {
		return err
	}
	if locked {
		return nil
	}
	_, err = s.locks.Lock(ctx, tenantID, "attendance", nil, userID, reason)
	return err
}

func (s *Service) DisableEmergencyLock(ctx context.Context, tenantID string) error {
	return s.locks.Unlock(ctx, tenantID, "attendance", nil)
}
