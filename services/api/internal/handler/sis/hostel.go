package sis

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/sis"
)

type HostelHandler struct {
	svc *sis.HostelService
}

func NewHostelHandler(svc *sis.HostelService) *HostelHandler {
	return &HostelHandler{svc: svc}
}

func (h *HostelHandler) RegisterRoutes(r chi.Router) {
	r.Route("/hostel", func(r chi.Router) {
		r.Get("/buildings", h.ListBuildings)
		r.Post("/buildings", h.CreateBuilding)
		r.Get("/buildings/{buildingId}/rooms", h.ListRooms)
		r.Post("/buildings/{buildingId}/rooms", h.CreateRoom)
		r.Get("/allocations", h.ListAllocations)
		r.Post("/allocations", h.AllocateRoom)
		r.Post("/allocations/{id}/vacate", h.VacateRoom)
	})
}

func (h *HostelHandler) CreateBuilding(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())
	reqID := middleware.GetReqID(r.Context())
	ip := r.RemoteAddr

	var b sis.HostelBuilding
	if err := json.NewDecoder(r.Body).Decode(&b); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	building, err := h.svc.CreateBuilding(r.Context(), tenantID, b, userID, reqID, ip)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(building)
}

func (h *HostelHandler) ListBuildings(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	buildings, err := h.svc.ListBuildings(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(buildings)
}

func (h *HostelHandler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	bID := chi.URLParam(r, "buildingId")
	var room sis.HostelRoom
	if err := json.NewDecoder(r.Body).Decode(&room); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res, err := h.svc.CreateRoom(r.Context(), bID, room)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func (h *HostelHandler) ListRooms(w http.ResponseWriter, r *http.Request) {
	bID := chi.URLParam(r, "buildingId")
	rooms, err := h.svc.ListRooms(r.Context(), bID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rooms)
}

func (h *HostelHandler) AllocateRoom(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())
	reqID := middleware.GetReqID(r.Context())
	ip := r.RemoteAddr

	var req struct {
		RoomID    string `json:"room_id"`
		StudentID string `json:"student_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.svc.AllocateRoom(r.Context(), tenantID, req.RoomID, req.StudentID, userID, reqID, ip); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *HostelHandler) ListAllocations(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	allocations, err := h.svc.ListAllocations(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(allocations)
}

func (h *HostelHandler) VacateRoom(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r.Context())
	reqID := middleware.GetReqID(r.Context())
	ip := r.RemoteAddr

	if err := h.svc.VacateRoom(r.Context(), tenantID, id, userID, reqID, ip); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
