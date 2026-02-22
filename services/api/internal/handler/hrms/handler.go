package hrms

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

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
		r.Post("/adjustments", h.CreateAdjustment)
		
		r.Get("/staff/specializations", h.ListTeacherSpecializations)
		r.Post("/staff/specializations", h.CreateTeacherSpecialization)
		r.Get("/staff/class-teachers", h.ListClassTeachers)
		r.Post("/staff/class-teachers", h.AssignClassTeacher)
		
		r.Get("/staff/tasks", h.ListStaffTasks)
		r.Post("/staff/tasks", h.CreateStaffTask)
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
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.EmployeeCode) == "" || strings.TrimSpace(req.FullName) == "" || strings.TrimSpace(req.Email) == "" {
		http.Error(w, "employee_code, full_name, and email are required", http.StatusBadRequest)
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
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "required") || strings.Contains(errMsg, "invalid") || strings.Contains(errMsg, "must") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
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
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Name) == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	if req.Basic < 0 || req.HRA < 0 || req.DA < 0 {
		http.Error(w, "salary components cannot be negative", http.StatusBadRequest)
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
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "required") || strings.Contains(errMsg, "invalid") || strings.Contains(errMsg, "negative") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
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
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if req.Month < 1 || req.Month > 12 {
		http.Error(w, "month must be between 1 and 12", http.StatusBadRequest)
		return
	}
	if req.Year < 2000 || req.Year > 2100 {
		http.Error(w, "year must be between 2000 and 2100", http.StatusBadRequest)
		return
	}

	pr, err := h.svc.CreatePayrollRun(r.Context(), tenantID, req.Month, req.Year, userID)
	if err != nil {
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "required") || strings.Contains(errMsg, "invalid") || strings.Contains(errMsg, "between") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
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
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "already completed") {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		if strings.Contains(errMsg, "invalid") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "completed"})
}
func (h *Handler) CreateAdjustment(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	var req struct {
		EmployeeID  string  `json:"employee_id"`
		Type        string  `json:"type"`
		Amount      float64 `json:"amount"`
		Description string  `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.EmployeeID) == "" {
		http.Error(w, "employee_id is required", http.StatusBadRequest)
		return
	}
	if req.Amount <= 0 {
		http.Error(w, "amount must be greater than zero", http.StatusBadRequest)
		return
	}
	if req.Type != "allowance" && req.Type != "deduction" {
		http.Error(w, "type must be 'allowance' or 'deduction'", http.StatusBadRequest)
		return
	}

	err := h.svc.AddAdjustment(r.Context(), tenantID, req.EmployeeID, userID, req.Type, req.Amount, req.Description)
	if err != nil {
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "required") || strings.Contains(errMsg, "invalid") || strings.Contains(errMsg, "must") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "adjustment pending approval"})
}

func (h *Handler) ListTeacherSpecializations(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	teacherID := r.URL.Query().Get("teacher_id")

	var trPtr *string
	if teacherID != "" {
		trPtr = &teacherID
	}

	specs, err := h.svc.ListTeacherSubjectSpecializations(r.Context(), tenantID, trPtr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(specs)
}

func (h *Handler) CreateTeacherSpecialization(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req struct {
		TeacherID string `json:"teacher_id"`
		SubjectID string `json:"subject_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	spec, err := h.svc.CreateTeacherSubjectSpecialization(r.Context(), tenantID, req.TeacherID, req.SubjectID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(spec)
}

func (h *Handler) ListClassTeachers(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	ayID := r.URL.Query().Get("academic_year_id")
	if ayID == "" {
		http.Error(w, "academic_year_id is required", http.StatusBadRequest)
		return
	}

	assignments, err := h.svc.ListClassTeacherAssignments(r.Context(), tenantID, ayID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(assignments)
}

func (h *Handler) AssignClassTeacher(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req struct {
		AcademicYearID string `json:"academic_year_id"`
		SectionID      string `json:"section_id"`
		TeacherID      string `json:"teacher_id"`
		Remarks        string `json:"remarks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	asgn, err := h.svc.AssignClassTeacher(r.Context(), tenantID, req.AcademicYearID, req.SectionID, req.TeacherID, req.Remarks)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(asgn)
}

func (h *Handler) ListStaffTasks(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	employeeID := r.URL.Query().Get("employee_id")

	tasks, err := h.svc.ListStaffTasks(r.Context(), tenantID, employeeID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

func (h *Handler) CreateStaffTask(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	var req struct {
		Title       string    `json:"title"`
		Description string    `json:"description"`
		Priority    string    `json:"priority"`
		AssignedTo  string    `json:"assigned_to"`
		DueDate     time.Time `json:"due_date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	task, err := h.svc.CreateStaffTask(r.Context(), hrmsservice.StaffTaskParams{
		TenantID:    tenantID,
		Title:       req.Title,
		Description: req.Description,
		Priority:    req.Priority,
		AssignedTo:  req.AssignedTo,
		CreatedBy:   userID,
		DueDate:     req.DueDate,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(task)
}

func (h *Handler) RegisterTeacherRoutes(r chi.Router) {
	r.Route("/leaves", func(r chi.Router) {
		r.Post("/", h.ApplyLeave)
		r.Get("/", h.ListTeacherLeaves)
		r.Get("/types", h.ListLeaveTypes)
	})
}

func (h *Handler) ApplyLeave(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	var req struct {
		LeaveTypeID string    `json:"leave_type_id"`
		StartDate   time.Time `json:"start_date"`
		EndDate     time.Time `json:"end_date"`
		Reason      string    `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	employee, err := h.svc.GetEmployeeByUserID(r.Context(), tenantID, userID)
	if err != nil {
		http.Error(w, "failed to identify employee record", http.StatusNotFound)
		return
	}

	leave, err := h.svc.CreateStaffLeaveRequest(r.Context(), tenantID, employee.ID.String(), req.LeaveTypeID, req.StartDate, req.EndDate, req.Reason)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(leave)
}

func (h *Handler) ListTeacherLeaves(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())
	status := r.URL.Query().Get("status")

	employee, err := h.svc.GetEmployeeByUserID(r.Context(), tenantID, userID)
	if err != nil {
		http.Error(w, "failed to identify employee record", http.StatusNotFound)
		return
	}

	empID := employee.ID.String()
	var statusPtr *string
	if status != "" {
		statusPtr = &status
	}

	leaves, err := h.svc.ListStaffLeaveRequests(r.Context(), tenantID, &empID, statusPtr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(leaves)
}

func (h *Handler) ListLeaveTypes(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	activeOnly := true
	types, err := h.svc.ListLeaveTypes(r.Context(), tenantID, &activeOnly)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(types)
}
