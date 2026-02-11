package transport

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/transport"
)

type Handler struct {
	svc *transport.TransportService
}

func NewHandler(svc *transport.TransportService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
    // Vehicles
	r.Post("/transport/vehicles", h.CreateVehicle)
	r.Get("/transport/vehicles", h.ListVehicles)
    r.Get("/transport/vehicles/{id}", h.GetVehicle)
    
    // Drivers
    r.Post("/transport/drivers", h.CreateDriver)
    r.Get("/transport/drivers", h.ListDrivers)

    // Routes
    r.Post("/transport/routes", h.CreateRoute)
    r.Put("/transport/routes/{id}", h.UpdateRoute)
    r.Get("/transport/routes", h.ListRoutes)
    r.Post("/transport/routes/{id}/stops", h.CreateRouteStop)
    r.Get("/transport/routes/{id}/stops", h.ListRouteStops)

    // Allocations
    r.Post("/transport/allocations", h.CreateAllocation)
    r.Get("/transport/allocations", h.ListAllocations)
}

// Vehicle Handlers

type createVehicleReq struct {
    RegistrationNumber string `json:"registration_number"`
    Capacity           int32  `json:"capacity"`
    Type               string `json:"type"`
    Status             string `json:"status"`
}

func (h *Handler) CreateVehicle(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    tenantID := middleware.GetTenantID(ctx)
    
    var req createVehicleReq
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid request body", http.StatusBadRequest)
        return
    }

    vehicle, err := h.svc.CreateVehicle(ctx, transport.CreateVehicleParams{
        TenantID: tID(tenantID),
        RegistrationNumber: req.RegistrationNumber,
        Capacity: req.Capacity,
        Type: req.Type,
        Status: req.Status,
        UserID: middleware.GetUserID(ctx),
        RequestID: middleware.GetReqID(ctx),
        IP: r.RemoteAddr,
    })

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    respondJSON(w, http.StatusCreated, vehicle)
}

func (h *Handler) ListVehicles(w http.ResponseWriter, r *http.Request) {
    tenantID := middleware.GetTenantID(r.Context())
    vehicles, err := h.svc.ListVehicles(r.Context(), tenantID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    respondJSON(w, http.StatusOK, vehicles)
}

func (h *Handler) GetVehicle(w http.ResponseWriter, r *http.Request) {
    tenantID := middleware.GetTenantID(r.Context())
    vehicleID := chi.URLParam(r, "id")
    
    vehicle, err := h.svc.GetVehicle(r.Context(), tenantID, vehicleID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    respondJSON(w, http.StatusOK, vehicle)
}

// Driver Handlers

type createDriverReq struct {
    FullName string `json:"full_name"`
    LicenseNumber string `json:"license_number"`
    Phone string `json:"phone"`
    Status string `json:"status"`
}

func (h *Handler) CreateDriver(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    var req createDriverReq
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid body", http.StatusBadRequest)
        return
    }

    driver, err := h.svc.CreateDriver(ctx, transport.CreateDriverParams{
        TenantID: middleware.GetTenantID(ctx),
        FullName: req.FullName,
        LicenseNumber: req.LicenseNumber,
        Phone: req.Phone,
        Status: req.Status,
        UserID: middleware.GetUserID(ctx),
        RequestID: middleware.GetReqID(ctx),
        IP: r.RemoteAddr,
    })
    
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    respondJSON(w, http.StatusCreated, driver)
}

func (h *Handler) ListDrivers(w http.ResponseWriter, r *http.Request) {
    drivers, err := h.svc.ListDrivers(r.Context(), middleware.GetTenantID(r.Context()))
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    respondJSON(w, http.StatusOK, drivers)
}

// Route Handlers

type createRouteReq struct {
    Name string `json:"name"`
    VehicleID string `json:"vehicle_id"`
    DriverID string `json:"driver_id"`
    Description string `json:"description"`
}

func (h *Handler) CreateRoute(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    var req createRouteReq
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid body", http.StatusBadRequest)
        return
    }

    route, err := h.svc.CreateRoute(ctx, transport.CreateRouteParams{
        TenantID: middleware.GetTenantID(ctx),
        Name: req.Name,
        VehicleID: req.VehicleID,
        DriverID: req.DriverID,
        Description: req.Description,
        UserID: middleware.GetUserID(ctx),
        RequestID: middleware.GetReqID(ctx),
        IP: r.RemoteAddr,
    })

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    respondJSON(w, http.StatusCreated, route)
}

func (h *Handler) UpdateRoute(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    routeID := chi.URLParam(r, "id")
    var req createRouteReq
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid body", http.StatusBadRequest)
        return
    }

    route, err := h.svc.UpdateRoute(ctx, middleware.GetTenantID(ctx), routeID, transport.CreateRouteParams{
        TenantID:    middleware.GetTenantID(ctx),
        Name:        req.Name,
        VehicleID:   req.VehicleID,
        DriverID:    req.DriverID,
        Description: req.Description,
        UserID:      middleware.GetUserID(ctx),
        RequestID:   middleware.GetReqID(ctx),
        IP:          r.RemoteAddr,
    })

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    respondJSON(w, http.StatusOK, route)
}

func (h *Handler) ListRoutes(w http.ResponseWriter, r *http.Request) {
    routes, err := h.svc.ListRoutes(r.Context(), middleware.GetTenantID(r.Context()))
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    respondJSON(w, http.StatusOK, routes)
}

// Stop Handlers

type createStopReq struct {
    Name string `json:"name"`
    SequenceOrder int32 `json:"sequence_order"`
}

func (h *Handler) CreateRouteStop(w http.ResponseWriter, r *http.Request) {
    routeID := chi.URLParam(r, "id")
    var req createStopReq
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid body", http.StatusBadRequest)
        return
    }

    stop, err := h.svc.CreateRouteStop(r.Context(), transport.CreateStopParams{
        RouteID: routeID,
        Name: req.Name,
        SequenceOrder: req.SequenceOrder,
    })

     if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    respondJSON(w, http.StatusCreated, stop)
}

func (h *Handler) ListRouteStops(w http.ResponseWriter, r *http.Request) {
    routeID := chi.URLParam(r, "id")
    stops, err := h.svc.ListStops(r.Context(), routeID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    respondJSON(w, http.StatusOK, stops)
}

// Allocation Handlers

type createAllocationReq struct {
    StudentID string `json:"student_id"`
    RouteID string `json:"route_id"`
    StopID string `json:"stop_id"`
    StartDate string `json:"start_date"`
    Status string `json:"status"`
}

func (h *Handler) CreateAllocation(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    var req createAllocationReq
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid body", http.StatusBadRequest)
        return
    }

    var startDate pgtype.Date
    if req.StartDate != "" {
        startDate.Scan(req.StartDate)
    } else {
        // default to today or handle error
    }

    alloc, err := h.svc.CreateAllocation(ctx, transport.CreateAllocationParams{
        TenantID: middleware.GetTenantID(ctx),
        StudentID: req.StudentID,
        RouteID: req.RouteID,
        StopID: req.StopID,
        StartDate: startDate,
        Status: req.Status,
    })
    
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    respondJSON(w, http.StatusCreated, alloc)
}

func (h *Handler) ListAllocations(w http.ResponseWriter, r *http.Request) {
    allocs, err := h.svc.ListAllocations(r.Context(), middleware.GetTenantID(r.Context()))
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    respondJSON(w, http.StatusOK, allocs)
}

// Helpers

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    if payload != nil {
        json.NewEncoder(w).Encode(payload)
    }
}

func tID(id string) string { return id }
