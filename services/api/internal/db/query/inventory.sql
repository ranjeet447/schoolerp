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
