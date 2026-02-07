package alumni

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type Service struct {
	q db.Querier
}

func NewService(q db.Querier) *Service {
	return &Service{q: q}
}

// ==================== Alumni ====================

type CreateAlumniParams struct {
	TenantID       string
	StudentID      string
	UserID         string
	FullName       string
	GraduationYear int32
	Batch          string
	Email          string
	Phone          string
	CurrentCompany string
	CurrentRole    string
	LinkedInURL    string
	Bio            string
}

func (s *Service) CreateAlumni(ctx context.Context, p CreateAlumniParams) (db.Alumnus, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	sID := pgtype.UUID{}
	if p.StudentID != "" {
		sID.Scan(p.StudentID)
	}
	uID := pgtype.UUID{}
	if p.UserID != "" {
		uID.Scan(p.UserID)
	}

	return s.q.CreateAlumni(ctx, db.CreateAlumniParams{
		TenantID:       tID,
		StudentID:      sID,
		UserID:         uID,
		FullName:       p.FullName,
		GraduationYear: pgtype.Int4{Int32: p.GraduationYear, Valid: p.GraduationYear > 0},
		Batch:          pgtype.Text{String: p.Batch, Valid: p.Batch != ""},
		Email:          pgtype.Text{String: p.Email, Valid: p.Email != ""},
		Phone:          pgtype.Text{String: p.Phone, Valid: p.Phone != ""},
		CurrentCompany: pgtype.Text{String: p.CurrentCompany, Valid: p.CurrentCompany != ""},
		CurrentRole:    pgtype.Text{String: p.CurrentRole, Valid: p.CurrentRole != ""},
		LinkedinUrl:    pgtype.Text{String: p.LinkedInURL, Valid: p.LinkedInURL != ""},
		Bio:            pgtype.Text{String: p.Bio, Valid: p.Bio != ""},
		IsVerified:     pgtype.Bool{Bool: false, Valid: true},
	})
}

func (s *Service) ListAlumni(ctx context.Context, tenantID string, limit, offset int32) ([]db.Alumnus, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListAlumni(ctx, db.ListAlumniParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}

// ==================== Placement Drives ====================

type CreateDriveParams struct {
	TenantID          string
	CompanyName       string
	RoleTitle         string
	Description       string
	DriveDate         string
	Deadline          string
	MinGraduationYear int32
	MaxGraduationYear int32
	CreatedBy         string
}

func (s *Service) CreatePlacementDrive(ctx context.Context, p CreateDriveParams) (db.PlacementDrive, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	uID := pgtype.UUID{}
	uID.Scan(p.CreatedBy)

	return s.q.CreatePlacementDrive(ctx, db.CreatePlacementDriveParams{
		TenantID:          tID,
		CompanyName:       p.CompanyName,
		RoleTitle:         p.RoleTitle,
		Description:       pgtype.Text{String: p.Description, Valid: p.Description != ""},
		MinGraduationYear: pgtype.Int4{Int32: p.MinGraduationYear, Valid: p.MinGraduationYear > 0},
		MaxGraduationYear: pgtype.Int4{Int32: p.MaxGraduationYear, Valid: p.MaxGraduationYear > 0},
		Status:            "upcoming",
		CreatedBy:         uID,
	})
}

func (s *Service) ListPlacementDrives(ctx context.Context, tenantID string, limit, offset int32) ([]db.PlacementDrive, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListPlacementDrives(ctx, db.ListPlacementDrivesParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}

// ==================== Applications ====================

func (s *Service) ApplyToDrive(ctx context.Context, driveID, alumniID, resumeURL, coverLetter string) (db.PlacementApplication, error) {
	dID := pgtype.UUID{}
	dID.Scan(driveID)
	aID := pgtype.UUID{}
	aID.Scan(alumniID)

	return s.q.CreatePlacementApplication(ctx, db.CreatePlacementApplicationParams{
		DriveID:     dID,
		AlumniID:    aID,
		ResumeUrl:   pgtype.Text{String: resumeURL, Valid: resumeURL != ""},
		CoverLetter: pgtype.Text{String: coverLetter, Valid: coverLetter != ""},
		Status:      "applied",
	})
}

func (s *Service) ListDriveApplications(ctx context.Context, driveID string) ([]db.ListDriveApplicationsRow, error) {
	dID := pgtype.UUID{}
	dID.Scan(driveID)
	return s.q.ListDriveApplications(ctx, dID)
}

func (s *Service) UpdateApplicationStatus(ctx context.Context, applicationID, status string) (db.PlacementApplication, error) {
	aID := pgtype.UUID{}
	aID.Scan(applicationID)
	return s.q.UpdateApplicationStatus(ctx, db.UpdateApplicationStatusParams{
		ID:     aID,
		Status: status,
	})
}
