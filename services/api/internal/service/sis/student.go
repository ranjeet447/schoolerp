package sis

import (
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/quota"
)

type StudentService struct {
	q     db.Querier
	audit *audit.Logger
	quota *quota.Service
}

func NewStudentService(q db.Querier, audit *audit.Logger, quota *quota.Service) *StudentService {
	return &StudentService{q: q, audit: audit, quota: quota}
}

type CreateStudentParams struct {
	TenantID        string
	AdmissionNumber string
	FullName        string
	DOB             pgtype.Date
	Gender          string
	SectionID       string
	Status          string

	// Audit Context
	UserID    string
	RequestID string
	IP        string
}

func (s *StudentService) CreateStudent(ctx context.Context, p CreateStudentParams) (db.Student, error) {
	// 0. Quota Check
	if s.quota != nil {
		if err := s.quota.CheckQuota(ctx, p.TenantID, quota.QuotaStudents); err != nil {
			return db.Student{}, err
		}
	}

	// 1. Convert IDs
	tenantUUID := pgtype.UUID{}
	tenantUUID.Scan(p.TenantID)

	sectionUUID := pgtype.UUID{}
	if p.SectionID != "" {
		sectionUUID.Scan(p.SectionID)
	}

	// 2. DB Insert
	arg := db.CreateStudentParams{
		TenantID:        tenantUUID,
		AdmissionNumber: p.AdmissionNumber,
		FullName:        p.FullName,
		DateOfBirth:     p.DOB,
		Gender:          pgtype.Text{String: p.Gender, Valid: p.Gender != ""},
		SectionID:       sectionUUID,
		Status:          pgtype.Text{String: p.Status, Valid: p.Status != ""},
	}

	student, err := s.q.CreateStudent(ctx, arg)
	if err != nil {
		return db.Student{}, err
	}

	// 3. Audit Log
	userUUID := pgtype.UUID{}
	userUUID.Scan(p.UserID)

	// We audit asynchronously or synchronously depending on requirements.
	// For Release 1 consistency, sync is safer.
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tenantUUID,
		UserID:       userUUID,
		RequestID:    p.RequestID,
		Action:       "student.create",
		ResourceType: "student",
		ResourceID:   student.ID,
		After:        student,
		IPAddress:    p.IP,
	})

	return student, nil
}

func (s *StudentService) ListStudents(ctx context.Context, tenantID string, limit, offset int32) ([]db.ListStudentsRow, error) {
	tenantUUID := pgtype.UUID{}
	tenantUUID.Scan(tenantID)

	return s.q.ListStudents(ctx, db.ListStudentsParams{
		TenantID: tenantUUID,
		Limit:    limit,
		Offset:   offset,
	})
}

func (s *StudentService) SearchStudents(ctx context.Context, tenantID, userID, role, query string, limit int32) ([]db.SearchStudentsRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	var sectionIDs []pgtype.UUID
	var classIDs []pgtype.UUID

	// If role is teacher, restrict search to assigned classes/sections
	if role == "teacher" {
		queries := s.q.(*db.Queries)
		scopes, err := queries.ListUserRoleAssignmentsByScope(ctx, uUUID, tUUID, "teacher")
		if err != nil {
			return nil, err
		}

		for _, sc := range scopes {
			if sc.ScopeType == "section" && sc.ScopeID.Valid {
				sectionIDs = append(sectionIDs, sc.ScopeID)
			} else if sc.ScopeType == "class" && sc.ScopeID.Valid {
				classIDs = append(classIDs, sc.ScopeID)
			}
		}

		// If teacher has no assignments, return empty list (scoped to "none")
		if len(sectionIDs) == 0 && len(classIDs) == 0 {
			return []db.SearchStudentsRow{}, nil
		}
	}

	return s.q.SearchStudents(ctx, db.SearchStudentsParams{
		TenantID: tUUID,
		Column2:  query,
		Column3:  sectionIDs,
		Column4:  classIDs,
		Limit:    limit,
	})
}

func (s *StudentService) GetStudent(ctx context.Context, tenantID, studentID string) (db.GetStudentRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)

	return s.q.GetStudent(ctx, db.GetStudentParams{
		ID:       sUUID,
		TenantID: tUUID,
	})
}

type UpdateStudentParams struct {
	ID        string
	TenantID  string
	FullName  string
	DOB       pgtype.Date
	Gender    string
	SectionID string
	Status    string

	// Audit Context
	UserID    string
	RequestID string
	IP        string
}

func (s *StudentService) ListChildrenByParent(ctx context.Context, tenantID, userID string) ([]db.GetChildrenByParentUserRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	return s.q.GetChildrenByParentUser(ctx, db.GetChildrenByParentUserParams{
		UserID:   uUUID,
		TenantID: tUUID,
	})
}

func (s *StudentService) UpdateStudent(ctx context.Context, p UpdateStudentParams) (db.Student, error) {
	stUUID := pgtype.UUID{}
	stUUID.Scan(p.ID)

	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	secUUID := pgtype.UUID{}
	if p.SectionID != "" {
		secUUID.Scan(p.SectionID)
	}

	before, _ := s.q.GetStudent(ctx, db.GetStudentParams{ID: stUUID, TenantID: tUUID})

	student, err := s.q.UpdateStudent(ctx, db.UpdateStudentParams{
		ID:          stUUID,
		TenantID:    tUUID,
		FullName:    p.FullName,
		DateOfBirth: p.DOB,
		Gender:      pgtype.Text{String: p.Gender, Valid: p.Gender != ""},
		SectionID:   secUUID,
		Status:      pgtype.Text{String: p.Status, Valid: p.Status != ""},
	})
	if err != nil {
		return db.Student{}, err
	}

	userUUID := pgtype.UUID{}
	userUUID.Scan(p.UserID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       userUUID,
		RequestID:    p.RequestID,
		Action:       "student.update",
		ResourceType: "student",
		ResourceID:   student.ID,
		Before:       before,
		After:        student,
		IPAddress:    p.IP,
	})

	return student, nil
}

func (s *StudentService) DeleteStudent(ctx context.Context, tenantID, studentID, userID, reqID, ip string) error {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)

	before, _ := s.q.GetStudent(ctx, db.GetStudentParams{ID: sUUID, TenantID: tUUID})

	err := s.q.DeleteStudent(ctx, db.DeleteStudentParams{
		ID:       sUUID,
		TenantID: tUUID,
	})
	if err != nil {
		return err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)
	
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    reqID,
		Action:       "student.delete",
		ResourceType: "student",
		ResourceID:   sUUID,
		Before:       before,
		IPAddress:    ip,
	})

	return nil
}

func (s *StudentService) UpdateStudentStatus(ctx context.Context, tenantID, studentID, status, userID, reqID, ip string) error {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)

	err := s.q.UpdateStudentStatus(ctx, db.UpdateStudentStatusParams{
		ID:       sUUID,
		TenantID: tUUID,
		Status:   pgtype.Text{String: status, Valid: status != ""},
	})
	if err != nil {
		return err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    reqID,
		Action:       "student.update_status",
		ResourceType: "student",
		ResourceID:   sUUID,
		After:        map[string]interface{}{"status": status},
		IPAddress:    ip,
	})

	return nil
}

// Guardian Management

type CreateGuardianParams struct {
	TenantID  string
	StudentID string
	FullName  string
	Phone     string
	Email     string
	Address   string
	Relation  string
	IsPrimary bool

	// Audit
	UserID    string
	RequestID string
	IP        string
}

func (s *StudentService) AddGuardian(ctx context.Context, p CreateGuardianParams) (db.Guardian, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	sUUID := pgtype.UUID{}
	sUUID.Scan(p.StudentID)

	guardian, err := s.q.CreateGuardian(ctx, db.CreateGuardianParams{
		TenantID: tUUID,
		FullName: p.FullName,
		Phone:    p.Phone,
		Email:    pgtype.Text{String: p.Email, Valid: p.Email != ""},
		Address:  pgtype.Text{String: p.Address, Valid: p.Address != ""},
	})
	if err != nil {
		return db.Guardian{}, err
	}

	err = s.q.LinkStudentGuardian(ctx, db.LinkStudentGuardianParams{
		StudentID:    sUUID,
		GuardianID:   guardian.ID,
		Relationship: p.Relation,
		IsPrimary:    pgtype.Bool{Bool: p.IsPrimary, Valid: true},
	})

	if err != nil {
		return guardian, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "student.add_guardian",
		ResourceType: "guardian",
		ResourceID:   guardian.ID,
		After:        guardian,
		IPAddress:    p.IP,
	})

	return guardian, nil
}

func (s *StudentService) GetStudentGuardians(ctx context.Context, tenantID, studentID string) ([]db.GetStudentGuardiansRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)

	if _, err := s.q.GetStudent(ctx, db.GetStudentParams{ID: sUUID, TenantID: tUUID}); err != nil {
		return nil, err
	}

	return s.q.GetStudentGuardians(ctx, sUUID)
}

// Academic Structure (Wrappers)

func (s *StudentService) CreateClass(ctx context.Context, tenantID string, name string, level int32, stream, userID, reqID, ip string) (db.Class, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	class, err := s.q.CreateClass(ctx, db.CreateClassParams{
		TenantID: tUUID,
		Name:     name,
		Level:    pgtype.Int4{Int32: level, Valid: true},
		Stream:   pgtype.Text{String: strings.TrimSpace(stream), Valid: strings.TrimSpace(stream) != ""},
	})
	if err != nil {
		return db.Class{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    reqID,
		Action:       "academic.create_class",
		ResourceType: "class",
		ResourceID:   class.ID,
		After:        class,
		IPAddress:    ip,
	})

	return class, nil
}

func (s *StudentService) CreateSection(ctx context.Context, tenantID string, classID string, name string, userID, reqID, ip string) (db.Section, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	cUUID := pgtype.UUID{}
	cUUID.Scan(classID)

	section, err := s.q.CreateSection(ctx, db.CreateSectionParams{
		TenantID: tUUID,
		ClassID:  cUUID,
		Name:     name,
	})
	if err != nil {
		return db.Section{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    reqID,
		Action:       "academic.create_section",
		ResourceType: "section",
		ResourceID:   section.ID,
		After:        section,
		IPAddress:    ip,
	})

	return section, nil
}

func (s *StudentService) ListAcademicStructure(ctx context.Context, tenantID string) ([]db.Class, []db.Section, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	classes, err := s.q.ListClasses(ctx, tUUID)
	if err != nil {
		return nil, nil, err
	}

	sections, err := s.q.ListSectionsByTenant(ctx, tUUID)
	if err != nil {
		return classes, nil, err
	}

	return classes, sections, nil
}

func (s *StudentService) CreateAcademicYear(ctx context.Context, tenantID, name, startDate, endDate, userID, reqID, ip string) (db.AcademicYear, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	start := pgtype.Date{}
	if err := start.Scan(startDate); err != nil {
		return db.AcademicYear{}, err
	}

	end := pgtype.Date{}
	if err := end.Scan(endDate); err != nil {
		return db.AcademicYear{}, err
	}

	year, err := s.q.CreateAcademicYear(ctx, db.CreateAcademicYearParams{
		TenantID:  tUUID,
		Name:      name,
		StartDate: start,
		EndDate:   end,
		IsActive:  pgtype.Bool{Bool: true, Valid: true},
	})
	if err != nil {
		return db.AcademicYear{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    reqID,
		Action:       "academic.create_year",
		ResourceType: "academic_year",
		ResourceID:   year.ID,
		After:        year,
		IPAddress:    ip,
	})

	return year, nil
}

func (s *StudentService) ListAcademicYears(ctx context.Context, tenantID string) ([]db.AcademicYear, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListAcademicYears(ctx, tUUID)
}

func (s *StudentService) ListSectionsByClass(ctx context.Context, classID string) ([]db.Section, error) {
	cUUID := pgtype.UUID{}
	cUUID.Scan(classID)
	return s.q.ListSectionsByClass(ctx, cUUID)
}

func (s *StudentService) CreateSubject(ctx context.Context, tenantID, name, code, subjectType, userID, reqID, ip string) (db.Subject, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	subject, err := s.q.CreateSubject(ctx, db.CreateSubjectParams{
		TenantID: tUUID,
		Name:     name,
		Code:     pgtype.Text{String: strings.TrimSpace(code), Valid: strings.TrimSpace(code) != ""},
		Type:     pgtype.Text{String: strings.TrimSpace(subjectType), Valid: strings.TrimSpace(subjectType) != ""},
	})
	if err != nil {
		return db.Subject{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    reqID,
		Action:       "academic.create_subject",
		ResourceType: "subject",
		ResourceID:   subject.ID,
		After:        subject,
		IPAddress:    ip,
	})

	return subject, nil
}

func (s *StudentService) ListSubjects(ctx context.Context, tenantID string) ([]db.Subject, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListSubjects(ctx, tUUID)
}

// Student Import logic

type ImportResult struct {
	TotalRows    int      `json:"total_rows"`
	SuccessCount int      `json:"success_count"`
	Errors       []string `json:"errors"`
}

func (s *StudentService) ImportStudents(ctx context.Context, tenantID string, r io.Reader, userID, reqID, ip string) (ImportResult, error) {
	reader := csv.NewReader(r)

	// Skip header
	_, err := reader.Read()
	if err != nil {
		return ImportResult{}, fmt.Errorf("failed to read header: %w", err)
	}

	result := ImportResult{}

	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("failed to read row: %v", err))
			continue
		}

		result.TotalRows++

		// Basic mapping: [admission_no, full_name, gender, dob]
		if len(record) < 2 {
			result.Errors = append(result.Errors, fmt.Sprintf("row %d: insufficient columns", result.TotalRows))
			continue
		}

		admNo := record[0]
		name := record[1]
		gender := ""
		if len(record) > 2 {
			gender = record[2]
		}

		// Use CreateStudent logic
		_, err = s.CreateStudent(ctx, CreateStudentParams{
			TenantID:        tenantID,
			AdmissionNumber: admNo,
			FullName:        name,
			Gender:          gender,
			Status:          "active",
			UserID:          userID,
			RequestID:       reqID,
			IP:              ip,
		})

		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("row %d (%s): %v", result.TotalRows, admNo, err))
		} else {
			result.SuccessCount++
		}
	}

	return result, nil
}

func (s *StudentService) AddStudentDocument(ctx context.Context, tenantID, studentID, fileID, docType, note string) (db.StudentDocument, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)

	fUUID := pgtype.UUID{}
	fUUID.Scan(fileID)

	return s.q.CreateStudentDocument(ctx, db.CreateStudentDocumentParams{
		TenantID:  tUUID,
		StudentID: sUUID,
		FileID:    fUUID,
		Type:      docType,
		Note:      pgtype.Text{String: note, Valid: note != ""},
	})
}
