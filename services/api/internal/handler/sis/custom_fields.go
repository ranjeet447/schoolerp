package sis

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	sisservice "github.com/schoolerp/api/internal/service/sis"
)

// CustomFieldHandler handles custom fields, houses, school profile, and import jobs
type CustomFieldHandler struct {
	svc *sisservice.CustomFieldService
}

func NewCustomFieldHandler(svc *sisservice.CustomFieldService) *CustomFieldHandler {
	return &CustomFieldHandler{svc: svc}
}

func (h *CustomFieldHandler) RegisterRoutes(r chi.Router) {
	// Custom Field Definitions
	r.Route("/custom-fields", func(r chi.Router) {
		r.Get("/definitions", h.ListDefinitions)
		r.Post("/definitions", h.CreateDefinition)
		r.Put("/definitions/{id}", h.UpdateDefinition)
		r.Delete("/definitions/{id}", h.DeleteDefinition)
		r.Get("/values/{entityType}/{entityId}", h.GetValues)
		r.Put("/values/{entityId}", h.SetValues)
	})

	// House System
	r.Route("/houses", func(r chi.Router) {
		r.Get("/", h.ListHouses)
		r.Post("/", h.CreateHouse)
		r.Put("/{id}", h.UpdateHouse)
		r.Delete("/{id}", h.DeleteHouse)
		r.Post("/assign/{studentId}", h.AssignStudentHouse)
	})

	// School Profile
	r.Route("/school-profile", func(r chi.Router) {
		r.Get("/", h.GetSchoolProfile)
		r.Put("/", h.UpdateSchoolProfile)
	})

	// Import Jobs
	r.Route("/import-jobs", func(r chi.Router) {
		r.Get("/", h.ListImportJobs)
	})
}

// ==================== Custom Field Definitions ====================

func (h *CustomFieldHandler) ListDefinitions(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	entityType := r.URL.Query().Get("entity_type")

	defs, err := h.svc.ListDefinitions(r.Context(), tenantID, entityType)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(defs)
}

func (h *CustomFieldHandler) CreateDefinition(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req sisservice.CreateCustomFieldParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	req.TenantID = tenantID

	def, err := h.svc.CreateDefinition(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(def)
}

func (h *CustomFieldHandler) UpdateDefinition(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	defID := chi.URLParam(r, "id")

	var req sisservice.CreateCustomFieldParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	req.TenantID = tenantID

	def, err := h.svc.UpdateDefinition(r.Context(), tenantID, defID, req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(def)
}

func (h *CustomFieldHandler) DeleteDefinition(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	defID := chi.URLParam(r, "id")

	if err := h.svc.DeleteDefinition(r.Context(), tenantID, defID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ==================== Custom Field Values ====================

func (h *CustomFieldHandler) GetValues(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	entityType := chi.URLParam(r, "entityType")
	entityID := chi.URLParam(r, "entityId")

	vals, err := h.svc.GetValues(r.Context(), tenantID, entityID, entityType)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vals)
}

func (h *CustomFieldHandler) SetValues(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	entityID := chi.URLParam(r, "entityId")

	var values map[string]json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&values); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.svc.BulkSetValues(r.Context(), tenantID, entityID, values); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ==================== Houses ====================

func (h *CustomFieldHandler) ListHouses(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	houses, err := h.svc.ListHouses(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(houses)
}

type createHouseReq struct {
	Name    string `json:"name"`
	Color   string `json:"color"`
	LogoURL string `json:"logo_url"`
}

func (h *CustomFieldHandler) CreateHouse(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var req createHouseReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	house, err := h.svc.CreateHouse(r.Context(), tenantID, req.Name, req.Color, req.LogoURL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(house)
}

func (h *CustomFieldHandler) UpdateHouse(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	houseID := chi.URLParam(r, "id")
	var req createHouseReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	house, err := h.svc.UpdateHouse(r.Context(), tenantID, houseID, req.Name, req.Color, req.LogoURL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(house)
}

func (h *CustomFieldHandler) DeleteHouse(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	houseID := chi.URLParam(r, "id")
	if err := h.svc.DeleteHouse(r.Context(), tenantID, houseID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type assignHouseReq struct {
	HouseID string `json:"house_id"`
}

func (h *CustomFieldHandler) AssignStudentHouse(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	studentID := chi.URLParam(r, "studentId")
	var req assignHouseReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if err := h.svc.AssignStudentHouse(r.Context(), tenantID, studentID, req.HouseID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ==================== School Profile ====================

func (h *CustomFieldHandler) GetSchoolProfile(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	profile, err := h.svc.GetSchoolProfile(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

func (h *CustomFieldHandler) UpdateSchoolProfile(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var req sisservice.SchoolProfile
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	req.TenantID = tenantID
	profile, err := h.svc.UpsertSchoolProfile(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

// ==================== Import Jobs ====================

func (h *CustomFieldHandler) ListImportJobs(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	jobs, err := h.svc.ListImportJobs(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(jobs)
}
