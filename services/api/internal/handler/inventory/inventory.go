package inventory

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/inventory"
)

type Handler struct {
	svc *inventory.InventoryService
}

func NewHandler(svc *inventory.InventoryService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	// Categories
	r.Post("/inventory/categories", h.CreateCategory)
	r.Get("/inventory/categories", h.ListCategories)
	
	// Suppliers
	r.Post("/inventory/suppliers", h.CreateSupplier)
	r.Get("/inventory/suppliers", h.ListSuppliers)

	// Items
	r.Post("/inventory/items", h.CreateItem)
	r.Get("/inventory/items", h.ListItems)

	// Transactions
	r.Post("/inventory/transactions", h.CreateTransaction)
	r.Get("/inventory/transactions", h.ListTransactions)
}

// Category Handlers

type createCategoryReq struct {
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description"`
}

func (h *Handler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req createCategoryReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	cat, err := h.svc.CreateCategory(ctx, 
		middleware.GetTenantID(ctx), 
		req.Name, req.Type, req.Description,
		middleware.GetUserID(ctx), middleware.GetReqID(ctx), r.RemoteAddr,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusCreated, cat)
}

func (h *Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.ListCategories(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, items)
}

// Supplier Handlers

type createSupplierReq struct {
	Name          string `json:"name"`
	ContactPerson string `json:"contact_person"`
	Phone         string `json:"phone"`
	Email         string `json:"email"`
	Address       string `json:"address"`
}

func (h *Handler) CreateSupplier(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req createSupplierReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	supplier, err := h.svc.CreateSupplier(ctx, 
		middleware.GetTenantID(ctx), 
		req.Name, req.ContactPerson, req.Phone, req.Email, req.Address,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusCreated, supplier)
}

func (h *Handler) ListSuppliers(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.ListSuppliers(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, items)
}

// Item Handlers

type createItemReq struct {
	CategoryID   string `json:"category_id"`
	Name         string `json:"name"`
	Sku          string `json:"sku"`
	Unit         string `json:"unit"`
	ReorderLevel int32  `json:"reorder_level"`
	Description  string `json:"description"`
}

func (h *Handler) CreateItem(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req createItemReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	item, err := h.svc.CreateItem(ctx, 
		middleware.GetTenantID(ctx), 
		req.CategoryID, req.Name, req.Sku, req.Unit, req.Description, req.ReorderLevel,
		middleware.GetUserID(ctx), middleware.GetReqID(ctx), r.RemoteAddr,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusCreated, item)
}

func (h *Handler) ListItems(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit == 0 { limit = 20 }
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	items, err := h.svc.ListItems(r.Context(), middleware.GetTenantID(r.Context()), int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, items)
}

// Transaction Handlers

type createTxnReq struct {
	ItemID        string  `json:"item_id"`
	Type          string  `json:"type"`
	Quantity      int32   `json:"quantity"`
	UnitPrice     float64 `json:"unit_price"`
	SupplierID    string  `json:"supplier_id"`
	Location      string  `json:"location"`
	ReferenceType string  `json:"reference_type"`
	Remarks       string  `json:"remarks"`
}

func (h *Handler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req createTxnReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	txn, err := h.svc.CreateTransaction(ctx, inventory.StockTransactionParams{
		TenantID:      middleware.GetTenantID(ctx),
		ItemID:        req.ItemID,
		Type:          req.Type,
		Quantity:      req.Quantity,
		UnitPrice:     req.UnitPrice,
		SupplierID:    req.SupplierID,
		Location:      req.Location,
		ReferenceType: req.ReferenceType,
		Remarks:       req.Remarks,
		UserID:        middleware.GetUserID(ctx),
		RequestID:     middleware.GetReqID(ctx),
		IP:            r.RemoteAddr,
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusCreated, txn)
}

func (h *Handler) ListTransactions(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit == 0 { limit = 20 }
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	items, err := h.svc.ListTransactions(r.Context(), middleware.GetTenantID(r.Context()), int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, items)
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload != nil {
		json.NewEncoder(w).Encode(payload)
	}
}
