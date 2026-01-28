package sis

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/sis"
)

type Handler struct {
	svc *sis.StudentService
}

func NewHandler(svc *sis.StudentService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/students", h.List)
	r.Post("/students", h.Create)
	r.Get("/students/{id}", h.Get)
	r.Put("/students/{id}", h.Update)
	r.Delete("/students/{id}", h.Delete)
	
	// Academic Structure
	r.Get("/academic-structure/classes", h.ListClasses)
	r.Post("/academic-structure/classes", h.CreateClass)

	// CSV Import
	r.Post("/students/import", h.Import)
}

func (h *Handler) Import(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	userID := middleware.GetUserID(ctx)
	reqID := middleware.GetReqID(ctx)

	// Max 10MB
	r.ParseMultipartForm(10 << 20)
	
	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "file is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	result, err := h.svc.ImportStudents(ctx, tenantID, file, userID, reqID, r.RemoteAddr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

type updateStudentReq struct {
	FullName  string `json:"full_name"`
	Gender    string `json:"gender"`
	DOB       string `json:"dob"`
	SectionID string `json:"section_id"`
	Status    string `json:"status"`
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	studentID := chi.URLParam(r, "id")
	tenantID := middleware.GetTenantID(ctx)
	
	var req updateStudentReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	var dob pgtype.Date
	if req.DOB != "" {
		dob.Scan(req.DOB)
	}

	student, err := h.svc.UpdateStudent(ctx, sis.UpdateStudentParams{
		ID:        studentID,
		TenantID:  tenantID,
		FullName:  req.FullName,
		DOB:       dob,
		Gender:    req.Gender,
		SectionID: req.SectionID,
		Status:    req.Status,
		UserID:    middleware.GetUserID(ctx),
		RequestID: middleware.GetReqID(ctx),
		IP:        r.RemoteAddr,
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(student)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	studentID := chi.URLParam(r, "id")
	tenantID := middleware.GetTenantID(ctx)

	err := h.svc.DeleteStudent(ctx, tenantID, studentID, 
		middleware.GetUserID(ctx), middleware.GetReqID(ctx), r.RemoteAddr)
	
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ListClasses(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	classes, _, err := h.svc.ListAcademicStructure(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(classes)
}

type createClassReq struct {
	Name  string `json:"name"`
	Level int32  `json:"level"`
}

func (h *Handler) CreateClass(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var req createClassReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	class, err := h.svc.CreateClass(r.Context(), tenantID, req.Name, req.Level)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(class)
}

type createStudentReq struct {
	AdmissionNumber string `json:"admission_number"`
	FullName        string `json:"full_name"`
	Gender          string `json:"gender"`
	DOB             string `json:"dob"` // YYYY-MM-DD
	SectionID       string `json:"section_id"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	userID := middleware.GetUserID(ctx)
	
	var req createStudentReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Basic validation (should use validator lib in real prod)
	if req.FullName == "" || req.AdmissionNumber == "" {
		http.Error(w, "full_name and admission_number are required", http.StatusBadRequest)
		return
	}

	var dob pgtype.Date
	if req.DOB != "" {
		dob.Scan(req.DOB)
	}

	student, err := h.svc.CreateStudent(ctx, sis.CreateStudentParams{
		TenantID:        tenantID,
		AdmissionNumber: req.AdmissionNumber,
		FullName:        req.FullName,
		DOB:             dob,
		Gender:          req.Gender,
		SectionID:       req.SectionID,
		Status:          "active",
		UserID:          userID,
		RequestID:       middleware.GetReqID(ctx),
		IP:              r.RemoteAddr,
	})

	if err != nil {
		// In a real app, check for unique constraint violation
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(student)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit == 0 { limit = 20 }
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	students, err := h.svc.ListStudents(r.Context(), tenantID, int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if students == nil {
		w.Write([]byte("[]"))
	} else {
		json.NewEncoder(w).Encode(students)
	}
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	studentID := chi.URLParam(r, "id")

	student, err := h.svc.GetStudent(r.Context(), tenantID, studentID)
	if err != nil {
		// Check for not found error specifically in real implementation
		http.Error(w, "student not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(student)
}

// Parent Routes
func (h *Handler) RegisterParentRoutes(r chi.Router) {
	r.Get("/me/children", h.ListMyChildren)
	r.Get("/children/{id}/profile", h.Get) // Reuse admin get for now, but usually needs scope check
}

func (h *Handler) ListMyChildren(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	userID := middleware.GetUserID(ctx)

	children, err := h.svc.ListChildrenByParent(ctx, tenantID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if children == nil {
		w.Write([]byte("[]"))
	} else {
		json.NewEncoder(w).Encode(children)
	}
}
