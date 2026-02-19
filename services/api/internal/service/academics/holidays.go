package academics

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type Holiday struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Date  string `json:"date"`
	Type  string `json:"type"`
}

func (s *Service) CreateHoliday(ctx context.Context, tenantID, name, date, hType string) (db.Holiday, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	var hDate pgtype.Date
	hDate.Scan(date)

	return s.q.CreateHoliday(ctx, db.CreateHolidayParams{
		TenantID:    tID,
		Name:        name,
		HolidayDate: hDate,
		HolidayType: hType,
	})
}

func (s *Service) ListHolidays(ctx context.Context, tenantID, startDate, endDate string) ([]db.Holiday, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	var sDate, eDate pgtype.Date
	sDate.Scan(startDate)
	eDate.Scan(endDate)

	return s.q.ListHolidays(ctx, db.ListHolidaysParams{
		TenantID:    tID,
		HolidayDate: sDate,
		HolidayDate_2: eDate,
	})
}

func (s *Service) DeleteHoliday(ctx context.Context, tenantID, id string) error {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	uID := pgtype.UUID{}
	uID.Scan(id)

	return s.q.DeleteHoliday(ctx, db.DeleteHolidayParams{
		ID:       uID,
		TenantID: tID,
	})
}
