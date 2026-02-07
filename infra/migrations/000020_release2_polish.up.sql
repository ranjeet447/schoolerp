-- Library Digital Assets Migration

CREATE TABLE library_digital_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('pdf', 'epub', 'link', 'video')),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    file_size_bytes BIGINT,
    access_level TEXT NOT NULL DEFAULT 'all' CHECK (access_level IN ('all', 'staff', 'students', 'premium')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_library_digital_assets_book ON library_digital_assets(book_id);
CREATE INDEX idx_library_digital_assets_tenant ON library_digital_assets(tenant_id);

-- Inventory Procurement Tables

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    supplier_id UUID REFERENCES inventory_suppliers(id),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'received', 'cancelled')),
    total_amount DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, po_number)
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    received_quantity INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_order_items_po ON purchase_order_items(po_id);
