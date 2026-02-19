package academics

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type Service struct {
	q     db.Querier
	audit *audit.Logger
}

type TimetableEntry struct {
	ID        string `json:"id"`
	ClassID   string `json:"class_id"`
	SectionID string `json:"section_id"`
	Weekday   string `json:"weekday"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	SubjectID string `json:"subject_id"`
	TeacherID string `json:"teacher_id"`
	Room      string `json:"room,omitempty"`
}

type CertificateType string
type CertificateStatus string

const (
	CertificateTypeTransfer  CertificateType = "transfer_certificate"
	CertificateTypeBonafide  CertificateType = "bonafide_certificate"
	CertificateTypeCharacter CertificateType = "character_certificate"
)

const (
	CertificateStatusPending  CertificateStatus = "pending"
	CertificateStatusApproved CertificateStatus = "approved"
	CertificateStatusRejected CertificateStatus = "rejected"
	CertificateStatusIssued   CertificateStatus = "issued"
)

type CertificateRequest struct {
	ID                string            `json:"id"`
	StudentID         string            `json:"student_id"`
	StudentName       string            `json:"student_name"`
	AdmissionNumber   string            `json:"admission_number"`
	Type              CertificateType   `json:"type"`
	Reason            string            `json:"reason"`
	RequestedOn       string            `json:"requested_on"`
	Status            CertificateStatus `json:"status"`
	ReviewedBy        string            `json:"reviewed_by,omitempty"`
	Remarks           string            `json:"remarks,omitempty"`
	IssueDate         string            `json:"issue_date,omitempty"`
	CertificateNumber string            `json:"certificate_number,omitempty"`
	UpdatedAt         string            `json:"updated_at"`
}

type CreateCertificateRequestParams struct {
	TenantID    string
	StudentID   string
	Type        CertificateType
	Reason      string
	RequestedOn string
	UserID      string
	RequestID   string
	IP          string
}

func NewService(q db.Querier, audit *audit.Logger) *Service {
	return &Service{q: q, audit: audit}
}

type CreateHomeworkParams struct {
	TenantID       string
	SubjectID      string
	ClassSectionID string
	TeacherID      string
	Title          string
	Description    string
	DueDate        pgtype.Timestamptz
	Attachments    []byte // JSONB

	// Audit
	UserID    string
	RequestID string
	IP        string
}

type HomeworkClassSectionOption struct {
	ID        string `json:"id"`
	ClassID   string `json:"class_id"`
	ClassName string `json:"class_name"`
	Name      string `json:"name"`
	Label     string `json:"label"`
}

type HomeworkSubjectOption struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Code string `json:"code,omitempty"`
	Type string `json:"type,omitempty"`
}

type HomeworkOptions struct {
	ClassSections []HomeworkClassSectionOption `json:"class_sections"`
	Subjects      []HomeworkSubjectOption      `json:"subjects"`
}

func (s *Service) CreateHomework(ctx context.Context, p CreateHomeworkParams) (db.Homework, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(p.SubjectID)
	csUUID := pgtype.UUID{}
	csUUID.Scan(p.ClassSectionID)
	teachUUID := pgtype.UUID{}
	teachUUID.Scan(p.TeacherID)

	hw, err := s.q.CreateHomework(ctx, db.CreateHomeworkParams{
		TenantID:       tUUID,
		SubjectID:      sUUID,
		ClassSectionID: csUUID,
		TeacherID:      teachUUID,
		Title:          p.Title,
		Description:    pgtype.Text{String: p.Description, Valid: p.Description != ""},
		DueDate:        p.DueDate,
		Attachments:    p.Attachments,
	})
	if err != nil {
		return db.Homework{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "homework.create",
		ResourceType: "homework",
		ResourceID:   hw.ID,
		After:        hw,
		IPAddress:    p.IP,
	})

	payload, _ := json.Marshal(map[string]interface{}{
		"homework_id":       hw.ID,
		"tenant_id":         hw.TenantID,
		"subject_id":        hw.SubjectID,
		"class_section_id":  hw.ClassSectionID,
		"teacher_id":        hw.TeacherID,
		"title":             hw.Title,
		"due_date":          hw.DueDate,
		"attachments_present": len(hw.Attachments) > 0,
	})
	_, _ = s.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
		TenantID:  tUUID,
		EventType: "academics.homework.created",
		Payload:   payload,
	})

	return hw, nil
}

func (s *Service) SubmitHomework(ctx context.Context, homeworkID, studentID, url, remarks string) (db.HomeworkSubmission, error) {
	hUUID := pgtype.UUID{}
	hUUID.Scan(homeworkID)
	stUUID := pgtype.UUID{}
	stUUID.Scan(studentID)

	return s.q.SubmitHomework(ctx, db.SubmitHomeworkParams{
		HomeworkID:    hUUID,
		StudentID:     stUUID,
		AttachmentUrl: pgtype.Text{String: url, Valid: url != ""},
		Remarks:       pgtype.Text{String: remarks, Valid: remarks != ""},
	})
}

func (s *Service) GradeSubmission(ctx context.Context, id, status, feedback string) (db.HomeworkSubmission, error) {
	uUUID := pgtype.UUID{}
	uUUID.Scan(id)

	return s.q.GradeSubmission(ctx, db.GradeSubmissionParams{
		ID:              uUUID,
		Column2:          status,
		TeacherFeedback: pgtype.Text{String: feedback, Valid: feedback != ""},
	})
}

func (s *Service) UpsertLessonPlan(ctx context.Context, tenantID, subjectID, classID string, week int32, topic string, covered pgtype.Timestamptz) (db.LessonPlan, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(subjectID)
	cUUID := pgtype.UUID{}
	cUUID.Scan(classID)

	return s.q.UpsertLessonPlan(ctx, db.UpsertLessonPlanParams{
		TenantID:     tUUID,
		SubjectID:    sUUID,
		ClassID:      cUUID,
		WeekNumber:   week,
		PlannedTopic: topic,
		CoveredAt:    covered,
	})
}

func (s *Service) ListHomeworkForSection(ctx context.Context, tenantID, sectionID string) ([]db.ListHomeworkForSectionRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	csUUID := pgtype.UUID{}
	csUUID.Scan(sectionID)
	return s.q.ListHomeworkForSection(ctx, db.ListHomeworkForSectionParams{
		TenantID:       tUUID,
		ClassSectionID: csUUID,
	})
}

func (s *Service) ListHomeworkOptions(ctx context.Context, tenantID string) (HomeworkOptions, error) {
	tUUID := pgtype.UUID{}
	if err := tUUID.Scan(tenantID); err != nil {
		return HomeworkOptions{}, fmt.Errorf("invalid tenant_id")
	}

	classes, err := s.q.ListClasses(ctx, tUUID)
	if err != nil {
		return HomeworkOptions{}, err
	}

	classNameByID := make(map[[16]byte]string, len(classes))
	for _, classItem := range classes {
		if classItem.ID.Valid {
			classNameByID[classItem.ID.Bytes] = classItem.Name
		}
	}

	sections, err := s.q.ListSectionsByTenant(ctx, tUUID)
	if err != nil {
		return HomeworkOptions{}, err
	}

	classSections := make([]HomeworkClassSectionOption, 0, len(sections))
	for _, section := range sections {
		if !section.ID.Valid {
			continue
		}
		className := ""
		if section.ClassID.Valid {
			className = classNameByID[section.ClassID.Bytes]
		}
		if className == "" {
			className = "Class"
		}
		classSections = append(classSections, HomeworkClassSectionOption{
			ID:        section.ID.String(),
			ClassID:   section.ClassID.String(),
			ClassName: className,
			Name:      section.Name,
			Label:     className + " - " + section.Name,
		})
	}

	subjectRows, err := s.q.ListSubjects(ctx, tUUID)
	if err != nil {
		return HomeworkOptions{}, err
	}

	subjects := make([]HomeworkSubjectOption, 0, len(subjectRows))
	for _, subject := range subjectRows {
		if !subject.ID.Valid {
			continue
		}
		subjects = append(subjects, HomeworkSubjectOption{
			ID:   subject.ID.String(),
			Name: subject.Name,
			Code: subject.Code.String,
			Type: subject.Type.String,
		})
	}

	return HomeworkOptions{ClassSections: classSections, Subjects: subjects}, nil
}

func (s *Service) GetHomeworkForStudent(ctx context.Context, tenantID, studentID string) ([]db.GetHomeworkForStudentRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	stUUID := pgtype.UUID{}
	stUUID.Scan(studentID)
	return s.q.GetHomeworkForStudent(ctx, db.GetHomeworkForStudentParams{
		ID:       stUUID,
		TenantID: tUUID,
	})
}

func (s *Service) ListSubmissions(ctx context.Context, homeworkID string) ([]db.ListSubmissionsRow, error) {
	hUUID := pgtype.UUID{}
	hUUID.Scan(homeworkID)
	return s.q.ListSubmissions(ctx, hUUID)
}

func (s *Service) ListLessonPlans(ctx context.Context, tenantID, subjectID, classID string) ([]db.LessonPlan, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(subjectID)
	cUUID := pgtype.UUID{}
	cUUID.Scan(classID)
	return s.q.ListLessonPlans(ctx, db.ListLessonPlansParams{
		TenantID:  tUUID,
		SubjectID: sUUID,
		ClassID:   cUUID,
	})
}

func (s *Service) GetHomework(ctx context.Context, tenantID, id string) (db.Homework, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	hUUID := pgtype.UUID{}
	hUUID.Scan(id)
	return s.q.GetHomework(ctx, db.GetHomeworkParams{
		ID:       hUUID,
		TenantID: tUUID,
	})
}

func (s *Service) GetTimetable(ctx context.Context, tenantID string) ([]TimetableEntry, error) {
	tUUID := pgtype.UUID{}
	if err := tUUID.Scan(tenantID); err != nil {
		return nil, fmt.Errorf("invalid tenant_id")
	}

	tenantRow, err := s.q.GetTenantByID(ctx, tUUID)
	if err != nil {
		return nil, err
	}

	config := map[string]interface{}{}
	if len(tenantRow.Config) > 0 {
		if err := json.Unmarshal(tenantRow.Config, &config); err != nil {
			return nil, err
		}
	}

	entriesRaw := make([]interface{}, 0)
	if timetableRaw, ok := config["timetable"].(map[string]interface{}); ok {
		if list, ok := timetableRaw["entries"].([]interface{}); ok {
			entriesRaw = list
		}
	}

	entries := make([]TimetableEntry, 0, len(entriesRaw))
	for _, item := range entriesRaw {
		b, _ := json.Marshal(item)
		var entry TimetableEntry
		if err := json.Unmarshal(b, &entry); err != nil {
			continue
		}
		entries = append(entries, entry)
	}

	return entries, nil
}

func (s *Service) SaveTimetable(ctx context.Context, tenantID, userID, requestID, ip string, entries []TimetableEntry) error {
	tUUID := pgtype.UUID{}
	if err := tUUID.Scan(tenantID); err != nil {
		return fmt.Errorf("invalid tenant_id")
	}

	for _, entry := range entries {
		if strings.TrimSpace(entry.ClassID) == "" || strings.TrimSpace(entry.SectionID) == "" || strings.TrimSpace(entry.SubjectID) == "" || strings.TrimSpace(entry.TeacherID) == "" {
			return fmt.Errorf("class_id, section_id, subject_id, and teacher_id are required for each entry")
		}
		if strings.TrimSpace(entry.Weekday) == "" {
			return fmt.Errorf("weekday is required for each entry")
		}
		if _, err := time.Parse("15:04", entry.StartTime); err != nil {
			return fmt.Errorf("invalid start_time format, expected HH:MM")
		}
		if _, err := time.Parse("15:04", entry.EndTime); err != nil {
			return fmt.Errorf("invalid end_time format, expected HH:MM")
		}
		if entry.StartTime >= entry.EndTime {
			return fmt.Errorf("start_time must be earlier than end_time")
		}
	}

	tenantRow, err := s.q.GetTenantByID(ctx, tUUID)
	if err != nil {
		return err
	}

	config := map[string]interface{}{}
	if len(tenantRow.Config) > 0 {
		if err := json.Unmarshal(tenantRow.Config, &config); err != nil {
			return err
		}
	}

	config["timetable"] = map[string]interface{}{
		"entries":    entries,
		"updated_at": time.Now().UTC().Format(time.RFC3339),
	}

	configBytes, err := json.Marshal(config)
	if err != nil {
		return err
	}

	if _, err := s.q.UpdateTenantConfig(ctx, db.UpdateTenantConfigParams{
		ID:     tUUID,
		Config: configBytes,
	}); err != nil {
		return err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    requestID,
		Action:       "timetable.save",
		ResourceType: "timetable",
		After: map[string]interface{}{
			"entries_count": len(entries),
		},
		IPAddress: ip,
	})

	return nil
}

func (s *Service) ListCertificateRequests(ctx context.Context, tenantID string, status string) ([]CertificateRequest, error) {
	tUUID := pgtype.UUID{}
	if err := tUUID.Scan(tenantID); err != nil {
		return nil, fmt.Errorf("invalid tenant_id")
	}

	tenantRow, err := s.q.GetTenantByID(ctx, tUUID)
	if err != nil {
		return nil, err
	}

	config := map[string]interface{}{}
	if len(tenantRow.Config) > 0 {
		if err := json.Unmarshal(tenantRow.Config, &config); err != nil {
			return nil, err
		}
	}

	requestsRaw := make([]interface{}, 0)
	if certRaw, ok := config["certificates"].(map[string]interface{}); ok {
		if list, ok := certRaw["requests"].([]interface{}); ok {
			requestsRaw = list
		}
	}

	requests := make([]CertificateRequest, 0, len(requestsRaw))
	for _, item := range requestsRaw {
		b, _ := json.Marshal(item)
		var req CertificateRequest
		if err := json.Unmarshal(b, &req); err != nil {
			continue
		}
		if strings.TrimSpace(status) != "" && string(req.Status) != strings.TrimSpace(status) {
			continue
		}
		requests = append(requests, req)
	}

	return requests, nil
}

func (s *Service) CreateCertificateRequest(ctx context.Context, p CreateCertificateRequestParams) (CertificateRequest, error) {
	if strings.TrimSpace(p.StudentID) == "" {
		return CertificateRequest{}, fmt.Errorf("student_id is required")
	}
	if strings.TrimSpace(p.Reason) == "" {
		return CertificateRequest{}, fmt.Errorf("reason is required")
	}
	if p.Type != CertificateTypeTransfer && p.Type != CertificateTypeBonafide && p.Type != CertificateTypeCharacter {
		return CertificateRequest{}, fmt.Errorf("invalid certificate type")
	}

	tUUID := pgtype.UUID{}
	if err := tUUID.Scan(p.TenantID); err != nil {
		return CertificateRequest{}, fmt.Errorf("invalid tenant_id")
	}

	studentUUID := pgtype.UUID{}
	if err := studentUUID.Scan(p.StudentID); err != nil {
		return CertificateRequest{}, fmt.Errorf("invalid student_id")
	}

	student, err := s.q.GetStudent(ctx, db.GetStudentParams{ID: studentUUID, TenantID: tUUID})
	if err != nil {
		return CertificateRequest{}, fmt.Errorf("student not found")
	}

	existing, err := s.ListCertificateRequests(ctx, p.TenantID, "")
	if err != nil {
		return CertificateRequest{}, err
	}

	requestedOn := strings.TrimSpace(p.RequestedOn)
	if requestedOn == "" {
		requestedOn = time.Now().Format("2006-01-02")
	}

	req := CertificateRequest{
		ID:              uuid.NewString(),
		StudentID:       p.StudentID,
		StudentName:     student.FullName,
		AdmissionNumber: student.AdmissionNumber,
		Type:            p.Type,
		Reason:          strings.TrimSpace(p.Reason),
		RequestedOn:     requestedOn,
		Status:          CertificateStatusPending,
		UpdatedAt:       time.Now().UTC().Format(time.RFC3339),
	}

	nextRequests := append([]CertificateRequest{req}, existing...)
	if err := s.saveCertificateRequests(ctx, tUUID, nextRequests); err != nil {
		return CertificateRequest{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "certificate.request.create",
		ResourceType: "certificate_request",
		ReasonCode:   string(p.Type),
		IPAddress:    p.IP,
		After:        req,
	})

	return req, nil
}

func (s *Service) UpdateCertificateRequestStatus(ctx context.Context, tenantID, requestID string, status CertificateStatus, remarks, userID, reqID, ip string) (CertificateRequest, error) {
	tUUID := pgtype.UUID{}
	if err := tUUID.Scan(tenantID); err != nil {
		return CertificateRequest{}, fmt.Errorf("invalid tenant_id")
	}

	if status != CertificateStatusPending && status != CertificateStatusApproved && status != CertificateStatusRejected && status != CertificateStatusIssued {
		return CertificateRequest{}, fmt.Errorf("invalid certificate status")
	}

	requests, err := s.ListCertificateRequests(ctx, tenantID, "")
	if err != nil {
		return CertificateRequest{}, err
	}

	var updated CertificateRequest
	found := false
	for idx := range requests {
		if requests[idx].ID != requestID {
			continue
		}

		requests[idx].Status = status
		requests[idx].UpdatedAt = time.Now().UTC().Format(time.RFC3339)
		requests[idx].ReviewedBy = userID
		if strings.TrimSpace(remarks) != "" {
			requests[idx].Remarks = strings.TrimSpace(remarks)
		}

		if status == CertificateStatusIssued {
			requests[idx].IssueDate = time.Now().Format("2006-01-02")
			if strings.TrimSpace(requests[idx].CertificateNumber) == "" {
				prefix := "CC"
				if requests[idx].Type == CertificateTypeTransfer {
					prefix = "TC"
				}
				if requests[idx].Type == CertificateTypeBonafide {
					prefix = "BC"
				}
				suffix := requests[idx].ID
				if len(suffix) > 6 {
					suffix = suffix[len(suffix)-6:]
				}
				requests[idx].CertificateNumber = fmt.Sprintf("%s-%s-%s", prefix, time.Now().Format("2006"), strings.ToUpper(suffix))
			}
		}

		updated = requests[idx]
		found = true
		break
	}

	if !found {
		return CertificateRequest{}, fmt.Errorf("certificate request not found")
	}

	if err := s.saveCertificateRequests(ctx, tUUID, requests); err != nil {
		return CertificateRequest{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    reqID,
		Action:       "certificate.request.status_update",
		ResourceType: "certificate_request",
		ReasonCode:   string(status),
		IPAddress:    ip,
		After:        updated,
	})

	return updated, nil
}

func (s *Service) saveCertificateRequests(ctx context.Context, tenantID pgtype.UUID, requests []CertificateRequest) error {
	tenantRow, err := s.q.GetTenantByID(ctx, tenantID)
	if err != nil {
		return err
	}

	config := map[string]interface{}{}
	if len(tenantRow.Config) > 0 {
		if err := json.Unmarshal(tenantRow.Config, &config); err != nil {
			return err
		}
	}

	config["certificates"] = map[string]interface{}{
		"requests":   requests,
		"updated_at": time.Now().UTC().Format(time.RFC3339),
	}

	configBytes, err := json.Marshal(config)
	if err != nil {
		return err
	}

	_, err = s.q.UpdateTenantConfig(ctx, db.UpdateTenantConfigParams{ID: tenantID, Config: configBytes})
	return err
}

func (s *Service) ListSubjects(ctx context.Context, tenantID string) ([]HomeworkSubjectOption, error) {
	tUUID := pgtype.UUID{}
	if err := tUUID.Scan(tenantID); err != nil {
		return nil, fmt.Errorf("invalid tenant_id")
	}

	rows, err := s.q.ListSubjects(ctx, tUUID)
	if err != nil {
		return nil, err
	}

	subjects := make([]HomeworkSubjectOption, 0, len(rows))
	for _, row := range rows {
		if !row.ID.Valid {
			continue
		}
		subjects = append(subjects, HomeworkSubjectOption{
			ID:   row.ID.String(),
			Name: row.Name,
			Code: row.Code.String,
			Type: row.Type.String,
		})
	}

	return subjects, nil
}

