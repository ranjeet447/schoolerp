package sis

import (
	"context"

	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

func (s *StudentService) CreateStudentRemark(ctx context.Context, arg db.CreateStudentRemarkParams) (db.StudentRemark, error) {
	remark, err := s.q.CreateStudentRemark(ctx, arg)
	if err != nil {
		return db.StudentRemark{}, err
	}

	_ = s.audit.Log(ctx, audit.Entry{
TenantID:     arg.TenantID,
UserID:       arg.PostedBy,
Action:       "sis.create_remark",
ResourceType: "student_remark",
ResourceID:   remark.ID,
After:        remark,
})

	return remark, nil
}

func (s *StudentService) ListStudentRemarks(ctx context.Context, arg db.ListStudentRemarksParams) ([]db.ListStudentRemarksRow, error) {
	return s.q.ListStudentRemarks(ctx, arg)
}

func (s *StudentService) AcknowledgeStudentRemark(ctx context.Context, arg db.AcknowledgeStudentRemarkParams) (db.StudentRemark, error) {
	remark, err := s.q.AcknowledgeStudentRemark(ctx, arg)
	if err != nil {
		return db.StudentRemark{}, err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     arg.TenantID,
		UserID:       arg.AckByUserID,
		Action:       "sis.acknowledge_remark",
		ResourceType: "student_remark",
		ResourceID:   remark.ID,
		After:        remark,
	})

	return remark, nil
}
