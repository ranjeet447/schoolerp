-- name: CreateInventoryCategory :one
INSERT INTO inventory_categories (
    tenant_id, name, type, description
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: ListInventoryCategories :many
SELECT * FROM inventory_categories
WHERE tenant_id = $1
ORDER BY name;

-- name: CreateSupplier :one
INSERT INTO inventory_suppliers (
    tenant_id, name, contact_person, phone, email, address
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: ListSuppliers :many
SELECT * FROM inventory_suppliers
WHERE tenant_id = $1
ORDER BY name;

-- name: CreateInventoryItem :one
INSERT INTO inventory_items (
    tenant_id, category_id, name, sku, unit, reorder_level, description
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: ListInventoryItems :many
SELECT 
    i.*,
    c.name as category_name,
    COALESCE(SUM(s.quantity), 0)::INTEGER as current_stock
FROM inventory_items i
LEFT JOIN inventory_categories c ON i.category_id = c.id
LEFT JOIN inventory_stocks s ON i.id = s.item_id
WHERE i.tenant_id = $1
GROUP BY i.id, c.name
ORDER BY i.name
LIMIT $2 OFFSET $3;

-- name: GetInventoryItem :one
SELECT * FROM inventory_items WHERE id = $1 AND tenant_id = $2;

-- name: UpsertStock :exec
INSERT INTO inventory_stocks (tenant_id, item_id, location, quantity)
VALUES ($1, $2, $3, $4)
ON CONFLICT (tenant_id, item_id, location) 
DO UPDATE SET 
    quantity = inventory_stocks.quantity + $4,
    updated_at = NOW();

-- name: GetStock :one
SELECT 
    item_id,
    tenant_id,
    COALESCE(SUM(quantity), 0)::INTEGER as quantity
FROM inventory_stocks
WHERE item_id = $1 AND tenant_id = $2
GROUP BY item_id, tenant_id;

-- name: CreateInventoryTransaction :one
INSERT INTO inventory_transactions (
    tenant_id, item_id, type, quantity, unit_price, supplier_id, reference_id, reference_type, remarks, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
) RETURNING *;

-- name: ListInventoryTransactions :many
SELECT 
    t.*,
    i.name as item_name,
    u.full_name as created_by_name
FROM inventory_transactions t
JOIN inventory_items i ON t.item_id = i.id
LEFT JOIN users u ON t.created_by = u.id
WHERE t.tenant_id = $1
ORDER BY t.created_at DESC
LIMIT $2 OFFSET $3;

-- ==================== Purchase Orders ====================

-- name: CreatePurchaseOrder :one
INSERT INTO purchase_orders (
    tenant_id, po_number, supplier_id, status, notes, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetPurchaseOrder :one
SELECT * FROM purchase_orders WHERE id = $1 AND tenant_id = $2;

-- name: ListPurchaseOrders :many
SELECT 
    po.*,
    s.name as supplier_name,
    u.full_name as created_by_name
FROM purchase_orders po
LEFT JOIN inventory_suppliers s ON po.supplier_id = s.id
LEFT JOIN users u ON po.created_by = u.id
WHERE po.tenant_id = $1
ORDER BY po.created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdatePurchaseOrderStatus :one
UPDATE purchase_orders
SET status = $3, approved_by = $4, approved_at = NOW(), updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: ReceivePurchaseOrder :one
UPDATE purchase_orders
SET status = 'received', received_at = NOW(), updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: CreatePurchaseOrderItem :one
INSERT INTO purchase_order_items (
    po_id, item_id, quantity, unit_price
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: ListPurchaseOrderItems :many
SELECT 
    poi.*,
    i.name as item_name,
    i.sku as item_sku
FROM purchase_order_items poi
JOIN inventory_items i ON poi.item_id = i.id
WHERE poi.po_id = $1
ORDER BY poi.created_at;

-- name: UpdatePOItemReceived :exec
UPDATE purchase_order_items
SET received_quantity = $2
WHERE id = $1;
