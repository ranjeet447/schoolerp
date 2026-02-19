package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/ai"
)

type AIHandler struct {
	aiSvc *ai.Service
	q     db.Querier
}

func NewAIHandler(aiSvc *ai.Service, q db.Querier) *AIHandler {
	return &AIHandler{aiSvc: aiSvc, q: q}
}

func (h *AIHandler) RegisterRoutes(r chi.Router) {
	r.Route("/ai", func(r chi.Router) {
		r.Post("/generate-lesson-plan", h.GenerateLessonPlan)
		r.Post("/parent-query", h.ParentQuery)
		r.Post("/exams/rubrics/generate", h.GenerateRubric)
	})
}

func (h *AIHandler) GenerateLessonPlan(w http.ResponseWriter, r *http.Request) {
	if h.aiSvc == nil {
		http.Error(w, "AI Service not initialized", http.StatusServiceUnavailable)
		return
	}

	enabled, err := h.isFeatureEnabled(r.Context(), "enable_teacher_copilot")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if !enabled {
		http.Error(w, "AI Teacher Copilot is disabled for this tenant", http.StatusForbidden)
		return
	}

	var req struct {
		Subject string `json:"subject"`
		Topic   string `json:"topic"`
		Grade   string `json:"grade"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Subject == "" || req.Topic == "" {
		http.Error(w, "subject and topic are required", http.StatusBadRequest)
		return
	}

	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	plan, err := h.aiSvc.GenerateLessonPlan(r.Context(), tenantID, userID, req.Subject, req.Topic, req.Grade)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"lesson_plan": plan})
}

func (h *AIHandler) ParentQuery(w http.ResponseWriter, r *http.Request) {
	if h.aiSvc == nil {
		http.Error(w, "AI Service not initialized", http.StatusServiceUnavailable)
		return
	}

	enabled, err := h.isFeatureEnabled(r.Context(), "enable_parent_helpdesk")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if !enabled {
		http.Error(w, "AI Parent Helpdesk is disabled for this tenant", http.StatusForbidden)
		return
	}

	var req struct {
		Query       string `json:"query"`
		ContextInfo string `json:"context_info"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	answer, err := h.aiSvc.AnswerParentQuery(r.Context(), tenantID, userID, req.Query, req.ContextInfo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"answer": answer})
}

func (h *AIHandler) GenerateRubric(w http.ResponseWriter, r *http.Request) {
	if h.aiSvc == nil {
		http.Error(w, "AI Service not initialized", http.StatusServiceUnavailable)
		return
	}

	enabled, err := h.isFeatureEnabled(r.Context(), "enable_teacher_copilot")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if !enabled {
		http.Error(w, "AI Teacher Copilot is disabled for this tenant", http.StatusForbidden)
		return
	}

	var req struct {
		Subject  string `json:"subject"`
		Title    string `json:"title"`
		Grade    string `json:"grade"`
		MaxMarks int    `json:"max_marks"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Subject == "" || req.Title == "" || req.MaxMarks <= 0 {
		http.Error(w, "subject, title, and max_marks (positive) are required", http.StatusBadRequest)
		return
	}

	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	rubricJson, err := h.aiSvc.GenerateRubric(r.Context(), tenantID, userID, req.Subject, req.Title, req.Grade, req.MaxMarks)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	// Since rubricJson is already a JSON string, we can send it as raw
	w.Write([]byte(rubricJson))
}

func (h *AIHandler) isFeatureEnabled(ctx context.Context, featureKey string) (bool, error) {
	tenantID := strings.TrimSpace(middleware.GetTenantID(ctx))
	if tenantID == "" {
		return false, errors.New("tenant context is missing")
	}

	tID := pgtype.UUID{}
	if err := tID.Scan(tenantID); err != nil {
		return false, errors.New("invalid tenant context")
	}

	tenant, err := h.q.GetTenantByID(ctx, tID)
	if err != nil {
		return false, err
	}

	var config map[string]interface{}
	if err := json.Unmarshal(tenant.Config, &config); err != nil {
		return false, errors.New("invalid tenant config")
	}

	plugins, ok := config["plugins"].(map[string]interface{})
	if !ok {
		return false, nil
	}

	pluginState, ok := plugins["ai_suite_v1"].(map[string]interface{})
	if !ok {
		return false, nil
	}

	enabled, _ := pluginState["enabled"].(bool)
	if !enabled {
		return false, nil
	}

	if featureKey == "" {
		return true, nil
	}

	settings, ok := pluginState["settings"].(map[string]interface{})
	if !ok {
		return false, nil
	}

	featureEnabled, _ := settings[featureKey].(bool)
	return featureEnabled, nil
}
