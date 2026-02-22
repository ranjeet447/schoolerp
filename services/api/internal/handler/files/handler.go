package files

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	filesvc "github.com/schoolerp/api/internal/service/files"
)

type Handler struct {
	svc *filesvc.FileService
}

func NewHandler(svc *filesvc.FileService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.With(middleware.RateLimitByKey("upload", 5, 0, nil)).Post("/files/upload", h.Upload)
}

func (h *Handler) Upload(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	userID := middleware.GetUserID(ctx)

	if tenantID == "" {
		http.Error(w, "tenant context is required", http.StatusBadRequest)
		return
	}
	if userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Limit upload size (e.g., 10MB)
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "file too large or invalid multipart form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "missing file in request", http.StatusBadRequest)
		return
	}
	defer file.Close()

	res, err := h.svc.Upload(ctx, filesvc.UploadParams{
		TenantID:    tenantID,
		Name:        header.Filename,
		MimeType:    header.Header.Get("Content-Type"),
		UploadedBy:  userID,
		Content:     file,
		ContentSize: header.Size,
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":   res.ID,
		"name": res.Name,
		"url":  "/uploads/" + res.Key + "." + getExt(res.Name), // Public URL
	})
}

func getExt(name string) string {
	for i := len(name) - 1; i >= 0; i-- {
		if name[i] == '.' {
			return name[i+1:]
		}
	}
	return "bin"
}
