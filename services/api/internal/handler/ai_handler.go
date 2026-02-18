package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

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

	plan, err := h.aiSvc.GenerateLessonPlan(r.Context(), req.Subject, req.Topic, req.Grade)
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

	answer, err := h.aiSvc.AnswerParentQuery(r.Context(), req.Query, req.ContextInfo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"answer": answer})
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
