-- SchoolERP COMPREHENSIVE PLATFORM SEED
-- This script populates platform features for demo and testing purposes.

BEGIN;

-- 1. SEED PLATFORM PLANS
INSERT INTO platform_plans (id, code, name, description, price_monthly, price_yearly, modules, limits, feature_flags) VALUES
(
    '019c4d42-49ca-7e0a-b047-86336ebac7ae',
    'basic',
    'Basic Plan',
    'Essential features for small schools',
    2900,
    29000,
    '{"sis": true, "attendance": true, "fees": true}',
    '{"students": 200, "staff": 20, "storage_gb": 5}',
    '{"beta_reports": false}'
),
(
    '019c4d42-49ca-7e0a-b047-86336ebac7af',
    'pro',
    'Pro Plan',
    'Advanced tools for growing institutions',
    5900,
    59000,
    '{"sis": true, "attendance": true, "fees": true, "exams": true, "transport": true}',
    '{"students": 1000, "staff": 100, "storage_gb": 50}',
    '{"beta_reports": true, "ai_assistant": false}'
),
(
    '019c4d42-49ca-7e0a-b047-86336ebac7b0',
    'enterprise',
    'Enterprise Plan',
    'Full suite for large multi-campus schools',
    12900,
    129000,
    '{"sis": true, "attendance": true, "fees": true, "exams": true, "transport": true, "library": true, "inventory": true}',
    '{"students": 5000, "staff": 500, "storage_gb": 500}',
    '{"beta_reports": true, "ai_assistant": true}'
) ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    modules = EXCLUDED.modules,
    limits = EXCLUDED.limits,
    feature_flags = EXCLUDED.feature_flags;

-- 2. SEED TENANT SIGNUP REQUESTS
INSERT INTO tenant_signup_requests (id, school_name, contact_name, contact_email, phone, city, country, status) VALUES
(uuid_generate_v4(), 'Greenwood Academy', 'John Doe', 'john@greenwood.com', '+1234567890', 'London', 'UK', 'pending'),
(uuid_generate_v4(), 'St. Marys School', 'Jane Smith', 'jane@stmarys.edu', '+1987654321', 'Mumbai', 'India', 'pending'),
(uuid_generate_v4(), 'Oakwood High', 'Robert Brown', 'robert@oakwood.org', '+1122334455', 'New York', 'USA', 'approved')
ON CONFLICT DO NOTHING;

-- 3. SEED EXTRA TENANTS & SUBSCRIPTIONS
-- Note: 'demo' tenant is already created in seed_users.sql. Let's add subscriptions for it.
INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, trial_ends_at)
SELECT
    '019c4d42-49ca-7efe-b28e-6feeebc4cd13',
    id,
    'active',
    NOW() + INTERVAL '30 days'
FROM platform_plans WHERE code = 'pro'
ON CONFLICT (tenant_id) DO NOTHING;

-- 4. SEED SUPPORT TICKETS
INSERT INTO support_tickets (id, tenant_id, subject, priority, status, created_by) VALUES
(
    uuid_generate_v4(),
    '019c4d42-49ca-7efe-b28e-6feeebc4cd13',
    'Unable to upload student photos',
    'high',
    'open',
    '019c4d42-49ca-70b0-a772-e58913e13446'
),
(
    uuid_generate_v4(),
    '019c4d42-49ca-7efe-b28e-6feeebc4cd13',
    'Payment gateway integration failing',
    'critical',
    'in_progress',
    '019c4d42-49ca-70b0-a772-e58913e13446'
)
ON CONFLICT DO NOTHING;

-- 4.1 SEED TENANT ADD-ON ACTIVATION REQUESTS
INSERT INTO platform_action_approvals (
    id, action_type, target_tenant_id, payload, requested_by, approved_by, status, reason, approved_at, created_at
) VALUES
(
    uuid_generate_v4(),
    'tenant_addon_activation',
    '019c4d42-49ca-7efe-b28e-6feeebc4cd13',
    '{"addon_id":"ai_suite_v1","addon_name":"AI Suite (Practical AI)","reason":"Need AI teacher assistant for new term","settings":{"enable_teacher_copilot":true,"enable_parent_helpdesk":false},"requested_at":"2026-02-18T10:00:00Z"}'::jsonb,
    '019c4d42-49ca-767c-b3bd-b1a7faf5ad04',
    NULL,
    'pending',
    'Awaiting billing confirmation',
    NULL,
    NOW() - INTERVAL '2 days'
),
(
    uuid_generate_v4(),
    'tenant_addon_activation',
    '019c4d42-49ca-7efe-b28e-6feeebc4cd13',
    '{"addon_id":"payments_razorpay","addon_name":"Razorpay Payments","reason":"Online fee collection","billing_reference":"INV-ADDON-2026-001","settings":{"key_id":"rzp_live_demo","key_secret":"configured-via-vault"},"requested_at":"2026-02-15T08:00:00Z","approved_at":"2026-02-16T08:30:00Z","activated_at":"2026-02-16T09:00:00Z"}'::jsonb,
    '019c4d42-49ca-767c-b3bd-b1a7faf5ad04',
    '019c4d42-49ca-767c-b3bd-b1a7faf5ad04',
    'executed',
    'Activated after payment receipt',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '5 days'
)
ON CONFLICT DO NOTHING;

-- 5. SEED PLATFORM SETTINGS
INSERT INTO platform_settings (key, value) VALUES
('security.internal_mfa_policy', '{"enforce_for_internal_users": true}'),
('security.password_policy', '{"min_length": 10, "require_special": true, "max_age_days": 90}'),
('billing.tax_rules', '{"gst_rate": 18, "enabled_countries": ["India"]}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

COMMIT;
