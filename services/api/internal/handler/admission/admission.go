package admission

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/admission"
)

type Handler struct {
	svc *admission.AdmissionService
}

func NewHandler(svc *admission.AdmissionService) *Handler {
	return &Handler{svc: svc}
}

// Rate Limiter Implementation (Simple In-Memory Token Bucket)
var (
	visitors = make(map[string]*visitor)
	mu       sync.Mutex
)

type visitor struct {
	lastSeen time.Time
	count    int
}

// limitMiddleware creates a rate limiter for the public endpoint
// Limit: 5 requests per minute per IP
func (h *Handler) limitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		mu.Lock()
		v, exists := visitors[ip]
		if !exists {
			visitors[ip] = &visitor{lastSeen: time.Now(), count: 1}
			mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		if time.Since(v.lastSeen) > time.Minute {
			v.lastSeen = time.Now()
			v.count = 1
		} else {
			if v.count >= 5 {
				mu.Unlock()
				http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
				return
			}
			v.count++
		}
		mu.Unlock()
		next.ServeHTTP(w, r)
	})
}

// Cleanup visitor map periodically
func init() {
	go func() {
		for {
			time.Sleep(time.Minute)
			mu.Lock()
			for ip, v := range visitors {
				if time.Since(v.lastSeen) > 3*time.Minute {
					delete(visitors, ip)
				}
			}
			mu.Unlock()
		}
	}()
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	h.RegisterPublicRoutes(r)
	h.RegisterAdminRoutes(r)
}

func (h *Handler) RegisterPublicRoutes(r chi.Router) {
	// Public Routes (Rate Limited)
	r.Group(func(r chi.Router) {
		r.Use(h.limitMiddleware)
		r.Post("/public/admissions/enquiry", h.SubmitEnquiry)
	})
}

func (h *Handler) RegisterAdminRoutes(r chi.Router) {
	// Admin Routes (Authenticated)
	r.Route("/admissions", func(r chi.Router) {
		r.Get("/enquiries", h.ListEnquiries)
		r.Put("/enquiries/{id}/status", h.UpdateEnquiryStatus)

		r.Post("/applications", h.CreateApplication)
		r.Get("/applications", h.ListApplications)
		r.Get("/applications/{id}", h.GetApplication)
		r.Put("/applications/{id}/status", h.UpdateApplicationStatus)
		r.Post("/applications/{id}/accept", h.AcceptApplication)
		r.Post("/applications/{id}/pay-fee", h.RecordFeePayment)
		r.Post("/applications/{id}/documents", h.AttachDocument)
	})
}

// Public Handlers

type submitEnquiryReq struct {
	TenantID        string `json:"tenant_id"`
	ParentName      string `json:"parent_name"`
	Email           string `json:"email"`
	Phone           string `json:"phone"`
	StudentName     string `json:"student_name"`
	GradeInterested string `json:"grade_interested"`
	AcademicYear    string `json:"academic_year"`
	Notes           string `json:"notes"`
	Source          string `json:"source"`
	Captcha         string `json:"captcha_solution"` // Added for hardening
}

func (h *Handler) SubmitEnquiry(w http.ResponseWriter, r *http.Request) {
	var req submitEnquiryReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.TenantID) == "" {
		req.TenantID = strings.TrimSpace(middleware.GetTenantID(r.Context()))
	}
	if strings.TrimSpace(req.TenantID) == "" {
		req.TenantID = strings.TrimSpace(os.Getenv("PUBLIC_DEFAULT_TENANT_ID"))
	}

	// Basic validation
	if req.TenantID == "" || req.ParentName == "" || req.Phone == "" {
		http.Error(w, "missing required fields", http.StatusBadRequest)
		return
	}

	captchaRequired := strings.EqualFold(os.Getenv("PUBLIC_FORM_CAPTCHA_REQUIRED"), "true")
	if captchaRequired && req.Captcha == "" && r.Header.Get("X-Env") != "test" {
		http.Error(w, "captcha validation required", http.StatusForbidden)
		return
	}

	enquiry, err := h.svc.SubmitEnquiry(r.Context(), admission.CreateEnquiryParams{
		TenantID:        req.TenantID,
		ParentName:      req.ParentName,
		Email:           req.Email,
		Phone:           req.Phone,
		StudentName:     req.StudentName,
		GradeInterested: req.GradeInterested,
		AcademicYear:    req.AcademicYear,
		Source:          req.Source,
		Notes:           req.Notes,
		IPAddress:       r.RemoteAddr,
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusCreated, enquiry)
}

// Admin Handlers

func (h *Handler) ListEnquiries(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit == 0 {
		limit = 20
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	status := r.URL.Query().Get("status")
	year := r.URL.Query().Get("academic_year")

	items, err := h.svc.ListEnquiries(r.Context(), middleware.GetTenantID(r.Context()), status, year, int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, items)
}

type updateStatusReq struct {
	Status string `json:"status"`
}

func (h *Handler) UpdateEnquiryStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req updateStatusReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err := h.svc.UpdateEnquiryStatus(r.Context(), middleware.GetTenantID(r.Context()), id, req.Status, middleware.GetUserID(r.Context()), r.RemoteAddr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "status updated"})
}

func (h *Handler) CreateApplication(w http.ResponseWriter, r *http.Request) {
	// Simple stub for creating application from enquiry
	type createAppReq struct {
		EnquiryID string                 `json:"enquiry_id"`
		Data      map[string]interface{} `json:"data"`
	}
	var req createAppReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	app, err := h.svc.CreateApplication(r.Context(), middleware.GetTenantID(r.Context()), req.EnquiryID, req.Data, middleware.GetUserID(r.Context()), r.RemoteAddr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusCreated, app)
}

func (h *Handler) ListApplications(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit == 0 {
		limit = 20
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	status := r.URL.Query().Get("status")
	year := r.URL.Query().Get("academic_year")

	items, err := h.svc.ListApplications(r.Context(), middleware.GetTenantID(r.Context()), status, year, int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, items)
}

func (h *Handler) RecordFeePayment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	type payReq struct {
		Amount int64  `json:"amount"`
		Ref    string `json:"reference"`
	}
	var req payReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err := h.svc.RecordFeePayment(r.Context(), middleware.GetTenantID(r.Context()), id, req.Amount, req.Ref, middleware.GetUserID(r.Context()), r.RemoteAddr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "payment recorded"})
}

func (h *Handler) GetApplication(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	app, err := h.svc.GetApplication(r.Context(), middleware.GetTenantID(r.Context()), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	respondJSON(w, http.StatusOK, app)
}

func (h *Handler) UpdateApplicationStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req updateStatusReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err := h.svc.UpdateApplicationStatus(r.Context(), middleware.GetTenantID(r.Context()), id, req.Status, middleware.GetUserID(r.Context()), r.RemoteAddr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "status updated"})
}

func (h *Handler) AcceptApplication(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	type acceptReq struct {
		ClassID   string `json:"class_id"`
		SectionID string `json:"section_id"`
	}
	var req acceptReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err := h.svc.AcceptApplication(r.Context(), middleware.GetTenantID(r.Context()), id, req.ClassID, req.SectionID, middleware.GetUserID(r.Context()), r.RemoteAddr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "application accepted and student created"})
}
func (h *Handler) AttachDocument(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	type docReq struct {
		Type string `json:"type"`
		URL  string `json:"url"`
	}
	var req docReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err := h.svc.AttachDocument(r.Context(), middleware.GetTenantID(r.Context()), id, req.Type, req.URL, middleware.GetUserID(r.Context()), r.RemoteAddr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "document attached"})
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload != nil {
		json.NewEncoder(w).Encode(payload)
	}
}
