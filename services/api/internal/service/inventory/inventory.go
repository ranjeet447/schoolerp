package inventory

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type InventoryService struct {
	q     db.Querier
	audit *audit.Logger
}

func NewInventoryService(q db.Querier, audit *audit.Logger) *InventoryService {
	return &InventoryService{
		q:     q,
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

	return cat, nil
}

func (s *InventoryService) ListCategories(ctx context.Context, tenantID string) ([]db.InventoryCategory, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListInventoryCategories(ctx, tID)
}

// Supplier Management

func (s *InventoryService) CreateSupplier(ctx context.Context, tenantID, name, contact, phone, email, address string) (db.InventorySupplier, error) {
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

	return supplier, nil
}

func (s *InventoryService) ListSuppliers(ctx context.Context, tenantID string) ([]db.InventorySupplier, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListSuppliers(ctx, tID)
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

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       pgtype.UUID{}, // TODO: parse userID
		RequestID:    reqID,
		Action:       "CREATE_ITEM",
		ResourceType: "inventory_item",
		ResourceID:   item.ID,
		After:        map[string]interface{}{"name": name, "sku": sku},
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
	txn, err := s.q.CreateInventoryTransaction(ctx, db.CreateInventoryTransactionParams{
		TenantID:      tID,
		ItemID:        iID,
		Type:          p.Type,
		Quantity:      p.Quantity,
		UnitPrice:     pgtype.Numeric{Int: nil, Valid: false}, // TODO: Handle numeric
		SupplierID:    sID,
		ReferenceID:   pgtype.UUID{}, // TODO: Handle ref ID
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
