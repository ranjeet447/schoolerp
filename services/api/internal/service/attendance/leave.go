package attendance

import (
	"context"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

func (s *Service) CreateLeaveRequest(ctx context.Context, tenantID, studentID string, from, to time.Time, reason string) (db.LeaveRequest, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)

	return s.q.CreateLeaveRequest(ctx, db.CreateLeaveRequestParams{
		TenantID:  tUUID,
		StudentID: sUUID,
		FromDate:  pgtype.Date{Time: from, Valid: true},
		ToDate:    pgtype.Date{Time: to, Valid: true},
		Reason:    pgtype.Text{String: reason, Valid: reason != ""},
	})
}

func (s *Service) ListLeaves(ctx context.Context, tenantID string, status string) ([]db.ListLeaveRequestsRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	return s.q.ListLeaveRequests(ctx, db.ListLeaveRequestsParams{
		TenantID: tUUID,
		Status:   pgtype.Text{String: status, Valid: status != ""},
	})
}

func (s *Service) ListLeavesForParent(ctx context.Context, tenantID, userID, status, studentID string) ([]db.ListLeaveRequestsRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	children, err := s.q.GetChildrenByParentUser(ctx, db.GetChildrenByParentUserParams{
		UserID:   uUUID,
		TenantID: tUUID,
	})
	if err != nil {
		return nil, err
	}

	allowedStudentIDs := map[[16]byte]bool{}
	for _, child := range children {
		if child.ID.Valid {
			allowedStudentIDs[child.ID.Bytes] = true
		}
	}

	if len(allowedStudentIDs) == 0 {
		return []db.ListLeaveRequestsRow{}, nil
	}

	allLeaves, err := s.q.ListLeaveRequests(ctx, db.ListLeaveRequestsParams{
		TenantID: tUUID,
		Status:   pgtype.Text{String: status, Valid: strings.TrimSpace(status) != ""},
	})
	if err != nil {
		return nil, err
	}

	var filterUUID pgtype.UUID
	if strings.TrimSpace(studentID) != "" {
		if err := filterUUID.Scan(studentID); err != nil {
			return []db.ListLeaveRequestsRow{}, nil
		}
	}

	filtered := make([]db.ListLeaveRequestsRow, 0, len(allLeaves))
	for _, leave := range allLeaves {
		if !leave.StudentID.Valid || !allowedStudentIDs[leave.StudentID.Bytes] {
			continue
		}
		if filterUUID.Valid && leave.StudentID.Bytes != filterUUID.Bytes {
			continue
		}
		filtered = append(filtered, leave)
	}

	return filtered, nil
}

func (s *Service) ProcessLeave(ctx context.Context, tenantID, requestID, status, userID string) (db.LeaveRequest, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	rUUID := pgtype.UUID{}
	rUUID.Scan(requestID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	return s.q.UpdateLeaveStatus(ctx, db.UpdateLeaveStatusParams{
		ID:        rUUID,
		TenantID:  tUUID,
		Status:    pgtype.Text{String: status, Valid: true},
		DecidedBy: uUUID,
	})
}
