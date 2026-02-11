package communication

import (
	"encoding/json"
	"net/http"
	"strconv"
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
		
		r.Post("/chats/{room_id}/messages", h.SendMessage)
		r.Get("/chats/{room_id}/history", h.GetChatHistory)
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
	if limit == 0 { limit = 50 }

	history, err := h.svc.GetChatHistory(r.Context(), roomID, int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}
