package alumni

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	alumniservice "github.com/schoolerp/api/internal/service/alumni"
)

type Handler struct {
	svc *alumniservice.Service
}

func NewHandler(svc *alumniservice.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/alumni", func(r chi.Router) {
		r.Get("/", h.ListAlumni)
		r.Post("/", h.CreateAlumni)
		r.Get("/drives", h.ListDrives)
		r.Post("/drives", h.CreateDrive)
		r.Get("/drives/{id}/applications", h.ListDriveApplications)
		r.Post("/drives/{id}/apply", h.ApplyToDrive)
		r.Patch("/applications/{id}/status", h.UpdateApplicationStatus)
	})
}

func (h *Handler) ListAlumni(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit == 0 { limit = 50 }

	alumni, err := h.svc.ListAlumni(r.Context(), tenantID, int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(alumni)
}

func (h *Handler) CreateAlumni(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req struct {
		FullName       string `json:"full_name"`
		GraduationYear int32  `json:"graduation_year"`
		Batch          string `json:"batch"`
		Email          string `json:"email"`
		Phone          string `json:"phone"`
		CurrentCompany string `json:"current_company"`
		CurrentRole    string `json:"current_role"`
		LinkedInURL    string `json:"linkedin_url"`
		Bio            string `json:"bio"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	alum, err := h.svc.CreateAlumni(r.Context(), alumniservice.CreateAlumniParams{
		TenantID:       tenantID,
		FullName:       req.FullName,
		GraduationYear: req.GraduationYear,
		Batch:          req.Batch,
		Email:          req.Email,
		Phone:          req.Phone,
		CurrentCompany: req.CurrentCompany,
		CurrentRole:    req.CurrentRole,
		LinkedInURL:    req.LinkedInURL,
		Bio:            req.Bio,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(alum)
}

func (h *Handler) ListDrives(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit == 0 { limit = 50 }

	drives, err := h.svc.ListPlacementDrives(r.Context(), tenantID, int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(drives)
}

func (h *Handler) CreateDrive(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	var req struct {
		CompanyName       string `json:"company_name"`
		RoleTitle         string `json:"role_title"`
		Description       string `json:"description"`
		MinGraduationYear int32  `json:"min_graduation_year"`
		MaxGraduationYear int32  `json:"max_graduation_year"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	drive, err := h.svc.CreatePlacementDrive(r.Context(), alumniservice.CreateDriveParams{
		TenantID:          tenantID,
		CompanyName:       req.CompanyName,
		RoleTitle:         req.RoleTitle,
		Description:       req.Description,
		MinGraduationYear: req.MinGraduationYear,
		MaxGraduationYear: req.MaxGraduationYear,
		CreatedBy:         userID,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(drive)
}

func (h *Handler) ListDriveApplications(w http.ResponseWriter, r *http.Request) {
	driveID := chi.URLParam(r, "id")

	apps, err := h.svc.ListDriveApplications(r.Context(), driveID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(apps)
}

func (h *Handler) ApplyToDrive(w http.ResponseWriter, r *http.Request) {
	driveID := chi.URLParam(r, "id")

	var req struct {
		AlumniID    string `json:"alumni_id"`
		ResumeURL   string `json:"resume_url"`
		CoverLetter string `json:"cover_letter"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	app, err := h.svc.ApplyToDrive(r.Context(), driveID, req.AlumniID, req.ResumeURL, req.CoverLetter)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(app)
}

func (h *Handler) UpdateApplicationStatus(w http.ResponseWriter, r *http.Request) {
	appID := chi.URLParam(r, "id")

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	app, err := h.svc.UpdateApplicationStatus(r.Context(), appID, req.Status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(app)
}
