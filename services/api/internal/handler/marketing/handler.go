package marketing

import (
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	marketingsvc "github.com/schoolerp/api/internal/service/marketing"
)

type Handler struct {
	svc *marketingsvc.Service
}

func NewHandler(svc *marketingsvc.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterPublicRoutes(r chi.Router) {
	r.Route("/public", func(r chi.Router) {
		r.Use(publicSubmissionRateLimit)

		r.Post("/demo-bookings", h.CreateDemoBooking)
		r.Post("/contact", h.SubmitContact)
		r.Post("/partner-applications", h.SubmitPartnerApplication)
		r.Get("/review-requests/{token}", h.GetReviewRequest)
		r.Post("/reviews", h.SubmitReview)
		r.Post("/case-studies/{slug}/pdf", h.CreateCaseStudyPDFJob)
		r.Get("/pdf-jobs/{id}", h.GetPDFJobStatus)
		r.Get("/pdf-jobs/{id}/download", h.DownloadPDFJob)
	})
}

func (h *Handler) RegisterAdminRoutes(r chi.Router) {
	r.Get("/demo-bookings", h.ListDemoBookings)
	r.Patch("/demo-bookings/{id}/status", h.UpdateDemoBookingStatus)
}

type createDemoBookingReq struct {
	Name         string `json:"name"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	SchoolName   string `json:"school_name"`
	City         string `json:"city"`
	StudentCount string `json:"student_count"`
	Message      string `json:"message"`
	SourcePage   string `json:"source_page"`
	UtmSource    string `json:"utm_source"`
	UtmCampaign  string `json:"utm_campaign"`
	UtmMedium    string `json:"utm_medium"`
	Timezone     string `json:"timezone"`
	StartAtUTC   string `json:"start_at_utc"`
}

func (h *Handler) CreateDemoBooking(w http.ResponseWriter, r *http.Request) {
	var req createDemoBookingReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	var startAt time.Time
	if strings.TrimSpace(req.StartAtUTC) != "" {
		parsed, err := time.Parse(time.RFC3339, req.StartAtUTC)
		if err != nil {
			http.Error(w, "start_at_utc must be a valid RFC3339 timestamp", http.StatusBadRequest)
			return
		}
		startAt = parsed.UTC()
	}

	booking, err := h.svc.CreateDemoBooking(r.Context(), marketingsvc.CreateDemoBookingParams{
		Name:              req.Name,
		Email:             req.Email,
		Phone:             req.Phone,
		SchoolName:        req.SchoolName,
		City:              req.City,
		StudentCountRange: req.StudentCount,
		Message:           req.Message,
		SourcePage:        req.SourcePage,
		UtmSource:         req.UtmSource,
		UtmCampaign:       req.UtmCampaign,
		UtmMedium:         req.UtmMedium,
		Timezone:          req.Timezone,
		StartAtUTC:        startAt,
		RequestIP:         getClientIP(r),
		IdempotencyKey:    r.Header.Get("Idempotency-Key"),
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"booking": booking,
	})
}

type contactReq struct {
	Name       string `json:"name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	SchoolName string `json:"school_name"`
	Message    string `json:"message"`
	City       string `json:"city"`
}

func (h *Handler) SubmitContact(w http.ResponseWriter, r *http.Request) {
	var req contactReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	id, err := h.svc.SubmitContact(r.Context(), marketingsvc.ContactRequest{
		Name:       req.Name,
		Email:      req.Email,
		Phone:      req.Phone,
		SchoolName: req.SchoolName,
		Message:    req.Message,
		City:       req.City,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	respondJSON(w, http.StatusCreated, map[string]string{
		"id":     id,
		"status": "received",
	})
}

type submitPartnerReq struct {
	CompanyName string `json:"company_name"`
	Name        string `json:"name"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Website     string `json:"website"`
	Category    string `json:"category"`
	Description string `json:"description"`
}

func (h *Handler) SubmitPartnerApplication(w http.ResponseWriter, r *http.Request) {
	var req submitPartnerReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	id, err := h.svc.SubmitPartnerApplication(r.Context(), marketingsvc.PartnerApplicationRequest{
		CompanyName: req.CompanyName,
		Name:        req.Name,
		Email:       req.Email,
		Phone:       req.Phone,
		Website:     req.Website,
		Category:    req.Category,
		Description: req.Description,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	respondJSON(w, http.StatusCreated, map[string]string{
		"id":     id,
		"status": "received",
	})
}

func (h *Handler) GetReviewRequest(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	info, err := h.svc.GetReviewRequest(r.Context(), token)
	if err != nil {
		switch {
		case errors.Is(err, marketingsvc.ErrInvalidReviewToken):
			http.Error(w, "review token not found", http.StatusNotFound)
		case errors.Is(err, marketingsvc.ErrExpiredReviewToken):
			http.Error(w, "review link expired", http.StatusGone)
		case errors.Is(err, marketingsvc.ErrReviewTokenUsed):
			http.Error(w, "review already submitted", http.StatusConflict)
		default:
			http.Error(w, "failed to read review request", http.StatusInternalServerError)
		}
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"token":       info.Token,
		"school_name": info.SchoolName,
		"expires_at":  info.ExpiresAt,
	})
}

type submitReviewReq struct {
	Token   string `json:"token"`
	Rating  int    `json:"rating"`
	Content string `json:"content"`
	Consent bool   `json:"consent"`
	Name    string `json:"name"`
	Role    string `json:"role"`
	City    string `json:"city"`
}

func (h *Handler) SubmitReview(w http.ResponseWriter, r *http.Request) {
	var req submitReviewReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	id, err := h.svc.SubmitReview(r.Context(), marketingsvc.SubmitReviewParams{
		Token:   req.Token,
		Rating:  req.Rating,
		Content: req.Content,
		Consent: req.Consent,
		Name:    req.Name,
		Role:    req.Role,
		City:    req.City,
	})
	if err != nil {
		switch {
		case errors.Is(err, marketingsvc.ErrInvalidReviewToken):
			http.Error(w, "review token not found", http.StatusNotFound)
		case errors.Is(err, marketingsvc.ErrExpiredReviewToken):
			http.Error(w, "review link expired", http.StatusGone)
		case errors.Is(err, marketingsvc.ErrReviewTokenUsed):
			http.Error(w, "review already submitted", http.StatusConflict)
		default:
			http.Error(w, err.Error(), http.StatusBadRequest)
		}
		return
	}

	respondJSON(w, http.StatusCreated, map[string]string{
		"id":     id,
		"status": "submitted",
	})
}

func (h *Handler) CreateCaseStudyPDFJob(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	locale := r.URL.Query().Get("locale")

	id, err := h.svc.CreateCaseStudyPDFJob(r.Context(), slug, locale, getClientIP(r))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	respondJSON(w, http.StatusAccepted, map[string]string{
		"job_id": id,
		"status": "completed",
	})
}

func (h *Handler) GetPDFJobStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	job, err := h.svc.GetPDFJob(r.Context(), id)
	if err != nil {
		if errors.Is(err, marketingsvc.ErrPDFJobNotFound) {
			http.Error(w, "job not found", http.StatusNotFound)
			return
		}
		http.Error(w, "failed to fetch job", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, job)
}

func (h *Handler) DownloadPDFJob(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	filename, payload, err := h.svc.BuildPDFDownload(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, marketingsvc.ErrPDFJobNotFound):
			http.Error(w, "job not found", http.StatusNotFound)
		case errors.Is(err, marketingsvc.ErrPDFJobNotReady):
			http.Error(w, "job not ready", http.StatusConflict)
		default:
			http.Error(w, "failed to generate download", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", `attachment; filename="`+filename+`"`)
	w.Header().Set("Cache-Control", "private, max-age=300")
	w.WriteHeader(http.StatusOK)
	w.Write(payload)
}

func (h *Handler) ListDemoBookings(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 {
		limit = 50
	}

	items, err := h.svc.ListDemoBookings(r.Context(), int32(limit), int32(offset))
	if err != nil {
		http.Error(w, "failed to fetch bookings", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"items": items,
	})
}

type updateDemoBookingStatusReq struct {
	Status string `json:"status"`
}

func (h *Handler) UpdateDemoBookingStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req updateDemoBookingStatusReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err := h.svc.UpdateDemoBookingStatus(r.Context(), id, req.Status)
	if err != nil {
		switch {
		case errors.Is(err, marketingsvc.ErrInvalidBookingState):
			http.Error(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, marketingsvc.ErrBookingNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		default:
			http.Error(w, "failed to update status", http.StatusInternalServerError)
		}
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"status": "updated",
	})
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

type visitor struct {
	lastSeen time.Time
	count    int
}

var (
	visitorsMu sync.Mutex
	visitors   = make(map[string]*visitor)
)

func publicSubmissionRateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)
		if ip == "" {
			ip = r.RemoteAddr
		}

		visitorsMu.Lock()
		v, ok := visitors[ip]
		if !ok {
			visitors[ip] = &visitor{lastSeen: time.Now(), count: 1}
			visitorsMu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		if time.Since(v.lastSeen) > time.Minute {
			v.lastSeen = time.Now()
			v.count = 1
			visitorsMu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		v.count++
		if v.count > 60 {
			visitorsMu.Unlock()
			http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
			return
		}
		visitorsMu.Unlock()
		next.ServeHTTP(w, r)
	})
}

func init() {
	go func() {
		for {
			time.Sleep(time.Minute)
			visitorsMu.Lock()
			for ip, v := range visitors {
				if time.Since(v.lastSeen) > 3*time.Minute {
					delete(visitors, ip)
				}
			}
			visitorsMu.Unlock()
		}
	}()
}

func getClientIP(r *http.Request) string {
	xff := strings.TrimSpace(r.Header.Get("X-Forwarded-For"))
	if xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	return strings.TrimSpace(r.RemoteAddr)
}
