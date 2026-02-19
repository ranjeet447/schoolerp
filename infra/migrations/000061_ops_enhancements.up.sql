-- 000061_ops_enhancements.up.sql

-- 1. Staff Task Master
CREATE TABLE staff_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Transport Fuel Tracking
CREATE TABLE transport_fuel_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES transport_vehicles(id) ON DELETE CASCADE,
    fill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    quantity DECIMAL(10, 2) NOT NULL, -- Liters/Gallons
    cost_per_unit DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    odometer_reading INTEGER,
    remarks TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inventory Requisitions (Internal Requests)
CREATE TABLE inventory_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department TEXT,
    purpose TEXT,
    items JSONB NOT NULL, -- Array of {item_id, quantity, unit}
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'issued', 'rejected')),
    approved_by UUID REFERENCES users(id),
    issued_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_staff_tasks_assigned ON staff_tasks(assigned_to, status);
CREATE INDEX idx_staff_tasks_tenant ON staff_tasks(tenant_id);
CREATE INDEX idx_fuel_logs_vehicle ON transport_fuel_logs(vehicle_id, fill_date);
CREATE INDEX idx_inv_req_status ON inventory_requisitions(tenant_id, status);
