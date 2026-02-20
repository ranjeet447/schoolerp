-- SchoolERP Comprehensive Data Hydration (v7)
-- A unified script to seed ALL modules with premium, consistent test data.
-- USES UUID v7 for all primary keys.

BEGIN;

-- ============================================
-- 0. CLEANUP (Standard Table Reset)
-- ============================================
TRUNCATE 
    tenants, users, roles, permissions, academic_years, classes, class_sections, subjects,
    students, guardians, employees, salary_structures, fee_heads, fee_plans,
    exams, transport_vehicles, transport_routes, inventory_categories, 
    library_categories, admission_enquiries, chat_rooms, hostel_buildings,
    ai_knowledge_base, support_tickets, platform_plans
CASCADE;

-- ============================================
-- 1. CORE SAAS & INFRASTRUCTURE
-- ============================================

-- 1.1 Tenants & Branches
INSERT INTO tenants (id, name, subdomain, is_active) 
VALUES ('019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Elite International School', 'elite', TRUE)
ON CONFLICT (subdomain) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO branches (id, tenant_id, name, code, is_active)
VALUES ('019c4d42-49ca-7e0a-b047-86336ebac7ae', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Main Campus', 'MAIN', TRUE)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- 1.1.1 School Profile (Board Selection)
INSERT INTO school_profiles (tenant_id, school_name, affiliation_board, affiliation_number, city, state)
VALUES ('019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Elite International School', 'CBSE', '1234567', 'New Delhi', 'Delhi')
ON CONFLICT (tenant_id) DO NOTHING;

-- 1.2 Identities & SaaS Admin
INSERT INTO users (id, email, phone, full_name, is_active)
VALUES ('019c4d42-49ca-767c-b3bd-b1a7faf5ad04', 'saas_admin@schoolerp.com', '+919999999999', 'SaaS Platform Admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Password: password123
INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES ('019c4d42-49ca-7593-ad83-721b9b43bc23', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04', 'password', 'saas_admin@schoolerp.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
ON CONFLICT (id) DO NOTHING;

-- 1.3 RBAC: Permissions
-- 1.3 RBAC: Permissions (Standardized 8-action matrix per module)
INSERT INTO permissions (id, code, module, description) VALUES
-- SIS (Student Information System)
('019c4d42-7db1-7001-9293-000000000001', 'sis:view', 'sis', 'View student profiles and records'),
('019c4d42-7db1-7001-9293-000000000002', 'sis:create', 'sis', 'Register new students'),
('019c4d42-7db1-7001-9293-000000000003', 'sis:edit', 'sis', 'Modify student details'),
('019c4d42-7db1-7001-9293-000000000004', 'sis:delete', 'sis', 'Remove student records'),
('019c4d42-7db1-7001-9293-000000000005', 'sis:approve', 'sis', 'Approve student registrations/changes'),
('019c4d42-7db1-7001-9293-000000000006', 'sis:export', 'sis', 'Export student data to CSV/Excel'),
('019c4d42-7db1-7001-9293-000000000007', 'sis:print', 'sis', 'Print ID cards and profiles'),
('019c4d42-7db1-7001-9293-000000000008', 'sis:override', 'sis', 'Override student status/constraints'),

-- FEES (Finance & Fee Management)
('019c4d42-7db1-7002-9293-000000000001', 'fees:view', 'fees', 'View fee structures and payments'),
('019c4d42-7db1-7002-9293-000000000002', 'fees:create', 'fees', 'Generate fee invoices/heads'),
('019c4d42-7db1-7002-9293-000000000003', 'fees:edit', 'fees', 'Modify fee structures'),
('019c4d42-7db1-7002-9293-000000000004', 'fees:delete', 'fees', 'Void/Delete fee records'),
('019c4d42-7db1-7002-9293-000000000005', 'fees:approve', 'fees', 'Approve concessions/waivers'),
('019c4d42-7db1-7002-9293-000000000006', 'fees:export', 'fees', 'Export collection reports'),
('019c4d42-7db1-7002-9293-000000000007', 'fees:print', 'fees', 'Print fee receipts'),
('019c4d42-7db1-7002-9293-000000000008', 'fees:override', 'fees', 'Override late fees/dues'),

-- ATTENDANCE (Student & Staff)
('019c4d42-7db1-7003-9293-000000000001', 'attendance:view', 'attendance', 'View attendance reports'),
('019c4d42-7db1-7003-9293-000000000002', 'attendance:create', 'attendance', 'Mark daily/period attendance'),
('019c4d42-7db1-7003-9293-000000000003', 'attendance:edit', 'attendance', 'Modify attendance entries'),
('019c4d42-7db1-7003-9293-000000000004', 'attendance:delete', 'attendance', 'Remove attendance records'),
('019c4d42-7db1-7003-9293-000000000005', 'attendance:approve', 'attendance', 'Approve leave requests'),
('019c4d42-7db1-7003-9293-000000000006', 'attendance:export', 'attendance', 'Export attendance registers'),
('019c4d42-7db1-7003-9293-000000000007', 'attendance:print', 'attendance', 'Print attendance sheets'),
('019c4d42-7db1-7003-9293-000000000008', 'attendance:override', 'attendance', 'Override attendance status'),

-- ACADEMICS (Timetable & Homework)
('019c4d42-7db1-7004-9293-000000000001', 'academics:view', 'academics', 'View timetable and homework'),
('019c4d42-7db1-7004-9293-000000000002', 'academics:create', 'academics', 'Assign homework/create timetable'),
('019c4d42-7db1-7004-9293-000000000003', 'academics:edit', 'academics', 'Modify academic schedules'),
('019c4d42-7db1-7004-9293-000000000004', 'academics:delete', 'academics', 'Delete academic records'),
('019c4d42-7db1-7004-9293-000000000005', 'academics:approve', 'academics', 'Approve timetable changes'),
('019c4d42-7db1-7004-9293-000000000006', 'academics:export', 'academics', 'Export academic data'),
('019c4d42-7db1-7004-9293-000000000007', 'academics:print', 'academics', 'Print timetables'),
('019c4d42-7db1-7004-9293-000000000008', 'academics:override', 'academics', 'Override class assignments'),

-- EXAMS (Examinations & Marks)
('019c4d42-7db1-7005-9293-000000000001', 'exams:view', 'exams', 'View exam schedules and results'),
('019c4d42-7db1-7005-9293-000000000002', 'exams:create', 'exams', 'Create exams and enter marks'),
('019c4d42-7db1-7005-9293-000000000003', 'exams:edit', 'exams', 'Modify exam details/marks'),
('019c4d42-7db1-7005-9293-000000000004', 'exams:delete', 'exams', 'Remove exam records'),
('019c4d42-7db1-7005-9293-000000000005', 'exams:approve', 'exams', 'Approve/Publish results'),
('019c4d42-7db1-7005-9293-000000000006', 'exams:export', 'exams', 'Export marksheets'),
('019c4d42-7db1-7005-9293-000000000007', 'exams:print', 'exams', 'Print report cards'),
('019c4d42-7db1-7005-9293-000000000008', 'exams:override', 'exams', 'Override marks/grading'),

-- HRMS (Employees & Payroll)
('019c4d42-7db1-7006-9293-000000000001', 'hrms:view', 'hrms', 'View employee records'),
('019c4d42-7db1-7006-9293-000000000002', 'hrms:create', 'hrms', 'Hire/Register employees'),
('019c4d42-7db1-7006-9293-000000000003', 'hrms:edit', 'hrms', 'Modify employee details'),
('019c4d42-7db1-7006-9293-000000000004', 'hrms:delete', 'hrms', 'Terminate/Remove employees'),
('019c4d42-7db1-7006-9293-000000000005', 'hrms:approve', 'hrms', 'Approve payroll/salaries'),
('019c4d42-7db1-7006-9293-000000000006', 'hrms:export', 'hrms', 'Export employee data'),
('019c4d42-7db1-7006-9293-000000000007', 'hrms:print', 'hrms', 'Print payslips'),
('019c4d42-7db1-7006-9293-000000000008', 'hrms:override', 'hrms', 'Override salary structures'),

-- OPERATIONS (Inventory, Transport, Library, Admissions)
('019c4d42-7db1-7007-9293-000000000001', 'ops:view', 'ops', 'View operational dashboards'),
('019c4d42-7db1-7007-9293-000000000002', 'ops:create', 'ops', 'Create operational records'),
('019c4d42-7db1-7007-9293-000000000003', 'ops:edit', 'ops', 'Modify operational logs'),
('019c4d42-7db1-7007-9293-000000000004', 'ops:delete', 'ops', 'Delete operational data'),
('019c4d42-7db1-7007-9293-000000000005', 'ops:approve', 'ops', 'Approve requisitions/applications'),
('019c4d42-7db1-7007-9293-000000000006', 'ops:export', 'ops', 'Export system logs'),
('019c4d42-7db1-7007-9293-000000000007', 'ops:print', 'ops', 'Print manifestos/forms'),
('019c4d42-7db1-7007-9293-000000000008', 'ops:override', 'ops', 'Override operational status'),

-- API Guard Permissions (tenant + platform routes)
('019c4d42-49ca-7014-aa9e-8bfa1146bf92', 'tenant:roles:manage', 'tenant', 'Manage tenant role templates and role assignments'),
('019c4d42-49ca-702a-a320-8adfcc2c17b5', 'tenant:users:manage', 'tenant', 'Manage tenant users and user role assignments'),
('019c4d42-49ca-7039-b94f-6bf746a217b7', 'platform:tenant.read', 'platform', 'View platform tenant directory and tenant profiles'),
('019c4d42-49ca-7045-bb74-ae7506f32297', 'platform:tenant.write', 'platform', 'Create and update platform tenant records'),
('019c4d42-49ca-7049-a63d-bdeb942bed3f', 'platform:user.read', 'platform', 'View platform internal and global users'),
('019c4d42-49ca-704e-bcb1-225b46efa565', 'platform:user.write', 'platform', 'Create and update platform internal and global users'),
('019c4d42-49ca-7060-918f-bf3a0d9c6fa0', 'platform:settings.write', 'platform', 'Manage platform settings and policy configuration'),
('019c4d42-49ca-72e7-b058-79b23fd17845', 'platform:settings.read', 'platform', 'View platform settings and policy configuration'),
('019c4d42-49ca-7063-a0e4-74582561e0f4', 'platform:ops.manage', 'platform', 'Run platform operational actions and workflows'),
('019c4d42-49ca-706b-ac25-131606823164', 'platform:audit.read', 'platform', 'View platform audit logs'),
('019c4d42-49ca-7098-a841-37ec6fbd5839', 'platform:billing.read', 'platform', 'View platform billing and invoicing data'),
('019c4d42-49ca-70a7-994c-fc86e052d584', 'platform:billing.write', 'platform', 'Manage platform billing, invoice states, and adjustments'),
('019c4d42-49ca-70b0-a772-e58913e13446', 'platform:marketing.write', 'platform', 'Manage platform announcements and marketing assets'),
('019c4d42-49ca-70c3-ba09-5e3eb6628bf9', 'platform:analytics.read', 'platform', 'View platform analytics and KPI dashboards'),
('019c4d42-49ca-70c4-bf13-9b0b0f95aa10', 'platform:addons.read', 'platform', 'View tenant add-ons and activation requests'),
('019c4d42-49ca-70c4-bf13-9b0b0f95aa11', 'platform:addons.write', 'platform', 'Configure tenant add-ons and process activation requests'),
('019c4d42-49ca-7319-9ad6-e9491c672bd3', 'platform:support.write', 'platform', 'Manage platform support tickets and assignments'),
('019c4d42-49ca-7351-a604-7d7bc4b46f54', 'platform:incidents.write', 'platform', 'Create and update platform incidents'),
('019c4d42-49ca-737c-afbc-d2876c90dbe0', 'platform:integrations.manage', 'platform', 'Manage platform integrations and webhook settings'),
('019c4d42-49ca-73a0-b215-438eecc42a9c', 'platform:dev.manage', 'platform', 'Manage developer and engineering platform controls'),
('019c4d42-49ca-741e-b5c1-4f62864d5098', 'platform:data.export', 'platform', 'Export platform-wide operational and billing data'),

-- Legacy Compatibility Permissions (existing web/app codepaths)
('019c4d42-49ca-70c5-942f-3e1e78b62a71', 'attendance:read', 'attendance', 'Legacy read access for attendance module'),
('019c4d42-49ca-70c7-8ca1-7e791d34e329', 'attendance:write', 'attendance', 'Legacy write access for attendance module'),
('019c4d42-49ca-710f-beb2-e5b54252bef3', 'dashboard:view', 'dashboard', 'View operational dashboard widgets'),
('019c4d42-49ca-7114-8749-9c4dc7454336', 'exams:read', 'exams', 'Legacy read access for exams module'),
('019c4d42-49ca-7115-b3f3-23aa625928b0', 'exams:write', 'exams', 'Legacy write access for exams module'),
('019c4d42-49ca-713d-bee9-7b37cdaf5080', 'fees:collect', 'fees', 'Collect and post fee payments'),
('019c4d42-49ca-7146-ac8c-252b07a062a7', 'fees:read', 'fees', 'Legacy read access for fees module'),
('019c4d42-49ca-7178-b027-e1b10b586738', 'fees:write', 'fees', 'Legacy write access for fees module'),
('019c4d42-49ca-7198-929d-c7e6604e25b1', 'finance:read', 'finance', 'Legacy read access for finance module'),
('019c4d42-49ca-719c-b00e-16f67bd33099', 'finance:write', 'finance', 'Legacy write access for finance module'),
('019c4d42-49ca-71b6-a4a7-2981fea25b77', 'notices:read', 'notices', 'Legacy read access for notices module'),
('019c4d42-49ca-71ea-b9d2-65468799f363', 'platform:incidents.read', 'incidents', 'View platform incidents'),
('019c4d42-49ca-7209-ab73-83436b90eca6', 'platform:integrations.read', 'integrations', 'View integration status and logs'),
('019c4d42-49ca-720a-944a-67279de40fb5', 'platform:monitoring.read', 'monitoring', 'View runtime health and monitoring metrics'),
('019c4d42-49ca-7219-accb-fa8499f18482', 'platform:plans.read', 'plans', 'View platform plans'),
('019c4d42-49ca-721b-b78d-c5c57ae318a3', 'platform:security.read', 'security', 'View platform security events'),
('019c4d42-49ca-7238-a669-4f57c4bb51ee', 'platform:security.write', 'security', 'Manage platform security controls'),
('019c4d42-49ca-723c-b274-f345b99eb12a', 'platform:support.read', 'support', 'View support tickets'),
('019c4d42-49ca-7265-b0fd-d47021531970', 'platform:tenants.read', 'tenants', 'Legacy read access for platform tenant listing'),
('019c4d42-49ca-7279-8903-5dd40619d787', 'platform:tenants.write', 'tenants', 'Legacy write access for platform tenant management'),
('019c4d42-49ca-7279-8a35-f9cc8b166be8', 'sis:read', 'sis', 'Legacy read access for SIS module'),
('019c4d42-49ca-7286-960f-28249030388a', 'sis:write', 'sis', 'Legacy write access for SIS module'),
('019c4d42-49ca-72b7-a1d6-779b799bb55b', 'tenant:settings:view', 'tenant', 'View tenant-level settings'),
('019c4d42-49ca-72b7-a1d6-779b799bb55c', 'tenant:addons.read', 'tenant', 'View tenant add-ons and activation status'),
('019c4d42-49ca-72b7-a1d6-779b799bb55d', 'tenant:addons.request', 'tenant', 'Create tenant add-on activation requests'),
('019c4d42-49ca-72b7-a1d6-779b799bb55e', 'tenant:addons.configure', 'tenant', 'Configure active tenant add-ons'),

-- PLATFORM
('019c4d42-7db1-7999-9293-000000000001', 'platform:manage', 'platform', 'Full platform administrative control')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

-- 1.4 RBAC: System Roles
INSERT INTO roles (id, name, code, description, is_system) VALUES
('019c4d42-49ca-7166-9de9-5e97220dc819', 'Super Admin', 'super_admin', 'Platform wide access', TRUE),
('019c4d42-49ca-773d-aea7-34deb37577e1', 'Tenant Admin', 'tenant_admin', 'School owner/administrator', TRUE),
('019c4d42-49ca-761c-aaf8-24e6628c030a', 'Teacher', 'teacher', 'Academic staff', TRUE),
('019c4d42-49ca-7f83-b4a1-7408a5b65f0e', 'Accountant', 'accountant', 'Finance and fee collector', TRUE),
('019c4d42-c25e-7044-904d-b227be5c819c', 'Librarian', 'librarian', 'Library management', TRUE),
('019c4d42-c25e-7740-9510-d5d3df33368a', 'Transport Manager', 'transport_manager', 'Fleet management', TRUE),
('019c4d42-49ca-7424-a373-949ee91ffd5e', 'Support L1', 'support_l1', 'Tier-1 customer support', TRUE),
('019c4d42-49ca-7442-b328-d20c9de8a543', 'Support L2', 'support_l2', 'Tier-2 technical support', TRUE),
('019c4d42-49ca-744e-8547-8071d51aef0d', 'Platform Finance', 'finance', 'Platform billing and finance operations', TRUE),
('019c4d42-49ca-7487-add7-2b540152adc1', 'Platform Operations', 'ops', 'Platform operations and incident response', TRUE),
('019c4d42-49ca-74c5-9df6-f06433ec0235', 'Platform Developer', 'developer', 'Platform engineering and integration maintenance', TRUE)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- 1.5 Role-Permission Mapping

-- Super Admin: Everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-49ca-7166-9de9-5e97220dc819', id FROM permissions
ON CONFLICT DO NOTHING;

-- Tenant Admin: All but Platform Management
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-49ca-773d-aea7-34deb37577e1', id FROM permissions WHERE module != 'platform'
ON CONFLICT DO NOTHING;

-- Teacher: Academic + SIS View + Attendance Mark + Exam Marks Entry
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-49ca-761c-aaf8-24e6628c030a', id FROM permissions 
WHERE module IN ('sis', 'attendance', 'academics', 'exams')
AND code IN (
    'sis:view', 'sis:print',
    'attendance:view', 'attendance:create', 'attendance:edit',
    'academics:view', 'academics:create', 'academics:edit',
    'exams:view', 'exams:create', 'exams:edit'
)
ON CONFLICT DO NOTHING;

-- Accountant: Fees + SIS View + Finance reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-49ca-7f83-b4a1-7408a5b65f0e', id FROM permissions 
WHERE module IN ('sis', 'fees', 'ops')
AND (
    code LIKE 'fees:%' OR 
    code = 'sis:view' OR 
    (module = 'ops' AND code IN ('ops:view', 'ops:export', 'ops:print'))
)
ON CONFLICT DO NOTHING;

-- Librarian: Operations (Library) + SIS View
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-c25e-7044-904d-b227be5c819c', id FROM permissions 
WHERE (module = 'ops' AND code IN ('ops:view', 'ops:create', 'ops:edit')) OR code = 'sis:view'
ON CONFLICT DO NOTHING;

-- Transport Manager: Operations (Transport) + SIS View
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-c25e-7740-9510-d5d3df33368a', id FROM permissions 
WHERE (module = 'ops' AND code IN ('ops:view', 'ops:create', 'ops:edit')) OR code = 'sis:view'
ON CONFLICT DO NOTHING;

-- Support L1: Read-only platform support posture
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-49ca-7424-a373-949ee91ffd5e', id
FROM permissions
WHERE code IN (
  'platform:support.read',
  'platform:settings.read',
  'platform:incidents.read',
  'platform:user.read',
  'platform:tenant.read',
  'platform:tenants.read',
  'platform:audit.read'
)
ON CONFLICT DO NOTHING;

-- Support L2: Elevated troubleshooting access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-49ca-7442-b328-d20c9de8a543', id
FROM permissions
WHERE code IN (
  'platform:support.read',
  'platform:support.write',
  'platform:settings.read',
  'platform:incidents.read',
  'platform:incidents.write',
  'platform:user.read',
  'platform:tenant.read',
  'platform:tenants.read',
  'platform:audit.read',
  'platform:security.read',
  'platform:integrations.read',
  'platform:addons.read',
  'platform:monitoring.read',
  'platform:ops.manage'
)
ON CONFLICT DO NOTHING;

-- Platform Finance: Billing-focused platform access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-49ca-744e-8547-8071d51aef0d', id
FROM permissions
WHERE code IN (
  'platform:billing.read',
  'platform:billing.write',
  'platform:plans.read',
  'platform:tenant.read',
  'platform:tenants.read',
  'platform:analytics.read',
  'platform:addons.read',
  'platform:audit.read',
  'platform:data.export'
)
ON CONFLICT DO NOTHING;

-- Platform Operations: Operations and reliability controls
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-49ca-7487-add7-2b540152adc1', id
FROM permissions
WHERE code IN (
  'platform:ops.manage',
  'platform:incidents.read',
  'platform:incidents.write',
  'platform:support.read',
  'platform:support.write',
  'platform:monitoring.read',
  'platform:integrations.read',
  'platform:integrations.manage',
  'platform:addons.read',
  'platform:addons.write',
  'platform:security.read',
  'platform:security.write',
  'platform:settings.read',
  'platform:settings.write',
  'platform:tenant.write',
  'platform:tenant.read',
  'platform:tenants.read',
  'platform:audit.read'
)
ON CONFLICT DO NOTHING;

-- Platform Developer: Integration, telemetry, and diagnostics
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-49ca-74c5-9df6-f06433ec0235', id
FROM permissions
WHERE code IN (
  'platform:integrations.read',
  'platform:integrations.manage',
  'platform:addons.read',
  'platform:addons.write',
  'platform:monitoring.read',
  'platform:security.read',
  'platform:analytics.read',
  'platform:audit.read',
  'platform:settings.read',
  'platform:user.read',
  'platform:user.write',
  'platform:tenant.read',
  'platform:tenants.read',
  'platform:ops.manage',
  'platform:dev.manage',
  'platform:data.export'
)
ON CONFLICT DO NOTHING;

-- Coverage baseline: ensure seeded system roles have full permission catalog.
-- Route access is still constrained by RoleGuard in handlers.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON TRUE
WHERE r.code IN ('super_admin', 'tenant_admin', 'teacher', 'accountant', 'librarian', 'transport_manager')
ON CONFLICT DO NOTHING;

-- 1.6 SaaS Admin Assignment
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type)
VALUES ('019c4d42-49ca-73e1-be64-56377f64b05b', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04', '019c4d42-49ca-7166-9de9-5e97220dc819', 'platform')
ON CONFLICT (id) DO NOTHING;

-- 1.6.1 Platform Internal Team (Support/Ops/Dev/Finance)
INSERT INTO users (id, email, phone, full_name, is_active) VALUES
('019c4d42-49ca-74c9-aa04-092b4993294a', 'support.l1@schoolerp.com', '+919999999991', 'Platform Support L1', TRUE),
('019c4d42-49ca-74cf-ad4c-647cbcf6c99b', 'support.l2@schoolerp.com', '+919999999992', 'Platform Support L2', TRUE),
('019c4d42-49ca-74d9-9685-82b69a77317c', 'finance.ops@schoolerp.com', '+919999999993', 'Platform Finance Ops', TRUE),
('019c4d42-49ca-7507-b554-f5178da92389', 'operations@schoolerp.com', '+919999999994', 'Platform Operations', TRUE),
('019c4d42-49ca-7513-8904-1716d6bcef88', 'developer@schoolerp.com', '+919999999995', 'Platform Developer', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential) VALUES
('019c4d42-49ca-7520-a8c4-7257e1f8c3c3', '019c4d42-49ca-74c9-aa04-092b4993294a', 'password', 'support.l1@schoolerp.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('019c4d42-49ca-7542-82a9-bdea6bfa0af5', '019c4d42-49ca-74cf-ad4c-647cbcf6c99b', 'password', 'support.l2@schoolerp.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('019c4d42-49ca-757b-ab3b-5542bbf2f1ce', '019c4d42-49ca-74d9-9685-82b69a77317c', 'password', 'finance.ops@schoolerp.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('019c4d42-49ca-7592-aa61-43ae3f990aaf', '019c4d42-49ca-7507-b554-f5178da92389', 'password', 'operations@schoolerp.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('019c4d42-49ca-75a6-9a38-68270548a850', '019c4d42-49ca-7513-8904-1716d6bcef88', 'password', 'developer@schoolerp.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
ON CONFLICT (provider, identifier) DO NOTHING;

INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type) VALUES
('019c4d42-49ca-75c5-975f-8aa93bb9c684', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-74c9-aa04-092b4993294a', '019c4d42-49ca-7424-a373-949ee91ffd5e', 'platform'),
('019c4d42-49ca-75de-b5cd-f4a815bbff64', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-74cf-ad4c-647cbcf6c99b', '019c4d42-49ca-7442-b328-d20c9de8a543', 'platform'),
('019c4d42-49ca-75f9-8416-f6f78dcd0079', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-74d9-9685-82b69a77317c', '019c4d42-49ca-744e-8547-8071d51aef0d', 'platform'),
('019c4d42-49ca-7604-b846-8cd7075ae7e1', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-7507-b554-f5178da92389', '019c4d42-49ca-7487-add7-2b540152adc1', 'platform'),
('019c4d42-49ca-761f-a786-ed9fe44ea72c', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-7513-8904-1716d6bcef88', '019c4d42-49ca-74c5-9df6-f06433ec0235', 'platform')
ON CONFLICT DO NOTHING;

-- 1.7 Standard Test Users (Tenant: Elite International)
-- Email pattern: role@elite.com | Password: password123

INSERT INTO users (id, email, phone, full_name, is_active) VALUES
('019c4d42-c25e-7705-9656-3ef7b9b095fb', 'admin@elite.com', '+919000000001', 'School Administrator', TRUE),
('019c4d42-c25e-71c0-b844-a502ab4e9681', 'teacher@elite.com', '+919000000002', 'Mahesh Kumar', TRUE),
('019c4d42-c25e-7418-a639-ee18da899f0b', 'accountant@elite.com', '+919000000003', 'Ritu Goyal', TRUE),
('019c4d42-c25e-7181-a523-7d89c9f07801', 'librarian@elite.com', '+919000000004', 'Suresh Raina', TRUE),
('019c4d42-c25e-7153-8190-8a86cb77a3c2', 'transport@elite.com', '+919000000005', 'Vikram Rathore', TRUE),
('019c4d42-c25e-7b45-9ad9-840d567925ba', 'parent@elite.com', '+919000000006', 'Rajesh Sharma', TRUE),
('019c4d42-c25e-7c7e-b9db-49efdd887bbd', 'student@elite.com', '+919000000007', 'Arjun Sharma', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Passwords (using same hash for all: password123)
-- Hash: ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
INSERT INTO user_identities (id, user_id, provider, identifier, credential) VALUES
('019c4d42-c25e-7e3b-8af6-3cf8d5dba555', '019c4d42-c25e-7705-9656-3ef7b9b095fb', 'password', 'admin@elite.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('019c4d42-c25e-76b7-9d17-42375f43314e', '019c4d42-c25e-71c0-b844-a502ab4e9681', 'password', 'teacher@elite.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('019c4d42-c25e-7304-b911-61db74a78cfc', '019c4d42-c25e-7418-a639-ee18da899f0b', 'password', 'accountant@elite.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('019c4d42-c25e-7413-94fb-b2073f91e8d7', '019c4d42-c25e-7181-a523-7d89c9f07801', 'password', 'librarian@elite.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('019c4d42-c25e-78e4-9d62-5b0302b6658d', '019c4d42-c25e-7153-8190-8a86cb77a3c2', 'password', 'transport@elite.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('019c4d42-c25e-7016-bb6d-51ad2653a310', '019c4d42-c25e-7b45-9ad9-840d567925ba', 'password', 'parent@elite.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('019c4d42-c25e-7ed2-936f-3d548e418062', '019c4d42-c25e-7c7e-b9db-49efdd887bbd', 'password', 'student@elite.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
ON CONFLICT (id) DO NOTHING;

-- Assign Roles
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type) VALUES
('019c4d42-c25e-77c9-84cb-f90fb83bb25b', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-c25e-7705-9656-3ef7b9b095fb', '019c4d42-49ca-773d-aea7-34deb37577e1', 'tenant'), -- Admin
('019c4d42-c25e-70d8-b3ff-96f706bf7530', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-c25e-71c0-b844-a502ab4e9681', '019c4d42-49ca-761c-aaf8-24e6628c030a', 'tenant'), -- Teacher
('019c4d42-c25e-709c-913b-30f2d361c4a4', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-c25e-7418-a639-ee18da899f0b', '019c4d42-49ca-7f83-b4a1-7408a5b65f0e', 'tenant'), -- Accountant
('019c4d42-c25e-70ad-b110-d47a40176bb2', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-c25e-7181-a523-7d89c9f07801', '019c4d42-c25e-7044-904d-b227be5c819c', 'tenant'), -- Librarian
('019c4d42-c25e-76c9-935f-8559b9863e73', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-c25e-7153-8190-8a86cb77a3c2', '019c4d42-c25e-7740-9510-d5d3df33368a', 'tenant')  -- Transport Manager
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. ACADEMIC STRUCTURE
-- ============================================

-- 2.1 Academic Years
INSERT INTO academic_years (id, tenant_id, name, start_date, end_date, is_active) VALUES
('019c4d42-49ca-7ec3-a3fc-de2bd942e1e6', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '2025-26', '2025-04-01', '2026-03-31', TRUE),
('019c4d42-c260-719d-bd5f-8f843af60012', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '2024-25', '2024-04-01', '2025-03-31', FALSE)
ON CONFLICT DO NOTHING;

-- 2.2 Classes (Varied Levels)
INSERT INTO classes (id, tenant_id, name, level) VALUES
('019c4d42-49ca-7347-8508-f9d57d70bbf6', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Grade 10', 10),
('019c4d42-49ca-7fb5-899f-edf278ae8217', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Grade 11', 11),
('019c4d42-c25e-7998-8693-e073a4c8e630', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Grade 1', 1),
('019c4d42-c25e-74f5-b632-c5ee09c28b05', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Grade 5', 5),
('019c4d42-c25e-7a73-a4a7-dd3fff4fab38', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Grade 12', 12)
ON CONFLICT DO NOTHING;

-- 2.3 class_sections (Including 2024 History)
INSERT INTO class_sections (id, tenant_id, class_id, name, capacity) VALUES
-- 2025 Sections
('019c4d42-49ca-71a1-bf87-9053f8107881', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-7347-8508-f9d57d70bbf6', 'A', 40),
('019c4d42-49ca-7a68-9970-6880bbb05a78', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-7347-8508-f9d57d70bbf6', 'B', 40),
('019c4d42-c25e-7d9d-8414-845160b96a59', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-c25e-7998-8693-e073a4c8e630', 'A', 30),
('019c4d42-c25e-7460-9b38-150565e0e262', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-c25e-74f5-b632-c5ee09c28b05', 'A', 35),
-- 2024 Sections (Historical)
('019c4d42-c260-7bf5-b817-ab2d15818d1d', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-7347-8508-f9d57d70bbf6', 'A-2024', 40),
('019c4d42-c260-74da-b160-0c0bbfde23a6', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-7347-8508-f9d57d70bbf6', 'A-2024-Extra', 35)
ON CONFLICT DO NOTHING;

-- 2.4 Subjects (Detailed List)
INSERT INTO subjects (id, tenant_id, name, code, type) VALUES
('019c4d42-49ca-7c0b-a93a-98359014061f', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Mathematics', 'MATH10', 'theory'),
('019c4d42-49ca-73fa-9adc-56a8440aa164', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Physics', 'PHYS10', 'theory'),
('019c4d42-49ca-75ec-9b4e-7f0f4f31e948', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Chemistry Lab', 'CHM10L', 'practical'),
('019c4d42-c264-706a-b28a-abcdef123456', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Biology', 'BIO10', 'theory'),
('019c4d42-c264-71f2-8b74-123456789abc', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'History', 'HIST10', 'theory'),
('019c4d42-c265-70e2-95fe-8c973177503a', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Geography', 'GEO10', 'theory'),
('019c4d42-c265-7131-bbf9-77ffa4afe019', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Hindi', 'HIN10', 'theory'),
('019c4d42-c265-7e2c-9af2-52b83405975a', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Computer Science', 'CS10', 'theory')
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. SIS (Students & Guardians)
-- ============================================

-- 3.1 Students (Massive Expansion + Mixed Profiles)
INSERT INTO students (id, tenant_id, admission_number, roll_number, full_name, section_id, status) VALUES
-- Grade 10-A Active
('019c4d42-49ca-794f-b77f-68b3b291152c', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025001', '101', 'Arjun Sharma', '019c4d42-49ca-71a1-bf87-9053f8107881', 'active'),
('019c4d42-49ca-7d7d-8d5b-dd8f34b5d0af', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025002', '102', 'Sanya Iyer', '019c4d42-49ca-71a1-bf87-9053f8107881', 'active'),
('019c4d42-c260-784b-b5f9-a0a6b03c773d', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2024001', '301', 'Vikram Aditya', '019c4d42-49ca-71a1-bf87-9053f8107881', 'active'),
('019c4d42-c25e-7147-93d2-d353395c4300', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025005', '103', 'Ishaan Khattar', '019c4d42-49ca-71a1-bf87-9053f8107881', 'active'),
('019c4d42-c25e-7e70-9a6c-9d1fe8b11693', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025006', '104', 'Kavya Pillai', '019c4d42-49ca-71a1-bf87-9053f8107881', 'inactive'),
-- Bulk 10-A (from v7_uuids.txt)
('019c4d42-c25e-7c0a-8b0d-6b92e1c56bb4', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025010', '105', 'Rahul Dravid', '019c4d42-49ca-71a1-bf87-9053f8107881', 'active'),
('019c4d42-c25e-72a4-aec1-2abf58ab00ed', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025011', '106', 'Sachin Ramesh', '019c4d42-49ca-71a1-bf87-9053f8107881', 'active'),
('019c4d42-c25e-791b-9176-27b6df276dcf', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025012', '107', 'Sourav Ganguly', '019c4d42-49ca-71a1-bf87-9053f8107881', 'active'),
('019c4d42-c25e-7535-9f36-05a30c62d740', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025013', '108', 'VVS Laxman', '019c4d42-49ca-71a1-bf87-9053f8107881', 'active'),
('019c4d42-c25e-7d11-b119-20d257f78601', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025014', '109', 'Anil Kumble', '019c4d42-49ca-71a1-bf87-9053f8107881', 'active'),

-- Grade 10-B 
('019c4d42-49ca-7adf-b48e-4b9a04a3cefc', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025003', '201', 'Rohan Gupta', '019c4d42-49ca-7a68-9970-6880bbb05a78', 'active'),
('019c4d42-49ca-7503-9b64-ee648ba040ad', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025004', '202', 'Ananya Verma', '019c4d42-49ca-7a68-9970-6880bbb05a78', 'active'),
('019c4d42-c25e-75d5-8124-70f11ce88b06', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025007', '203', 'Rishi Kapoor', '019c4d42-49ca-7a68-9970-6880bbb05a78', 'withdrawn'),
('019c4d42-c25e-7971-bc28-da0cf1e1f2b3', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025020', '204', 'Virat Kohli', '019c4d42-49ca-7a68-9970-6880bbb05a78', 'active'),
('019c4d42-c25e-7f56-98a5-96b664095aa3', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025021', '205', 'MS Dhoni', '019c4d42-49ca-7a68-9970-6880bbb05a78', 'active'),

-- Grade 1 (No Data Testing)
('019c4d42-c25e-7846-821a-c8bdb133fcce', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025008', '001', 'Baby Aisha', '019c4d42-c25e-7d9d-8414-845160b96a59', 'active'),
('019c4d42-c25e-7054-9433-15b9129804b5', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025030', '002', 'New Admission 1', '019c4d42-c25e-7d9d-8414-845160b96a59', 'active'),
('019c4d42-c25e-7a0e-b3af-ab00c5f38dd5', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025031', '003', 'New Admission 2', '019c4d42-c25e-7d9d-8414-845160b96a59', 'active'),

-- Graduated / Historical
('019c4d42-c260-7d69-8736-4a2d487537db', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2023099', '999', 'Old Student', '019c4d42-c260-7bf5-b817-ab2d15818d1d', 'graduated')
ON CONFLICT DO NOTHING;

-- 3.2 Guardians (Expanded)
INSERT INTO guardians (id, tenant_id, full_name, phone, email) VALUES
('019c4d42-49ca-752d-8a6d-591b96cc63d7', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Vijay Sharma', '+919811122233', 'vijay@email.com'),
('019c4d42-49ca-7c66-a3e1-34041dbcaeca', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Meera Iyer', '+919822233344', 'meera@email.com'),
('019c4d42-49ca-7156-a4a6-092e9c891fc7', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Suresh Gupta', '+919833344455', 'suresh@email.com'),
('019c4d42-49ca-7b45-ad5e-f13ce2b12cca', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Lata Verma', '+919844455566', 'lata@email.com'),
('019c4d42-49ca-7d87-b3fc-fccaf69c9a18', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Sunil Ramesh', '+919855566677', 'sunil@email.com')
ON CONFLICT DO NOTHING;

-- 3.3 Link Student-Guardian
INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary) VALUES
('019c4d42-49ca-794f-b77f-68b3b291152c', '019c4d42-49ca-752d-8a6d-591b96cc63d7', 'father', TRUE),
('019c4d42-49ca-7d7d-8d5b-dd8f34b5d0af', '019c4d42-49ca-7c66-a3e1-34041dbcaeca', 'mother', TRUE),
('019c4d42-c25e-72a4-aec1-2abf58ab00ed', '019c4d42-49ca-7d87-b3fc-fccaf69c9a18', 'father', TRUE),
('019c4d42-49ca-7adf-b48e-4b9a04a3cefc', '019c4d42-49ca-7156-a4a6-092e9c891fc7', 'father', TRUE),
('019c4d42-49ca-7503-9b64-ee648ba040ad', '019c4d42-49ca-7b45-ad5e-f13ce2b12cca', 'mother', TRUE)
ON CONFLICT DO NOTHING;

-- 3.4 Student Promotion History (2024 -> 2025)
INSERT INTO student_promotions (id, tenant_id, student_id, from_academic_year_id, to_academic_year_id, from_section_id, to_section_id, status) VALUES
('019c4d42-c260-701b-8363-0881d8ffd0fa', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-c260-784b-b5f9-a0a6b03c773d', '019c4d42-c260-719d-bd5f-8f843af60012', '019c4d42-49ca-7ec3-a3fc-de2bd942e1e6', '019c4d42-c260-74da-b160-0c0bbfde23a6', '019c4d42-49ca-71a1-bf87-9053f8107881', 'promoted')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. ACADEMIC SCHEDULING (Timetables)
-- ============================================

-- 4.1 Timetable Variants
INSERT INTO timetable_variants (id, tenant_id, name, is_active, start_date) VALUES
('019c4d42-c260-7f53-9c17-8e73d8134ff7', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Regular Schedule', TRUE, '2025-04-01')
ON CONFLICT DO NOTHING;

-- 4.2 Timetable Periods
INSERT INTO timetable_periods (id, variant_id, period_name, start_time, end_time, is_break, sort_order) VALUES
('019c4d42-c260-77e6-89cc-94635eb54e4f', '019c4d42-c260-7f53-9c17-8e73d8134ff7', '1st Period', '08:00:00', '08:45:00', FALSE, 1),
('019c4d42-c260-79b6-9f1d-5e205b83b0c7', '019c4d42-c260-7f53-9c17-8e73d8134ff7', '2nd Period', '08:45:00', '09:30:00', FALSE, 2),
('019c4d42-c260-74c3-b090-12cda0f3e3d1', '019c4d42-c260-7f53-9c17-8e73d8134ff7', 'Breakfast Break', '09:30:00', '10:00:00', TRUE, 3),
('019c4d42-c260-7cd4-886f-cbb03907cce9', '019c4d42-c260-7f53-9c17-8e73d8134ff7', '3rd Period', '10:00:00', '10:45:00', FALSE, 4)
ON CONFLICT DO NOTHING;

-- 4.3 Timetable Entries (Grade 10-A)
-- Teacher Priya Sharma (019c4d42-49ca-70ee-9169-0e1d2e446462)
INSERT INTO timetable_entries (id, tenant_id, variant_id, period_id, day_of_week, class_section_id, subject_id, teacher_id, room_number) VALUES
('019c4d42-c260-7cac-9f2b-faafe7b13dae', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-c260-7f53-9c17-8e73d8134ff7', '019c4d42-c260-77e6-89cc-94635eb54e4f', 1, '019c4d42-49ca-71a1-bf87-9053f8107881', '019c4d42-49ca-7c0b-a93a-98359014061f', '019c4d42-c25e-71c0-b844-a502ab4e9681', 'Room 101'), -- Mon, Period 1, Math, Mahesh
('019c4d42-c260-7316-846e-5d98564f3189', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-c260-7f53-9c17-8e73d8134ff7', '019c4d42-c260-79b6-9f1d-5e205b83b0c7', 1, '019c4d42-49ca-71a1-bf87-9053f8107881', '019c4d42-49ca-73fa-9adc-56a8440aa164', '019c4d42-c25e-71c0-b844-a502ab4e9681', 'Lab 2') -- Mon, Period 2, Physics, Mahesh
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. HRMS (Employees & Payroll)
-- ============================================

-- 4.1 Salary Structures
INSERT INTO salary_structures (id, tenant_id, name, basic, hra, da) VALUES
('019c4d42-49ca-7337-b9f0-7d04d8d901b6', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Faculty-Grade-A', 45000.00, 15000.00, 5000.00),
('019c4d42-49ca-720e-bbe6-f9ab7d98885e', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Admin-Staff-B', 25000.00, 8000.00, 2000.00)
ON CONFLICT DO NOTHING;

-- 4.2 Employees (Expanded Faculty & Staff)
INSERT INTO employees (id, tenant_id, employee_code, full_name, designation, salary_structure_id, status) VALUES
('019c4d42-49ca-70ee-9169-0e1d2e446462', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'EMP001', 'Priya Sharma', 'Senior Teacher', '019c4d42-49ca-7337-b9f0-7d04d8d901b6', 'active'),
('019c4d42-c25e-71c0-b844-a502ab4e9681', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'EMP005', 'Mahesh Rathore', 'Math Teacher', '019c4d42-49ca-7337-b9f0-7d04d8d901b6', 'active'),
('019c4d42-c265-7a7a-bbc4-abf532919e0e', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'EMP006', 'Kavita Iyer', 'Physics Teacher', '019c4d42-49ca-7337-b9f0-7d04d8d901b6', 'active'),
('019c4d42-c265-7c4f-bd04-c11cc2d48b2f', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'EMP007', 'Rajesh Gupta', 'History Teacher', '019c4d42-49ca-7337-b9f0-7d04d8d901b6', 'active'),
('019c4d42-49ca-7bd0-a48f-7183256b771c', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'EMP002', 'Amit Verma', 'Accountant', '019c4d42-49ca-720e-bbe6-f9ab7d98885e', 'active'),
('019c4d42-c25e-7846-821a-c8bdb133fcce', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'EMP003', 'Suresh Raina', 'Librarian', '019c4d42-49ca-720e-bbe6-f9ab7d98885e', 'active'),
('019c4d42-c25e-7b02-8ef6-352bb1ee0842', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'EMP004', 'Vikram Rathore', 'Transport Manager', '019c4d42-49ca-720e-bbe6-f9ab7d98885e', 'active')
ON CONFLICT DO NOTHING;

-- 4.3 Payroll History (Last 6 Months)
INSERT INTO payroll_runs (id, tenant_id, month, year, status) VALUES
('019c4d42-c260-7a01-a123-1814f78d9999', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 9, 2024, 'completed'),
('019c4d42-c260-7a1b-9999-1814f78d8888', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 10, 2024, 'completed'),
('019c4d42-c260-70f2-8888-1814f78d7777', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 11, 2024, 'completed'),
(uuid_generate_v7(), '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 12, 2024, 'completed'),
('019c4d42-c25e-74a1-a6a7-1814f78d061c', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 1, 2025, 'completed'),
('019c4d42-c25e-70a7-9b9c-857205617283', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 2, 2025, 'pending')
ON CONFLICT DO NOTHING;

-- 4.4 Staff Bonus Records (History)
INSERT INTO staff_bonus_history (id, tenant_id, employee_id, amount, bonus_type, payment_date, remarks) VALUES
('019c4d42-49ca-748a-b86e-72b144fa1234', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-70ee-9169-0e1d2e446462', 5000.00, 'Performance', '2025-01-15', 'Yearly performance bonus'),
('019c4d42-49ca-79a2-bc6e-82b255fb2345', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-70ee-9169-0e1d2e446462', 2000.00, 'Festival', '2024-11-01', 'Diwali Bonus')
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. ATTENDANCE
-- ============================================

-- 5.1 Staff Attendance Sessions (Multi-Day History)
INSERT INTO staff_attendance_sessions (id, tenant_id, date, marked_by) VALUES
('019c4d42-c264-748f-97e1-1814f78d9999', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', CURRENT_DATE - INTERVAL '4 days', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04'),
('019c4d42-c264-79ee-a974-1814f78d8888', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', CURRENT_DATE - INTERVAL '3 days', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04'),
('019c4d42-c264-74ec-9f4c-1814f78d7777', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', CURRENT_DATE - INTERVAL '2 days', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04'),
('019c4d42-c263-7f72-9721-1814f78d9999', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', CURRENT_DATE - INTERVAL '1 day', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04'),
('019c4d42-c263-7946-b5ea-1814f78d8888', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', CURRENT_DATE, '019c4d42-49ca-767c-b3bd-b1a7faf5ad04')
ON CONFLICT DO NOTHING;

-- 5.2 Staff Attendance Entries (Active Employee history)
INSERT INTO staff_attendance_entries (session_id, employee_id, status, check_in_time, check_out_time) VALUES
('019c4d42-c264-748f-97e1-1814f78d9999', '019c4d42-49ca-70ee-9169-0e1d2e446462', 'present', '08:00:00', '16:00:00'),
('019c4d42-c264-79ee-a974-1814f78d8888', '019c4d42-49ca-70ee-9169-0e1d2e446462', 'present', '08:10:00', '16:05:00'),
('019c4d42-c264-74ec-9f4c-1814f78d7777', '019c4d42-49ca-70ee-9169-0e1d2e446462', 'late', '09:30:00', '16:00:00'),
('019c4d42-c263-7f72-9721-1814f78d9999', '019c4d42-49ca-70ee-9169-0e1d2e446462', 'present', '08:00:00', '16:00:00'),
('019c4d42-c263-7946-b5ea-1814f78d8888', '019c4d42-49ca-70ee-9169-0e1d2e446462', 'present', '08:00:00', '16:00:00')
ON CONFLICT DO NOTHING;

-- 5.3 Staff Assignments (Specializations & Class Teachers)
INSERT INTO teacher_subject_specializations (id, tenant_id, teacher_id, subject_id) VALUES
('019c4d42-c264-701b-8363-1284d72bde6a', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-c25e-71c0-b844-a502ab4e9681', '019c4d42-49ca-7c0b-a93a-98359014061f') -- Mahesh -> Math
ON CONFLICT DO NOTHING;

INSERT INTO class_teacher_assignments (id, tenant_id, academic_year_id, class_section_id, teacher_id) VALUES
('019c4d42-c264-7f53-9c17-567890123456', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-7ec3-a3fc-de2bd942e1e6', '019c4d42-49ca-71a1-bf87-9053f8107881', '019c4d42-c25e-71c0-b844-a502ab4e9681') -- Mahesh -> 10-A
ON CONFLICT DO NOTHING;

-- 5.4 Student Attendance Sessions
INSERT INTO attendance_sessions (id, tenant_id, class_section_id, date, marked_by) VALUES
('019c4d42-49ca-7651-84c4-c5396a5dfc96', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-71a1-bf87-9053f8107881', CURRENT_DATE, '019c4d42-49ca-767c-b3bd-b1a7faf5ad04')
ON CONFLICT DO NOTHING;

-- 5.2 Attendance Entries
INSERT INTO attendance_entries (session_id, student_id, status, remarks) VALUES
('019c4d42-49ca-7651-84c4-c5396a5dfc96', '019c4d42-49ca-794f-b77f-68b3b291152c', 'present', 'On time'),
('019c4d42-49ca-7651-84c4-c5396a5dfc96', '019c4d42-49ca-7d7d-8d5b-dd8f34b5d0af', 'present', 'On time'),
('019c4d42-49ca-7651-84c4-c5396a5dfc96', '019c4d42-49ca-7adf-b48e-4b9a04a3cefc', 'absent', 'Medical leave')
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. FEES
-- ============================================

-- 6.1 Fee Heads
INSERT INTO fee_heads (id, tenant_id, name, type) VALUES
('019c4d42-49ca-766b-af08-9fc7f638f168', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Tuition Fee', 'recurring'),
('019c4d42-49ca-7e5b-9c2d-6c1ff19a3ee3', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Computer Lab Fee', 'recurring'),
('019c4d42-49ca-78ab-9895-9f60ac891674', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Transport Fee', 'recurring'),
('019c4d42-c260-7056-b040-3665780a1877', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Admission Fee', 'one_time')
ON CONFLICT DO NOTHING;

-- 6.2 Fee Plans
INSERT INTO fee_plans (id, tenant_id, name, academic_year_id, total_amount) VALUES
('019c4d42-49ca-7b81-a6a3-548c83d93975', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Standard Grade 10 Plan', '019c4d42-49ca-7ec3-a3fc-de2bd942e1e6', 5000000),
('019c4d42-c260-781e-873b-e016ac9a3854', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Historical Grade 9 Plan', '019c4d42-c260-719d-bd5f-8f843af60012', 4500000)
ON CONFLICT DO NOTHING;

-- 6.3 Fee Plan Items
INSERT INTO fee_plan_items (plan_id, head_id, amount, due_date) VALUES
('019c4d42-49ca-7b81-a6a3-548c83d93975', '019c4d42-49ca-766b-af08-9fc7f638f168', 4000000, '2025-05-15'),
('019c4d42-49ca-7b81-a6a3-548c83d93975', '019c4d42-49ca-7e5b-9c2d-6c1ff19a3ee3', 1000000, '2025-05-15'),
('019c4d42-c260-781e-873b-e016ac9a3854', '019c4d42-49ca-766b-af08-9fc7f638f168', 4500000, '2024-05-15')
ON CONFLICT DO NOTHING;

-- 6.4 Receipt Series
INSERT INTO receipt_series (id, tenant_id, prefix, current_number) VALUES
('019c4d42-c260-738c-85bd-969400263625', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'REC/2025/', 10)
ON CONFLICT DO NOTHING;

-- 6.5 Receipts & Fee Payments (Varied Modes & Stress Test)
INSERT INTO receipts (id, tenant_id, receipt_number, student_id, amount_paid, payment_mode, series_id, transaction_ref) VALUES
('019c4d42-c260-768a-b420-a681df70c0c6', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'REC/2025/001', '019c4d42-49ca-794f-b77f-68b3b291152c', 5000000, 'cash', '019c4d42-c260-738c-85bd-969400263625', 'N/A'),
('019c4d42-c260-7a54-a690-348f93427909', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'REC/2025/002', '019c4d42-49ca-7d7d-8d5b-dd8f34b5d0af', 2500000, 'bank_transfer', '019c4d42-c260-738c-85bd-969400263625', 'TXN998877'),
('019c4d42-c260-7667-bb9a-41372661dc97', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'REC/2025/003', '019c4d42-c260-784b-b5f9-a0a6b03c773d', 1000000, 'cheque', '019c4d42-c260-738c-85bd-969400263625', 'CHQ123456'),
-- Bulk Payments for new students
('019c4d42-c264-726e-8b23-abcdef123456', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'REC/2025/004', '019c4d42-c25e-7c0a-8b0d-6b92e1c56bb4', 5000000, 'online', '019c4d42-c260-738c-85bd-969400263625', 'RAZOR123'),
('019c4d42-c264-7042-bd8a-123456789012', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'REC/2025/005', '019c4d42-c25e-72a4-aec1-2abf58ab00ed', 3000000, 'cash', '019c4d42-c260-738c-85bd-969400263625', 'N/A')
ON CONFLICT DO NOTHING;

-- 6.6 High-level Payment Status (Already handled by receipts above)

-- 6.7 Optional Fee Items (Transport Add-ons)
INSERT INTO optional_fee_items (id, tenant_id, name, amount, category) VALUES
('019c4d42-c263-706a-b28a-123456789abc', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Transport: Zone A', 150000, 'Transport'),
('019c4d42-c263-71f2-8b74-abcdef123456', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Transport: Zone B', 250000, 'Transport')
ON CONFLICT DO NOTHING;

-- 6.8 Student Optional Fees Binding
INSERT INTO student_optional_fees (id, tenant_id, student_id, item_id, academic_year_id, status) VALUES
('019c4d42-c263-7d2d-8b63-1d4f2b6e174b', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-794f-b77f-68b3b291152c', '019c4d42-c263-706a-b28a-123456789abc', '019c4d42-49ca-7ec3-a3fc-de2bd942e1e6', 'selected')
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. EXAMS & MARKS
-- ============================================

-- 7.1 Exams
INSERT INTO exams (id, tenant_id, academic_year_id, name, status) VALUES
('019c4d42-49ca-7e3a-a998-b5cd5afdc6bc', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-7ec3-a3fc-de2bd942e1e6', 'Terminal-I Examination', 'published')
ON CONFLICT DO NOTHING;

-- 7.2 Exam Subjects
INSERT INTO exam_subjects (exam_id, subject_id, max_marks) VALUES
('019c4d42-49ca-7e3a-a998-b5cd5afdc6bc', '019c4d42-49ca-7c0b-a93a-98359014061f', 100),
('019c4d42-49ca-7e3a-a998-b5cd5afdc6bc', '019c4d42-49ca-73fa-9adc-56a8440aa164', 100)
ON CONFLICT DO NOTHING;

-- 7.3 Marks Entries
INSERT INTO marks_entries (exam_id, subject_id, student_id, marks_obtained, entered_by) VALUES
('019c4d42-49ca-7e3a-a998-b5cd5afdc6bc', '019c4d42-49ca-7c0b-a93a-98359014061f', '019c4d42-49ca-794f-b77f-68b3b291152c', 95.50, '019c4d42-49ca-767c-b3bd-b1a7faf5ad04'),
('019c4d42-49ca-7e3a-a998-b5cd5afdc6bc', '019c4d42-49ca-73fa-9adc-56a8440aa164', '019c4d42-49ca-7d7d-8d5b-dd8f34b5d0af', 88.00, '019c4d42-49ca-767c-b3bd-b1a7faf5ad04')
ON CONFLICT DO NOTHING;

-- 7.4 Question Bank (Massive Expansion)
INSERT INTO exam_question_bank (id, tenant_id, subject_id, topic, difficulty, question_type, question_text, options, correct_answer, marks) VALUES
-- Math
('019c4d42-c262-7f8e-a9af-17482b6e174b', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-7c0b-a93a-98359014061f', 'Algebra', 'easy', 'mcq', 'What is 5 + 7?', '{"A": "10", "B": "12", "C": "14", "D": "15"}', 'B', 1.00),
('019c4d42-c262-70b1-8b74-1284d72bde6a', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-7c0b-a93a-98359014061f', 'Calculus', 'hard', 'descriptive', 'Derive the formula for area under a curve.', NULL, NULL, 5.00),
('019c4d42-c265-726e-8b23-abcdef123456', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-7c0b-a93a-98359014061f', 'Trigonometry', 'medium', 'mcq', 'Value of sin 90?', '{"A": "0", "B": "1", "C": "-1"}', 'B', 1.00),
-- Physics
('019c4d42-c264-74fc-8345-d78b9b884987', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-73fa-9adc-56a8440aa164', 'Mechanics', 'medium', 'mcq', 'What is the SI unit of Force?', '{"A": "Joule", "B": "Newton", "C": "Pascal", "D": "Watt"}', 'B', 1.00),
('019c4d42-c264-7022-97f2-2bd9582dfa6a', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-73fa-9adc-56a8440aa164', 'Light', 'easy', 'true_false', 'Light travels in a straight line.', NULL, 'true', 1.00),
-- History
('019c4d42-c265-7bc1-b63a-46b11cdbe80e', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-c264-71f2-8b74-123456789abc', 'World War', 'medium', 'short_answer', 'When did WW2 end?', NULL, '1945', 2.00),
-- CS
('019c4d42-c265-7b5c-93ed-1960b4228109', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-c265-7e2c-9af2-52b83405975a', 'Networking', 'hard', 'mcq', 'Which layer is IP?', '{"A": "Physical", "B": "Network", "C": "Link"}', 'B', 1.00)
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. TRANSPORT
-- ============================================

-- 8.1 Vehicles & Routes (Expanded Fleet)
INSERT INTO transport_vehicles (id, tenant_id, registration_number, capacity, type, status) VALUES
('019c4d42-49ca-7f28-b86e-b1a822bc1111', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'DL-1CA-1234', 40, 'bus', 'active'),
('019c4d42-49ca-7a1a-b86e-b2b922bc2222', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'DL-1CB-5678', 25, 'van', 'active'),
('019c4d42-c265-70e2-95fe-8c973177503b', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'KA-01-PQ-9999', 40, 'bus', 'active'),
('019c4d42-c265-73ac-8594-1f7ff83ea58a', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'DL-02-ZZ-1111', 8, 'car', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO transport_routes (id, tenant_id, name, vehicle_id, description) VALUES
('019c4d42-49cb-7097-97c8-403eacd64311', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'North Route 01', '019c4d42-49ca-7f28-b86e-b1a822bc1111', 'Covering Rohini and Pitampura'),
('019c4d42-c264-74da-b160-567890123456', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Route-West-B', '019c4d42-49ca-7a1a-b86e-b2b922bc2222', 'Covering Dwarka and Janakpuri'),
('019c4d42-c265-70bd-ba10-19a6e04e4f50', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Route-South-C', '019c4d42-c265-70e2-95fe-8c973177503b', 'Covering Saket and Malviya Nagar')
ON CONFLICT DO NOTHING;

-- 8.2 Drivers & Allocations
INSERT INTO transport_drivers (id, tenant_id, full_name, license_number, phone) VALUES
('019c4d42-49cb-7ba4-8d74-59fd40ea971b', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Karan Singh', 'DL-1234567890', '+919833344455')
ON CONFLICT DO NOTHING;

INSERT INTO transport_allocations (id, tenant_id, student_id, route_id, start_date) VALUES
('019c4d42-49cb-716d-b2d9-2c0c21791d3a', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-794f-b77f-68b3b291152c', '019c4d42-49cb-7097-97c8-403eacd64311', '2025-04-01')
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. INVENTORY
-- ============================================

-- 9.1 Categories & Suppliers
INSERT INTO inventory_categories (id, tenant_id, name, type) VALUES
('019c4d42-49cb-7cb2-b8a6-1518c55b96d5', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Academic Supplies', 'consumable')
ON CONFLICT DO NOTHING;

INSERT INTO inventory_suppliers (id, tenant_id, name, contact_person, phone) VALUES
('019c4d42-49cb-7891-a7fb-31135e9a6f67', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Global Stationery', 'Mr. Verma', '+919877788899')
ON CONFLICT DO NOTHING;

-- 9.2 Items & Stocks
INSERT INTO inventory_items (id, tenant_id, name, category_id, unit) VALUES
('019c4d42-49cb-70b1-a13d-b0bb5cf2005b', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Whiteboard Marker', '019c4d42-49cb-7cb2-b8a6-1518c55b96d5', 'Box')
ON CONFLICT DO NOTHING;

INSERT INTO inventory_stocks (id, tenant_id, item_id, quantity) VALUES
('019c4d42-49cb-7efb-a3a2-d4edbdcd7c2d', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49cb-70b1-a13d-b0bb5cf2005b', 100)
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. LIBRARY
-- ============================================

-- 10.1 Categories & Authors
INSERT INTO library_categories (id, tenant_id, name) VALUES
('019c4d42-49cb-70eb-a1df-e8871eb099a4', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Science & Technology')
ON CONFLICT DO NOTHING;

INSERT INTO library_authors (id, tenant_id, name) VALUES
('019c4d42-49cb-725e-a2b6-90f25bf27074', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Stephen Hawking'),
('019c4d42-c265-7e2c-9af2-52b83405975a', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Thomas H. Cormen')
ON CONFLICT DO NOTHING;

-- 10.2 Books (Expanded Collection)
INSERT INTO library_books (id, tenant_id, title, category_id, isbn) VALUES
('019c4d42-49cb-7963-9562-b11223344556', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Introduction to Algorithms', '019c4d42-49cb-70eb-a1df-e8871eb099a4', '978-0262033848'),
('019c4d42-c264-7c98-af30-f0bd1b94d8de', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Principles', '019c4d42-49cb-70eb-a1df-e8871eb099a4', '978-1501124020')
ON CONFLICT DO NOTHING;

INSERT INTO library_book_authors (book_id, author_id) VALUES
('019c4d42-49cb-7963-9562-b11223344556', '019c4d42-c265-7e2c-9af2-52b83405975a'),
('019c4d42-c264-7c98-af30-f0bd1b94d8de', '019c4d42-49cb-725e-a2b6-90f25bf27074')
ON CONFLICT DO NOTHING;

-- 10.3 Book Issues (Testing status)
INSERT INTO library_issues (id, tenant_id, book_id, student_id, issue_date, due_date, status) VALUES
('019c4d42-c262-7635-b285-1d4f2b6e174b', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49cb-7963-9562-b11223344556', '019c4d42-49ca-794f-b77f-68b3b291152c', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '3 days', 'overdue'),
('019c4d42-c262-78d9-a764-f28471b6e492', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-c264-7c98-af30-f0bd1b94d8de', '019c4d42-49ca-794f-b77f-68b3b291152c', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '6 days', 'issued')
ON CONFLICT DO NOTHING;

-- ============================================
-- 11. ADMISSIONS
-- ============================================

-- 11.1 Enquiries
INSERT INTO admission_enquiries (id, tenant_id, student_name, grade_interested, academic_year, parent_name, phone, status) VALUES
('019c4d42-49cb-7a7a-bd04-ad1234567890', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Rohit Mehra', 'Grade 5', '2025-2026', 'Raj Mehra', '+919988776655', 'open'),
('019c4d42-49cb-775c-b892-aba58aee9af6', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Vikram Seth', 'Grade 10', '2025-2026', 'Raj Seth', '+919911223344', 'converted')
ON CONFLICT DO NOTHING;

-- 11.2 Applications
INSERT INTO admission_applications (id, tenant_id, enquiry_id, application_number, status) VALUES
('019c4d42-49cb-7843-83d6-cd56f4fa7420', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49cb-775c-b892-aba58aee9af6', 'APP-2025-001', 'submitted')
ON CONFLICT DO NOTHING;

-- ============================================
-- 12. SAFETY & INCIDENTS
-- ============================================

-- 12.1 Discipline Incidents
INSERT INTO discipline_incidents (id, tenant_id, student_id, reporter_id, category, title, status) VALUES
('019c4d42-49cb-7f97-a445-49a9222b79c0', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-794f-b77f-68b3b291152c', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04', 'behavioral', 'Minor hallway scuffle', 'resolved')
ON CONFLICT DO NOTHING;

-- 12.2 Visitors
INSERT INTO visitors (id, tenant_id, full_name, phone, id_type, id_number) VALUES
('019c4d42-49cb-7e39-be63-83e5c4216b21', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Sanjeev Kumar', '+919988776655', 'aadhaar', 'XXXX-XXXX-1234')
ON CONFLICT DO NOTHING;

-- ============================================
-- 13. AI KNOWLEDGE BASE
-- ============================================

INSERT INTO ai_knowledge_base (id, tenant_id, title, content, content_type) VALUES
('019c4d42-49cb-7da2-b4fc-d43a6b031010', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Emergency Contact Protocol', 'In case of medical emergency, contact the school health clinic at ext 911. Parent notification will be immediate.', 'policy')
ON CONFLICT DO NOTHING;

-- ============================================
-- 14. HOSTEL
-- ============================================

-- 14.1 Buildings & Rooms
INSERT INTO hostel_buildings (id, tenant_id, name, type, total_rooms) VALUES
('019c4d42-c25d-7b6a-b723-1324337773e3', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Pioneer Hall', 'boys', 20)
ON CONFLICT DO NOTHING;

INSERT INTO hostel_rooms (id, building_id, room_number, room_type, capacity, cost_per_month) VALUES
('019c4d42-c25d-7b14-b380-89cf9a145f03', '019c4d42-c25d-7b6a-b723-1324337773e3', '101', 'double', 2, 5000.00)
ON CONFLICT DO NOTHING;

-- 14.2 Allocation
INSERT INTO hostel_allocations (id, room_id, student_id, allotted_on, status) VALUES
('019c4d42-c25d-7f40-8876-6ffb8f9585be', '019c4d42-c25d-7b14-b380-89cf9a145f03', '019c4d42-49ca-794f-b77f-68b3b291152c', CURRENT_DATE, 'active')
ON CONFLICT DO NOTHING;

-- ============================================
-- 15. PTM & EVENTS
-- ============================================

INSERT INTO ptm_events (id, tenant_id, title, event_date, start_time, end_time, teacher_id) VALUES
('019c4d42-c25d-74ac-9e62-dc32116e3496', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Q1 Progress Review', CURRENT_DATE + INTERVAL '7 days', '14:00:00', '17:00:00', '019c4d42-c25e-71c0-b844-a502ab4e9681')
ON CONFLICT DO NOTHING;

-- ============================================
-- 16. COMMUNICATION (CHAT)
-- ============================================

-- 16.1 Chat Room
INSERT INTO chat_rooms (id, tenant_id, student_id, title, is_active) VALUES
('019c4d42-c25d-7db9-a142-e9ee380cf4b7', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-794f-b77f-68b3b291152c', 'Grade 10-A Parent Group', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO chat_participants (room_id, user_id, role) VALUES
('019c4d42-c25d-7db9-a142-e9ee380cf4b7', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04', 'admin'), -- SaaS Admin 
('019c4d42-c25d-7db9-a142-e9ee380cf4b7', '019c4d42-c25e-7b45-9ad9-840d567925ba', 'parent') -- Parent user
ON CONFLICT DO NOTHING;

-- ============================================
-- 17. PLATFORM CONTROL PLANE FIXTURES
-- ============================================

INSERT INTO platform_plans (id, code, name, description, price_monthly, price_yearly, modules, limits, feature_flags, is_active) VALUES
('019c4d42-49ca-7e0a-b047-86336ebac7ae', 'basic', 'Basic Plan', 'Essential suite for small schools', 2900, 29000, '{"sis": true, "attendance": true, "fees": true}', '{"students": 300, "staff": 30, "storage_gb": 10}', '{"ai_suite_v1": false}', TRUE),
('019c4d42-49ca-7e0a-b047-86336ebac7af', 'pro', 'Pro Plan', 'Advanced suite for growing schools', 5900, 59000, '{"sis": true, "attendance": true, "fees": true, "exams": true, "transport": true, "library": true, "inventory": true}', '{"students": 1500, "staff": 150, "storage_gb": 100}', '{"ai_suite_v1": true}', TRUE),
('019c4d42-49ca-7e0a-b047-86336ebac7b0', 'enterprise', 'Enterprise Plan', 'Full suite for large groups', 12900, 129000, '{"sis": true, "attendance": true, "fees": true, "exams": true, "transport": true, "library": true, "inventory": true, "hrms": true, "safety": true}', '{"students": 5000, "staff": 500, "storage_gb": 500}', '{"ai_suite_v1": true, "priority_support": true}', TRUE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    modules = EXCLUDED.modules,
    limits = EXCLUDED.limits,
    feature_flags = EXCLUDED.feature_flags,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

INSERT INTO platform_settings (key, value, updated_by) VALUES
('security.internal_mfa_policy', '{"enforce_for_internal_users": false}', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04'),
('security.password_policy', '{"min_length": 10, "require_special": true, "max_age_days": 90}', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04'),
('billing.tax_rules', '{"gst_rate": 18, "enabled_countries": ["India"]}', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW();

INSERT INTO tenant_signup_requests (id, school_name, contact_name, contact_email, phone, city, country, student_count_range, payload, status)
VALUES
('019c4d42-49cb-7903-a11b-9f89aff1db2d', 'Greenwood Public School', 'Aditi Rao', 'aditi@greenwood.edu', '+919811110001', 'Pune', 'India', '100-500', '{"board":"CBSE"}', 'pending'),
('019c4d42-49cb-70cf-8e38-cf899699aab7', 'Riverdale International', 'Karan Mehta', 'karan@riverdale.school', '+919811110002', 'Jaipur', 'India', '500-1500', '{"board":"ICSE"}', 'approved'),
('019c4d42-49cb-7591-b977-c1647957c805', 'Future Minds Academy', 'Neha Jain', 'neha@futureminds.edu', '+919811110003', 'Lucknow', 'India', '0-100', '{"board":"STATE"}', 'rejected')
ON CONFLICT DO NOTHING;

-- ============================================
-- 18. MULTI-TENANT EXPANSION (ALL MODULES)
-- ============================================

DO $$
DECLARE
    r RECORD;
    v_seed_idx INTEGER := 0;
    v_branch_id UUID;
    v_admin_user UUID;
    v_teacher_user UUID;
    v_accountant_user UUID;
    v_librarian_user UUID;
    v_transport_user UUID;
    v_parent_user UUID;
    v_admin_identity UUID;
    v_teacher_identity UUID;
    v_accountant_identity UUID;
    v_librarian_identity UUID;
    v_transport_identity UUID;
    v_parent_identity UUID;
    v_student_user UUID;
    v_student_identity UUID;
    v_role_assign_admin UUID;
    v_role_assign_teacher UUID;
    v_role_assign_accountant UUID;
    v_role_assign_librarian UUID;
    v_role_assign_transport UUID;
    v_year_id UUID;
    v_class_id UUID;
    v_section_id UUID;
    v_subject_id UUID;
    v_student_id UUID;
    v_guardian_id UUID;
    v_variant_id UUID;
    v_period_id UUID;
    v_salary_id UUID;
    v_teacher_emp UUID;
    v_accountant_emp UUID;
    v_att_session UUID;
    v_staff_session UUID;
    v_fee_head UUID;
    v_fee_plan UUID;
    v_receipt_series UUID;
    v_exam_id UUID;
    v_vehicle_id UUID;
    v_route_id UUID;
    v_driver_id UUID;
    v_inventory_category UUID;
    v_inventory_supplier UUID;
    v_inventory_item UUID;
    v_library_category UUID;
    v_library_author UUID;
    v_library_book UUID;
    v_enquiry_id UUID;
    v_application_id UUID;
    v_hostel_building UUID;
    v_hostel_room UUID;
    v_chat_room UUID;
BEGIN
    FOR r IN
        SELECT * FROM (
            VALUES
            ('019c4d42-49ca-7392-b29e-d74aadcfabbe'::uuid, 'Northstar Public School', 'northstar', 'Bengaluru', 'Karnataka'),
            ('019c4d42-49ca-73a3-9fd6-c546ed507304'::uuid, 'Sunrise Global Academy', 'sunrise', 'Hyderabad', 'Telangana')
        ) AS t(tenant_id, school_name, subdomain, city, state)
    LOOP
        v_seed_idx := v_seed_idx + 1;

        INSERT INTO tenants (id, name, subdomain, is_active)
        VALUES (r.tenant_id, r.school_name, r.subdomain, TRUE)
        ON CONFLICT (subdomain) DO UPDATE SET name = EXCLUDED.name, is_active = TRUE;

        v_branch_id := uuid_generate_v7();
        INSERT INTO branches (id, tenant_id, name, code, is_active)
        VALUES (v_branch_id, r.tenant_id, 'Main Campus', 'MAIN', TRUE)
        ON CONFLICT (tenant_id, code) DO NOTHING;

        INSERT INTO school_profiles (tenant_id, school_name, affiliation_board, affiliation_number, city, state)
        VALUES (r.tenant_id, r.school_name, 'CBSE', 'AFF-' || upper(r.subdomain), r.city, r.state)
        ON CONFLICT (tenant_id) DO UPDATE SET school_name = EXCLUDED.school_name, city = EXCLUDED.city, state = EXCLUDED.state;

        v_admin_user := uuid_generate_v7();
        v_teacher_user := uuid_generate_v7();
        v_accountant_user := uuid_generate_v7();
        v_librarian_user := uuid_generate_v7();
        v_transport_user := uuid_generate_v7();
        v_parent_user := uuid_generate_v7();
        v_student_user := uuid_generate_v7();

        INSERT INTO users (id, email, phone, full_name, is_active) VALUES
        (v_admin_user, 'admin@' || r.subdomain || '.test', '+91' || (9700000000 + (v_seed_idx * 100) + 1)::text, initcap(r.subdomain) || ' Admin', TRUE),
        (v_teacher_user, 'teacher@' || r.subdomain || '.test', '+91' || (9700000000 + (v_seed_idx * 100) + 2)::text, initcap(r.subdomain) || ' Teacher', TRUE),
        (v_accountant_user, 'accountant@' || r.subdomain || '.test', '+91' || (9700000000 + (v_seed_idx * 100) + 3)::text, initcap(r.subdomain) || ' Accountant', TRUE),
        (v_librarian_user, 'librarian@' || r.subdomain || '.test', '+91' || (9700000000 + (v_seed_idx * 100) + 4)::text, initcap(r.subdomain) || ' Librarian', TRUE),
        (v_transport_user, 'transport@' || r.subdomain || '.test', '+91' || (9700000000 + (v_seed_idx * 100) + 5)::text, initcap(r.subdomain) || ' Transport Manager', TRUE),
        (v_parent_user, 'parent@' || r.subdomain || '.test', '+91' || (9700000000 + (v_seed_idx * 100) + 6)::text, initcap(r.subdomain) || ' Parent', TRUE),
        (v_student_user, 'student@' || r.subdomain || '.test', '+91' || (9700000000 + (v_seed_idx * 100) + 7)::text, initcap(r.subdomain) || ' Student', TRUE)
        ON CONFLICT (email) DO NOTHING;

        v_admin_identity := uuid_generate_v7();
        v_teacher_identity := uuid_generate_v7();
        v_accountant_identity := uuid_generate_v7();
        v_librarian_identity := uuid_generate_v7();
        v_transport_identity := uuid_generate_v7();
        v_parent_identity := uuid_generate_v7();
        v_student_identity := uuid_generate_v7();

        INSERT INTO user_identities (id, user_id, provider, identifier, credential) VALUES
        (v_admin_identity, v_admin_user, 'password', 'admin@' || r.subdomain || '.test', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
        (v_teacher_identity, v_teacher_user, 'password', 'teacher@' || r.subdomain || '.test', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
        (v_accountant_identity, v_accountant_user, 'password', 'accountant@' || r.subdomain || '.test', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
        (v_librarian_identity, v_librarian_user, 'password', 'librarian@' || r.subdomain || '.test', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
        (v_transport_identity, v_transport_user, 'password', 'transport@' || r.subdomain || '.test', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
        (v_parent_identity, v_parent_user, 'password', 'parent@' || r.subdomain || '.test', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
        (v_student_identity, v_student_user, 'password', 'student@' || r.subdomain || '.test', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
        ON CONFLICT (provider, identifier) DO NOTHING;

        v_role_assign_admin := uuid_generate_v7();
        v_role_assign_teacher := uuid_generate_v7();
        v_role_assign_accountant := uuid_generate_v7();
        v_role_assign_librarian := uuid_generate_v7();
        v_role_assign_transport := uuid_generate_v7();

        INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type) VALUES
        (v_role_assign_admin, r.tenant_id, v_admin_user, '019c4d42-49ca-773d-aea7-34deb37577e1', 'tenant'),
        (v_role_assign_teacher, r.tenant_id, v_teacher_user, '019c4d42-49ca-761c-aaf8-24e6628c030a', 'tenant'),
        (v_role_assign_accountant, r.tenant_id, v_accountant_user, '019c4d42-49ca-7f83-b4a1-7408a5b65f0e', 'tenant'),
        (v_role_assign_librarian, r.tenant_id, v_librarian_user, '019c4d42-c25e-7044-904d-b227be5c819c', 'tenant'),
        (v_role_assign_transport, r.tenant_id, v_transport_user, '019c4d42-c25e-7740-9510-d5d3df33368a', 'tenant')
        ON CONFLICT DO NOTHING;

        -- Academic + SIS
        v_year_id := uuid_generate_v7();
        v_class_id := uuid_generate_v7();
        v_section_id := uuid_generate_v7();
        v_subject_id := uuid_generate_v7();
        v_student_id := uuid_generate_v7();
        v_guardian_id := uuid_generate_v7();

        INSERT INTO academic_years (id, tenant_id, name, start_date, end_date, is_active)
        VALUES (v_year_id, r.tenant_id, '2025-26', '2025-04-01', '2026-03-31', TRUE)
        ON CONFLICT DO NOTHING;

        INSERT INTO classes (id, tenant_id, name, level)
        VALUES (v_class_id, r.tenant_id, 'Grade 8', 8)
        ON CONFLICT DO NOTHING;

        INSERT INTO class_sections (id, tenant_id, class_id, name, capacity)
        VALUES (v_section_id, r.tenant_id, v_class_id, 'A', 35)
        ON CONFLICT DO NOTHING;

        INSERT INTO subjects (id, tenant_id, name, code, type)
        VALUES (v_subject_id, r.tenant_id, 'Mathematics', upper(r.subdomain) || '-MATH8', 'theory')
        ON CONFLICT DO NOTHING;

        INSERT INTO students (id, tenant_id, admission_number, roll_number, full_name, section_id, status)
        VALUES (v_student_id, r.tenant_id, upper(r.subdomain) || '-ADM-001', '801', initcap(r.subdomain) || ' Student One', v_section_id, 'active')
        ON CONFLICT DO NOTHING;

        INSERT INTO guardians (id, tenant_id, full_name, phone, email)
        VALUES (v_guardian_id, r.tenant_id, initcap(r.subdomain) || ' Guardian', '+919722200001', 'guardian@' || r.subdomain || '.test')
        ON CONFLICT DO NOTHING;

        INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary)
        VALUES (v_student_id, v_guardian_id, 'father', TRUE)
        ON CONFLICT DO NOTHING;

        -- Timetable + HRMS + Attendance
        v_variant_id := uuid_generate_v7();
        v_period_id := uuid_generate_v7();
        v_salary_id := uuid_generate_v7();
        v_teacher_emp := uuid_generate_v7();
        v_accountant_emp := uuid_generate_v7();
        v_att_session := uuid_generate_v7();
        v_staff_session := uuid_generate_v7();

        INSERT INTO timetable_variants (id, tenant_id, name, is_active, start_date)
        VALUES (v_variant_id, r.tenant_id, 'Regular Schedule', TRUE, CURRENT_DATE)
        ON CONFLICT DO NOTHING;

        INSERT INTO timetable_periods (id, variant_id, period_name, start_time, end_time, is_break, sort_order)
        VALUES (v_period_id, v_variant_id, 'Period 1', '08:00:00', '08:45:00', FALSE, 1)
        ON CONFLICT DO NOTHING;

        INSERT INTO timetable_entries (id, tenant_id, variant_id, period_id, day_of_week, class_section_id, subject_id, teacher_id, room_number)
        VALUES (uuid_generate_v7(), r.tenant_id, v_variant_id, v_period_id, 1, v_section_id, v_subject_id, v_teacher_user, 'Room 101')
        ON CONFLICT DO NOTHING;

        INSERT INTO salary_structures (id, tenant_id, name, basic, hra, da)
        VALUES (v_salary_id, r.tenant_id, 'Standard Staff', 30000, 8000, 3000)
        ON CONFLICT DO NOTHING;

        INSERT INTO employees (id, tenant_id, employee_code, full_name, designation, salary_structure_id, status) VALUES
        (v_teacher_emp, r.tenant_id, upper(r.subdomain) || '-EMP-T1', initcap(r.subdomain) || ' Teacher Employee', 'Teacher', v_salary_id, 'active'),
        (v_accountant_emp, r.tenant_id, upper(r.subdomain) || '-EMP-A1', initcap(r.subdomain) || ' Accountant Employee', 'Accountant', v_salary_id, 'active')
        ON CONFLICT DO NOTHING;

        INSERT INTO payroll_runs (id, tenant_id, month, year, status)
        VALUES (uuid_generate_v7(), r.tenant_id, EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE), 'pending')
        ON CONFLICT DO NOTHING;

        INSERT INTO attendance_sessions (id, tenant_id, class_section_id, date, marked_by)
        VALUES (v_att_session, r.tenant_id, v_section_id, CURRENT_DATE, v_admin_user)
        ON CONFLICT DO NOTHING;

        INSERT INTO attendance_entries (session_id, student_id, status, remarks)
        VALUES (v_att_session, v_student_id, 'present', 'Auto-seeded')
        ON CONFLICT DO NOTHING;

        INSERT INTO staff_attendance_sessions (id, tenant_id, date, marked_by)
        VALUES (v_staff_session, r.tenant_id, CURRENT_DATE, v_admin_user)
        ON CONFLICT DO NOTHING;

        INSERT INTO staff_attendance_entries (session_id, employee_id, status, check_in_time, check_out_time) VALUES
        (v_staff_session, v_teacher_emp, 'present', '08:05:00', '16:00:00'),
        (v_staff_session, v_accountant_emp, 'present', '09:00:00', '17:15:00')
        ON CONFLICT DO NOTHING;

        INSERT INTO teacher_subject_specializations (id, tenant_id, teacher_id, subject_id)
        VALUES (uuid_generate_v7(), r.tenant_id, v_teacher_user, v_subject_id)
        ON CONFLICT DO NOTHING;

        INSERT INTO class_teacher_assignments (id, tenant_id, academic_year_id, class_section_id, teacher_id)
        VALUES (uuid_generate_v7(), r.tenant_id, v_year_id, v_section_id, v_teacher_user)
        ON CONFLICT DO NOTHING;

        -- Fees + Receipts
        v_fee_head := uuid_generate_v7();
        v_fee_plan := uuid_generate_v7();
        v_receipt_series := uuid_generate_v7();
        INSERT INTO fee_heads (id, tenant_id, name, type)
        VALUES (v_fee_head, r.tenant_id, 'Tuition Fee', 'recurring')
        ON CONFLICT DO NOTHING;

        INSERT INTO fee_plans (id, tenant_id, name, academic_year_id, total_amount)
        VALUES (v_fee_plan, r.tenant_id, 'Standard Plan', v_year_id, 120000)
        ON CONFLICT DO NOTHING;

        INSERT INTO fee_plan_items (plan_id, head_id, amount, due_date)
        VALUES (v_fee_plan, v_fee_head, 120000, CURRENT_DATE + INTERVAL '30 days')
        ON CONFLICT DO NOTHING;

        INSERT INTO receipt_series (id, tenant_id, prefix, current_number)
        VALUES (v_receipt_series, r.tenant_id, 'REC/' || upper(r.subdomain) || '/', 1)
        ON CONFLICT DO NOTHING;

        INSERT INTO receipts (id, tenant_id, receipt_number, student_id, amount_paid, payment_mode, series_id, transaction_ref)
        VALUES (uuid_generate_v7(), r.tenant_id, 'REC/' || upper(r.subdomain) || '/001', v_student_id, 60000, 'cash', v_receipt_series, 'N/A')
        ON CONFLICT DO NOTHING;

        -- Exams
        v_exam_id := uuid_generate_v7();
        INSERT INTO exams (id, tenant_id, academic_year_id, name, status)
        VALUES (v_exam_id, r.tenant_id, v_year_id, 'Term 1', 'published')
        ON CONFLICT DO NOTHING;

        INSERT INTO exam_subjects (exam_id, subject_id, max_marks)
        VALUES (v_exam_id, v_subject_id, 100)
        ON CONFLICT DO NOTHING;

        INSERT INTO marks_entries (exam_id, subject_id, student_id, marks_obtained, entered_by)
        VALUES (v_exam_id, v_subject_id, v_student_id, 88, v_admin_user)
        ON CONFLICT DO NOTHING;

        -- Notices + Admissions + Safety
        INSERT INTO notices (id, tenant_id, title, body, scope, created_by)
        VALUES (uuid_generate_v7(), r.tenant_id, 'Welcome Notice', 'Welcome to ' || r.school_name, '{"type":"all"}'::jsonb, v_admin_user)
        ON CONFLICT DO NOTHING;

        v_enquiry_id := uuid_generate_v7();
        v_application_id := uuid_generate_v7();
        INSERT INTO admission_enquiries (id, tenant_id, student_name, grade_interested, academic_year, parent_name, phone, status)
        VALUES (v_enquiry_id, r.tenant_id, initcap(r.subdomain) || ' Prospect', 'Grade 8', '2025-2026', 'Prospect Parent', '+919733300001', 'open')
        ON CONFLICT DO NOTHING;

        INSERT INTO admission_applications (id, tenant_id, enquiry_id, application_number, status)
        VALUES (v_application_id, r.tenant_id, v_enquiry_id, upper(r.subdomain) || '-APP-001', 'submitted')
        ON CONFLICT DO NOTHING;

        INSERT INTO discipline_incidents (id, tenant_id, student_id, reporter_id, category, title, status)
        VALUES (uuid_generate_v7(), r.tenant_id, v_student_id, v_admin_user, 'behavioral', 'Seeded incident', 'reported')
        ON CONFLICT DO NOTHING;

        INSERT INTO visitors (id, tenant_id, full_name, phone, id_type, id_number)
        VALUES (uuid_generate_v7(), r.tenant_id, initcap(r.subdomain) || ' Visitor', '+919744400001', 'aadhaar', 'XXXX-XXXX-0001')
        ON CONFLICT DO NOTHING;

        -- Transport
        v_vehicle_id := uuid_generate_v7();
        v_route_id := uuid_generate_v7();
        v_driver_id := uuid_generate_v7();
        INSERT INTO transport_vehicles (id, tenant_id, registration_number, capacity, type, status)
        VALUES (v_vehicle_id, r.tenant_id, upper(r.subdomain) || '-BUS-01', 35, 'bus', 'active')
        ON CONFLICT DO NOTHING;

        INSERT INTO transport_routes (id, tenant_id, name, vehicle_id, description)
        VALUES (v_route_id, r.tenant_id, initcap(r.subdomain) || ' Main Route', v_vehicle_id, 'Auto-seeded route')
        ON CONFLICT DO NOTHING;

        INSERT INTO transport_route_stops (id, route_id, name, sequence_order, arrival_time, pickup_cost, drop_cost)
        VALUES (uuid_generate_v7(), v_route_id, 'Central Stop', 1, '07:40:00', 1500, 1500)
        ON CONFLICT DO NOTHING;

        INSERT INTO transport_drivers (id, tenant_id, full_name, license_number, phone)
        VALUES (v_driver_id, r.tenant_id, initcap(r.subdomain) || ' Driver', upper(r.subdomain) || '-DL-001', '+919755500001')
        ON CONFLICT DO NOTHING;

        INSERT INTO transport_allocations (id, tenant_id, student_id, route_id, start_date)
        VALUES (uuid_generate_v7(), r.tenant_id, v_student_id, v_route_id, CURRENT_DATE)
        ON CONFLICT DO NOTHING;

        -- Inventory
        v_inventory_category := uuid_generate_v7();
        v_inventory_supplier := uuid_generate_v7();
        v_inventory_item := uuid_generate_v7();
        INSERT INTO inventory_categories (id, tenant_id, name, type)
        VALUES (v_inventory_category, r.tenant_id, 'Stationery', 'consumable')
        ON CONFLICT DO NOTHING;

        INSERT INTO inventory_suppliers (id, tenant_id, name, contact_person, phone)
        VALUES (v_inventory_supplier, r.tenant_id, initcap(r.subdomain) || ' Supplies', 'Purchase Manager', '+919766600001')
        ON CONFLICT DO NOTHING;

        INSERT INTO inventory_items (id, tenant_id, name, category_id, unit)
        VALUES (v_inventory_item, r.tenant_id, 'Notebook', v_inventory_category, 'pcs')
        ON CONFLICT DO NOTHING;

        INSERT INTO inventory_stocks (id, tenant_id, item_id, quantity)
        VALUES (uuid_generate_v7(), r.tenant_id, v_inventory_item, 500)
        ON CONFLICT DO NOTHING;

        -- Library
        v_library_category := uuid_generate_v7();
        v_library_author := uuid_generate_v7();
        v_library_book := uuid_generate_v7();
        INSERT INTO library_categories (id, tenant_id, name)
        VALUES (v_library_category, r.tenant_id, 'General')
        ON CONFLICT DO NOTHING;

        INSERT INTO library_authors (id, tenant_id, name)
        VALUES (v_library_author, r.tenant_id, initcap(r.subdomain) || ' Author')
        ON CONFLICT DO NOTHING;

        INSERT INTO library_books (id, tenant_id, title, category_id, isbn)
        VALUES (v_library_book, r.tenant_id, initcap(r.subdomain) || ' Handbook', v_library_category, '9780000000001')
        ON CONFLICT DO NOTHING;

        INSERT INTO library_book_authors (book_id, author_id)
        VALUES (v_library_book, v_library_author)
        ON CONFLICT DO NOTHING;

        INSERT INTO library_issues (id, tenant_id, book_id, student_id, issue_date, due_date, status)
        VALUES (uuid_generate_v7(), r.tenant_id, v_library_book, v_student_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'issued')
        ON CONFLICT DO NOTHING;

        -- AI + Hostel + PTM + Communication
        INSERT INTO ai_knowledge_base (id, tenant_id, title, content, content_type)
        VALUES (uuid_generate_v7(), r.tenant_id, 'Campus Emergency Protocol', 'Contact admin office first, then guardians.', 'policy')
        ON CONFLICT DO NOTHING;

        v_hostel_building := uuid_generate_v7();
        v_hostel_room := uuid_generate_v7();
        INSERT INTO hostel_buildings (id, tenant_id, name, type, total_rooms)
        VALUES (v_hostel_building, r.tenant_id, 'Hostel A', 'boys', 10)
        ON CONFLICT DO NOTHING;

        INSERT INTO hostel_rooms (id, building_id, room_number, room_type, capacity, cost_per_month)
        VALUES (v_hostel_room, v_hostel_building, 'A-101', 'double', 2, 4500)
        ON CONFLICT DO NOTHING;

        INSERT INTO hostel_allocations (id, room_id, student_id, allotted_on, status)
        VALUES (uuid_generate_v7(), v_hostel_room, v_student_id, CURRENT_DATE, 'active')
        ON CONFLICT DO NOTHING;

        INSERT INTO ptm_events (id, tenant_id, title, event_date, start_time, end_time, teacher_id)
        VALUES (uuid_generate_v7(), r.tenant_id, 'Monthly PTM', CURRENT_DATE + INTERVAL '5 days', '14:00:00', '17:00:00', v_teacher_user)
        ON CONFLICT DO NOTHING;

        v_chat_room := uuid_generate_v7();
        INSERT INTO chat_rooms (id, tenant_id, student_id, title, is_active)
        VALUES (v_chat_room, r.tenant_id, v_student_id, 'Parent-Teacher Channel', TRUE)
        ON CONFLICT DO NOTHING;

        INSERT INTO chat_participants (room_id, user_id, role) VALUES
        (v_chat_room, v_admin_user, 'admin'),
        (v_chat_room, v_parent_user, 'parent')
        ON CONFLICT DO NOTHING;

        -- Academics depth
        INSERT INTO homework (id, tenant_id, subject_id, class_section_id, teacher_id, title, description, due_date)
        VALUES (uuid_generate_v7(), r.tenant_id, v_subject_id, v_section_id, v_teacher_user, 'Worksheet 1', 'Solve chapter exercises', CURRENT_DATE + INTERVAL '2 days')
        ON CONFLICT DO NOTHING;

        INSERT INTO lesson_plans (id, tenant_id, subject_id, class_id, week_number, planned_topic)
        VALUES (uuid_generate_v7(), r.tenant_id, v_subject_id, v_class_id, 1, 'Introduction and revision')
        ON CONFLICT DO NOTHING;

        -- Automation + Support
        INSERT INTO automation_rules (id, tenant_id, name, description, trigger_event, condition_json, action_json, is_active, created_by, trigger_type)
        VALUES (uuid_generate_v7(), r.tenant_id, 'Fee Reminder', 'Auto reminder for overdue fees', 'fees.overdue', '{}'::jsonb, '{"type":"notification","channel":"email"}'::jsonb, TRUE, v_admin_user, 'event')
        ON CONFLICT DO NOTHING;

        INSERT INTO support_tickets (id, tenant_id, subject, priority, status, tags, source, created_by, metadata)
        VALUES (uuid_generate_v7(), r.tenant_id, 'Need onboarding assistance', 'high', 'open', ARRAY['onboarding'], 'internal', v_admin_user, '{"seeded": true}'::jsonb)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- Platform subscriptions + invoices for all seeded tenants
INSERT INTO tenant_subscriptions (id, tenant_id, plan_id, status, trial_starts_at, trial_ends_at, renews_at, billing_email, tax_profile, dunning_rules, overrides, updated_by)
SELECT
    uuid_generate_v7(),
    t.id,
    '019c4d42-49ca-7e0a-b047-86336ebac7af',
    'active',
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '27 days',
    NOW() + INTERVAL '30 days',
    'billing@' || t.subdomain || '.test',
    '{"gstin":"29ABCDE1234F1Z5"}'::jsonb,
    '{"retry_days":[3,7,14]}'::jsonb,
    '{}'::jsonb,
    '019c4d42-49ca-767c-b3bd-b1a7faf5ad04'
FROM tenants t
ON CONFLICT (tenant_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = EXCLUDED.status,
    trial_starts_at = EXCLUDED.trial_starts_at,
    trial_ends_at = EXCLUDED.trial_ends_at,
    renews_at = EXCLUDED.renews_at,
    billing_email = EXCLUDED.billing_email,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();

INSERT INTO platform_invoices (id, tenant_id, subscription_id, invoice_number, currency, amount_total, tax_amount, status, due_date, issued_at, line_items, metadata, created_by)
SELECT
    uuid_generate_v7(),
    t.id,
    s.id,
    'INV-' || upper(t.subdomain) || '-001',
    'INR',
    5900,
    1062,
    'issued',
    CURRENT_DATE + INTERVAL '15 days',
    NOW(),
    '[{"item":"Pro Plan","amount":5900}]'::jsonb,
    '{"seeded": true}'::jsonb,
    '019c4d42-49ca-767c-b3bd-b1a7faf5ad04'
FROM tenants t
JOIN tenant_subscriptions s ON s.tenant_id = t.id
ON CONFLICT (invoice_number) DO NOTHING;

-- ============================================
-- 19. EXTENDED FEATURE COVERAGE (NON-EMPTY CORE TABLES)
-- ============================================

CREATE TEMP TABLE seed_ctx ON COMMIT DROP AS
SELECT
  t.id AS tenant_id,
  t.subdomain,
  (SELECT b.id FROM branches b WHERE b.tenant_id = t.id ORDER BY b.created_at NULLS LAST, b.id LIMIT 1) AS branch_id,
  (SELECT ra.user_id
   FROM role_assignments ra
   JOIN roles r ON r.id = ra.role_id
   WHERE ra.tenant_id = t.id AND r.code = 'tenant_admin'
   ORDER BY ra.id LIMIT 1) AS admin_user_id,
  (SELECT ra.user_id
   FROM role_assignments ra
   JOIN roles r ON r.id = ra.role_id
   WHERE ra.tenant_id = t.id AND r.code = 'teacher'
   ORDER BY ra.id LIMIT 1) AS teacher_user_id,
  (SELECT s.id FROM students s WHERE s.tenant_id = t.id ORDER BY s.created_at NULLS LAST, s.id LIMIT 1) AS student_id,
  (SELECT e.id FROM employees e WHERE e.tenant_id = t.id ORDER BY e.created_at NULLS LAST, e.id LIMIT 1) AS employee_id,
  (SELECT c.id FROM classes c WHERE c.tenant_id = t.id ORDER BY c.created_at NULLS LAST, c.id LIMIT 1) AS class_id,
  (SELECT cs.id FROM class_sections cs WHERE cs.tenant_id = t.id ORDER BY cs.created_at NULLS LAST, cs.id LIMIT 1) AS section_id,
  (SELECT s.id FROM subjects s WHERE s.tenant_id = t.id ORDER BY s.created_at NULLS LAST, s.id LIMIT 1) AS subject_id,
  (SELECT e.id FROM exams e WHERE e.tenant_id = t.id ORDER BY e.created_at NULLS LAST, e.id LIMIT 1) AS exam_id,
  (SELECT ay.id FROM academic_years ay WHERE ay.tenant_id = t.id ORDER BY ay.created_at NULLS LAST, ay.id LIMIT 1) AS academic_year_id,
  (SELECT fh.id FROM fee_heads fh WHERE fh.tenant_id = t.id ORDER BY fh.created_at NULLS LAST, fh.id LIMIT 1) AS fee_head_id,
  (SELECT r.id FROM receipts r WHERE r.tenant_id = t.id ORDER BY r.created_at NULLS LAST, r.id LIMIT 1) AS receipt_id,
  (SELECT tv.id FROM transport_vehicles tv WHERE tv.tenant_id = t.id ORDER BY tv.created_at NULLS LAST, tv.id LIMIT 1) AS vehicle_id,
  (SELECT ii.id FROM inventory_items ii WHERE ii.tenant_id = t.id ORDER BY ii.created_at NULLS LAST, ii.id LIMIT 1) AS inventory_item_id,
  (SELECT isup.id FROM inventory_suppliers isup WHERE isup.tenant_id = t.id ORDER BY isup.created_at NULLS LAST, isup.id LIMIT 1) AS supplier_id,
  (SELECT st.id FROM support_tickets st WHERE st.tenant_id = t.id ORDER BY st.created_at NULLS LAST, st.id LIMIT 1) AS support_ticket_id,
  (SELECT n.id FROM notices n WHERE n.tenant_id = t.id ORDER BY n.created_at NULLS LAST, n.id LIMIT 1) AS notice_id,
  (SELECT ar.id FROM automation_rules ar WHERE ar.tenant_id = t.id ORDER BY ar.created_at NULLS LAST, ar.id LIMIT 1) AS automation_rule_id
FROM tenants t;

INSERT INTO school_events (id, tenant_id, title, description, event_type, start_time, end_time, location, target_audience, is_active)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  'Monthly Townhall - ' || upper(sc.subdomain),
  'Monthly all-stakeholder alignment event',
  'meeting',
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '2 days 2 hours',
  'Main Auditorium',
  '["teacher","parent","student"]'::jsonb,
  TRUE
FROM seed_ctx sc
ON CONFLICT DO NOTHING;

INSERT INTO event_reminders (id, event_id, reminder_type, remind_at, status)
SELECT
  uuid_generate_v7(),
  se.id,
  'push',
  se.start_time - INTERVAL '6 hours',
  'pending'
FROM (
  SELECT DISTINCT ON (tenant_id) id, tenant_id, start_time
  FROM school_events
  ORDER BY tenant_id, created_at DESC, id DESC
) se
ON CONFLICT DO NOTHING;

INSERT INTO fee_late_rules (id, tenant_id, fee_head_id, rule_type, amount, grace_days, is_active)
SELECT uuid_generate_v7(), sc.tenant_id, sc.fee_head_id, 'daily', 25.00, 3, TRUE
FROM seed_ctx sc
WHERE sc.fee_head_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO fee_concession_rules (id, tenant_id, name, discount_type, value, category, priority, is_active)
SELECT uuid_generate_v7(), sc.tenant_id, 'Merit Scholarship', 'percentage', 10.00, 'scholarship', 1, TRUE
FROM seed_ctx sc
ON CONFLICT DO NOTHING;

INSERT INTO student_concessions (id, student_id, rule_id, approved_by, remarks)
SELECT
  uuid_generate_v7(),
  sc.student_id,
  fcr.id,
  sc.admin_user_id,
  'Auto-seeded concession for QA coverage'
FROM seed_ctx sc
JOIN LATERAL (
  SELECT id FROM fee_concession_rules WHERE tenant_id = sc.tenant_id ORDER BY created_at DESC, id DESC LIMIT 1
) fcr ON TRUE
WHERE sc.student_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO payment_gateway_configs (id, tenant_id, provider, api_key, api_secret, webhook_secret, is_active, settings)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  'razorpay',
  'rzp_live_seed_' || sc.subdomain,
  'seed_secret_' || sc.subdomain,
  'seed_webhook_' || sc.subdomain,
  TRUE,
  '{"mode":"test","currency":"INR"}'::jsonb
FROM seed_ctx sc
ON CONFLICT (tenant_id, provider) DO NOTHING;

INSERT INTO auto_debit_mandates (id, tenant_id, student_id, provider, mandate_ref, max_amount, status, start_date)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  sc.student_id,
  'razorpay_subscription',
  'MANDATE-' || upper(sc.subdomain) || '-001',
  75000,
  'active',
  CURRENT_DATE
FROM seed_ctx sc
WHERE sc.student_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO staff_leave_types (id, tenant_id, name, code, annual_allowance, carry_forward_limit, is_active)
SELECT uuid_generate_v7(), sc.tenant_id, 'Casual Leave', 'CL', 12, 3, TRUE FROM seed_ctx sc
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO staff_leave_requests (id, tenant_id, employee_id, leave_type_id, start_date, end_date, reason, status, reviewed_by, reviewed_at, remarks)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  sc.employee_id,
  slt.id,
  CURRENT_DATE + 5,
  CURRENT_DATE + 6,
  'Personal work',
  'approved',
  sc.admin_user_id,
  NOW(),
  'Approved in seed for reporting coverage'
FROM seed_ctx sc
JOIN staff_leave_types slt ON slt.tenant_id = sc.tenant_id AND slt.code = 'CL'
WHERE sc.employee_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO staff_awards (id, tenant_id, employee_id, award_name, category, awarded_date, awarded_by, description, bonus_amount)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  sc.employee_id,
  'Teacher Excellence Award',
  'Performance',
  CURRENT_DATE - 15,
  'Principal Office',
  'Recognized for strong student outcomes',
  2500.00
FROM seed_ctx sc
WHERE sc.employee_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO staff_transfers (id, tenant_id, employee_id, from_branch_id, to_branch_id, transfer_date, reason, authorized_by, status)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  sc.employee_id,
  sc.branch_id,
  sc.branch_id,
  CURRENT_DATE - 30,
  'Internal department restructuring',
  sc.admin_user_id,
  'completed'
FROM seed_ctx sc
WHERE sc.employee_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO staff_tasks (id, tenant_id, title, description, priority, status, assigned_to, created_by, due_date)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  'Verify monthly attendance summary',
  'Cross-check late marks and half-day entries before payroll',
  'high',
  'in_progress',
  sc.employee_id,
  sc.admin_user_id,
  NOW() + INTERVAL '2 days'
FROM seed_ctx sc
WHERE sc.employee_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO transport_fuel_logs (id, tenant_id, vehicle_id, fill_date, quantity, cost_per_unit, total_cost, odometer_reading, remarks, created_by)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  sc.vehicle_id,
  CURRENT_DATE - 1,
  24.50,
  97.20,
  2381.40,
  12540,
  'Weekly route refill',
  sc.admin_user_id
FROM seed_ctx sc
WHERE sc.vehicle_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO inventory_requisitions (id, tenant_id, requester_id, department, purpose, items, status, approved_by, issued_at)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  sc.admin_user_id,
  'Academics',
  'Monthly classroom stationery replenishment',
  jsonb_build_array(jsonb_build_object('item_id', sc.inventory_item_id, 'quantity', 25, 'unit', 'pcs')),
  'approved',
  sc.admin_user_id,
  NOW()
FROM seed_ctx sc
WHERE sc.admin_user_id IS NOT NULL AND sc.inventory_item_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO student_behavioral_logs (id, tenant_id, student_id, type, category, points, remarks, incident_date, logged_by)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  sc.student_id,
  'merit',
  'academic',
  5,
  'Excellent participation in class activities',
  CURRENT_DATE - 2,
  sc.teacher_user_id
FROM seed_ctx sc
WHERE sc.student_id IS NOT NULL AND sc.teacher_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO student_health_records (id, tenant_id, student_id, blood_group, allergies, vaccinations, medical_conditions, height_cm, weight_kg)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  sc.student_id,
  'B+',
  '["none"]'::jsonb,
  '["MMR","HepB"]'::jsonb,
  'No chronic condition',
  147.5,
  39.8
FROM seed_ctx sc
WHERE sc.student_id IS NOT NULL
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO teacher_class_specializations (id, tenant_id, teacher_id, class_id)
SELECT uuid_generate_v7(), sc.tenant_id, sc.teacher_user_id, sc.class_id
FROM seed_ctx sc
WHERE sc.teacher_user_id IS NOT NULL AND sc.class_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO teacher_absences (id, tenant_id, teacher_id, absence_date, reason, is_notified)
SELECT uuid_generate_v7(), sc.tenant_id, sc.teacher_user_id, CURRENT_DATE + 4, 'Training workshop', TRUE
FROM seed_ctx sc
WHERE sc.teacher_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO exam_question_papers (id, tenant_id, exam_id, subject_id, set_name, file_path, is_encrypted, unlock_at, is_previous_year, academic_year_id)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  sc.exam_id,
  sc.subject_id,
  'Set A',
  's3://seed/' || sc.subdomain || '/question-papers/set-a.pdf',
  TRUE,
  NOW() + INTERVAL '7 days',
  FALSE,
  sc.academic_year_id
FROM seed_ctx sc
WHERE sc.subject_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO paper_access_logs (id, paper_id, user_id, accessed_at, ip_address, user_agent)
SELECT
  uuid_generate_v7(),
  p.id,
  sc.admin_user_id,
  NOW(),
  '10.10.0.1',
  'SeedAgent/1.0'
FROM seed_ctx sc
JOIN LATERAL (
  SELECT id FROM exam_question_papers WHERE tenant_id = sc.tenant_id ORDER BY created_at DESC, id DESC LIMIT 1
) p ON TRUE
WHERE sc.admin_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO exam_paper_questions (id, paper_id, question_id, sort_order)
SELECT
  uuid_generate_v7(),
  p.id,
  q.id,
  1
FROM seed_ctx sc
JOIN LATERAL (
  SELECT id FROM exam_question_papers WHERE tenant_id = sc.tenant_id ORDER BY created_at DESC, id DESC LIMIT 1
) p ON TRUE
JOIN LATERAL (
  SELECT id FROM exam_question_bank WHERE tenant_id = sc.tenant_id ORDER BY created_at DESC, id DESC LIMIT 1
) q ON TRUE
ON CONFLICT DO NOTHING;

INSERT INTO promotion_rules (id, tenant_id, priority, min_aggregate_percent, min_subject_percent, required_attendance_percent, is_active)
SELECT uuid_generate_v7(), sc.tenant_id, 1, 35.00, 33.00, 75.00, TRUE
FROM seed_ctx sc
ON CONFLICT DO NOTHING;

INSERT INTO receipt_items (id, receipt_id, fee_head_id, amount)
SELECT uuid_generate_v7(), sc.receipt_id, sc.fee_head_id, 25000
FROM seed_ctx sc
WHERE sc.receipt_id IS NOT NULL AND sc.fee_head_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO automation_rule_runs (rule_id, tenant_id, run_minute)
SELECT
  ar.id,
  ar.tenant_id,
  date_trunc('minute', NOW() - INTERVAL '1 minute')
FROM automation_rules ar
ON CONFLICT (rule_id, run_minute) DO NOTHING;

INSERT INTO wallets (id, tenant_id, balance_paise)
SELECT uuid_generate_v7(), sc.tenant_id, 150000
FROM seed_ctx sc
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO wallet_ledger (wallet_id, amount_paise, type, description, reference_id)
SELECT
  w.id,
  150000,
  'topup',
  'Seed wallet top-up',
  'seed-' || sc.subdomain
FROM wallets w
JOIN seed_ctx sc ON sc.tenant_id = w.tenant_id
ON CONFLICT DO NOTHING;

INSERT INTO purchase_orders (id, tenant_id, po_number, supplier_id, status, total_amount, notes, created_by, approved_by, approved_at, received_at)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  'PO-' || upper(sc.subdomain) || '-001',
  sc.supplier_id,
  'approved',
  5000.00,
  'Auto-seeded PO for inventory flow testing',
  sc.admin_user_id,
  sc.admin_user_id,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day'
FROM seed_ctx sc
WHERE sc.supplier_id IS NOT NULL
ON CONFLICT (tenant_id, po_number) DO NOTHING;

INSERT INTO purchase_order_items (id, po_id, item_id, quantity, unit_price, received_quantity)
SELECT
  uuid_generate_v7(),
  po.id,
  sc.inventory_item_id,
  50,
  42.50,
  50
FROM seed_ctx sc
JOIN purchase_orders po ON po.tenant_id = sc.tenant_id
WHERE sc.inventory_item_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO notice_acks (notice_id, user_id)
SELECT sc.notice_id, sc.admin_user_id
FROM seed_ctx sc
WHERE sc.notice_id IS NOT NULL AND sc.admin_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO period_attendance_sessions (id, tenant_id, class_section_id, date, period_number, subject_id, marked_by)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  sc.section_id,
  CURRENT_DATE,
  2,
  sc.subject_id,
  sc.teacher_user_id
FROM seed_ctx sc
WHERE sc.section_id IS NOT NULL
ON CONFLICT (class_section_id, date, period_number) DO NOTHING;

INSERT INTO period_attendance_entries (session_id, student_id, status, remarks)
SELECT
  pas.id,
  sc.student_id,
  'present',
  'Seeded period attendance'
FROM seed_ctx sc
JOIN period_attendance_sessions pas ON pas.tenant_id = sc.tenant_id AND pas.date = CURRENT_DATE AND pas.period_number = 2
WHERE sc.student_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO support_ticket_notes (id, ticket_id, note_type, note, attachments, created_by)
SELECT
  uuid_generate_v7(),
  sc.support_ticket_id,
  'internal',
  'Seed note: issue triaged and assigned for follow-up.',
  '[]'::jsonb,
  sc.admin_user_id
FROM seed_ctx sc
WHERE sc.support_ticket_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO security_events (id, tenant_id, user_id, role_name, event_type, severity, method, path, status_code, ip_address, user_agent, origin, request_id, metadata)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  sc.admin_user_id,
  'tenant_admin',
  'auth.login.success',
  'info',
  'POST',
  '/v1/auth/login',
  200,
  '10.20.0.10',
  'SeedBrowser/1.0',
  'web',
  'seed-sec-' || sc.subdomain,
  jsonb_build_object('seeded', true, 'subdomain', sc.subdomain)
FROM seed_ctx sc
WHERE sc.admin_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO platform_security_blocks (id, target_type, target_tenant_id, status, severity, reason, metadata, created_by, expires_at)
SELECT
  uuid_generate_v7(),
  'tenant',
  sc.tenant_id,
  'released',
  'warning',
  'Seeded risk hold for simulation (released)',
  '{"source":"seed","ticket":"SEC-001"}'::jsonb,
  sc.admin_user_id,
  NOW() + INTERVAL '2 days'
FROM seed_ctx sc
WHERE sc.admin_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO platform_security_blocks (id, target_type, target_user_id, status, severity, reason, metadata, created_by, released_by, released_at)
SELECT
  uuid_generate_v7(),
  'user',
  sc.admin_user_id,
  'released',
  'info',
  'Seeded released block for audit history',
  '{"source":"seed","ticket":"SEC-002"}'::jsonb,
  sc.admin_user_id,
  sc.admin_user_id,
  NOW() - INTERVAL '1 day'
FROM seed_ctx sc
WHERE sc.admin_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO legal_doc_versions (id, doc_key, title, version, content_url, requires_acceptance, is_active, published_at, created_by)
VALUES
  (uuid_generate_v7(), 'terms', 'Terms of Service', '2026-02', 'https://schoolerp.example/legal/terms-2026-02', TRUE, TRUE, NOW() - INTERVAL '20 days', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04'),
  (uuid_generate_v7(), 'privacy', 'Privacy Policy', '2026-02', 'https://schoolerp.example/legal/privacy-2026-02', TRUE, TRUE, NOW() - INTERVAL '20 days', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04'),
  (uuid_generate_v7(), 'dpa', 'Data Processing Addendum', '2026-02', 'https://schoolerp.example/legal/dpa-2026-02', TRUE, TRUE, NOW() - INTERVAL '20 days', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04')
ON CONFLICT (doc_key, version) DO NOTHING;

INSERT INTO user_legal_acceptances (id, user_id, doc_key, version, accepted_at, ip_address, user_agent, metadata)
SELECT
  uuid_generate_v7(),
  sc.admin_user_id,
  ldv.doc_key,
  ldv.version,
  NOW() - INTERVAL '10 days',
  '10.10.10.10',
  'SeedBrowser/1.0',
  '{"source":"seed"}'::jsonb
FROM seed_ctx sc
JOIN legal_doc_versions ldv ON ldv.is_active = TRUE
WHERE sc.admin_user_id IS NOT NULL
ON CONFLICT (user_id, doc_key, version) DO NOTHING;

INSERT INTO platform_incidents (id, title, status, severity, scope, affected_tenant_ids, created_by, created_at, updated_at, resolved_at)
VALUES
  (uuid_generate_v7(), 'Intermittent billing API latency', 'monitoring', 'major', 'platform', '{}'::uuid[], '019c4d42-49ca-767c-b3bd-b1a7faf5ad04', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NULL),
  (uuid_generate_v7(), 'Tenant-specific notification delay', 'resolved', 'minor', 'tenant', ARRAY(SELECT tenant_id FROM seed_ctx ORDER BY tenant_id LIMIT 1), '019c4d42-49ca-767c-b3bd-b1a7faf5ad04', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO platform_incident_events (id, incident_id, event_type, message, metadata, created_by, created_at)
SELECT
  uuid_generate_v7(),
  pi.id,
  'update',
  CASE WHEN pi.status = 'resolved'
       THEN 'Incident resolved after cache invalidation and queue replay.'
       ELSE 'Mitigation deployed; monitoring error rates.'
  END,
  '{"seeded":true}'::jsonb,
  '019c4d42-49ca-767c-b3bd-b1a7faf5ad04',
  pi.created_at + INTERVAL '2 hours'
FROM platform_incidents pi
ON CONFLICT DO NOTHING;

INSERT INTO platform_broadcasts (id, incident_id, title, message, channels, tenant_ids, status, created_by, created_at, sent_at)
SELECT
  uuid_generate_v7(),
  pi.id,
  'Incident Update: ' || pi.title,
  'Please note status change: ' || pi.status,
  ARRAY['in_app','email']::text[],
  CASE WHEN pi.scope = 'tenant' THEN pi.affected_tenant_ids ELSE ARRAY(SELECT tenant_id FROM seed_ctx) END,
  'sent',
  '019c4d42-49ca-767c-b3bd-b1a7faf5ad04',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '23 hours'
FROM platform_incidents pi
ON CONFLICT DO NOTHING;

INSERT INTO platform_broadcast_deliveries (id, broadcast_id, tenant_id, status, created_at, delivered_at)
SELECT
  uuid_generate_v7(),
  pb.id,
  sc.tenant_id,
  'completed',
  NOW() - INTERVAL '22 hours',
  NOW() - INTERVAL '21 hours'
FROM platform_broadcasts pb
JOIN seed_ctx sc ON sc.tenant_id = ANY(pb.tenant_ids)
ON CONFLICT DO NOTHING;

INSERT INTO platform_announcements (id, title, content, target_cohorts, target_tenants, starts_at, ends_at, is_active, created_by)
VALUES
(
  uuid_generate_v7(),
  'New analytics drill-down released',
  'Platform analytics now supports module-level revenue trend drill-down.',
  ARRAY['all'],
  ARRAY(SELECT tenant_id FROM seed_ctx),
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '14 days',
  TRUE,
  '019c4d42-49ca-767c-b3bd-b1a7faf5ad04'
)
ON CONFLICT DO NOTHING;

INSERT INTO platform_changelogs (id, version, title, content, type, published_at, created_by)
VALUES
(
  uuid_generate_v7(),
  'v7.3.0',
  'Platform control plane hardening',
  '- Added legal acceptance tracking\n- Expanded incident workflows\n- Improved webhook telemetry',
  'improvement',
  NOW() - INTERVAL '3 days',
  '019c4d42-49ca-767c-b3bd-b1a7faf5ad04'
)
ON CONFLICT DO NOTHING;

INSERT INTO platform_notification_templates (id, code, name, type, subject_template, body_template, variables, is_system, is_active)
VALUES
  (uuid_generate_v7(), 'platform.incident.update', 'Incident Update', 'email', 'Incident update: {{title}}', 'Current status: {{status}}', '["title","status"]'::jsonb, TRUE, TRUE),
  (uuid_generate_v7(), 'platform.billing.reminder', 'Billing Reminder', 'email', 'Billing reminder for {{tenant}}', 'Your invoice {{invoice_number}} is due on {{due_date}}.', '["tenant","invoice_number","due_date"]'::jsonb, TRUE, TRUE),
  (uuid_generate_v7(), 'platform.security.alert', 'Security Alert', 'whatsapp', NULL, 'Security alert: {{event_type}} ({{severity}})', '["event_type","severity"]'::jsonb, TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO platform_document_templates (id, code, name, type, file_url, schema, template_html, is_active)
VALUES
  (uuid_generate_v7(), 'platform.invoice.default', 'Default Invoice Template', 'receipt', 'https://schoolerp.example/templates/invoice-default.html', '{"version":"1.0"}'::jsonb, '<html><body>Invoice Template</body></html>', TRUE),
  (uuid_generate_v7(), 'platform.admit-card.default', 'Default Admit Card Template', 'report_card', 'https://schoolerp.example/templates/admit-card-default.html', '{"version":"1.0"}'::jsonb, '<html><body>Admit Card Template</body></html>', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO platform_api_keys (id, tenant_id, name, key_hash, key_last4, scopes, is_active, created_by, rotated_at)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  'Seed Integration Key',
  md5('seed-' || sc.subdomain || '-api-key'),
  upper(right(md5(sc.subdomain), 4)),
  ARRAY['platform:integrations.read','platform:billing.read'],
  TRUE,
  sc.admin_user_id,
  NOW() - INTERVAL '1 day'
FROM seed_ctx sc
WHERE sc.admin_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO platform_webhooks (id, tenant_id, name, target_url, secret_hash, events, is_active, created_by, created_at, updated_at)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  'Primary Ops Webhook',
  'https://webhook.' || sc.subdomain || '.example/schoolerp',
  md5('webhook-secret-' || sc.subdomain),
  ARRAY['tenant.created','invoice.issued','incident.updated'],
  TRUE,
  sc.admin_user_id,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day'
FROM seed_ctx sc
WHERE sc.admin_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO integration_logs (id, webhook_id, tenant_id, event_type, status, http_status, request_payload, response_payload, created_at)
SELECT
  uuid_generate_v7(),
  pw.id,
  pw.tenant_id,
  'invoice.issued',
  'delivered',
  200,
  '{"invoice_number":"seed-001"}'::jsonb,
  '{"ok":true}'::jsonb,
  NOW() - INTERVAL '12 hours'
FROM platform_webhooks pw
ON CONFLICT DO NOTHING;

INSERT INTO platform_backups (id, tenant_id, action, status, payload, requested_by, approved_by, completed_at, created_at)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  'backup',
  'completed',
  '{"mode":"full","include_blobs":false}'::jsonb,
  sc.admin_user_id,
  sc.admin_user_id,
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '8 hours'
FROM seed_ctx sc
WHERE sc.admin_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO platform_action_approvals (id, action_type, target_tenant_id, payload, requested_by, approved_by, status, reason, expires_at, approved_at, created_at)
SELECT
  uuid_generate_v7(),
  'tenant.freeze',
  sc.tenant_id,
  '{"reason":"security review","hours":24}'::jsonb,
  sc.admin_user_id,
  sc.admin_user_id,
  'approved',
  'Seeded action approval for workflow tests',
  NOW() + INTERVAL '1 day',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '4 hours'
FROM seed_ctx sc
WHERE sc.admin_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO outbox_events (tenant_id, event_type, payload, status, attempts, process_after, request_id)
SELECT
  sc.tenant_id,
  'platform.seed.event',
  jsonb_build_object('tenant', sc.subdomain, 'kind', 'seed_verification'),
  'pending',
  0,
  NOW() + INTERVAL '5 minutes',
  'seed-outbox-' || sc.subdomain
FROM seed_ctx sc
ON CONFLICT DO NOTHING;

INSERT INTO notification_templates (id, tenant_id, code, channel, locale, subject, body)
SELECT
  uuid_generate_v7(),
  sc.tenant_id,
  'fees.overdue.reminder',
  'email',
  'en-IN',
  'Fee overdue reminder',
  'Dear Parent, fee dues are pending for your ward.'
FROM seed_ctx sc
ON CONFLICT (tenant_id, code, channel, locale) DO NOTHING;

INSERT INTO notification_templates (id, tenant_id, code, channel, locale, subject, body)
VALUES
  (uuid_generate_v7(), NULL, 'platform.system.notice', 'email', 'en-IN', 'System notice', 'A platform-level maintenance notice is published.')
ON CONFLICT (tenant_id, code, channel, locale) DO NOTHING;

INSERT INTO platform_analytics_snapshots (id, metric_name, metric_value, dimensions, snapshot_date)
VALUES
  (uuid_generate_v7(), 'revenue.total', 1250000, '{"currency":"INR","period":"30d"}'::jsonb, CURRENT_DATE),
  (uuid_generate_v7(), 'tenants.active', 3, '{"segment":"all"}'::jsonb, CURRENT_DATE),
  (uuid_generate_v7(), 'tickets.open', 2, '{"priority":"all"}'::jsonb, CURRENT_DATE)
ON CONFLICT DO NOTHING;

INSERT INTO platform_master_data_templates (id, type, name, payload, is_default)
VALUES
  (uuid_generate_v7(), 'grade_system', 'Default CBSE Grade Bands', '{"A1":"91-100","A2":"81-90","B1":"71-80"}'::jsonb, TRUE),
  (uuid_generate_v7(), 'subjects', 'STEM Starter Pack', '{"subjects":["Mathematics","Physics","Chemistry","Biology"]}'::jsonb, TRUE)
ON CONFLICT DO NOTHING;

COMMIT;
