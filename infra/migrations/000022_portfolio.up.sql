-- Portfolio & Multi-School Groups Migration

CREATE TABLE school_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE school_group_members (
    group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, tenant_id)
);

-- Indexes
CREATE INDEX idx_school_groups_owner ON school_groups(owner_user_id);
CREATE INDEX idx_school_group_members_group ON school_group_members(group_id);
