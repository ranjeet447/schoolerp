package academics

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	academicservice "github.com/schoolerp/api/internal/service/academics"
)

type ScheduleHandler struct {
	svc *academicservice.ScheduleService
}

func NewScheduleHandler(svc *academicservice.ScheduleService) *ScheduleHandler {
	return &ScheduleHandler{svc: svc}
}

func (h *ScheduleHandler) RegisterRoutes(r chi.Router) {
	r.Route("/schedule", func(r chi.Router) {
		r.Route("/variants", func(r chi.Router) {
			r.Get("/", h.ListVariants)
			r.Post("/", h.CreateVariant)
		})
		r.Get("/teacher-daily", h.GetTeacherDailyTimetable)
		r.Route("/periods", func(r chi.Router) {
			r.Get("/{variantID}", h.GetPeriods)
			r.Post("/", h.CreatePeriod)
		})
		r.Route("/entries", func(r chi.Router) {
			r.Get("/", h.GetTimetable)
			r.Post("/", h.CreateEntry)
		})
		r.Route("/substitutions", func(r chi.Router) {
			r.Get("/free-teachers", h.GetFreeTeachers)
			r.Post("/", h.CreateSubstitution)
			r.Post("/absences", h.MarkTeacherAbsence)
			r.Get("/absences", h.GetAbsentTeachers)
			r.Get("/teacher-lessons/{teacherID}", h.GetTeacherLessons)
		})
		r.Route("/teacher-assignments", func(r chi.Router) {
			r.Post("/specializations", h.SetTeacherSpecializations)
			r.Get("/specializations/{teacherID}", h.GetTeacherSpecializations)
			r.Post("/class-teacher", h.AssignClassTeacher)
		})
	})
}

func (h *ScheduleHandler) CreateVariant(w http.ResponseWriter, r *http.Request) {
	var req academicservice.RelationalVariant
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	id, err := h.svc.CreateVariant(r.Context(), middleware.GetTenantID(r.Context()), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"id": id})
}

func (h *ScheduleHandler) ListVariants(w http.ResponseWriter, r *http.Request) {
	list, err := h.svc.ListVariants(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}

func (h *ScheduleHandler) CreatePeriod(w http.ResponseWriter, r *http.Request) {
	var req academicservice.RelationalPeriod
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	id, err := h.svc.CreatePeriod(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"id": id})
}

func (h *ScheduleHandler) GetPeriods(w http.ResponseWriter, r *http.Request) {
	variantID := chi.URLParam(r, "variantID")
	list, err := h.svc.GetPeriods(r.Context(), variantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}

func (h *ScheduleHandler) CreateEntry(w http.ResponseWriter, r *http.Request) {
	var req academicservice.RelationalTimetableEntry
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	id, err := h.svc.CreateEntry(r.Context(), middleware.GetTenantID(r.Context()), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"id": id})
}

func (h *ScheduleHandler) GetTimetable(w http.ResponseWriter, r *http.Request) {
	variantID := r.URL.Query().Get("variant_id")
	sectionID := r.URL.Query().Get("section_id")

	if variantID == "" || sectionID == "" {
		http.Error(w, "variant_id and section_id are required", http.StatusBadRequest)
		return
	}

	list, err := h.svc.GetTimetable(r.Context(), variantID, sectionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}

func (h *ScheduleHandler) GetFreeTeachers(w http.ResponseWriter, r *http.Request) {
	dateStr := r.URL.Query().Get("date")
	periodID := r.URL.Query().Get("period_id")

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		http.Error(w, "invalid date format, expected YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	list, err := h.svc.GetFreeTeachersForDate(r.Context(), middleware.GetTenantID(r.Context()), date, periodID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}

func (h *ScheduleHandler) CreateSubstitution(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Date         string `json:"date"`
		EntryID      string `json:"entry_id"`
		SubTeacherID string `json:"substitute_teacher_id"`
		Remarks      string `json:"remarks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	date, _ := time.Parse("2006-01-02", req.Date)
	id, err := h.svc.CreateSubstitution(r.Context(), middleware.GetTenantID(r.Context()), date, req.EntryID, req.SubTeacherID, req.Remarks)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"id": id})
}

func (h *ScheduleHandler) MarkTeacherAbsence(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TeacherID string `json:"teacher_id"`
		Date      string `json:"date"`
		Reason    string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	date, _ := time.Parse("2006-01-02", req.Date)
	err := h.svc.MarkTeacherAbsence(r.Context(), middleware.GetTenantID(r.Context()), req.TeacherID, date, req.Reason)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *ScheduleHandler) GetAbsentTeachers(w http.ResponseWriter, r *http.Request) {
	dateStr := r.URL.Query().Get("date")
	date := time.Now()
	if dateStr != "" {
		if d, err := time.Parse("2006-01-02", dateStr); err == nil {
			date = d
		}
	}

	list, err := h.svc.GetAbsentTeachers(r.Context(), middleware.GetTenantID(r.Context()), date)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}

func (h *ScheduleHandler) GetTeacherLessons(w http.ResponseWriter, r *http.Request) {
	teacherID := chi.URLParam(r, "teacherID")
	dateStr := r.URL.Query().Get("date")
	date := time.Now()
	if dateStr != "" {
		if d, err := time.Parse("2006-01-02", dateStr); err == nil {
			date = d
		}
	}

	list, err := h.svc.GetTeacherLessonsForDate(r.Context(), middleware.GetTenantID(r.Context()), teacherID, date)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}
func (h *ScheduleHandler) SetTeacherSpecializations(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TeacherID  string   `json:"teacher_id"`
		SubjectIDs []string `json:"subject_ids"`
		ClassIDs   []string `json:"class_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	tenantID := middleware.GetTenantID(r.Context())
	
	if len(req.SubjectIDs) > 0 {
		if err := h.svc.SetTeacherSubjectSpecializations(r.Context(), tenantID, req.TeacherID, req.SubjectIDs); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	
	if len(req.ClassIDs) > 0 {
		if err := h.svc.SetTeacherClassSpecializations(r.Context(), tenantID, req.TeacherID, req.ClassIDs); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (h *ScheduleHandler) GetTeacherSpecializations(w http.ResponseWriter, r *http.Request) {
	teacherID := chi.URLParam(r, "teacherID")
	tenantID := middleware.GetTenantID(r.Context())

	specs, err := h.svc.GetTeacherSpecializations(r.Context(), tenantID, teacherID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(specs)
}

func (h *ScheduleHandler) AssignClassTeacher(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AcademicYearID string `json:"academic_year_id"`
		SectionID      string `json:"section_id"`
		TeacherID      string `json:"teacher_id"`
		Remarks        string `json:"remarks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	tenantID := middleware.GetTenantID(r.Context())
	err := h.svc.AssignClassTeacher(r.Context(), tenantID, req.AcademicYearID, req.SectionID, req.TeacherID, req.Remarks)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *ScheduleHandler) GetTeacherDailyTimetable(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context()) // Assuming Teacher's user ID is used
	
	dateStr := r.URL.Query().Get("date")
	date := time.Now()
	if dateStr != "" {
		if d, err := time.Parse("2006-01-02", dateStr); err == nil {
			date = d
		}
	}

	list, err := h.svc.GetTeacherDailyTimetable(r.Context(), tenantID, userID, date)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}
