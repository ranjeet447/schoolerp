package communication

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	commservice "github.com/schoolerp/api/internal/service/communication"
)

type Handler struct {
	svc *commservice.Service
}

func NewHandler(svc *commservice.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/communication", func(r chi.Router) {
		r.Post("/ptm/events", h.CreatePTMEvent)
		r.Get("/ptm/events", h.ListPTMEvents)
		r.Get("/ptm/events/{id}/slots", h.GetPTMSlots)
		r.Post("/ptm/events/{id}/slots/{slot_id}/book", h.BookPTMSlot)
		r.Get("/ptm/settings", h.GetPTMSettings)
		r.Put("/ptm/settings", h.UpdatePTMSettings)

		r.Post("/chats/{room_id}/messages", h.SendMessage)
		r.Get("/chats/{room_id}/history", h.GetChatHistory)
		r.Get("/chats/rooms", h.ListChatRooms)
		r.Get("/chats/moderation", h.GetChatModerationSettings)
		r.Put("/chats/moderation", h.UpdateChatModerationSettings)

		r.Get("/events", h.ListMessagingEvents)
	})
}

func (h *Handler) CreatePTMEvent(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req struct {
		Title               string    `json:"title"`
		Description         string    `json:"description"`
		EventDate           time.Time `json:"event_date"`
		StartTime           time.Time `json:"start_time"`
		EndTime             time.Time `json:"end_time"`
		SlotDurationMinutes int32     `json:"slot_duration_minutes"`
		TeacherID           string    `json:"teacher_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	event, err := h.svc.CreatePTMEvent(r.Context(), commservice.CreatePTMEventParams{
		TenantID:            tenantID,
		Title:               req.Title,
		Description:         req.Description,
		EventDate:           req.EventDate,
		StartTime:           req.StartTime,
		EndTime:             req.EndTime,
		SlotDurationMinutes: req.SlotDurationMinutes,
		TeacherID:           req.TeacherID,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(event)
}

func (h *Handler) ListPTMEvents(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	events, err := h.svc.ListPTMEvents(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}

func (h *Handler) GetPTMSlots(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "id")

	slots, err := h.svc.GetPTMSlots(r.Context(), eventID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(slots)
}

func (h *Handler) BookPTMSlot(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "id")
	slotID := chi.URLParam(r, "slot_id")

	var req struct {
		StudentID string `json:"student_id"`
		Remarks   string `json:"remarks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	slot, err := h.svc.BookSlot(r.Context(), eventID, slotID, req.StudentID, req.Remarks)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(slot)
}

func (h *Handler) SendMessage(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	senderID := middleware.GetUserID(r.Context())
	roomID := chi.URLParam(r, "room_id")

	var req struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	msg, err := h.svc.SendMessage(r.Context(), tenantID, commservice.SendMessageParams{
		RoomID:   roomID,
		SenderID: senderID,
		Message:  req.Message,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(msg)
}

func (h *Handler) GetChatHistory(w http.ResponseWriter, r *http.Request) {
	roomID := chi.URLParam(r, "room_id")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit == 0 {
		limit = 50
	}

	history, err := h.svc.GetChatHistory(r.Context(), roomID, int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}

func (h *Handler) ListChatRooms(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := strings.TrimSpace(r.URL.Query().Get("user_id"))
	if userID == "" {
		userID = middleware.GetUserID(r.Context())
	}

	rooms, err := h.svc.ListChatRooms(r.Context(), tenantID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if rooms == nil {
		w.Write([]byte("[]"))
		return
	}
	json.NewEncoder(w).Encode(rooms)
}

func (h *Handler) GetChatModerationSettings(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	settings, err := h.svc.GetChatModerationSettings(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(settings)
}

func (h *Handler) UpdateChatModerationSettings(w http.ResponseWriter, r *http.Request) {
	role := middleware.GetRole(r.Context())
	if role != "tenant_admin" && role != "super_admin" {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	var req struct {
		QuietHoursStart string   `json:"quiet_hours_start"`
		QuietHoursEnd   string   `json:"quiet_hours_end"`
		BlockedKeywords []string `json:"blocked_keywords"`
		IsEnabled       bool     `json:"is_enabled"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.QuietHoursStart) == "" || strings.TrimSpace(req.QuietHoursEnd) == "" {
		http.Error(w, "quiet_hours_start and quiet_hours_end are required in HH:MM format", http.StatusBadRequest)
		return
	}

	tenantID := middleware.GetTenantID(r.Context())
	settings, err := h.svc.UpsertChatModerationSettings(
		r.Context(),
		tenantID,
		strings.TrimSpace(req.QuietHoursStart),
		strings.TrimSpace(req.QuietHoursEnd),
		req.BlockedKeywords,
		req.IsEnabled,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(settings)
}

func (h *Handler) ListMessagingEvents(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	eventType := strings.TrimSpace(r.URL.Query().Get("event_type"))
	status := strings.TrimSpace(r.URL.Query().Get("status"))

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	events, err := h.svc.ListMessagingEvents(r.Context(), tenantID, eventType, status, int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if events == nil {
		w.Write([]byte("[]"))
		return
	}
	json.NewEncoder(w).Encode(events)
}

func (h *Handler) GetPTMSettings(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	settings, err := h.svc.GetPTMSettings(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(settings)
}

func (h *Handler) UpdatePTMSettings(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var req struct {
		Enabled bool `json:"automated_reminders_enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if err := h.svc.UpdatePTMSettings(r.Context(), tenantID, req.Enabled); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
