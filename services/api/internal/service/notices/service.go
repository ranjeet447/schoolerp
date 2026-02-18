package notices

import (
	"context"
	"encoding/json"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type Service struct {
	q     db.Querier
	audit *audit.Logger
}

func NewService(q db.Querier, audit *audit.Logger) *Service {
	return &Service{q: q, audit: audit}
}

var classDigitsRegex = regexp.MustCompile(`\d+`)

type CreateNoticeParams struct {
	TenantID  string
	Title     string
	Body      string
	Scope     map[string]any
	CreatedBy string
	RequestID string
	IP        string
}

func (s *Service) CreateNotice(ctx context.Context, p CreateNoticeParams) (db.Notice, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.CreatedBy)

	if p.Scope == nil {
		p.Scope = map[string]any{"value": "all"}
	}

	scopeJSON, err := json.Marshal(p.Scope)
	if err != nil {
		return db.Notice{}, err
	}

	notice, err := s.q.CreateNotice(ctx, db.CreateNoticeParams{
		TenantID:  tUUID,
		Title:     p.Title,
		Body:      p.Body,
		Scope:     scopeJSON,
		CreatedBy: uUUID,
	})
	if err != nil {
		return db.Notice{}, err
	}

	s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "create_notice",
		ResourceType: "notice",
		ResourceID:   notice.ID,
		IPAddress:    p.IP,
	})

	// 5. Outbox Event for Notifications
	payload, _ := json.Marshal(map[string]interface{}{
		"notice_id": notice.ID,
		"title":     notice.Title,
		"scope":     p.Scope,
		"created_by": p.CreatedBy,
	})
	_, _ = s.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
		TenantID:  tUUID,
		EventType: "notice.published",
		Payload:   payload,
	})

	return notice, nil
}

func (s *Service) ListNotices(ctx context.Context, tenantID string) ([]db.ListNoticesRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListNotices(ctx, tUUID)
}

func (s *Service) AcknowledgeNotice(ctx context.Context, noticeID, userID string) error {
	nUUID := pgtype.UUID{}
	nUUID.Scan(noticeID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	_, err := s.q.AcknowledgeNotice(ctx, db.AcknowledgeNoticeParams{
		NoticeID: nUUID,
		UserID:   uUUID,
	})
	return err
}

func (s *Service) ListNoticesForParent(ctx context.Context, tenantID, userID string) ([]db.ListNoticesForParentRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	rows, err := s.q.ListNoticesForParent(ctx, db.ListNoticesForParentParams{
		TenantID: tUUID,
		UserID:   uUUID,
	})
	if err != nil {
		return nil, err
	}

	children, err := s.q.GetChildrenByParentUser(ctx, db.GetChildrenByParentUserParams{
		UserID:   uUUID,
		TenantID: tUUID,
	})
	if err != nil {
		return nil, err
	}

	allowed := buildParentNoticeAudience(children)
	filtered := make([]db.ListNoticesForParentRow, 0, len(rows))
	for _, row := range rows {
		if scopeMatchesParentAudience(row.Scope, allowed) {
			filtered = append(filtered, row)
		}
	}

	return filtered, nil
}

func buildParentNoticeAudience(children []db.GetChildrenByParentUserRow) map[string]bool {
	allowed := map[string]bool{"all": true}
	for _, child := range children {
		if child.ClassName.Valid {
			classText := strings.ToLower(strings.TrimSpace(child.ClassName.String))
			if classText != "" {
				allowed[classText] = true
				digits := classDigitsRegex.FindString(classText)
				if digits != "" {
					allowed["class_"+digits] = true
				}
			}
		}

		if child.SectionName.Valid {
			sectionText := strings.ToLower(strings.TrimSpace(child.SectionName.String))
			if sectionText != "" {
				allowed[sectionText] = true
				allowed["section_"+sectionText] = true
			}
		}
	}
	return allowed
}

func scopeMatchesParentAudience(scopeRaw []byte, allowed map[string]bool) bool {
	if len(scopeRaw) == 0 {
		return true
	}

	var parsed interface{}
	if err := json.Unmarshal(scopeRaw, &parsed); err != nil {
		return true
	}

	values := flattenScopeValues(parsed)
	if len(values) == 0 {
		return true
	}

	for _, value := range values {
		normalized := strings.ToLower(strings.TrimSpace(value))
		if normalized == "" {
			continue
		}
		if normalized == "all" || allowed[normalized] {
			return true
		}
	}

	return false
}

func flattenScopeValues(input interface{}) []string {
	switch value := input.(type) {
	case string:
		return []string{value}
	case []interface{}:
		out := make([]string, 0, len(value))
		for _, item := range value {
			out = append(out, flattenScopeValues(item)...)
		}
		return out
	case map[string]interface{}:
		out := make([]string, 0)
		for _, key := range []string{"value", "scope", "target", "values", "targets", "scopes", "audience"} {
			if item, ok := value[key]; ok {
				out = append(out, flattenScopeValues(item)...)
			}
		}
		return out
	default:
		return nil
	}
}
