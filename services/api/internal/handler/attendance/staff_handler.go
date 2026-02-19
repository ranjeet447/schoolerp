package attendance

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	attendservice "github.com/schoolerp/api/internal/service/attendance"
)

// StaffHandler handles staff attendance and period-wise attendance HTTP routes
type StaffHandler struct {
	svc *attendservice.StaffAttendanceService
}

func NewStaffHandler(svc *attendservice.StaffAttendanceService) *StaffHandler {
	return &StaffHandler{svc: svc}
}

func (h *StaffHandler) RegisterRoutes(r chi.Router) {
	// Staff Attendance
	r.Route("/staff-attendance", func(r chi.Router) {
		r.Post("/", h.MarkStaffAttendance)
		r.Get("/", h.GetStaffSession)
		r.Get("/stats", h.GetStaffStats)
		r.Get("/report", h.GetMonthlyReport)
	})

	// Period-wise Attendance
	r.Route("/period-attendance", func(r chi.Router) {
		r.Post("/", h.MarkPeriodAttendance)
		r.Get("/", h.GetPeriodSession)
	})
}

// ==================== Staff Attendance ====================

type markStaffReq struct {
	Date    string                              `json:"date"`
	Entries []attendservice.StaffAttendanceEntry `json:"entries"`
}

func (h *StaffHandler) MarkStaffAttendance(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())
	reqID := middleware.GetReqID(r.Context())
	ip := r.RemoteAddr

	var req markStaffReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		http.Error(w, "invalid date format, use YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	err = h.svc.MarkAttendance(r.Context(), attendservice.MarkStaffAttendanceParams{
		TenantID:  tenantID,
		Date:      date,
		Entries:   req.Entries,
		UserID:    userID,
		RequestID: reqID,
		IP:        ip,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"ok"}`))
}

func (h *StaffHandler) GetStaffSession(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	dateStr := r.URL.Query().Get("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		http.Error(w, "invalid date", http.StatusBadRequest)
		return
	}

	sess, err := h.svc.GetSession(r.Context(), tenantID, date)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if sess == nil {
		w.Write([]byte(`null`))
		return
	}
	json.NewEncoder(w).Encode(sess)
}

func (h *StaffHandler) GetStaffStats(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	dateStr := r.URL.Query().Get("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		http.Error(w, "invalid date", http.StatusBadRequest)
		return
	}

	stats, err := h.svc.GetDailyStats(r.Context(), tenantID, date)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func (h *StaffHandler) GetMonthlyReport(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	yearStr := r.URL.Query().Get("year")
	monthStr := r.URL.Query().Get("month")
	year, _ := strconv.Atoi(yearStr)
	month, _ := strconv.Atoi(monthStr)
	if year == 0 {
		year = time.Now().Year()
	}
	if month == 0 {
		month = int(time.Now().Month())
	}

	report, err := h.svc.GetMonthlyReport(r.Context(), tenantID, year, month)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(report)
}

// ==================== Period-wise Attendance ====================

type markPeriodReq struct {
	ClassSectionID string                                `json:"class_section_id"`
	Date           string                                `json:"date"`
	PeriodNumber   int                                   `json:"period_number"`
	SubjectID      string                                `json:"subject_id"`
	Entries        []attendservice.PeriodAttendanceEntry  `json:"entries"`
}

func (h *StaffHandler) MarkPeriodAttendance(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())
	reqID := middleware.GetReqID(r.Context())
	ip := r.RemoteAddr

	var req markPeriodReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		http.Error(w, "invalid date", http.StatusBadRequest)
		return
	}

	err = h.svc.MarkPeriodAttendance(r.Context(), attendservice.MarkPeriodAttendanceParams{
		TenantID:       tenantID,
		ClassSectionID: req.ClassSectionID,
		Date:           date,
		PeriodNumber:   req.PeriodNumber,
		SubjectID:      req.SubjectID,
		Entries:        req.Entries,
		UserID:         userID,
		RequestID:      reqID,
		IP:             ip,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"ok"}`))
}

func (h *StaffHandler) GetPeriodSession(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	classSectionID := r.URL.Query().Get("class_section_id")
	dateStr := r.URL.Query().Get("date")
	periodStr := r.URL.Query().Get("period")

	if classSectionID == "" || dateStr == "" || periodStr == "" {
		http.Error(w, "class_section_id, date, and period are required", http.StatusBadRequest)
		return
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		http.Error(w, "invalid date", http.StatusBadRequest)
		return
	}
	period, err := strconv.Atoi(periodStr)
	if err != nil {
		http.Error(w, "invalid period", http.StatusBadRequest)
		return
	}

	sess, err := h.svc.GetPeriodSession(r.Context(), tenantID, classSectionID, date, period)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if sess == nil {
		w.Write([]byte(`null`))
		return
	}
	json.NewEncoder(w).Encode(sess)
}
