package library

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/library"
)

type Handler struct {
	svc *library.LibraryService
}

func NewHandler(svc *library.LibraryService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	// Books
	r.Post("/library/books", h.CreateBook)
	r.Put("/library/books/{id}", h.UpdateBook)
	r.Get("/library/books", h.ListBooks)
	r.Get("/library/categories", h.ListCategories)
	r.Get("/library/authors", h.ListAuthors)
	
	// Circulation
	r.Post("/library/issues", h.IssueBook)
	r.Get("/library/issues", h.ListIssues)
	r.Post("/library/issues/{id}/return", h.ReturnBook)
}

// Book Handlers

type createBookReq struct {
	Title         string  `json:"title"`
	ISBN          string  `json:"isbn"`
	Publisher     string  `json:"publisher"`
	PublishedYear int32   `json:"published_year"`
	CategoryID    string  `json:"category_id"`
	TotalCopies   int32   `json:"total_copies"`
	ShelfLocation string  `json:"shelf_location"`
	Price         float64 `json:"price"`
	Language      string  `json:"language"`
	AuthorID      string  `json:"author_id"`
}

func (h *Handler) CreateBook(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req createBookReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Title) == "" && strings.TrimSpace(req.ISBN) == "" {
		http.Error(w, "title or isbn is required", http.StatusBadRequest)
		return
	}
	if req.TotalCopies <= 0 {
		http.Error(w, "total_copies must be greater than zero", http.StatusBadRequest)
		return
	}

	book, err := h.svc.CreateBook(ctx, library.CreateBookParams{
		TenantID:      middleware.GetTenantID(ctx),
		Title:         req.Title,
		ISBN:          req.ISBN,
		Publisher:     req.Publisher,
		PublishedYear: req.PublishedYear,
		CategoryID:    req.CategoryID,
		TotalCopies:   req.TotalCopies,
		ShelfLocation: req.ShelfLocation,
		Price:         req.Price,
		Language:      req.Language,
		AuthorID:      req.AuthorID,
		UserID:        middleware.GetUserID(ctx),
		RequestID:     middleware.GetReqID(ctx),
		IP:            r.RemoteAddr,
	})

	if err != nil {
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "not found") {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		if strings.Contains(errMsg, "not available") {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusCreated, book)
}

func (h *Handler) UpdateBook(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	bookID := chi.URLParam(r, "id")
	var req createBookReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Title) == "" && strings.TrimSpace(req.ISBN) == "" {
		http.Error(w, "title or isbn is required", http.StatusBadRequest)
		return
	}
	if req.TotalCopies <= 0 {
		http.Error(w, "total_copies must be greater than zero", http.StatusBadRequest)
		return
	}

	book, err := h.svc.UpdateBook(ctx, middleware.GetTenantID(ctx), bookID, library.CreateBookParams{
		TenantID:      middleware.GetTenantID(ctx),
		Title:         req.Title,
		ISBN:          req.ISBN,
		Publisher:     req.Publisher,
		PublishedYear: req.PublishedYear,
		CategoryID:    req.CategoryID,
		TotalCopies:   req.TotalCopies,
		ShelfLocation: req.ShelfLocation,
		Price:         req.Price,
		Language:      req.Language,
		AuthorID:      req.AuthorID,
		UserID:        middleware.GetUserID(ctx),
		RequestID:     middleware.GetReqID(ctx),
		IP:            r.RemoteAddr,
	})

	if err != nil {
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "not found") {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, book)
}

func (h *Handler) ListBooks(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit == 0 { limit = 20 }
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	books, err := h.svc.ListBooks(r.Context(), middleware.GetTenantID(r.Context()), int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, books)
}

func (h *Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.svc.ListCategories(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, categories)
}

func (h *Handler) ListAuthors(w http.ResponseWriter, r *http.Request) {
	authors, err := h.svc.ListAuthors(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, authors)
}

// Issue Handlers

type issueBookReq struct {
	BookID    string `json:"book_id"`
	StudentID string `json:"student_id"`
	Days      int    `json:"days"`
}

func (h *Handler) IssueBook(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req issueBookReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.BookID) == "" || strings.TrimSpace(req.StudentID) == "" {
		http.Error(w, "book_id and student_id are required", http.StatusBadRequest)
		return
	}
	if req.Days <= 0 {
		req.Days = 14
	}

	issue, err := h.svc.IssueBook(ctx, library.IssueBookParams{
		TenantID:  middleware.GetTenantID(ctx),
		BookID:    req.BookID,
		StudentID: req.StudentID,
		UserID:    middleware.GetUserID(ctx),
		Days:      req.Days,
		RequestID: middleware.GetReqID(ctx),
		IP:        r.RemoteAddr,
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusCreated, issue)
}

type returnBookReq struct {
	Remarks string `json:"remarks"`
}

func (h *Handler) ReturnBook(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	issueID := chi.URLParam(r, "id")
	
	var req returnBookReq
	if r.Body != nil {
		_ = json.NewDecoder(r.Body).Decode(&req)
	}
	if strings.TrimSpace(issueID) == "" {
		http.Error(w, "issue id is required", http.StatusBadRequest)
		return
	}

	issue, err := h.svc.ReturnBook(ctx, library.ReturnBookParams{
		TenantID: middleware.GetTenantID(ctx),
		IssueID:  issueID,
		UserID:   middleware.GetUserID(ctx),
		Remarks:  req.Remarks,
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, issue)
}

func (h *Handler) ListIssues(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit == 0 { limit = 20 }
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	issues, err := h.svc.ListIssues(r.Context(), middleware.GetTenantID(r.Context()), int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, issues)
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload != nil {
		json.NewEncoder(w).Encode(payload)
	}
}
