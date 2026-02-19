package academics

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type ResourceService struct {
	db    *pgxpool.Pool
	audit *audit.Logger
}

func NewResourceService(db *pgxpool.Pool, audit *audit.Logger) *ResourceService {
	return &ResourceService{db: db, audit: audit}
}

type LearningResource struct {
	ID           string    `json:"id"`
	ClassID      string    `json:"class_id,omitempty"`
	SectionID    string    `json:"section_id,omitempty"`
	SubjectID    string    `json:"subject_id,omitempty"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	ResourceType string    `json:"resource_type"` // video_link, file, document_link
	URL          string    `json:"url"`
	UploadedBy   string    `json:"uploaded_by"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}

func (s *ResourceService) CreateResource(ctx context.Context, tenantID string, r LearningResource, userID, reqID, ip string) (LearningResource, error) {
	var id string
	query := `
		INSERT INTO learning_resources (tenant_id, class_id, section_id, subject_id, title, description, resource_type, url, uploaded_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at
	`
	err := s.db.QueryRow(ctx, query,
		tenantID,
		nullUUID(r.ClassID),
		nullUUID(r.SectionID),
		nullUUID(r.SubjectID),
		r.Title,
		r.Description,
		r.ResourceType,
		r.URL,
		r.UploadedBy,
	).Scan(&id, &r.CreatedAt)

	if err != nil {
		return LearningResource{}, err
	}
	r.ID = id

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     toPgUUID(tenantID),
		UserID:       toPgUUID(userID),
		RequestID:    reqID,
		Action:       "resource.create",
		ResourceType: "learning_resource",
		ResourceID:   toPgUUID(id),
		After:        r,
		IPAddress:    ip,
	})

	return r, nil
}

func (s *ResourceService) ListResources(ctx context.Context, tenantID, classID, subjectID string) ([]LearningResource, error) {
	query := `
		SELECT id, class_id, section_id, subject_id, title, description, resource_type, url, uploaded_by, is_active, created_at
		FROM learning_resources
		WHERE tenant_id = $1 AND (class_id = $2 OR $2 IS NULL) AND (subject_id = $3 OR $3 IS NULL) AND is_active = true
		ORDER BY created_at DESC
	`
	rows, err := s.db.Query(ctx, query, tenantID, nullUUID(classID), nullUUID(subjectID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var resources []LearningResource
	for rows.Next() {
		var r LearningResource
		var cID, sID, scID *string
		err := rows.Scan(&r.ID, &cID, &scID, &sID, &r.Title, &r.Description, &r.ResourceType, &r.URL, &r.UploadedBy, &r.IsActive, &r.CreatedAt)
		if err != nil {
			return nil, err
		}
		if cID != nil { r.ClassID = *cID }
		if sID != nil { r.SubjectID = *sID }
		if scID != nil { r.SectionID = *scID }
		resources = append(resources, r)
	}
	return resources, nil
}

func (s *ResourceService) DeleteResource(ctx context.Context, tenantID, id string, userID, reqID, ip string) error {
	query := `UPDATE learning_resources SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`
	_, err := s.db.Exec(ctx, query, id, tenantID)
	if err != nil {
		return err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     toPgUUID(tenantID),
		UserID:       toPgUUID(userID),
		RequestID:    reqID,
		Action:       "resource.delete",
		ResourceType: "learning_resource",
		ResourceID:   toPgUUID(id),
		IPAddress:    ip,
	})

	return nil
}
