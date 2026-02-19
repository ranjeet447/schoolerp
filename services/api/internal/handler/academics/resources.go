package academics

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/academics"
)

type ResourceHandler struct {
	svc *academics.ResourceService
}

func NewResourceHandler(svc *academics.ResourceService) *ResourceHandler {
	return &ResourceHandler{svc: svc}
}

func (h *ResourceHandler) RegisterRoutes(r chi.Router) {
	r.Route("/resources", func(r chi.Router) {
		r.Get("/", h.ListResources)
		r.Post("/", h.CreateResource)
		r.Delete("/{id}", h.DeleteResource)
	})
}

func (h *ResourceHandler) CreateResource(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())
	reqID := middleware.GetReqID(r.Context())
	ip := r.RemoteAddr

	var res academics.LearningResource
	if err := json.NewDecoder(r.Body).Decode(&res); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resource, err := h.svc.CreateResource(r.Context(), tenantID, res, userID, reqID, ip)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resource)
}

func (h *ResourceHandler) ListResources(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	classID := r.URL.Query().Get("class_id")
	subjectID := r.URL.Query().Get("subject_id")

	resources, err := h.svc.ListResources(r.Context(), tenantID, classID, subjectID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resources)
}

func (h *ResourceHandler) DeleteResource(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r.Context())
	reqID := middleware.GetReqID(r.Context())
	ip := r.RemoteAddr

	if err := h.svc.DeleteResource(r.Context(), tenantID, id, userID, reqID, ip); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
