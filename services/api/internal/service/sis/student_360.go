package sis

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type Student360Service struct {
	pool  *pgxpool.Pool
	audit *audit.Logger
}

func NewStudent360Service(pool *pgxpool.Pool, audit *audit.Logger) *Student360Service {
	return &Student360Service{pool: pool, audit: audit}
}

// Behavioral Log Structs
type BehavioralLog struct {
	ID           string    `json:"id"`
	StudentID    string    `json:"student_id"`
	Type         string    `json:"type"` // merit, demerit, info
	Category     string    `json:"category"`
	Points       int       `json:"points"`
	Remarks      string    `json:"remarks"`
	IncidentDate time.Time `json:"incident_date"`
	LoggedBy     string    `json:"logged_by"`
	CreatedBy    string    `json:"created_by_name,omitempty"`
}

// Health Record Struct
type HealthRecord struct {
	StudentID         string            `json:"student_id"`
	BloodGroup        string            `json:"blood_group"`
	Allergies         []string          `json:"allergies"`
	Vaccinations      []string          `json:"vaccinations"`
	MedicalConditions string            `json:"medical_conditions"`
	HeightCm          float64           `json:"height_cm"`
	WeightKg          float64           `json:"weight_kg"`
	LastUpdatedAt     time.Time         `json:"last_updated_at"`
}

// Student Document Struct
type StudentDocument struct {
	ID           string    `json:"id"`
	StudentID    string    `json:"student_id"`
	DocumentType string    `json:"document_type"`
	FileName     string    `json:"file_name"`
	FileURL      string    `json:"file_url"`
	Status       string    `json:"status"`
	VerifiedBy   string    `json:"verified_by,omitempty"`
	VerifiedAt   *time.Time `json:"verified_at,omitempty"`
}

// Student360 Aggregated View
type Student360 struct {
	Profile      map[string]interface{} `json:"profile"`
	Behavior     []BehavioralLog        `json:"behavior"`
	Health       *HealthRecord          `json:"health"`
	Documents    []StudentDocument      `json:"documents"`
	Finances     map[string]interface{} `json:"finances"`
	Academics    map[string]interface{} `json:"academics"`
	Guardians    []map[string]interface{} `json:"guardians"`
}

// --- Behavioral Logic ---

func (s *Student360Service) AddBehavioralLog(ctx context.Context, tenantID string, log BehavioralLog) (string, error) {
	var id string
	err := s.pool.QueryRow(ctx, `
		INSERT INTO student_behavioral_logs (tenant_id, student_id, type, category, points, remarks, incident_date, logged_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`, tenantID, log.StudentID, log.Type, log.Category, log.Points, log.Remarks, log.IncidentDate, log.LoggedBy).Scan(&id)
	return id, err
}

func (s *Student360Service) ListBehavioralLogs(ctx context.Context, studentID string) ([]BehavioralLog, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT l.id, l.student_id, l.type, l.category, l.points, l.remarks, l.incident_date, l.logged_by, u.full_name
		FROM student_behavioral_logs l
		LEFT JOIN users u ON l.logged_by = u.id
		WHERE l.student_id = $1
		ORDER BY l.incident_date DESC
	`, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []BehavioralLog
	for rows.Next() {
		var l BehavioralLog
		if err := rows.Scan(&l.ID, &l.StudentID, &l.Type, &l.Category, &l.Points, &l.Remarks, &l.IncidentDate, &l.LoggedBy, &l.CreatedBy); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}

// --- Health Logic ---

func (s *Student360Service) UpsertHealthRecord(ctx context.Context, tenantID string, h HealthRecord) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO student_health_records (tenant_id, student_id, blood_group, allergies, vaccinations, medical_conditions, height_cm, weight_kg, last_updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
		ON CONFLICT (student_id) DO UPDATE SET
			blood_group = EXCLUDED.blood_group,
			allergies = EXCLUDED.allergies,
			vaccinations = EXCLUDED.vaccinations,
			medical_conditions = EXCLUDED.medical_conditions,
			height_cm = EXCLUDED.height_cm,
			weight_kg = EXCLUDED.weight_kg,
			last_updated_at = CURRENT_TIMESTAMP
	`, tenantID, h.StudentID, h.BloodGroup, h.Allergies, h.Vaccinations, h.MedicalConditions, h.HeightCm, h.WeightKg)
	return err
}

func (s *Student360Service) GetHealthRecord(ctx context.Context, studentID string) (*HealthRecord, error) {
	var h HealthRecord
	err := s.pool.QueryRow(ctx, `
		SELECT student_id, blood_group, allergies, vaccinations, medical_conditions, height_cm, weight_kg, last_updated_at
		FROM student_health_records
		WHERE student_id = $1
	`, studentID).Scan(&h.StudentID, &h.BloodGroup, &h.Allergies, &h.Vaccinations, &h.MedicalConditions, &h.HeightCm, &h.WeightKg, &h.LastUpdatedAt)
	if err != nil {
		return nil, err
	}
	return &h, nil
}

// --- Document Logic ---

func (s *Student360Service) UploadDocument(ctx context.Context, tenantID string, doc StudentDocument) (string, error) {
	var id string
	err := s.pool.QueryRow(ctx, `
		INSERT INTO student_documents (tenant_id, student_id, document_type, file_name, file_url, status)
		VALUES ($1, $2, $3, $4, $5, 'pending')
		RETURNING id
	`, tenantID, doc.StudentID, doc.DocumentType, doc.FileName, doc.FileURL).Scan(&id)
	return id, err
}

func (s *Student360Service) ListDocuments(ctx context.Context, studentID string) ([]StudentDocument, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, student_id, document_type, file_name, file_url, status, verified_by, verified_at
		FROM student_documents
		WHERE student_id = $1
		ORDER BY created_at DESC
	`, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []StudentDocument
	for rows.Next() {
		var d StudentDocument
		if err := rows.Scan(&d.ID, &d.StudentID, &d.DocumentType, &d.FileName, &d.FileURL, &d.Status, &d.VerifiedBy, &d.VerifiedAt); err != nil {
			return nil, err
		}
		docs = append(docs, d)
	}
	return docs, nil
}

// --- Aggregation Logic ---

func (s *Student360Service) GetStudent360(ctx context.Context, tenantID, studentID string) (*Student360, error) {
	// 1. Basic Profile
	profile := make(map[string]interface{})
	var admissionNumber, fullName, gender, status, className, sectionName string
	var dob time.Time
	err := s.pool.QueryRow(ctx, `
		SELECT s.admission_number, s.full_name, s.date_of_birth, s.gender, COALESCE(s.status, 'active'), COALESCE(c.name, ''), COALESCE(sec.name, '')
		FROM students s
		LEFT JOIN sections sec ON s.section_id = sec.id
		LEFT JOIN classes c ON sec.class_id = c.id
		WHERE s.id = $1 AND s.tenant_id = $2
	`, studentID, tenantID).Scan(&admissionNumber, &fullName, &dob, &gender, &status, &className, &sectionName)
	if err != nil {
		return nil, fmt.Errorf("student not found or access denied: %v", err)
	}

	profile["admission_number"] = admissionNumber
	profile["full_name"] = fullName
	profile["dob"] = dob
	profile["gender"] = gender
	profile["status"] = status
	profile["class"] = className
	profile["section"] = sectionName

	// 2. Behavioral
	behavior, _ := s.ListBehavioralLogs(ctx, studentID)

	// 3. Health
	health, _ := s.GetHealthRecord(ctx, studentID)

	// 4. Documents
	docs, _ := s.ListDocuments(ctx, studentID)

	// 5. Financial Snapshot (Real Data)
	finance := make(map[string]interface{})
	var totalDue, totalPaid int64
	var lastPayment *time.Time

	// Calculate Due from Plan Items
	s.pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(fpi.amount), 0)
		FROM fee_plan_items fpi
		JOIN student_fee_plans sfp ON fpi.plan_id = sfp.plan_id
		WHERE sfp.student_id = $1
	`, studentID).Scan(&totalDue)

	// Calculate Paid from Receipts
	s.pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(amount_paid), 0), MAX(created_at)
		FROM receipts
		WHERE student_id = $1 AND status != 'cancelled'
	`, studentID).Scan(&totalPaid, &lastPayment)

	finance["total_due"] = totalDue
	finance["paid"] = totalPaid
	finance["balance"] = totalDue - totalPaid
	finance["last_payment_date"] = lastPayment

	// 6. Academic Snapshot (Real Data)
	academics := make(map[string]interface{})
	var attendancePercent float64
	var latestExamAvg float64

	// Attendance Percentage
	s.pool.QueryRow(ctx, `
		SELECT 
			CASE WHEN COUNT(*) = 0 THEN 0 
			ELSE (COUNT(*) FILTER (WHERE status = 'present')::float / COUNT(*)::float) * 100 
			END
		FROM attendance_entries
		WHERE student_id = $1
	`, studentID).Scan(&attendancePercent)

	// Latest Exam Average
	s.pool.QueryRow(ctx, `
		SELECT COALESCE(AVG(marks_obtained), 0)
		FROM marks_entries
		WHERE student_id = $1 AND exam_id = (
			SELECT id FROM exams 
			WHERE tenant_id = $2 AND status = 'published' 
			ORDER BY start_date DESC LIMIT 1
		)
	`, studentID, tenantID).Scan(&latestExamAvg)

	// Subject-wise Performance
	subjectPerf := []map[string]interface{}{}
	rows, _ := s.pool.Query(ctx, `
		SELECT s.name, COALESCE(AVG(m.marks_obtained::float / NULLIF(m.max_marks, 0) * 100), 0) as percent
		FROM marks_entries m
		JOIN subjects s ON m.subject_id = s.id
		WHERE m.student_id = $1
		GROUP BY s.name
		LIMIT 6
	`, studentID)
	if rows != nil {
		for rows.Next() {
			var name string
			var pc float64
			if err := rows.Scan(&name, &pc); err == nil {
				subjectPerf = append(subjectPerf, map[string]interface{}{"subject": name, "score": pc})
			}
		}
		rows.Close()
	}

	// Attendance Trends (Last 6 Months)
	trends := []map[string]interface{}{}
	rows, _ = s.pool.Query(ctx, `
		SELECT TO_CHAR(asess.date, 'Mon'), COALESCE((COUNT(*) FILTER (WHERE ae.status = 'present')::float / NULLIF(COUNT(*), 0) * 100), 0)
		FROM attendance_entries ae
		JOIN attendance_sessions asess ON ae.session_id = asess.id
		WHERE ae.student_id = $1
		GROUP BY TO_CHAR(asess.date, 'Mon'), DATE_TRUNC('month', asess.date)
		ORDER BY DATE_TRUNC('month', asess.date) DESC
		LIMIT 6
	`, studentID)
	if rows != nil {
		for rows.Next() {
			var month string
			var pc float64
			if err := rows.Scan(&month, &pc); err == nil {
				// Reverse for chronological order later in JS if needed
				trends = append(trends, map[string]interface{}{"month": month, "percent": pc})
			}
		}
		rows.Close()
	}

	academics["attendance_percentage"] = attendancePercent
	academics["latest_exam_avg"] = latestExamAvg
	academics["subject_performance"] = subjectPerf
	academics["attendance_trends"] = trends

	// 7. Guardians
	guardians := []map[string]interface{}{}
	rows, _ = s.pool.Query(ctx, `
		SELECT g.full_name, g.phone, g.email, sg.relationship, sg.is_primary
		FROM guardians g
		JOIN student_guardians sg ON g.id = sg.guardian_id
		WHERE sg.student_id = $1
	`, studentID)
	if rows != nil {
		for rows.Next() {
			var name, phone, email, relationship string
			var isPrimary bool
			if err := rows.Scan(&name, &phone, &email, &relationship, &isPrimary); err == nil {
				guardians = append(guardians, map[string]interface{}{
					"name": name, "phone": phone, "email": email, "relationship": relationship, "is_primary": isPrimary,
				})
			}
		}
		rows.Close()
	}


	return &Student360{
		Profile:   profile,
		Behavior:  behavior,
		Health:    health,
		Documents: docs,
		Finances:  finance,
		Academics: academics,
		Guardians: guardians,
	}, nil
}

