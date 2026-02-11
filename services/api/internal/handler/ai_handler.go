package handler

import (
	"encoding/json"
	"net/http"

	"github.com/schoolerp/api/internal/service/ai"
)

type AIHandler struct {
	aiSvc *ai.Service
}

func NewAIHandler(aiSvc *ai.Service) *AIHandler {
	return &AIHandler{aiSvc: aiSvc}
}

func (h *AIHandler) GenerateLessonPlan(w http.ResponseWriter, r *http.Request) {
	if h.aiSvc == nil {
		http.Error(w, "AI Service not initialized", http.StatusServiceUnavailable)
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
