package kb

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

var (
	ErrKBDisabled       = errors.New("knowledgebase is disabled")
	ErrKBForbidden      = errors.New("you are not allowed to use knowledgebase search")
	ErrKBNotFound       = errors.New("knowledgebase document not found")
	ErrKBInvalidPayload = errors.New("invalid knowledgebase payload")
)

const (
	defaultChunkSize    = 1600
	defaultChunkOverlap = 150
)

type Service struct {
	q      *db.Queries
	pool   *pgxpool.Pool
	audit  *audit.Logger
	engine KBAnswerEngine
}

func NewService(q *db.Queries, pool *pgxpool.Pool, auditLogger *audit.Logger) *Service {
	svc := &Service{
		q:     q,
		pool:  pool,
		audit: auditLogger,
	}
	svc.engine = NewSearchOnlyAnswerEngine(q, pool)
	return svc
}

func (s *Service) SetAnswerEngine(engine KBAnswerEngine) {
	if engine == nil {
		return
	}
	s.engine = engine
}

func (s *Service) CreateDocument(ctx context.Context, tenantID, userID string, req DocumentUpsertRequest) (DocumentDTO, error) {
	normalized, err := normalizeUpsertRequest(req)
	if err != nil {
		return DocumentDTO{}, err
	}

	tenantUUID, err := parseUUID(tenantID)
	if err != nil {
		return DocumentDTO{}, err
	}
	userUUID, err := parseUUID(userID)
	if err != nil {
		return DocumentDTO{}, err
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return DocumentDTO{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	qtx := s.q.WithTx(tx)
	doc, err := qtx.CreateKBDocument(ctx, db.CreateKBDocumentParams{
		TenantID:    tenantUUID,
		Title:       normalized.Title,
		Category:    toText(normalized.Category),
		Tags:        normalized.Tags,
		Visibility:  normalized.Visibility,
		Status:      normalized.Status,
		ContentText: normalized.ContentText,
		CreatedBy:   userUUID,
	})
	if err != nil {
		return DocumentDTO{}, err
	}

	if err := insertChunks(ctx, qtx, tenantUUID, doc.ID, normalized.ContentText); err != nil {
		return DocumentDTO{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return DocumentDTO{}, err
	}

	s.logDocumentAudit(ctx, tenantUUID, userUUID, "kb.document.create", doc.ID, nil, doc)
	return mapDocument(doc), nil
}

func (s *Service) ListDocuments(ctx context.Context, tenantID string, filters DocumentListFilters) ([]DocumentDTO, error) {
	tenantUUID, err := parseUUID(tenantID)
	if err != nil {
		return nil, err
	}

	limit := filters.Limit
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	rows, err := s.q.ListKBDocuments(ctx, db.ListKBDocumentsParams{
		TenantID: tenantUUID,
		Column2:  strings.TrimSpace(strings.ToLower(filters.Status)),
		Column3:  strings.TrimSpace(strings.ToLower(filters.Visibility)),
		Column4:  strings.TrimSpace(filters.Category),
		Column5:  strings.TrimSpace(filters.Search),
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		return nil, err
	}

	out := make([]DocumentDTO, 0, len(rows))
	for _, row := range rows {
		out = append(out, mapDocument(row))
	}
	return out, nil
}

func (s *Service) GetDocument(ctx context.Context, tenantID, documentID string) (DocumentWithChunks, error) {
	tenantUUID, err := parseUUID(tenantID)
	if err != nil {
		return DocumentWithChunks{}, err
	}
	docUUID, err := parseUUID(documentID)
	if err != nil {
		return DocumentWithChunks{}, err
	}

	doc, err := s.q.GetKBDocument(ctx, db.GetKBDocumentParams{ID: docUUID, TenantID: tenantUUID})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return DocumentWithChunks{}, ErrKBNotFound
		}
		return DocumentWithChunks{}, err
	}

	chunks, err := s.q.ListKBChunksByDocument(ctx, db.ListKBChunksByDocumentParams{
		TenantID:   tenantUUID,
		DocumentID: docUUID,
	})
	if err != nil {
		return DocumentWithChunks{}, err
	}

	outChunks := make([]ChunkDTO, 0, len(chunks))
	for _, chunk := range chunks {
		outChunks = append(outChunks, ChunkDTO{
			ID:         chunk.ID.String(),
			ChunkIndex: chunk.ChunkIndex,
			Content:    chunk.Content,
		})
	}

	return DocumentWithChunks{Document: mapDocument(doc), Chunks: outChunks}, nil
}

func (s *Service) UpdateDocument(ctx context.Context, tenantID, documentID, userID string, patch DocumentPatchRequest) (DocumentDTO, error) {
	tenantUUID, err := parseUUID(tenantID)
	if err != nil {
		return DocumentDTO{}, err
	}
	docUUID, err := parseUUID(documentID)
	if err != nil {
		return DocumentDTO{}, err
	}
	userUUID, err := parseUUID(userID)
	if err != nil {
		return DocumentDTO{}, err
	}

	before, err := s.q.GetKBDocument(ctx, db.GetKBDocumentParams{ID: docUUID, TenantID: tenantUUID})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return DocumentDTO{}, ErrKBNotFound
		}
		return DocumentDTO{}, err
	}

	merged, err := mergePatch(before, patch)
	if err != nil {
		return DocumentDTO{}, err
	}
	contentChanged := merged.ContentText != before.ContentText

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return DocumentDTO{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	qtx := s.q.WithTx(tx)
	after, err := qtx.UpdateKBDocument(ctx, db.UpdateKBDocumentParams{
		ID:          docUUID,
		TenantID:    tenantUUID,
		Title:       merged.Title,
		Category:    toText(merged.Category),
		Tags:        merged.Tags,
		Visibility:  merged.Visibility,
		Status:      merged.Status,
		ContentText: merged.ContentText,
		UpdatedBy:   userUUID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return DocumentDTO{}, ErrKBNotFound
		}
		return DocumentDTO{}, err
	}

	if contentChanged {
		if err := qtx.DeleteKBChunksByDocument(ctx, db.DeleteKBChunksByDocumentParams{TenantID: tenantUUID, DocumentID: docUUID}); err != nil {
			return DocumentDTO{}, err
		}
		if err := insertChunks(ctx, qtx, tenantUUID, docUUID, merged.ContentText); err != nil {
			return DocumentDTO{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return DocumentDTO{}, err
	}

	action := "kb.document.update"
	if before.Status != "published" && after.Status == "published" {
		action = "kb.document.publish"
	}
	s.logDocumentAudit(ctx, tenantUUID, userUUID, action, after.ID, before, after)
	return mapDocument(after), nil
}

func (s *Service) DeleteDocument(ctx context.Context, tenantID, documentID, userID string) error {
	tenantUUID, err := parseUUID(tenantID)
	if err != nil {
		return err
	}
	docUUID, err := parseUUID(documentID)
	if err != nil {
		return err
	}
	userUUID, err := parseUUID(userID)
	if err != nil {
		return err
	}

	before, err := s.q.GetKBDocument(ctx, db.GetKBDocumentParams{ID: docUUID, TenantID: tenantUUID})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrKBNotFound
		}
		return err
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	qtx := s.q.WithTx(tx)
	if err := qtx.SoftDeleteKBDocument(ctx, db.SoftDeleteKBDocumentParams{
		ID:        docUUID,
		TenantID:  tenantUUID,
		UpdatedBy: userUUID,
	}); err != nil {
		return err
	}
	if err := qtx.DeleteKBChunksByDocument(ctx, db.DeleteKBChunksByDocumentParams{TenantID: tenantUUID, DocumentID: docUUID}); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}

	s.logDocumentAudit(ctx, tenantUUID, userUUID, "kb.document.delete", docUUID, before, nil)
	return nil
}

func (s *Service) GetSettings(ctx context.Context, tenantID string) (SettingsDTO, error) {
	settings, err := s.ensureSettings(ctx, tenantID)
	if err != nil {
		return SettingsDTO{}, err
	}
	return mapSettings(settings), nil
}

func (s *Service) UpdateSettings(ctx context.Context, tenantID string, patch SettingsPatchRequest) (SettingsDTO, error) {
	settings, err := s.ensureSettings(ctx, tenantID)
	if err != nil {
		return SettingsDTO{}, err
	}
	tenantUUID, err := parseUUID(tenantID)
	if err != nil {
		return SettingsDTO{}, err
	}

	enabled := settings.Enabled
	if patch.Enabled != nil {
		enabled = *patch.Enabled
	}
	allowParents := settings.AllowParents
	if patch.AllowParents != nil {
		allowParents = *patch.AllowParents
	}
	allowStudents := settings.AllowStudents
	if patch.AllowStudents != nil {
		allowStudents = *patch.AllowStudents
	}
	allowedRoles := settings.AllowedRoles
	if patch.AllowedRoles != nil {
		allowedRoles = normalizeRoles(patch.AllowedRoles)
	}
	if len(allowedRoles) == 0 {
		allowedRoles = defaultAllowedRoles()
	}

	updated, err := s.q.UpsertTenantKBSettings(ctx, db.UpsertTenantKBSettingsParams{
		TenantID:      tenantUUID,
		Enabled:       enabled,
		AllowedRoles:  allowedRoles,
		AllowParents:  allowParents,
		AllowStudents: allowStudents,
	})
	if err != nil {
		return SettingsDTO{}, err
	}
	return mapSettings(updated), nil
}

func (s *Service) Search(ctx context.Context, tenantID string, userCtx UserContext, req SearchRequest) (SearchResponse, error) {
	query := strings.TrimSpace(req.Q)
	if query == "" {
		return SearchResponse{}, fmt.Errorf("query is required")
	}

	settings, err := s.ensureSettings(ctx, tenantID)
	if err != nil {
		return SearchResponse{}, err
	}

	allowedVisibilities, err := evaluateSearchAccess(settings, strings.ToLower(strings.TrimSpace(userCtx.Role)))
	if err != nil {
		return SearchResponse{}, err
	}

	filters := req.Filters
	filters.TopK = req.TopK
	if filters.TopK <= 0 {
		filters.TopK = 10
	}
	if filters.TopK > 25 {
		filters.TopK = 25
	}
	status := strings.TrimSpace(strings.ToLower(filters.Status))
	if status == "" {
		status = "published"
	}
	if userCtx.Role != "tenant_admin" && userCtx.Role != "super_admin" {
		status = "published"
	}
	filters.Status = status
	filters.AllowedVisibilities = allowedVisibilities

	started := time.Now()
	summary, results, meta, confidence, err := s.engine.Answer(ctx, query, tenantID, userCtx, filters)
	if err != nil {
		return SearchResponse{}, err
	}
	meta.LatencyMs = time.Since(started).Milliseconds()

	resp := SearchResponse{
		AnswerMode: "search_only",
		ModelUsed:  "none",
		Confidence: confidence,
		Summary:    summary,
		Results:    results,
		Meta:       meta,
	}

	s.logSearchAudit(ctx, tenantID, userCtx.UserID, len(query), results, meta)
	return resp, nil
}

func (s *Service) ListFacets(ctx context.Context, tenantID string, userCtx UserContext) (FacetsResponse, error) {
	settings, err := s.ensureSettings(ctx, tenantID)
	if err != nil {
		return FacetsResponse{}, err
	}
	allowedVisibilities, err := evaluateSearchAccess(settings, strings.ToLower(strings.TrimSpace(userCtx.Role)))
	if err != nil {
		return FacetsResponse{}, err
	}

	tenantUUID, err := parseUUID(tenantID)
	if err != nil {
		return FacetsResponse{}, err
	}

	categoryRows, err := s.q.ListKBCategories(ctx, db.ListKBCategoriesParams{TenantID: tenantUUID, Column2: allowedVisibilities})
	if err != nil {
		return FacetsResponse{}, err
	}
	tagRows, err := s.q.ListKBTags(ctx, db.ListKBTagsParams{TenantID: tenantUUID, Column2: allowedVisibilities})
	if err != nil {
		return FacetsResponse{}, err
	}

	categories := make([]string, 0, len(categoryRows))
	for _, row := range categoryRows {
		if row.Valid {
			categories = append(categories, row.String)
		}
	}
	return FacetsResponse{Categories: categories, Tags: tagRows}, nil
}

func (s *Service) ensureSettings(ctx context.Context, tenantID string) (db.TenantKbSetting, error) {
	tenantUUID, err := parseUUID(tenantID)
	if err != nil {
		return db.TenantKbSetting{}, err
	}

	settings, err := s.q.GetTenantKBSettings(ctx, tenantUUID)
	if err == nil {
		if len(settings.AllowedRoles) == 0 {
			settings.AllowedRoles = defaultAllowedRoles()
		}
		return settings, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return db.TenantKbSetting{}, err
	}

	return s.q.UpsertTenantKBSettings(ctx, db.UpsertTenantKBSettingsParams{
		TenantID:      tenantUUID,
		Enabled:       false,
		AllowedRoles:  defaultAllowedRoles(),
		AllowParents:  false,
		AllowStudents: false,
	})
}

func evaluateSearchAccess(settings db.TenantKbSetting, role string) ([]string, error) {
	if role == "super_admin" {
		return []string{"internal", "parents", "students"}, nil
	}
	if !settings.Enabled {
		return nil, ErrKBDisabled
	}
	allowedRoles := normalizeRoles(settings.AllowedRoles)
	if !containsString(allowedRoles, role) {
		return nil, ErrKBForbidden
	}

	switch role {
	case "parent":
		if !settings.AllowParents {
			return nil, ErrKBForbidden
		}
		return []string{"parents"}, nil
	case "student":
		if !settings.AllowStudents {
			return nil, ErrKBForbidden
		}
		return []string{"students"}, nil
	case "tenant_admin":
		return []string{"internal", "parents", "students"}, nil
	default:
		return []string{"internal"}, nil
	}
}

func insertChunks(ctx context.Context, qtx *db.Queries, tenantUUID, documentUUID pgtype.UUID, content string) error {
	chunks := chunkText(content, defaultChunkSize, defaultChunkOverlap)
	if len(chunks) == 0 {
		return fmt.Errorf("%w: content_text must not be empty", ErrKBInvalidPayload)
	}
	for idx, chunk := range chunks {
		if _, err := qtx.CreateKBChunk(ctx, db.CreateKBChunkParams{
			TenantID:   tenantUUID,
			DocumentID: documentUUID,
			ChunkIndex: int32(idx),
			Content:    chunk,
		}); err != nil {
			return err
		}
	}
	return nil
}

func chunkText(content string, chunkSize, overlap int) []string {
	text := strings.TrimSpace(content)
	if text == "" {
		return nil
	}
	runes := []rune(text)
	if len(runes) <= chunkSize {
		return []string{text}
	}

	if overlap >= chunkSize {
		overlap = chunkSize / 10
	}
	if overlap < 0 {
		overlap = 0
	}

	chunks := make([]string, 0)
	start := 0
	for start < len(runes) {
		end := start + chunkSize
		if end > len(runes) {
			end = len(runes)
		}
		chunk := strings.TrimSpace(string(runes[start:end]))
		if chunk != "" {
			chunks = append(chunks, chunk)
		}
		if end == len(runes) {
			break
		}
		nextStart := end - overlap
		if nextStart <= start {
			nextStart = end
		}
		start = nextStart
	}
	return chunks
}

func normalizeUpsertRequest(req DocumentUpsertRequest) (DocumentUpsertRequest, error) {
	out := req
	out.Title = strings.TrimSpace(out.Title)
	out.Category = strings.TrimSpace(out.Category)
	out.Visibility = strings.ToLower(strings.TrimSpace(out.Visibility))
	out.Status = strings.ToLower(strings.TrimSpace(out.Status))
	out.ContentText = strings.TrimSpace(out.ContentText)
	out.Tags = normalizeTags(out.Tags)

	if out.Title == "" || out.ContentText == "" {
		return DocumentUpsertRequest{}, fmt.Errorf("%w: title and content_text are required", ErrKBInvalidPayload)
	}
	if out.Visibility == "" {
		out.Visibility = "internal"
	}
	if out.Status == "" {
		out.Status = "draft"
	}
	if !isAllowedVisibility(out.Visibility) {
		return DocumentUpsertRequest{}, fmt.Errorf("%w: invalid visibility", ErrKBInvalidPayload)
	}
	if !isAllowedStatus(out.Status) {
		return DocumentUpsertRequest{}, fmt.Errorf("%w: invalid status", ErrKBInvalidPayload)
	}
	return out, nil
}

func mergePatch(before db.KbDocument, patch DocumentPatchRequest) (DocumentUpsertRequest, error) {
	merged := DocumentUpsertRequest{
		Title:       before.Title,
		Category:    before.Category.String,
		Tags:        before.Tags,
		Visibility:  before.Visibility,
		Status:      before.Status,
		ContentText: before.ContentText,
	}

	if patch.Title != nil {
		merged.Title = *patch.Title
	}
	if patch.Category != nil {
		merged.Category = *patch.Category
	}
	if patch.Tags != nil {
		merged.Tags = *patch.Tags
	}
	if patch.Visibility != nil {
		merged.Visibility = *patch.Visibility
	}
	if patch.Status != nil {
		merged.Status = *patch.Status
	}
	if patch.ContentText != nil {
		merged.ContentText = *patch.ContentText
	}

	return normalizeUpsertRequest(merged)
}

func isAllowedVisibility(v string) bool {
	switch v {
	case "internal", "parents", "students":
		return true
	default:
		return false
	}
}

func isAllowedStatus(s string) bool {
	switch s {
	case "draft", "published", "archived":
		return true
	default:
		return false
	}
}

func mapDocument(doc db.KbDocument) DocumentDTO {
	return DocumentDTO{
		ID:          doc.ID.String(),
		Title:       doc.Title,
		Category:    doc.Category.String,
		Tags:        doc.Tags,
		Visibility:  doc.Visibility,
		Status:      doc.Status,
		ContentText: doc.ContentText,
		CreatedAt:   doc.CreatedAt.Time.UTC(),
		UpdatedAt:   doc.UpdatedAt.Time.UTC(),
	}
}

func mapSettings(settings db.TenantKbSetting) SettingsDTO {
	roles := settings.AllowedRoles
	if len(roles) == 0 {
		roles = defaultAllowedRoles()
	}
	return SettingsDTO{
		Enabled:       settings.Enabled,
		AllowedRoles:  normalizeRoles(roles),
		AllowParents:  settings.AllowParents,
		AllowStudents: settings.AllowStudents,
	}
}

func normalizeRoles(roles []string) []string {
	if len(roles) == 0 {
		return nil
	}
	seen := map[string]struct{}{}
	out := make([]string, 0, len(roles))
	for _, role := range roles {
		normalized := strings.ToLower(strings.TrimSpace(role))
		if normalized == "" {
			continue
		}
		if _, ok := seen[normalized]; ok {
			continue
		}
		seen[normalized] = struct{}{}
		out = append(out, normalized)
	}
	return out
}

func defaultAllowedRoles() []string {
	return []string{"tenant_admin", "teacher"}
}

func containsString(values []string, target string) bool {
	for _, value := range values {
		if strings.EqualFold(strings.TrimSpace(value), strings.TrimSpace(target)) {
			return true
		}
	}
	return false
}

func toText(value string) pgtype.Text {
	trimmed := strings.TrimSpace(value)
	return pgtype.Text{String: trimmed, Valid: trimmed != ""}
}

func (s *Service) logDocumentAudit(ctx context.Context, tenantID, userID pgtype.UUID, action string, resourceID pgtype.UUID, before, after interface{}) {
	if s.audit == nil {
		return
	}
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tenantID,
		UserID:       userID,
		Action:       action,
		ResourceType: "kb_document",
		ResourceID:   resourceID,
		Before:       before,
		After:        after,
	})
}

func (s *Service) logSearchAudit(ctx context.Context, tenantID string, userID string, queryLength int, results []SearchResult, meta SearchMeta) {
	if s.audit == nil {
		return
	}
	tenantUUID, err := parseUUID(tenantID)
	if err != nil {
		return
	}
	userUUID, err := parseUUID(userID)
	if err != nil {
		userUUID = pgtype.UUID{}
	}

	topDocIDs := make([]string, 0, len(results))
	for i, result := range results {
		if i >= 5 {
			break
		}
		topDocIDs = append(topDocIDs, result.DocumentID)
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tenantUUID,
		UserID:       userUUID,
		Action:       "kb.search",
		ResourceType: "kb_search",
		Before:       nil,
		After: map[string]interface{}{
			"query_length": queryLength,
			"top_doc_ids":  topDocIDs,
			"latency_ms":   meta.LatencyMs,
			"used_trgm":    meta.UsedTrgm,
			"total":        meta.Total,
		},
	})
}
