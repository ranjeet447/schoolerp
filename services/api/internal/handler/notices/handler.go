package notices

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	noticeservice "github.com/schoolerp/api/internal/service/notices"
)

type Handler struct {
	svc *noticeservice.Service
}

func NewHandler(svc *noticeservice.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/notices", func(r chi.Router) {
		r.Post("/", h.Create)
		r.Get("/", h.List)
	})
}

func (h *Handler) RegisterParentRoutes(r chi.Router) {
	r.Route("/notices", func(r chi.Router) {
		r.Get("/", h.ListForParent)
		r.Post("/{id}/ack", h.Acknowledge)
	})
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title string `json:"title"`
		Body  string `json:"body"`
		Scope any    `json:"scope"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	p := noticeservice.CreateNoticeParams{
		TenantID:  middleware.GetTenantID(r.Context()),
		Title:     req.Title,
		Body:      req.Body,
		Scope:     normalizeScopePayload(req.Scope),
		CreatedBy: middleware.GetUserID(r.Context()),
		RequestID: middleware.GetReqID(r.Context()),
		IP:        r.RemoteAddr,
	}

	notice, err := h.svc.CreateNotice(r.Context(), p)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(notice)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	notices, err := h.svc.ListNotices(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(notices)
}

func (h *Handler) ListForParent(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	notices, err := h.svc.ListNoticesForParent(r.Context(), tenantID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(notices)
}

func (h *Handler) Acknowledge(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r.Context())

	if err := h.svc.AcknowledgeNotice(r.Context(), id, userID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func normalizeScopePayload(scope any) map[string]any {
	switch v := scope.(type) {
	case nil:
		return map[string]any{"value": "all"}
	case string:
		normalized := strings.TrimSpace(v)
		if normalized == "" {
			normalized = "all"
		}
		return map[string]any{"value": normalized}
	case []any:
		items := make([]string, 0, len(v))
		for _, item := range v {
			if text, ok := item.(string); ok {
				trimmed := strings.TrimSpace(text)
				if trimmed != "" {
					items = append(items, trimmed)
				}
			}
		}
		if len(items) == 0 {
			return map[string]any{"value": "all"}
		}
		return map[string]any{"values": items}
	case map[string]any:
		return v
	default:
		return map[string]any{"value": "all"}
	}
}
