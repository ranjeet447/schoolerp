package hrms

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	hrmsservice "github.com/schoolerp/api/internal/service/hrms"
)

type Handler struct {
	svc *hrmsservice.Service
}

func NewHandler(svc *hrmsservice.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/hrms", func(r chi.Router) {
		r.Get("/employees", h.ListEmployees)
		r.Post("/employees", h.CreateEmployee)
		r.Get("/salary-structures", h.ListSalaryStructures)
		r.Post("/salary-structures", h.CreateSalaryStructure)
		r.Get("/payroll-runs", h.ListPayrollRuns)
		r.Post("/payroll-runs", h.CreatePayrollRun)
		r.Post("/payroll-runs/{id}/execute", h.ExecutePayroll)
	})
}

func (h *Handler) ListEmployees(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit == 0 { limit = 50 }

	employees, err := h.svc.ListEmployees(r.Context(), tenantID, int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(employees)
}

func (h *Handler) CreateEmployee(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req struct {
		EmployeeCode      string `json:"employee_code"`
		FullName          string `json:"full_name"`
		Email             string `json:"email"`
		Phone             string `json:"phone"`
		Department        string `json:"department"`
		Designation       string `json:"designation"`
		SalaryStructureID string `json:"salary_structure_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	emp, err := h.svc.CreateEmployee(r.Context(), hrmsservice.CreateEmployeeParams{
		TenantID:          tenantID,
		EmployeeCode:      req.EmployeeCode,
		FullName:          req.FullName,
		Email:             req.Email,
		Phone:             req.Phone,
		Department:        req.Department,
		Designation:       req.Designation,
		SalaryStructureID: req.SalaryStructureID,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(emp)
}

func (h *Handler) ListSalaryStructures(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	structures, err := h.svc.ListSalaryStructures(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(structures)
}

func (h *Handler) CreateSalaryStructure(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req struct {
		Name  string  `json:"name"`
		Basic float64 `json:"basic"`
		HRA   float64 `json:"hra"`
		DA    float64 `json:"da"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	ss, err := h.svc.CreateSalaryStructure(r.Context(), hrmsservice.CreateSalaryStructureParams{
		TenantID: tenantID,
		Name:     req.Name,
		Basic:    req.Basic,
		HRA:      req.HRA,
		DA:       req.DA,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ss)
}

func (h *Handler) ListPayrollRuns(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit == 0 { limit = 50 }

	runs, err := h.svc.ListPayrollRuns(r.Context(), tenantID, int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(runs)
}

func (h *Handler) CreatePayrollRun(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	var req struct {
		Month int32 `json:"month"`
		Year  int32 `json:"year"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	pr, err := h.svc.CreatePayrollRun(r.Context(), tenantID, req.Month, req.Year, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(pr)
}

func (h *Handler) ExecutePayroll(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	payrollID := chi.URLParam(r, "id")

	if err := h.svc.RunPayroll(r.Context(), tenantID, payrollID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "completed"})
}
