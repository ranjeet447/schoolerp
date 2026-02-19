package sis

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

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
	r.Get("/students/{id}/guardians", h.ListGuardians)
	r.Post("/students/{id}/guardians", h.AddGuardian)
	r.Put("/students/{id}", h.Update)
	r.Delete("/students/{id}", h.Delete)

	// Academic Structure
	r.Get("/academic-structure/academic-years", h.ListAcademicYears)
	r.Post("/academic-structure/academic-years", h.CreateAcademicYear)
	r.Get("/academic-structure/classes", h.ListClasses)
	r.Post("/academic-structure/classes", h.CreateClass)
	r.Get("/academic-structure/classes/{classID}/sections", h.ListSectionsByClass)
	r.Post("/academic-structure/classes/{classID}/sections", h.CreateSection)
	r.Get("/academic-structure/subjects", h.ListSubjects)
	r.Post("/academic-structure/subjects", h.CreateSubject)

	// CSV Import
	r.Post("/students/import", h.Import)

	// Confidential Notes
	confHandler := NewConfidentialNotesHandler(nil) // Note: actual service injection happens in registry
	confHandler.RegisterRoutes(r)
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
	Name   string `json:"name"`
	Level  int32  `json:"level"`
	Stream string `json:"stream"`
}

func (h *Handler) CreateClass(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var req createClassReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	class, err := h.svc.CreateClass(r.Context(), tenantID, name, req.Level, strings.TrimSpace(req.Stream),
		middleware.GetUserID(r.Context()), middleware.GetReqID(r.Context()), r.RemoteAddr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(class)
}

type createAcademicYearReq struct {
	Name      string `json:"name"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
}

func (h *Handler) ListAcademicYears(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	years, err := h.svc.ListAcademicYears(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if years == nil {
		w.Write([]byte("[]"))
		return
	}
	json.NewEncoder(w).Encode(years)
}

func (h *Handler) CreateAcademicYear(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)

	var req createAcademicYearReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" || strings.TrimSpace(req.StartDate) == "" || strings.TrimSpace(req.EndDate) == "" {
		http.Error(w, "name, start_date and end_date are required", http.StatusBadRequest)
		return
	}

	year, err := h.svc.CreateAcademicYear(
		ctx,
		tenantID,
		name,
		strings.TrimSpace(req.StartDate),
		strings.TrimSpace(req.EndDate),
		middleware.GetUserID(ctx),
		middleware.GetReqID(ctx),
		r.RemoteAddr,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(year)
}

func (h *Handler) ListSectionsByClass(w http.ResponseWriter, r *http.Request) {
	classID := chi.URLParam(r, "classID")
	if strings.TrimSpace(classID) == "" {
		http.Error(w, "classID is required", http.StatusBadRequest)
		return
	}

	sections, err := h.svc.ListSectionsByClass(r.Context(), classID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if sections == nil {
		w.Write([]byte("[]"))
		return
	}
	json.NewEncoder(w).Encode(sections)
}

type createSectionReq struct {
	Name     string `json:"name"`
	Capacity int32  `json:"capacity"`
}

func (h *Handler) CreateSection(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	classID := chi.URLParam(r, "classID")
	if strings.TrimSpace(classID) == "" {
		http.Error(w, "classID is required", http.StatusBadRequest)
		return
	}

	var req createSectionReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	section, err := h.svc.CreateSection(
		ctx,
		tenantID,
		classID,
		name,
		middleware.GetUserID(ctx),
		middleware.GetReqID(ctx),
		r.RemoteAddr,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(section)
}

type createSubjectReq struct {
	Name string `json:"name"`
	Code string `json:"code"`
	Type string `json:"type"`
}

func (h *Handler) ListSubjects(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	subjects, err := h.svc.ListSubjects(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if subjects == nil {
		w.Write([]byte("[]"))
		return
	}
	json.NewEncoder(w).Encode(subjects)
}

func (h *Handler) CreateSubject(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)

	var req createSubjectReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	subject, err := h.svc.CreateSubject(
		ctx,
		tenantID,
		name,
		strings.TrimSpace(req.Code),
		strings.TrimSpace(req.Type),
		middleware.GetUserID(ctx),
		middleware.GetReqID(ctx),
		r.RemoteAddr,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(subject)
}

type createStudentReq struct {
	AdmissionNumber string `json:"admission_number"`
	FullName        string `json:"full_name"`
	Gender          string `json:"gender"`
	DOB             string `json:"dob"` // YYYY-MM-DD
	SectionID       string `json:"section_id"`
}

type addGuardianReq struct {
	FullName  string `json:"full_name"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	Address   string `json:"address"`
	Relation  string `json:"relation"`
	IsPrimary bool   `json:"is_primary"`
}

func (h *Handler) ListGuardians(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	studentID := chi.URLParam(r, "id")

	guardians, err := h.svc.GetStudentGuardians(ctx, tenantID, studentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if guardians == nil {
		w.Write([]byte("[]"))
		return
	}
	json.NewEncoder(w).Encode(guardians)
}

func (h *Handler) AddGuardian(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	studentID := chi.URLParam(r, "id")

	var req addGuardianReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.FullName) == "" || strings.TrimSpace(req.Phone) == "" || strings.TrimSpace(req.Relation) == "" {
		http.Error(w, "full_name, phone and relation are required", http.StatusBadRequest)
		return
	}

	guardian, err := h.svc.AddGuardian(ctx, sis.CreateGuardianParams{
		TenantID:  tenantID,
		StudentID: studentID,
		FullName:  strings.TrimSpace(req.FullName),
		Phone:     strings.TrimSpace(req.Phone),
		Email:     strings.TrimSpace(req.Email),
		Address:   strings.TrimSpace(req.Address),
		Relation:  strings.TrimSpace(req.Relation),
		IsPrimary: req.IsPrimary,
		UserID:    middleware.GetUserID(ctx),
		RequestID: middleware.GetReqID(ctx),
		IP:        r.RemoteAddr,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(guardian)
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
	if limit == 0 {
		limit = 20
	}
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
	r.Get("/children/{id}/profile", h.GetMyChildProfile)
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

func (h *Handler) GetMyChildProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	userID := middleware.GetUserID(ctx)
	childID := chi.URLParam(r, "id")

	if childID == "" {
		http.Error(w, "child id is required", http.StatusBadRequest)
		return
	}

	children, err := h.svc.ListChildrenByParent(ctx, tenantID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	childUUID := pgtype.UUID{}
	if err := childUUID.Scan(childID); err != nil {
		http.Error(w, "invalid child id", http.StatusBadRequest)
		return
	}

	authorized := false
	for _, child := range children {
		if child.ID.Valid && childUUID.Valid && child.ID.Bytes == childUUID.Bytes {
			authorized = true
			break
		}
	}

	if !authorized {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	student, err := h.svc.GetStudent(ctx, tenantID, childID)
	if err != nil {
		http.Error(w, "student not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(student)
}
