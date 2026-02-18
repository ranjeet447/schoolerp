package admission

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
	sisservice "github.com/schoolerp/api/internal/service/sis"
)

type AdmissionService struct {
	q       db.Querier
	audit   *audit.Logger
	student *sisservice.StudentService
}

func NewAdmissionService(q db.Querier, audit *audit.Logger, student *sisservice.StudentService) *AdmissionService {
	return &AdmissionService{
		q:       q,
		audit:   audit,
		student: student,
	}
}

func generateApplicationNumber(now time.Time) string {
	suffixBytes := make([]byte, 3)
	if _, err := rand.Read(suffixBytes); err != nil {
		return fmt.Sprintf("APP-%s-%d", now.UTC().Format("20060102"), now.UTC().UnixNano())
	}
	suffix := strings.ToUpper(hex.EncodeToString(suffixBytes))
	return fmt.Sprintf("APP-%s-%s", now.UTC().Format("20060102"), suffix)
}

// Public Enquiries

type CreateEnquiryParams struct {
	TenantID        string
	ParentName      string
	Email           string
	Phone           string
	StudentName     string
	GradeInterested string
	AcademicYear    string
	Source          string
	Notes           string
	IPAddress       string
}

var defaultAdmissionDocumentTypes = []string{
	"ID Proof",
	"Birth Certificate",
	"Previous Report Card",
	"Transfer Certificate",
	"Others",
}

type AdmissionWorkflowSettings struct {
	AllowedTransitions          map[string][]string `json:"allowed_transitions"`
	RequiredDocumentTypesByStatus map[string][]string `json:"required_document_types_by_status"`
}

var defaultAdmissionWorkflowSettings = AdmissionWorkflowSettings{
	AllowedTransitions: map[string][]string{
		"submitted":  {"review", "declined"},
		"review":     {"assessment", "offered", "declined"},
		"assessment": {"offered", "declined"},
		"offered":    {"admitted", "declined"},
		"admitted":   {},
		"declined":   {},
	},
	RequiredDocumentTypesByStatus: map[string][]string{},
}

func normalizeStatusKey(status string) string {
	return strings.ToLower(strings.TrimSpace(status))
}

func normalizeTransitionsMap(input map[string][]string) map[string][]string {
	if input == nil {
		return map[string][]string{}
	}
	out := map[string][]string{}
	for key, values := range input {
		normalizedKey := normalizeStatusKey(key)
		if normalizedKey == "" {
			continue
		}
		uniq := make([]string, 0, len(values))
		seen := map[string]bool{}
		for _, value := range values {
			normalizedValue := normalizeStatusKey(value)
			if normalizedValue == "" || seen[normalizedValue] {
				continue
			}
			seen[normalizedValue] = true
			uniq = append(uniq, normalizedValue)
		}
		out[normalizedKey] = uniq
	}
	return out
}

func normalizeRequiredDocsMap(input map[string][]string) map[string][]string {
	if input == nil {
		return map[string][]string{}
	}
	out := map[string][]string{}
	for key, values := range input {
		normalizedKey := normalizeStatusKey(key)
		if normalizedKey == "" {
			continue
		}
		uniq := make([]string, 0, len(values))
		seen := map[string]bool{}
		for _, value := range values {
			trimmed := strings.TrimSpace(value)
			if trimmed == "" {
				continue
			}
			key := strings.ToLower(trimmed)
			if seen[key] {
				continue
			}
			seen[key] = true
			uniq = append(uniq, trimmed)
		}
		out[normalizedKey] = uniq
	}
	return out
}

func (s *AdmissionService) loadTenantConfig(ctx context.Context, tenantID pgtype.UUID) (map[string]interface{}, error) {
	t, err := s.q.GetTenantByID(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	config := map[string]interface{}{}
	if len(t.Config) > 0 {
		if err := json.Unmarshal(t.Config, &config); err != nil {
			return nil, err
		}
	}
	return config, nil
}

func (s *AdmissionService) saveTenantConfig(ctx context.Context, tenantID pgtype.UUID, config map[string]interface{}) error {
	configBytes, err := json.Marshal(config)
	if err != nil {
		return err
	}
	_, err = s.q.UpdateTenantConfig(ctx, db.UpdateTenantConfigParams{ID: tenantID, Config: configBytes})
	return err
}

func (s *AdmissionService) SubmitEnquiry(ctx context.Context, p CreateEnquiryParams) (db.AdmissionEnquiry, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)

	enquiry, err := s.q.CreateEnquiry(ctx, db.CreateEnquiryParams{
		TenantID:        tID,
		ParentName:      p.ParentName,
		Email:           pgtype.Text{String: p.Email, Valid: p.Email != ""},
		Phone:           p.Phone,
		StudentName:     p.StudentName,
		GradeInterested: p.GradeInterested,
		AcademicYear:    p.AcademicYear,
		Source:          pgtype.Text{String: p.Source, Valid: p.Source != ""},
		Status:          "open",
		Notes:           pgtype.Text{String: p.Notes, Valid: p.Notes != ""},
	})
	if err != nil {
		return db.AdmissionEnquiry{}, fmt.Errorf("failed to submit enquiry: %w", err)
	}

	// Audit (Public action, no UserID)
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		Action:       "PUBLIC_ENQUIRY",
		ResourceType: "admission_enquiry",
		ResourceID:   enquiry.ID,
		After:        map[string]interface{}{"parent": p.ParentName, "grade": p.GradeInterested},
		IPAddress:    p.IPAddress,
	})

	return enquiry, nil
}

// Admin Operations

func (s *AdmissionService) ListEnquiries(ctx context.Context, tenantID, status, academicYear string, limit, offset int32) ([]db.AdmissionEnquiry, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListEnquiries(ctx, db.ListEnquiriesParams{
		TenantID:     tID,
		Limit:        limit,
		Offset:       offset,
		Status:       pgtype.Text{String: status, Valid: status != ""},
		AcademicYear: pgtype.Text{String: academicYear, Valid: academicYear != ""},
	})
}

func (s *AdmissionService) UpdateEnquiryStatus(ctx context.Context, tenantID, id, status, userID, ip string) error {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	eID := pgtype.UUID{}
	eID.Scan(id)
	uID := pgtype.UUID{}
	uID.Scan(userID)

	err := s.q.UpdateEnquiryStatus(ctx, db.UpdateEnquiryStatusParams{
		ID:       eID,
		TenantID: tID,
		Status:   status,
	})
	if err != nil {
		return err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		Action:       "UPDATE_ENQUIRY_STATUS",
		ResourceType: "admission_enquiry",
		ResourceID:   eID,
		After:        map[string]interface{}{"status": status},
		IPAddress:    ip,
	})

	return nil
}

// Applications

func (s *AdmissionService) CreateApplication(ctx context.Context, tenantID, enquiryID string, data map[string]interface{}, userID, ip string) (db.AdmissionApplication, error) {
	if strings.TrimSpace(enquiryID) == "" {
		return db.AdmissionApplication{}, fmt.Errorf("enquiry_id is required")
	}

	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	eID := pgtype.UUID{}
	eID.Scan(enquiryID)
	uID := pgtype.UUID{}
	uID.Scan(userID)

	enquiry, err := s.q.GetEnquiry(ctx, db.GetEnquiryParams{
		ID:       eID,
		TenantID: tID,
	})
	if err != nil {
		return db.AdmissionApplication{}, fmt.Errorf("failed to load enquiry: %w", err)
	}

	if data == nil {
		data = map[string]interface{}{}
	}

	if _, exists := data["student_name"]; !exists && strings.TrimSpace(enquiry.StudentName) != "" {
		data["student_name"] = enquiry.StudentName
	}
	if _, exists := data["parent_name"]; !exists && strings.TrimSpace(enquiry.ParentName) != "" {
		data["parent_name"] = enquiry.ParentName
	}
	if _, exists := data["grade_interested"]; !exists && strings.TrimSpace(enquiry.GradeInterested) != "" {
		data["grade_interested"] = enquiry.GradeInterested
	}
	if _, exists := data["academic_year"]; !exists && enquiry.AcademicYear != "" {
		data["academic_year"] = enquiry.AcademicYear
	}

	appNum := generateApplicationNumber(time.Now())

	jsonBytes, _ := json.Marshal(data)

	app, err := s.q.CreateApplication(ctx, db.CreateApplicationParams{
		TenantID:          tID,
		EnquiryID:         eID,
		ApplicationNumber: appNum,
		Status:            "submitted",
		FormData:          jsonBytes,
		Documents:         []byte("[]"),
	})
	if err != nil {
		return db.AdmissionApplication{}, fmt.Errorf("failed to create application: %w", err)
	}
	
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		Action:       "CREATE_APPLICATION",
		ResourceType: "admission_application",
		ResourceID:   app.ID,
		IPAddress:    ip,
	})

	return app, nil
}

func (s *AdmissionService) ListApplications(ctx context.Context, tenantID, status, academicYear string, limit, offset int32) ([]db.ListApplicationsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListApplications(ctx, db.ListApplicationsParams{
		TenantID:     tID,
		Limit:        limit,
		Offset:       offset,
		Status:       pgtype.Text{String: status, Valid: status != ""},
		AcademicYear: pgtype.Text{String: academicYear, Valid: academicYear != ""},
	})
}

func (s *AdmissionService) RecordFeePayment(ctx context.Context, tenantID, appID string, amount int64, ref, userID, ip string) error {
	if amount <= 0 {
		return fmt.Errorf("amount must be greater than zero")
	}

	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	aID := pgtype.UUID{}
	aID.Scan(appID)
	uID := pgtype.UUID{}
	uID.Scan(userID)

	err := s.q.UpdateApplicationFee(ctx, db.UpdateApplicationFeeParams{
		ID:                   aID,
		TenantID:             tID,
		ProcessingFeeAmount:  pgtype.Int8{Int64: amount, Valid: true},
		ProcessingFeeStatus:  pgtype.Text{String: "paid", Valid: true},
		PaymentReference:     pgtype.Text{String: strings.TrimSpace(ref), Valid: strings.TrimSpace(ref) != ""},
	})
	if err != nil {
		return err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		Action:       "RECORD_ADMISSION_FEE",
		ResourceType: "admission_application",
		ResourceID:   aID,
		After:        map[string]interface{}{"amount": amount, "ref": ref},
		IPAddress:    ip,
	})

	return nil
}
func (s *AdmissionService) UpdateApplicationStatus(ctx context.Context, tenantID, id, status, userID, ip string) error {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	aID := pgtype.UUID{}
	aID.Scan(id)
	uID := pgtype.UUID{}
	uID.Scan(userID)

	// Workflow Guard
	app, err := s.GetApplication(ctx, tenantID, id)
	if err != nil {
		return err
	}

	workflow, err := s.GetWorkflowSettings(ctx, tenantID)
	if err == nil {
		currentStatus := normalizeStatusKey(app.Status)
		targetStatus := normalizeStatusKey(status)
		if currentStatus != targetStatus {
			allowed := workflow.AllowedTransitions[currentStatus]
			transitionAllowed := false
			for _, candidate := range allowed {
				if normalizeStatusKey(candidate) == targetStatus {
					transitionAllowed = true
					break
				}
			}
			if !transitionAllowed {
				return fmt.Errorf("status transition not allowed: %s -> %s", app.Status, status)
			}
		}

		requiredDocs := workflow.RequiredDocumentTypesByStatus[targetStatus]
		if len(requiredDocs) > 0 {
			var documents []map[string]interface{}
			if len(app.Documents) > 0 {
				_ = json.Unmarshal(app.Documents, &documents)
			}

			present := map[string]bool{}
			for _, doc := range documents {
				typeText, _ := doc["type"].(string)
				normalizedType := strings.ToLower(strings.TrimSpace(typeText))
				if normalizedType != "" {
					present[normalizedType] = true
				}
			}

			for _, required := range requiredDocs {
				if !present[strings.ToLower(strings.TrimSpace(required))] {
					return fmt.Errorf("required document missing for %s: %s", status, required)
				}
			}
		}
	}

	if status == "offered" || status == "admitted" {
		if app.ProcessingFeeStatus.String != "paid" {
			return fmt.Errorf("cannot move to %s: processing fee is not paid", status)
		}
	}

	err = s.q.UpdateApplicationStatus(ctx, db.UpdateApplicationStatusParams{
		ID:       aID,
		TenantID: tID,
		Status:   status,
		ReviewedBy: uID,
	})
	if err != nil {
		return err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		Action:       "UPDATE_APPLICATION_STATUS",
		ResourceType: "admission_application",
		ResourceID:   aID,
		After:        map[string]interface{}{"status": status},
		IPAddress:    ip,
	})

	return nil
}

func (s *AdmissionService) GetApplication(ctx context.Context, tenantID, id string) (db.GetApplicationRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	aID := pgtype.UUID{}
	aID.Scan(id)

	return s.q.GetApplication(ctx, db.GetApplicationParams{
		ID:       aID,
		TenantID: tID,
	})
}

func (s *AdmissionService) AttachDocument(ctx context.Context, tenantID, id, docType, url, userID, ip string) error {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	aID := pgtype.UUID{}
	aID.Scan(id)
	uID := pgtype.UUID{}
	uID.Scan(userID)

	app, err := s.GetApplication(ctx, tenantID, id)
	if err != nil {
		return err
	}

	var documents []map[string]interface{}
	if len(app.Documents) > 0 {
		json.Unmarshal(app.Documents, &documents)
	}

	documents = append(documents, map[string]interface{}{
		"type":        docType,
		"url":         url,
		"attached_at": time.Now().Format(time.RFC3339),
		"attached_by": userID,
	})

	jsonBytes, _ := json.Marshal(documents)

	err = s.q.UpdateApplicationDocuments(ctx, db.UpdateApplicationDocumentsParams{
		ID:        aID,
		TenantID:  tID,
		Documents: jsonBytes,
	})
	if err != nil {
		return err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		Action:       "ATTACH_ADMISSION_DOC",
		ResourceType: "admission_application",
		ResourceID:   aID,
		After:        map[string]interface{}{"type": docType, "url": url},
		IPAddress:    ip,
	})

	return nil
}

func (s *AdmissionService) RemoveDocument(ctx context.Context, tenantID, id string, docIndex int, userID, ip string) error {
	if docIndex < 0 {
		return fmt.Errorf("invalid document index")
	}

	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	aID := pgtype.UUID{}
	aID.Scan(id)
	uID := pgtype.UUID{}
	uID.Scan(userID)

	app, err := s.GetApplication(ctx, tenantID, id)
	if err != nil {
		return err
	}

	var documents []map[string]interface{}
	if len(app.Documents) > 0 {
		_ = json.Unmarshal(app.Documents, &documents)
	}

	if docIndex >= len(documents) {
		return fmt.Errorf("document index out of range")
	}

	removed := documents[docIndex]
	documents = append(documents[:docIndex], documents[docIndex+1:]...)

	jsonBytes, _ := json.Marshal(documents)
	err = s.q.UpdateApplicationDocuments(ctx, db.UpdateApplicationDocumentsParams{
		ID:        aID,
		TenantID:  tID,
		Documents: jsonBytes,
	})
	if err != nil {
		return err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		Action:       "REMOVE_ADMISSION_DOC",
		ResourceType: "admission_application",
		ResourceID:   aID,
		After:        map[string]interface{}{"removed": removed, "index": docIndex},
		IPAddress:    ip,
	})

	return nil
}

func (s *AdmissionService) ListDocumentTypes(ctx context.Context, tenantID string) ([]string, error) {
	tID := pgtype.UUID{}
	if err := tID.Scan(tenantID); err != nil {
		return nil, fmt.Errorf("invalid tenant id")
	}

	t, err := s.q.GetTenantByID(ctx, tID)
	if err != nil {
		return nil, err
	}

	config := map[string]interface{}{}
	if len(t.Config) > 0 {
		if err := json.Unmarshal(t.Config, &config); err != nil {
			return nil, err
		}
	}

	admissionCfg, _ := config["admissions"].(map[string]interface{})
	rawTypes, _ := admissionCfg["document_types"].([]interface{})
	if len(rawTypes) == 0 {
		return defaultAdmissionDocumentTypes, nil
	}

	out := make([]string, 0, len(rawTypes))
	for _, item := range rawTypes {
		if text, ok := item.(string); ok && strings.TrimSpace(text) != "" {
			out = append(out, strings.TrimSpace(text))
		}
	}
	if len(out) == 0 {
		return defaultAdmissionDocumentTypes, nil
	}
	return out, nil
}

func (s *AdmissionService) SaveDocumentTypes(ctx context.Context, tenantID string, documentTypes []string, userID, ip string) error {
	tID := pgtype.UUID{}
	if err := tID.Scan(tenantID); err != nil {
		return fmt.Errorf("invalid tenant id")
	}

	normalized := make([]string, 0, len(documentTypes))
	seen := map[string]bool{}
	for _, item := range documentTypes {
		trimmed := strings.TrimSpace(item)
		if trimmed == "" {
			continue
		}
		key := strings.ToLower(trimmed)
		if seen[key] {
			continue
		}
		seen[key] = true
		normalized = append(normalized, trimmed)
	}
	if len(normalized) == 0 {
		return fmt.Errorf("at least one document type is required")
	}

	t, err := s.q.GetTenantByID(ctx, tID)
	if err != nil {
		return err
	}

	config := map[string]interface{}{}
	if len(t.Config) > 0 {
		if err := json.Unmarshal(t.Config, &config); err != nil {
			return err
		}
	}

	admissionsCfg, _ := config["admissions"].(map[string]interface{})
	if admissionsCfg == nil {
		admissionsCfg = map[string]interface{}{}
	}
	admissionsCfg["document_types"] = normalized
	admissionsCfg["updated_at"] = time.Now().UTC().Format(time.RFC3339)
	config["admissions"] = admissionsCfg

	configBytes, err := json.Marshal(config)
	if err != nil {
		return err
	}

	if _, err := s.q.UpdateTenantConfig(ctx, db.UpdateTenantConfigParams{ID: tID, Config: configBytes}); err != nil {
		return err
	}

	uID := pgtype.UUID{}
	uID.Scan(userID)
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		Action:       "ADMISSION_DOC_TYPES_UPDATED",
		ResourceType: "tenant_config",
		After:        map[string]interface{}{"document_types": normalized},
		IPAddress:    ip,
	})

	return nil
}

func (s *AdmissionService) GetWorkflowSettings(ctx context.Context, tenantID string) (AdmissionWorkflowSettings, error) {
	tID := pgtype.UUID{}
	if err := tID.Scan(tenantID); err != nil {
		return AdmissionWorkflowSettings{}, fmt.Errorf("invalid tenant id")
	}

	config, err := s.loadTenantConfig(ctx, tID)
	if err != nil {
		return AdmissionWorkflowSettings{}, err
	}

	admissionsCfg, _ := config["admissions"].(map[string]interface{})
	workflowRaw, _ := admissionsCfg["workflow"].(map[string]interface{})

	settings := defaultAdmissionWorkflowSettings

	if workflowRaw != nil {
		if allowedRaw, ok := workflowRaw["allowed_transitions"].(map[string]interface{}); ok {
			allowed := map[string][]string{}
			for key, values := range allowedRaw {
				arr, _ := values.([]interface{})
				normalized := make([]string, 0, len(arr))
				for _, item := range arr {
					if text, ok := item.(string); ok {
						normalized = append(normalized, text)
					}
				}
				allowed[key] = normalized
			}
			settings.AllowedTransitions = normalizeTransitionsMap(allowed)
		}

		if requiredRaw, ok := workflowRaw["required_document_types_by_status"].(map[string]interface{}); ok {
			required := map[string][]string{}
			for key, values := range requiredRaw {
				arr, _ := values.([]interface{})
				normalized := make([]string, 0, len(arr))
				for _, item := range arr {
					if text, ok := item.(string); ok {
						normalized = append(normalized, strings.TrimSpace(text))
					}
				}
				required[key] = normalized
			}
			settings.RequiredDocumentTypesByStatus = normalizeRequiredDocsMap(required)
		}
	}

	if len(settings.AllowedTransitions) == 0 {
		settings.AllowedTransitions = defaultAdmissionWorkflowSettings.AllowedTransitions
	}
	if settings.RequiredDocumentTypesByStatus == nil {
		settings.RequiredDocumentTypesByStatus = map[string][]string{}
	}

	return settings, nil
}

func (s *AdmissionService) SaveWorkflowSettings(ctx context.Context, tenantID string, settings AdmissionWorkflowSettings, userID, ip string) error {
	tID := pgtype.UUID{}
	if err := tID.Scan(tenantID); err != nil {
		return fmt.Errorf("invalid tenant id")
	}

	settings.AllowedTransitions = normalizeTransitionsMap(settings.AllowedTransitions)
	settings.RequiredDocumentTypesByStatus = normalizeRequiredDocsMap(settings.RequiredDocumentTypesByStatus)

	if len(settings.AllowedTransitions) == 0 {
		settings.AllowedTransitions = defaultAdmissionWorkflowSettings.AllowedTransitions
	}

	config, err := s.loadTenantConfig(ctx, tID)
	if err != nil {
		return err
	}

	admissionsCfg, _ := config["admissions"].(map[string]interface{})
	if admissionsCfg == nil {
		admissionsCfg = map[string]interface{}{}
	}
	admissionsCfg["workflow"] = settings
	admissionsCfg["updated_at"] = time.Now().UTC().Format(time.RFC3339)
	config["admissions"] = admissionsCfg

	if err := s.saveTenantConfig(ctx, tID, config); err != nil {
		return err
	}

	uID := pgtype.UUID{}
	uID.Scan(userID)
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		Action:       "ADMISSION_WORKFLOW_UPDATED",
		ResourceType: "tenant_config",
		After:        settings,
		IPAddress:    ip,
	})

	return nil
}

func (s *AdmissionService) AcceptApplication(ctx context.Context, tenantID, id, classID, sectionID, userID, ip string) error {
	app, err := s.GetApplication(ctx, tenantID, id)
	if err != nil {
		return err
	}

	if app.Status == "admitted" {
		return fmt.Errorf("application already admitted")
	}

	if app.ProcessingFeeStatus.String != "paid" {
		return fmt.Errorf("cannot admit student: processing fee is not paid")
	}

	if strings.TrimSpace(sectionID) == "" {
		return fmt.Errorf("section is required")
	}

	// 1. Create Student record in SIS
	studentName := app.StudentName.String
	if studentName == "" {
		return fmt.Errorf("student name missing in application")
	}

	_, err = s.student.CreateStudent(ctx, sisservice.CreateStudentParams{
		TenantID:        tenantID,
		AdmissionNumber: app.ApplicationNumber,
		FullName:        studentName,
		SectionID:       sectionID,
		Status:          "active",
		UserID:          userID,
		IP:              ip,
	})
	if err != nil {
		return fmt.Errorf("failed to create student: %w", err)
	}

	// 2. Update Application Status
	return s.UpdateApplicationStatus(ctx, tenantID, id, "admitted", userID, ip)
}

