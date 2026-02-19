package hrms

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type StaffTaskParams struct {
	TenantID    string
	Title       string
	Description string
	Priority    string
	AssignedTo  string
	CreatedBy   string
	DueDate     time.Time
}

func (s *Service) CreateStaffTask(ctx context.Context, p StaffTaskParams) (db.StaffTask, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	
	valAssigned := pgtype.UUID{}
	if p.AssignedTo != "" {
		valAssigned.Scan(p.AssignedTo)
	}

	valCreatedBy := pgtype.UUID{}
	valCreatedBy.Scan(p.CreatedBy)

	var task db.StaffTask
	err := s.pool.QueryRow(ctx, `
		INSERT INTO staff_tasks (tenant_id, title, description, priority, assigned_to, created_by, due_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, tenant_id, title, description, priority, status, assigned_to, created_by, due_date, created_at, updated_at
	`, 
		tID, p.Title, 
		pgtype.Text{String: p.Description, Valid: p.Description != ""},
		p.Priority, valAssigned, valCreatedBy,
		pgtype.Timestamptz{Time: p.DueDate, Valid: !p.DueDate.IsZero()},
	).Scan(
		&task.ID, &task.TenantID, &task.Title, &task.Description, &task.Priority, &task.Status,
		&task.AssignedTo, &task.CreatedBy, &task.DueDate, &task.CreatedAt, &task.UpdatedAt,
	)

	return task, err
}

func (s *Service) ListStaffTasks(ctx context.Context, tenantID, employeeID string) ([]db.StaffTask, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	var rows []db.StaffTask
	query := `SELECT id, tenant_id, title, description, priority, status, assigned_to, created_by, due_date, created_at, updated_at 
	          FROM staff_tasks WHERE tenant_id = $1`
	args := []interface{}{tID}

	if employeeID != "" {
		eID := pgtype.UUID{}
		eID.Scan(employeeID)
		query += " AND assigned_to = $2"
		args = append(args, eID)
	}
	query += " ORDER BY due_date ASC, created_at DESC"

	dbRows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer dbRows.Close()

	for dbRows.Next() {
		var t db.StaffTask
		if err := dbRows.Scan(&t.ID, &t.TenantID, &t.Title, &t.Description, &t.Priority, &t.Status, &t.AssignedTo, &t.CreatedBy, &t.DueDate, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		rows = append(rows, t)
	}

	return rows, nil
}
