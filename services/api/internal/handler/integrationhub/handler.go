package integrationhub

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	hubsvc "github.com/schoolerp/api/internal/service/integrationhub"
)

type Handler struct {
	svc *hubsvc.Service
}

func NewHandler(svc *hubsvc.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterAdminRoutes(r chi.Router) {
	r.Route("/billing", func(r chi.Router) {
		r.Get("/addons", h.ListAddons)
		r.Post("/addons/{code}/activate", h.ActivateAddon)
		r.Post("/addons/{code}/cancel", h.CancelAddon)
		r.Get("/credits/balance", h.GetCreditBalances)
		r.Get("/credits/ledger", h.GetCreditLedger)
		r.Post("/credits/topup", h.RequestCreditTopup)
	})
	r.Route("/settings/integrations", func(r chi.Router) {
		r.Get("/", h.ListIntegrations)
		r.Post("/{provider}/connect", h.StartConnect)
		r.Get("/{provider}/callback", h.ConnectCallback)
		r.Post("/{provider}/disconnect", h.Disconnect)
	})
}

func (h *Handler) RegisterPublicRoutes(r chi.Router) {
	r.Route("/integrations/oauth", func(r chi.Router) {
		r.Get("/{provider}/callback", h.PublicConnectCallback)
	})
}

func (h *Handler) RegisterTeacherRoutes(r chi.Router) {
	r.Route("/live-classes", func(r chi.Router) {
		r.Post("/schedule", h.ScheduleLiveClass)
		r.Get("/list", h.ListLiveClasses)
	})
}

func (h *Handler) RegisterParentRoutes(r chi.Router) {
	r.Route("/live-classes", func(r chi.Router) {
		r.Get("/list", h.ListLiveClasses)
	})
}

func (h *Handler) RegisterStudentRoutes(r chi.Router) {
	r.Route("/live-classes", func(r chi.Router) {
		r.Get("/list", h.ListLiveClasses)
	})
}

func (h *Handler) RegisterPlatformRoutes(r chi.Router) {
	r.Route("/billing", func(r chi.Router) {
		r.Post("/credits/adjust", h.PlatformAdjustCredits)
		r.Get("/addons/catalog", h.ListPlatformAddonCatalog)
		r.Post("/addons/catalog", h.UpsertPlatformAddonCatalog)
		r.Put("/addons/catalog/{code}", h.UpsertPlatformAddonCatalog)
	})
}

func (h *Handler) ListAddons(w http.ResponseWriter, r *http.Request) {
	rows, err := h.svc.ListBillingAddons(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]interface{}{"addons": rows})
}

func (h *Handler) ActivateAddon(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	var req struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)
	res, err := h.svc.ActivateAddon(r.Context(), middleware.GetTenantID(r.Context()), code, middleware.GetUserID(r.Context()), req.Reason)
	if err != nil {
		status := http.StatusInternalServerError
		if strings.Contains(err.Error(), "already") {
			status = http.StatusConflict
		} else if strings.Contains(err.Error(), "addon is not available") {
			status = http.StatusBadRequest
		}
		http.Error(w, err.Error(), status)
		return
	}
	writeJSON(w, res)
}

func (h *Handler) CancelAddon(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	if err := h.svc.CancelAddon(r.Context(), middleware.GetTenantID(r.Context()), code); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]string{"status": "cancelled"})
}

func (h *Handler) GetCreditBalances(w http.ResponseWriter, r *http.Request) {
	rows, err := h.svc.ListCreditBalances(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]interface{}{"balances": rows})
}

func (h *Handler) GetCreditLedger(w http.ResponseWriter, r *http.Request) {
	limit := parseInt32(r.URL.Query().Get("limit"), 50)
	offset := parseInt32(r.URL.Query().Get("offset"), 0)
	walletType := strings.TrimSpace(r.URL.Query().Get("wallet_type"))
	rows, err := h.svc.ListCreditLedger(r.Context(), middleware.GetTenantID(r.Context()), walletType, limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]interface{}{"ledger": rows})
}

func (h *Handler) RequestCreditTopup(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WalletType string `json:"wallet_type"`
		Amount     int64  `json:"amount"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.WalletType) == "" || req.Amount <= 0 {
		http.Error(w, "wallet_type and positive amount are required", http.StatusBadRequest)
		return
	}
	res, err := h.svc.TopupCreditsRequest(r.Context(), middleware.GetTenantID(r.Context()), req.WalletType, req.Amount, middleware.GetUserID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusAccepted)
	writeJSON(w, res)
}

func (h *Handler) PlatformAdjustCredits(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TenantID    string                 `json:"tenant_id"`
		WalletType  string                 `json:"wallet_type"`
		Amount      int64                  `json:"amount"`
		Source      string                 `json:"source"`
		ReferenceID string                 `json:"reference_id"`
		Metadata    map[string]interface{} `json:"metadata"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.TenantID) == "" || strings.TrimSpace(req.WalletType) == "" || strings.TrimSpace(req.ReferenceID) == "" || req.Amount == 0 {
		http.Error(w, "tenant_id, wallet_type, non-zero amount and reference_id are required", http.StatusBadRequest)
		return
	}
	actor := middleware.GetUserID(r.Context())
	err := h.svc.CreditAdjustment(r.Context(), req.TenantID, req.WalletType, req.Amount, stringOr(req.Source, "support_adjustment"), req.ReferenceID, req.Metadata, &actor)
	if err != nil {
		status := http.StatusInternalServerError
		if strings.Contains(err.Error(), "INSUFFICIENT_CREDITS") {
			status = http.StatusConflict
		}
		http.Error(w, err.Error(), status)
		return
	}
	writeJSON(w, map[string]string{"status": "ok"})
}

func (h *Handler) ListPlatformAddonCatalog(w http.ResponseWriter, r *http.Request) {
	rows, err := h.svc.ListPlatformAddonCatalog(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]interface{}{"addons": rows})
}

func (h *Handler) UpsertPlatformAddonCatalog(w http.ResponseWriter, r *http.Request) {
	var req hubsvc.UpsertPlatformAddonParams
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if code := strings.TrimSpace(chi.URLParam(r, "code")); code != "" {
		req.Code = code
	}
	row, err := h.svc.UpsertPlatformAddonCatalog(r.Context(), req, middleware.GetUserID(r.Context()))
	if err != nil {
		status := http.StatusBadRequest
		if !strings.Contains(err.Error(), "required") && !strings.Contains(err.Error(), "invalid") {
			status = http.StatusInternalServerError
		}
		http.Error(w, err.Error(), status)
		return
	}
	writeJSONStatus(w, http.StatusOK, row)
}

func (h *Handler) ListIntegrations(w http.ResponseWriter, r *http.Request) {
	rows, err := h.svc.ListTenantIntegrations(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]interface{}{"integrations": rows})
}

func (h *Handler) StartConnect(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	scheme := "https"
	if r.TLS == nil {
		scheme = "http"
	}
	if xfProto := strings.TrimSpace(r.Header.Get("X-Forwarded-Proto")); xfProto != "" {
		scheme = strings.Split(xfProto, ",")[0]
	}
	host := r.Host
	if xfHost := strings.TrimSpace(r.Header.Get("X-Forwarded-Host")); xfHost != "" {
		host = strings.Split(xfHost, ",")[0]
	}
	baseURL := scheme + "://" + strings.TrimSpace(host)
	res, err := h.svc.StartOAuthConnect(r.Context(), middleware.GetTenantID(r.Context()), provider, middleware.GetUserID(r.Context()), baseURL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	writeJSON(w, res)
}

func (h *Handler) ConnectCallback(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	state := strings.TrimSpace(r.URL.Query().Get("state"))
	code := strings.TrimSpace(r.URL.Query().Get("code"))
	if err := h.svc.CompleteOAuthConnect(r.Context(), middleware.GetTenantID(r.Context()), provider, middleware.GetUserID(r.Context()), state, code); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	redirectTo := r.URL.Query().Get("redirect")
	if !strings.HasPrefix(redirectTo, "/") || strings.HasPrefix(redirectTo, "//") {
		redirectTo = "/admin/settings/integrations?connected=" + provider
	}
	http.Redirect(w, r, redirectTo, http.StatusFound)
}

func (h *Handler) PublicConnectCallback(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	state := strings.TrimSpace(r.URL.Query().Get("state"))
	code := strings.TrimSpace(r.URL.Query().Get("code"))
	if _, err := h.svc.CompleteOAuthConnectByState(r.Context(), provider, state, code); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	redirectTo := r.URL.Query().Get("redirect")
	if !strings.HasPrefix(redirectTo, "/") || strings.HasPrefix(redirectTo, "//") {
		redirectTo = "/admin/settings/integrations?connected=" + provider
	}
	http.Redirect(w, r, redirectTo, http.StatusFound)
}

func (h *Handler) Disconnect(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	if err := h.svc.DisconnectIntegration(r.Context(), middleware.GetTenantID(r.Context()), provider, middleware.GetUserID(r.Context())); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	writeJSON(w, map[string]string{"status": "disconnected"})
}

func (h *Handler) ScheduleLiveClass(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title       string    `json:"title"`
		Description string    `json:"description"`
		ClassID     string    `json:"class_id"`
		SectionID   string    `json:"section_id"`
		StartsAt    time.Time `json:"starts_at"`
		EndsAt      time.Time `json:"ends_at"`
		Provider    string    `json:"provider"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	row, err := h.svc.ScheduleLiveClass(r.Context(), hubsvc.LiveClassScheduleParams{
		TenantID:    middleware.GetTenantID(r.Context()),
		TeacherID:   middleware.GetUserID(r.Context()),
		Title:       req.Title,
		Description: req.Description,
		ClassID:     req.ClassID,
		SectionID:   req.SectionID,
		StartsAt:    req.StartsAt,
		EndsAt:      req.EndsAt,
		Provider:    req.Provider,
	})
	if err != nil {
		status := http.StatusInternalServerError
		switch {
		case strings.Contains(err.Error(), "UPGRADE_REQUIRED"):
			status = http.StatusForbidden
		case strings.Contains(err.Error(), "not connected"), strings.Contains(err.Error(), "invalid"):
			status = http.StatusBadRequest
		}
		writeJSONStatus(w, status, map[string]string{"error": err.Error()})
		return
	}
	writeJSONStatus(w, http.StatusCreated, row)
}

func (h *Handler) ListLiveClasses(w http.ResponseWriter, r *http.Request) {
	rows, err := h.svc.ListLiveClasses(r.Context(), middleware.GetTenantID(r.Context()), parseInt32(r.URL.Query().Get("limit"), 50))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]interface{}{"events": rows})
}

func parseInt32(raw string, fallback int32) int32 {
	if raw == "" {
		return fallback
	}
	v, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return int32(v)
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	writeJSONStatus(w, http.StatusOK, v)
}

func writeJSONStatus(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func stringOr(v, fallback string) string {
	if strings.TrimSpace(v) == "" {
		return fallback
	}
	return v
}

var _ = errors.Is
