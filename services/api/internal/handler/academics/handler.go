// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package academics

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/middleware"
	academicservice "github.com/schoolerp/api/internal/service/academics"
)

type Handler struct {
	svc *academicservice.Service
}

func NewHandler(svc *academicservice.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/homework", func(r chi.Router) {
		r.Post("/", h.CreateHomework)
		r.Get("/section/{sectionId}", h.ListHomeworkForSection)
		r.Get("/{id}/submissions", h.ListSubmissions)
		r.Post("/submissions/{id}/grade", h.GradeSubmission)
	})
	r.Route("/lesson-plans", func(r chi.Router) {
		r.Post("/", h.UpsertLessonPlan)
		r.Get("/", h.ListLessonPlans)
	})
}

func (h *Handler) RegisterStudentRoutes(r chi.Router) {
	r.Route("/homework", func(r chi.Router) {
		r.Get("/", h.GetHomeworkForStudent)
		r.Post("/{id}/submit", h.SubmitHomework)
	})
}

func (h *Handler) CreateHomework(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SubjectID      string    `json:"subject_id"`
		ClassSectionID string    `json:"class_section_id"`
		Title          string    `json:"title"`
		Description    string    `json:"description"`
		DueDate        time.Time `json:"due_date"`
		Attachments    []byte    `json:"attachments"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	hw, err := h.svc.CreateHomework(r.Context(), academicservice.CreateHomeworkParams{
		TenantID:       middleware.GetTenantID(r.Context()),
		SubjectID:      req.SubjectID,
		ClassSectionID: req.ClassSectionID,
		TeacherID:      middleware.GetUserID(r.Context()),
		Title:          req.Title,
		Description:    req.Description,
		DueDate:        pgtype.Timestamptz{Time: req.DueDate, Valid: true},
		Attachments:    req.Attachments,
		UserID:         middleware.GetUserID(r.Context()),
		RequestID:      middleware.GetReqID(r.Context()),
		IP:             r.RemoteAddr,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(hw)
}

func (h *Handler) ListHomeworkForSection(w http.ResponseWriter, r *http.Request) {
	sectionID := chi.URLParam(r, "sectionId")
	list, err := h.svc.ListHomeworkForSection(r.Context(), middleware.GetTenantID(r.Context()), sectionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}

func (h *Handler) SubmitHomework(w http.ResponseWriter, r *http.Request) {
	hwID := chi.URLParam(r, "id")
	var req struct {
		StudentID     string `json:"student_id"`
		AttachmentURL string `json:"attachment_url"`
		Remarks       string `json:"remarks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	sub, err := h.svc.SubmitHomework(r.Context(), hwID, req.StudentID, req.AttachmentURL, req.Remarks)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(sub)
}

func (h *Handler) GradeSubmission(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Status   string `json:"status"`
		Feedback string `json:"feedback"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	sub, err := h.svc.GradeSubmission(r.Context(), id, req.Status, req.Feedback)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(sub)
}

func (h *Handler) UpsertLessonPlan(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SubjectID string    `json:"subject_id"`
		ClassID   string    `json:"class_id"`
		Week      int32     `json:"week_number"`
		Topic     string    `json:"planned_topic"`
		CoveredAt time.Time `json:"covered_at"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	lp, err := h.svc.UpsertLessonPlan(r.Context(), middleware.GetTenantID(r.Context()), req.SubjectID, req.ClassID, req.Week, req.Topic, pgtype.Timestamptz{Time: req.CoveredAt, Valid: !req.CoveredAt.IsZero()})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(lp)
}

func (h *Handler) ListLessonPlans(w http.ResponseWriter, r *http.Request) {
	subjectID := r.URL.Query().Get("subject_id")
	classID := r.URL.Query().Get("class_id")
	list, err := h.svc.ListLessonPlans(r.Context(), middleware.GetTenantID(r.Context()), subjectID, classID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}

func (h *Handler) GetHomeworkForStudent(w http.ResponseWriter, r *http.Request) {
	studentID := r.URL.Query().Get("student_id")
	list, err := h.svc.GetHomeworkForStudent(r.Context(), middleware.GetTenantID(r.Context()), studentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}

func (h *Handler) ListSubmissions(w http.ResponseWriter, r *http.Request) {
	hwID := chi.URLParam(r, "id")
	list, err := h.svc.ListSubmissions(r.Context(), hwID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}

