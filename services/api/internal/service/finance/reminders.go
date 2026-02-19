package finance

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type ReminderConfigParams struct {
	TenantID     string `json:"tenant_id"`
	DaysOffset   int32  `json:"days_offset"`
	ReminderType string `json:"reminder_type"`
	IsActive     bool   `json:"is_active"`
}

func (s *Service) UpsertFeeReminderConfig(ctx context.Context, p ReminderConfigParams) (db.FeeReminderConfig, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	return s.q.UpsertFeeReminderConfig(ctx, db.UpsertFeeReminderConfigParams{
		TenantID:     tUUID,
		DaysOffset:   p.DaysOffset,
		ReminderType: p.ReminderType,
		IsActive:     pgtype.Bool{Bool: p.IsActive, Valid: true},
	})
}

func (s *Service) ListFeeReminderConfigs(ctx context.Context, tenantID string) ([]db.FeeReminderConfig, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	return s.q.ListFeeReminderConfigs(ctx, tUUID)
}

func (s *Service) GetActiveReminderConfigs(ctx context.Context) ([]db.FeeReminderConfig, error) {
	return s.q.GetActiveReminderConfigs(ctx)
}

func (s *Service) GetStudentsForFeeReminder(ctx context.Context, tenantID, ayID, configID string, offset int32, targetDate pgtype.Date) ([]db.GetStudentsForFeeReminderRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	ayUUID := pgtype.UUID{}
	ayUUID.Scan(ayID)
	cUUID := pgtype.UUID{}
	cUUID.Scan(configID)

	targetDueDate := pgtype.Date{
		Time:  targetDate.Time.AddDate(0, 0, -int(offset)),
		Valid: true,
	}

	return s.q.GetStudentsForFeeReminder(ctx, db.GetStudentsForFeeReminderParams{
		TenantID:         tUUID,
		AcademicYearID:   ayUUID,
		ReminderConfigID: cUUID,
		TargetDueDate:    targetDueDate,
	})
}

func (s *Service) LogFeeReminder(ctx context.Context, tenantID, studentID, headID, configID string) error {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)
	hUUID := pgtype.UUID{}
	hUUID.Scan(headID)
	cUUID := pgtype.UUID{}
	cUUID.Scan(configID)

	_, err := s.q.LogFeeReminder(ctx, db.LogFeeReminderParams{
		TenantID:         tUUID,
		StudentID:        sUUID,
		FeeHeadID:        hUUID,
		ReminderConfigID: cUUID,
	})
	return err
}
