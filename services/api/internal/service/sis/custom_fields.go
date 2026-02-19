package sis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/foundation/audit"
)

// ==================== Custom Field Definitions ====================

type CustomFieldDefinition struct {
	ID         string   `json:"id"`
	TenantID   string   `json:"tenant_id"`
	EntityType string   `json:"entity_type"`
	FieldName  string   `json:"field_name"`
	FieldLabel string   `json:"field_label"`
	FieldType  string   `json:"field_type"`
	Options    []string `json:"options"`
	IsRequired bool     `json:"is_required"`
	IsActive   bool     `json:"is_active"`
	SortOrder  int      `json:"sort_order"`
	CreatedAt  string   `json:"created_at"`
	UpdatedAt  string   `json:"updated_at"`
}

type CreateCustomFieldParams struct {
	TenantID   string   `json:"tenant_id"`
	EntityType string   `json:"entity_type"`
	FieldName  string   `json:"field_name"`
	FieldLabel string   `json:"field_label"`
	FieldType  string   `json:"field_type"`
	Options    []string `json:"options"`
	IsRequired bool     `json:"is_required"`
	SortOrder  int      `json:"sort_order"`
}

type CustomFieldValue struct {
	ID           string          `json:"id"`
	DefinitionID string          `json:"definition_id"`
	EntityID     string          `json:"entity_id"`
	Value        json.RawMessage `json:"value"`
	FieldName    string          `json:"field_name"`
	FieldLabel   string          `json:"field_label"`
	FieldType    string          `json:"field_type"`
}

type SetCustomFieldValueParams struct {
	TenantID     string          `json:"tenant_id"`
	DefinitionID string          `json:"definition_id"`
	EntityID     string          `json:"entity_id"`
	Value        json.RawMessage `json:"value"`
}

type CustomFieldService struct {
	pool  *pgxpool.Pool
	audit *audit.Logger
}

func NewCustomFieldService(pool *pgxpool.Pool, audit *audit.Logger) *CustomFieldService {
	return &CustomFieldService{pool: pool, audit: audit}
}

func (s *CustomFieldService) CreateDefinition(ctx context.Context, p CreateCustomFieldParams) (CustomFieldDefinition, error) {
	if p.EntityType == "" || p.FieldName == "" || p.FieldLabel == "" {
		return CustomFieldDefinition{}, fmt.Errorf("entity_type, field_name, and field_label are required")
	}

	allowed := map[string]bool{"text": true, "number": true, "date": true, "select": true, "multiselect": true, "boolean": true, "textarea": true}
	if !allowed[p.FieldType] {
		p.FieldType = "text"
	}

	opts, _ := json.Marshal(p.Options)
	if p.Options == nil {
		opts = []byte("[]")
	}

	var def CustomFieldDefinition
	err := s.pool.QueryRow(ctx,
		`INSERT INTO custom_field_definitions (tenant_id, entity_type, field_name, field_label, field_type, options, is_required, sort_order)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, tenant_id, entity_type, field_name, field_label, field_type, options, is_required, is_active, sort_order, created_at, updated_at`,
		p.TenantID, p.EntityType, p.FieldName, p.FieldLabel, p.FieldType, opts, p.IsRequired, p.SortOrder,
	).Scan(&def.ID, &def.TenantID, &def.EntityType, &def.FieldName, &def.FieldLabel, &def.FieldType,
		&opts, &def.IsRequired, &def.IsActive, &def.SortOrder, &def.CreatedAt, &def.UpdatedAt)
	if err != nil {
		return CustomFieldDefinition{}, fmt.Errorf("create custom field definition: %w", err)
	}
	json.Unmarshal(opts, &def.Options)
	return def, nil
}

func (s *CustomFieldService) ListDefinitions(ctx context.Context, tenantID, entityType string) ([]CustomFieldDefinition, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, tenant_id, entity_type, field_name, field_label, field_type, options, is_required, is_active, sort_order, created_at, updated_at
		 FROM custom_field_definitions
		 WHERE tenant_id = $1 AND ($2 = '' OR entity_type = $2) AND is_active = true
		 ORDER BY sort_order, field_label`, tenantID, entityType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var defs []CustomFieldDefinition
	for rows.Next() {
		var d CustomFieldDefinition
		var opts []byte
		if err := rows.Scan(&d.ID, &d.TenantID, &d.EntityType, &d.FieldName, &d.FieldLabel, &d.FieldType,
			&opts, &d.IsRequired, &d.IsActive, &d.SortOrder, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, err
		}
		json.Unmarshal(opts, &d.Options)
		defs = append(defs, d)
	}
	if defs == nil {
		defs = []CustomFieldDefinition{}
	}
	return defs, nil
}

func (s *CustomFieldService) UpdateDefinition(ctx context.Context, tenantID, defID string, p CreateCustomFieldParams) (CustomFieldDefinition, error) {
	opts, _ := json.Marshal(p.Options)
	if p.Options == nil {
		opts = []byte("[]")
	}

	var def CustomFieldDefinition
	err := s.pool.QueryRow(ctx,
		`UPDATE custom_field_definitions
		 SET field_label = $1, field_type = $2, options = $3, is_required = $4, sort_order = $5, updated_at = NOW()
		 WHERE id = $6 AND tenant_id = $7
		 RETURNING id, tenant_id, entity_type, field_name, field_label, field_type, options, is_required, is_active, sort_order, created_at, updated_at`,
		p.FieldLabel, p.FieldType, opts, p.IsRequired, p.SortOrder, defID, tenantID,
	).Scan(&def.ID, &def.TenantID, &def.EntityType, &def.FieldName, &def.FieldLabel, &def.FieldType,
		&opts, &def.IsRequired, &def.IsActive, &def.SortOrder, &def.CreatedAt, &def.UpdatedAt)
	if err != nil {
		return CustomFieldDefinition{}, fmt.Errorf("update custom field definition: %w", err)
	}
	json.Unmarshal(opts, &def.Options)
	return def, nil
}

func (s *CustomFieldService) DeleteDefinition(ctx context.Context, tenantID, defID string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE custom_field_definitions SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
		defID, tenantID)
	return err
}

// ==================== Custom Field Values ====================

func (s *CustomFieldService) GetValues(ctx context.Context, tenantID, entityID, entityType string) ([]CustomFieldValue, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT v.id, v.definition_id, v.entity_id, v.value, d.field_name, d.field_label, d.field_type
		 FROM custom_field_values v
		 JOIN custom_field_definitions d ON d.id = v.definition_id
		 WHERE v.tenant_id = $1 AND v.entity_id = $2 AND d.entity_type = $3 AND d.is_active = true
		 ORDER BY d.sort_order`, tenantID, entityID, entityType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var vals []CustomFieldValue
	for rows.Next() {
		var v CustomFieldValue
		if err := rows.Scan(&v.ID, &v.DefinitionID, &v.EntityID, &v.Value, &v.FieldName, &v.FieldLabel, &v.FieldType); err != nil {
			return nil, err
		}
		vals = append(vals, v)
	}
	if vals == nil {
		vals = []CustomFieldValue{}
	}
	return vals, nil
}

func (s *CustomFieldService) SetValue(ctx context.Context, p SetCustomFieldValueParams) error {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO custom_field_values (tenant_id, definition_id, entity_id, value)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (definition_id, entity_id) DO UPDATE SET value = $4, updated_at = NOW()`,
		p.TenantID, p.DefinitionID, p.EntityID, p.Value)
	return err
}

func (s *CustomFieldService) BulkSetValues(ctx context.Context, tenantID, entityID string, values map[string]json.RawMessage) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for defID, val := range values {
		_, err := tx.Exec(ctx,
			`INSERT INTO custom_field_values (tenant_id, definition_id, entity_id, value)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (definition_id, entity_id) DO UPDATE SET value = $4, updated_at = NOW()`,
			tenantID, defID, entityID, val)
		if err != nil {
			return fmt.Errorf("set custom field %s: %w", defID, err)
		}
	}
	return tx.Commit(ctx)
}

// ==================== House System ====================

type House struct {
	ID       string `json:"id"`
	TenantID string `json:"tenant_id"`
	Name     string `json:"name"`
	Color    string `json:"color"`
	LogoURL  string `json:"logo_url"`
	IsActive bool   `json:"is_active"`
}

func (s *CustomFieldService) CreateHouse(ctx context.Context, tenantID, name, color, logoURL string) (House, error) {
	var h House
	err := s.pool.QueryRow(ctx,
		`INSERT INTO student_houses (tenant_id, name, color, logo_url)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, tenant_id, name, COALESCE(color, ''), COALESCE(logo_url, ''), is_active`,
		tenantID, name, color, logoURL,
	).Scan(&h.ID, &h.TenantID, &h.Name, &h.Color, &h.LogoURL, &h.IsActive)
	return h, err
}

func (s *CustomFieldService) ListHouses(ctx context.Context, tenantID string) ([]House, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, tenant_id, name, COALESCE(color, ''), COALESCE(logo_url, ''), is_active
		 FROM student_houses WHERE tenant_id = $1 AND is_active = true ORDER BY name`, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var houses []House
	for rows.Next() {
		var h House
		if err := rows.Scan(&h.ID, &h.TenantID, &h.Name, &h.Color, &h.LogoURL, &h.IsActive); err != nil {
			return nil, err
		}
		houses = append(houses, h)
	}
	if houses == nil {
		houses = []House{}
	}
	return houses, nil
}

func (s *CustomFieldService) UpdateHouse(ctx context.Context, tenantID, houseID, name, color, logoURL string) (House, error) {
	var h House
	err := s.pool.QueryRow(ctx,
		`UPDATE student_houses SET name = $1, color = $2, logo_url = $3, updated_at = NOW()
		 WHERE id = $4 AND tenant_id = $5
		 RETURNING id, tenant_id, name, COALESCE(color, ''), COALESCE(logo_url, ''), is_active`,
		name, color, logoURL, houseID, tenantID,
	).Scan(&h.ID, &h.TenantID, &h.Name, &h.Color, &h.LogoURL, &h.IsActive)
	return h, err
}

func (s *CustomFieldService) DeleteHouse(ctx context.Context, tenantID, houseID string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE student_houses SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
		houseID, tenantID)
	return err
}

func (s *CustomFieldService) AssignStudentHouse(ctx context.Context, tenantID, studentID, houseID string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE students SET house_id = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
		houseID, studentID, tenantID)
	return err
}

// ==================== School Profile ====================

type SchoolProfile struct {
	TenantID           string `json:"tenant_id"`
	SchoolName         string `json:"school_name"`
	LogoURL            string `json:"logo_url"`
	Address            string `json:"address"`
	City               string `json:"city"`
	State              string `json:"state"`
	Pincode            string `json:"pincode"`
	Phone              string `json:"phone"`
	Email              string `json:"email"`
	Website            string `json:"website"`
	AffiliationBoard   string `json:"affiliation_board"`
	AffiliationNumber  string `json:"affiliation_number"`
	Timezone           string `json:"timezone"`
	AcademicYearFormat string `json:"academic_year_format"`
	GradingSystem      string `json:"grading_system"`
	UpdatedAt          string `json:"updated_at"`
}

func (s *CustomFieldService) GetSchoolProfile(ctx context.Context, tenantID string) (SchoolProfile, error) {
	var p SchoolProfile
	err := s.pool.QueryRow(ctx,
		`SELECT tenant_id, COALESCE(school_name,''), COALESCE(logo_url,''), COALESCE(address,''),
		        COALESCE(city,''), COALESCE(state,''), COALESCE(pincode,''), COALESCE(phone,''),
		        COALESCE(email,''), COALESCE(website,''), COALESCE(affiliation_board,''),
		        COALESCE(affiliation_number,''), COALESCE(timezone,'Asia/Kolkata'),
		        COALESCE(academic_year_format,'YYYY-YYYY'), COALESCE(grading_system,'percentage'), updated_at
		 FROM school_profiles WHERE tenant_id = $1`, tenantID,
	).Scan(&p.TenantID, &p.SchoolName, &p.LogoURL, &p.Address, &p.City, &p.State, &p.Pincode,
		&p.Phone, &p.Email, &p.Website, &p.AffiliationBoard, &p.AffiliationNumber,
		&p.Timezone, &p.AcademicYearFormat, &p.GradingSystem, &p.UpdatedAt)
	if err != nil {
		// Return empty profile if not found
		return SchoolProfile{TenantID: tenantID, Timezone: "Asia/Kolkata", GradingSystem: "percentage", AcademicYearFormat: "YYYY-YYYY"}, nil
	}
	return p, nil
}

func (s *CustomFieldService) UpsertSchoolProfile(ctx context.Context, p SchoolProfile) (SchoolProfile, error) {
	if p.Timezone == "" {
		p.Timezone = "Asia/Kolkata"
	}
	if p.GradingSystem == "" {
		p.GradingSystem = "percentage"
	}

	_, err := s.pool.Exec(ctx,
		`INSERT INTO school_profiles (tenant_id, school_name, logo_url, address, city, state, pincode, phone, email, website, affiliation_board, affiliation_number, timezone, academic_year_format, grading_system)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		 ON CONFLICT (tenant_id) DO UPDATE SET
		   school_name = $2, logo_url = $3, address = $4, city = $5, state = $6, pincode = $7,
		   phone = $8, email = $9, website = $10, affiliation_board = $11, affiliation_number = $12,
		   timezone = $13, academic_year_format = $14, grading_system = $15, updated_at = NOW()`,
		p.TenantID, p.SchoolName, p.LogoURL, p.Address, p.City, p.State, p.Pincode,
		p.Phone, p.Email, p.Website, p.AffiliationBoard, p.AffiliationNumber,
		p.Timezone, p.AcademicYearFormat, p.GradingSystem)
	if err != nil {
		return SchoolProfile{}, fmt.Errorf("upsert school profile: %w", err)
	}
	p.UpdatedAt = time.Now().Format(time.RFC3339)
	return p, nil
}

// ==================== Bulk Import (Users) ====================

type ImportJob struct {
	ID           string   `json:"id"`
	TenantID     string   `json:"tenant_id"`
	Type         string   `json:"type"`
	Status       string   `json:"status"`
	TotalRows    int      `json:"total_rows"`
	SuccessCount int      `json:"success_count"`
	ErrorCount   int      `json:"error_count"`
	Errors       []string `json:"errors"`
	FileName     string   `json:"file_name"`
	UploadedBy   string   `json:"uploaded_by"`
	CreatedAt    string   `json:"created_at"`
}

func (s *CustomFieldService) CreateImportJob(ctx context.Context, tenantID, importType, fileName, userID string) (ImportJob, error) {
	var j ImportJob
	var errorsJSON []byte
	err := s.pool.QueryRow(ctx,
		`INSERT INTO import_jobs (tenant_id, type, file_name, uploaded_by) VALUES ($1, $2, $3, $4)
		 RETURNING id, tenant_id, type, status, total_rows, success_count, error_count, errors, COALESCE(file_name,''), COALESCE(uploaded_by::text,''), created_at`,
		tenantID, importType, fileName, userID,
	).Scan(&j.ID, &j.TenantID, &j.Type, &j.Status, &j.TotalRows, &j.SuccessCount, &j.ErrorCount, &errorsJSON, &j.FileName, &j.UploadedBy, &j.CreatedAt)
	if err != nil {
		return ImportJob{}, err
	}
	json.Unmarshal(errorsJSON, &j.Errors)
	if j.Errors == nil {
		j.Errors = []string{}
	}
	return j, nil
}

func (s *CustomFieldService) UpdateImportJob(ctx context.Context, jobID string, status string, total, success, errorCount int, errors []string) error {
	errJSON, _ := json.Marshal(errors)
	_, err := s.pool.Exec(ctx,
		`UPDATE import_jobs SET status = $1, total_rows = $2, success_count = $3, error_count = $4, errors = $5,
		 completed_at = CASE WHEN $1 IN ('completed', 'failed') THEN NOW() ELSE NULL END
		 WHERE id = $6`,
		status, total, success, errorCount, errJSON, jobID)
	return err
}

func (s *CustomFieldService) ListImportJobs(ctx context.Context, tenantID string) ([]ImportJob, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, tenant_id, type, status, total_rows, success_count, error_count, errors, COALESCE(file_name,''), COALESCE(uploaded_by::text,''), created_at
		 FROM import_jobs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50`, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var jobs []ImportJob
	for rows.Next() {
		var j ImportJob
		var errorsJSON []byte
		if err := rows.Scan(&j.ID, &j.TenantID, &j.Type, &j.Status, &j.TotalRows, &j.SuccessCount, &j.ErrorCount, &errorsJSON, &j.FileName, &j.UploadedBy, &j.CreatedAt); err != nil {
			return nil, err
		}
		json.Unmarshal(errorsJSON, &j.Errors)
		if j.Errors == nil {
			j.Errors = []string{}
		}
		jobs = append(jobs, j)
	}
	if jobs == nil {
		jobs = []ImportJob{}
	}
	return jobs, nil
}
