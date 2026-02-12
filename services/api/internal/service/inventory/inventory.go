package inventory

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type InventoryService struct {
	q     db.Querier
	pool  *pgxpool.Pool
	audit *audit.Logger
}

func NewInventoryService(q db.Querier, pool *pgxpool.Pool, audit *audit.Logger) *InventoryService {
	return &InventoryService{
		q:     q,
		pool:  pool,
		audit: audit,
	}
}

// Category Management

func (s *InventoryService) CreateCategory(ctx context.Context, tenantID, name, itemType, desc, userID, reqID, ip string) (db.InventoryCategory, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	cat, err := s.q.CreateInventoryCategory(ctx, db.CreateInventoryCategoryParams{
		TenantID:    tID,
		Name:        name,
		Type:        itemType,
		Description: pgtype.Text{String: desc, Valid: desc != ""},
	})
	if err != nil {
		return db.InventoryCategory{}, fmt.Errorf("failed to create category: %w", err)
	}

	uID := pgtype.UUID{}
	uID.Scan(userID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		RequestID:    reqID,
		Action:       "inventory.create_category",
		ResourceType: "inventory_category",
		ResourceID:   cat.ID,
		After:        cat,
		IPAddress:    ip,
	})

	return cat, nil
}

func (s *InventoryService) ListCategories(ctx context.Context, tenantID string) ([]db.InventoryCategory, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListInventoryCategories(ctx, tID)
}

// Supplier Management

func (s *InventoryService) CreateSupplier(ctx context.Context, tenantID, name, contact, phone, email, address, userID, reqID, ip string) (db.InventorySupplier, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	supplier, err := s.q.CreateSupplier(ctx, db.CreateSupplierParams{
		TenantID:      tID,
		Name:          name,
		ContactPerson: pgtype.Text{String: contact, Valid: contact != ""},
		Phone:         pgtype.Text{String: phone, Valid: phone != ""},
		Email:         pgtype.Text{String: email, Valid: email != ""},
		Address:       pgtype.Text{String: address, Valid: address != ""},
	})
	if err != nil {
		return db.InventorySupplier{}, fmt.Errorf("failed to create supplier: %w", err)
	}

	uID := pgtype.UUID{}
	uID.Scan(userID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		RequestID:    reqID,
		Action:       "inventory.create_supplier",
		ResourceType: "inventory_supplier",
		ResourceID:   supplier.ID,
		After:        supplier,
		IPAddress:    ip,
	})

	return supplier, nil
}

func (s *InventoryService) ListSuppliers(ctx context.Context, tenantID string) ([]db.InventorySupplier, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListSuppliers(ctx, tID)
}

func (s *InventoryService) UpdateSupplier(ctx context.Context, tenantID, supplierID, name, contact, phone, email, address, userID, reqID, ip string) (db.InventorySupplier, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	sID := pgtype.UUID{}
	sID.Scan(supplierID)

	var supplier db.InventorySupplier
	err := s.pool.QueryRow(ctx, `
		UPDATE inventory_suppliers
		SET name = $3,
			contact_person = $4,
			phone = $5,
			email = $6,
			address = $7,
			updated_at = NOW()
		WHERE id = $1 AND tenant_id = $2
		RETURNING id, tenant_id, name, contact_person, phone, email, address, created_at, updated_at
	`,
		sID,
		tID,
		name,
		pgtype.Text{String: contact, Valid: contact != ""},
		pgtype.Text{String: phone, Valid: phone != ""},
		pgtype.Text{String: email, Valid: email != ""},
		pgtype.Text{String: address, Valid: address != ""},
	).Scan(
		&supplier.ID,
		&supplier.TenantID,
		&supplier.Name,
		&supplier.ContactPerson,
		&supplier.Phone,
		&supplier.Email,
		&supplier.Address,
		&supplier.CreatedAt,
		&supplier.UpdatedAt,
	)
	if err != nil {
		return db.InventorySupplier{}, fmt.Errorf("failed to update supplier: %w", err)
	}

	uID := pgtype.UUID{}
	uID.Scan(userID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		RequestID:    reqID,
		Action:       "inventory.update_supplier",
		ResourceType: "inventory_supplier",
		ResourceID:   supplier.ID,
		After:        supplier,
		IPAddress:    ip,
	})

	return supplier, nil
}

// Item Management

func (s *InventoryService) CreateItem(ctx context.Context, tenantID, catID, name, sku, unit, desc string, reorder int32, userID, reqID, ip string) (db.InventoryItem, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	cID := pgtype.UUID{}
	cID.Scan(catID)

	item, err := s.q.CreateInventoryItem(ctx, db.CreateInventoryItemParams{
		TenantID:     tID,
		CategoryID:   cID,
		Name:         name,
		Sku:          pgtype.Text{String: sku, Valid: sku != ""},
		Unit:         pgtype.Text{String: unit, Valid: unit != ""},
		ReorderLevel: pgtype.Int4{Int32: reorder, Valid: true},
		Description:  pgtype.Text{String: desc, Valid: desc != ""},
	})
	if err != nil {
		return db.InventoryItem{}, fmt.Errorf("failed to create item: %w", err)
	}

	uID := pgtype.UUID{}
	uID.Scan(userID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		RequestID:    reqID,
		Action:       "inventory.create_item",
		ResourceType: "inventory_item",
		ResourceID:   item.ID,
		After:        item,
		IPAddress:    ip,
	})

	return item, nil
}

func (s *InventoryService) ListItems(ctx context.Context, tenantID string, limit, offset int32) ([]db.ListInventoryItemsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListInventoryItems(ctx, db.ListInventoryItemsParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}

func (s *InventoryService) UpdateItem(ctx context.Context, tenantID, itemID, catID, name, sku, unit, desc string, reorder int32, userID, reqID, ip string) (db.InventoryItem, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	iID := pgtype.UUID{}
	iID.Scan(itemID)
	cID := pgtype.UUID{}
	cID.Scan(catID)

	var item db.InventoryItem
	err := s.pool.QueryRow(ctx, `
		UPDATE inventory_items
		SET category_id = $3,
			name = $4,
			sku = $5,
			unit = $6,
			reorder_level = $7,
			description = $8,
			updated_at = NOW()
		WHERE id = $1 AND tenant_id = $2
		RETURNING id, tenant_id, category_id, name, sku, description, unit, reorder_level, created_at, updated_at
	`,
		iID,
		tID,
		cID,
		name,
		pgtype.Text{String: sku, Valid: sku != ""},
		pgtype.Text{String: unit, Valid: unit != ""},
		pgtype.Int4{Int32: reorder, Valid: true},
		pgtype.Text{String: desc, Valid: desc != ""},
	).Scan(
		&item.ID,
		&item.TenantID,
		&item.CategoryID,
		&item.Name,
		&item.Sku,
		&item.Description,
		&item.Unit,
		&item.ReorderLevel,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		return db.InventoryItem{}, fmt.Errorf("failed to update item: %w", err)
	}

	uID := pgtype.UUID{}
	uID.Scan(userID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		RequestID:    reqID,
		Action:       "inventory.update_item",
		ResourceType: "inventory_item",
		ResourceID:   item.ID,
		After:        item,
		IPAddress:    ip,
	})

	return item, nil
}

// Transaction Management

type StockTransactionParams struct {
	TenantID      string
	ItemID        string
	Type          string // 'in', 'out', 'adjustment'
	Quantity      int32
	UnitPrice     float64
	SupplierID    string
	Location      string
	ReferenceID   string
	ReferenceType string
	Remarks       string
	UserID        string
	RequestID     string
	IP            string
}

func (s *InventoryService) CreateTransaction(ctx context.Context, p StockTransactionParams) (db.InventoryTransaction, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	iID := pgtype.UUID{}
	iID.Scan(p.ItemID)
	uID := pgtype.UUID{}
	uID.Scan(p.UserID)

	sID := pgtype.UUID{}
	if p.SupplierID != "" {
		sID.Scan(p.SupplierID)
	}

	// 1. Create Transaction Record
	price := pgtype.Numeric{}
	price.Scan(fmt.Sprintf("%.2f", p.UnitPrice))

	refID := pgtype.UUID{}
	if p.ReferenceID != "" {
		refID.Scan(p.ReferenceID)
	}

	txn, err := s.q.CreateInventoryTransaction(ctx, db.CreateInventoryTransactionParams{
		TenantID:      tID,
		ItemID:        iID,
		Type:          p.Type,
		Quantity:      p.Quantity,
		UnitPrice:     price,
		SupplierID:    sID,
		ReferenceID:   refID,
		ReferenceType: pgtype.Text{String: p.ReferenceType, Valid: p.ReferenceType != ""},
		Remarks:       pgtype.Text{String: p.Remarks, Valid: p.Remarks != ""},
		CreatedBy:     uID,
	})
	if err != nil {
		return db.InventoryTransaction{}, fmt.Errorf("failed to create transaction: %w", err)
	}

	// 2. Update Stock Level
	// Calculate delta: 'in' adds, 'out' subtracts
	delta := p.Quantity
	if p.Type == "out" {
		// Check availability for OUT transactions
		stock, sErr := s.q.GetStock(ctx, db.GetStockParams{ItemID: iID, TenantID: tID})
		if sErr == nil && stock.Quantity < p.Quantity {
			return db.InventoryTransaction{}, fmt.Errorf("insufficient stock: available %d, requested %d", stock.Quantity, p.Quantity)
		}
		delta = -p.Quantity
	}

	// Default location if not provided
	location := p.Location
	if location == "" {
		location = "Main Store"
	}

	err = s.q.UpsertStock(ctx, db.UpsertStockParams{
		TenantID: tID,
		ItemID:   iID,
		Location: pgtype.Text{String: location, Valid: true},
		Quantity: delta,
	})
	if err != nil {
		return db.InventoryTransaction{}, fmt.Errorf("failed to update stock: %w", err)
	}

	// 3. Audit
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		RequestID:    p.RequestID,
		Action:       "STOCK_" + p.Type,
		ResourceType: "inventory_transaction",
		ResourceID:   txn.ID,
		After:        map[string]interface{}{"item_id": p.ItemID, "qty": delta},
		IPAddress:    p.IP,
	})

	return txn, nil
}

func (s *InventoryService) ListTransactions(ctx context.Context, tenantID string, limit, offset int32) ([]db.ListInventoryTransactionsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListInventoryTransactions(ctx, db.ListInventoryTransactionsParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}

// ==================== Purchase Orders ====================

type CreatePurchaseOrderParams struct {
	TenantID   string
	PONumber   string
	SupplierID string
	Notes      string
	UserID     string
	RequestID  string
	IP         string
}

func (s *InventoryService) CreatePurchaseOrder(ctx context.Context, p CreatePurchaseOrderParams) (db.PurchaseOrder, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	sID := pgtype.UUID{}
	if p.SupplierID != "" {
		sID.Scan(p.SupplierID)
	}
	uID := pgtype.UUID{}
	uID.Scan(p.UserID)

	po, err := s.q.CreatePurchaseOrder(ctx, db.CreatePurchaseOrderParams{
		TenantID:   tID,
		PoNumber:   p.PONumber,
		SupplierID: sID,
		Status:     "draft",
		Notes:      pgtype.Text{String: p.Notes, Valid: p.Notes != ""},
		CreatedBy:  uID,
	})
	if err != nil {
		return db.PurchaseOrder{}, err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		RequestID:    p.RequestID,
		Action:       "inventory.create_po",
		ResourceType: "purchase_order",
		ResourceID:   po.ID,
		After:        po,
		IPAddress:    p.IP,
	})

	return po, nil
}

func (s *InventoryService) ListPurchaseOrders(ctx context.Context, tenantID string, limit, offset int32) ([]db.ListPurchaseOrdersRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListPurchaseOrders(ctx, db.ListPurchaseOrdersParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}

func (s *InventoryService) ApprovePurchaseOrder(ctx context.Context, tenantID, poID, approverID, reqID, ip string) (db.PurchaseOrder, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	pID := pgtype.UUID{}
	pID.Scan(poID)
	aID := pgtype.UUID{}
	aID.Scan(approverID)

	po, err := s.q.UpdatePurchaseOrderStatus(ctx, db.UpdatePurchaseOrderStatusParams{
		ID:         pID,
		TenantID:   tID,
		Status:     "approved",
		ApprovedBy: aID,
	})
	if err != nil {
		return db.PurchaseOrder{}, err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       aID,
		RequestID:    reqID,
		Action:       "inventory.approve_po",
		ResourceType: "purchase_order",
		ResourceID:   po.ID,
		After:        po,
		IPAddress:    ip,
	})

	return po, nil
}

func (s *InventoryService) ReceivePurchaseOrder(ctx context.Context, tenantID, poID, receiverID, reqID, ip string) (db.PurchaseOrder, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	pID := pgtype.UUID{}
	pID.Scan(poID)
	uID := pgtype.UUID{}
	uID.Scan(receiverID)

	po, err := s.q.ReceivePurchaseOrder(ctx, db.ReceivePurchaseOrderParams{
		ID:       pID,
		TenantID: tID,
	})
	if err != nil {
		return db.PurchaseOrder{}, err
	}

	// Auto-create inventory transactions for received items
	items, _ := s.q.ListPurchaseOrderItems(ctx, pID)
	for _, item := range items {
		uPrice, _ := item.UnitPrice.Float64Value()
		s.CreateTransaction(ctx, StockTransactionParams{
			TenantID:      tenantID,
			ItemID:        item.ItemID.String(),
			Type:          "in",
			Quantity:      int32(item.Quantity),
			UnitPrice:     uPrice.Float64,
			ReferenceID:   poID,
			ReferenceType: "purchase_order",
			Remarks:       "Received from PO",
			UserID:        receiverID,
			RequestID:     reqID,
			IP:            ip,
		})
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		RequestID:    reqID,
		Action:       "inventory.receive_po",
		ResourceType: "purchase_order",
		ResourceID:   po.ID,
		After:        po,
		IPAddress:    ip,
	})

	return po, nil
}
