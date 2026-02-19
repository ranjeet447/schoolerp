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
('019c4d42-c25e-7740-9510-d5d3df33368a', 'Transport Manager', 'transport_manager', 'Fleet management', TRUE)
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

-- 1.6 SaaS Admin Assignment
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type)
VALUES ('019c4d42-49ca-73e1-be64-56377f64b05b', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04', '019c4d42-49ca-7166-9de9-5e97220dc819', 'platform')
ON CONFLICT (id) DO NOTHING;

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
('019c4d42-c260-7817-7777-1814f78d6666', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 12, 2024, 'completed'),
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

COMMIT;
