-- SchoolERP Comprehensive Data Hydration (v7)
-- Hydrates Academic, SIS, HRMS, Fees, Attendance, Exams, and AI KB modules
-- USES UNIQUE UUID v7 FROM USER LIST (Offset 100+)

BEGIN;

-- ============================================
-- 1. ACADEMIC STRUCTURE
-- ============================================

-- Academic Years (Lines 100-101)
INSERT INTO academic_years (id, tenant_id, name, start_date, end_date, is_active) VALUES
('019c4d42-49ca-7ec3-a3fc-de2bd942e1e6', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '2025-2026', '2025-04-01', '2026-03-31', TRUE),
('019c4d42-49ca-7f83-a077-87b68effdf10', '019c4d42-49ca-7861-9293-59cbaaea5d14', '2025-2026', '2025-06-01', '2026-05-31', TRUE);

-- Classes (Lines 102-103)
INSERT INTO classes (id, tenant_id, name, level) VALUES
('019c4d42-49ca-7347-8508-f9d57d70bbf6', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Grade 10', 10),
('019c4d42-49ca-7fb5-899f-edf278ae8217', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Grade 11', 11);

-- Sections (Lines 104-105)
INSERT INTO sections (id, tenant_id, class_id, name, capacity) VALUES
('019c4d42-49ca-71a1-bf87-9053f8107881', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-7347-8508-f9d57d70bbf6', 'A', 40),
('019c4d42-49ca-7a68-9970-6880bbb05a78', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-7347-8508-f9d57d70bbf6', 'B', 40);

-- Subjects (Lines 106-107)
INSERT INTO subjects (id, tenant_id, name, code) VALUES
('019c4d42-49ca-7c0b-a93a-98359014061f', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Mathematics', 'MATH10'),
('019c4d42-49ca-73fa-9adc-56a8440aa164', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Physics', 'PHYS10');

-- ============================================
-- 2. PEOPLE (Students & Guardians)
-- ============================================

-- Students (Lines 110-113)
INSERT INTO students (id, tenant_id, admission_number, full_name, section_id, status) VALUES
('019c4d42-49ca-794f-b77f-68b3b291152c', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025001', 'Arjun Sharma', '019c4d42-49ca-71a1-bf87-9053f8107881', 'active'),
('019c4d42-49ca-7d7d-8d5b-dd8f34b5d0af', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025002', 'Sanya Iyer', '019c4d42-49ca-71a1-bf87-9053f8107881', 'active'),
('019c4d42-49ca-7adf-b48e-4b9a04a3cefc', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025003', 'Rohan Gupta', '019c4d42-49ca-7a68-9970-6880bbb05a78', 'active'),
('019c4d42-49ca-7503-9b64-ee648ba040ad', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'ADM2025004', 'Ananya Verma', '019c4d42-49ca-7a68-9970-6880bbb05a78', 'active');

-- Guardians (Lines 120-123)
INSERT INTO guardians (id, tenant_id, full_name, phone, email) VALUES
('019c4d42-49ca-752d-8a6d-591b96cc63d7', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Rajesh Sharma', '+919800011122', 'rajesh.sharma@example.com'),
('019c4d42-49ca-7c66-a3e1-34041dbcaeca', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Meera Iyer', '+919800033344', 'meera.iyer@example.com'),
('019c4d42-49ca-7156-a4a7-2981fea25b77', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Suresh Gupta', '+919800055566', 'suresh.gupta@example.com'),
('019c4d42-49ca-7b45-ad5e-f13ce2b12cca', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Kavita Verma', '+919800077788', 'kavita.verma@example.com');

-- Linking (Line 124-127)
INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary) VALUES
('019c4d42-49ca-794f-b77f-68b3b291152c', '019c4d42-49ca-752d-8a6d-591b96cc63d7', 'father', TRUE),
('019c4d42-49ca-7d7d-8d5b-dd8f34b5d0af', '019c4d42-49ca-7c66-a3e1-34041dbcaeca', 'mother', TRUE),
('019c4d42-49ca-7adf-b48e-4b9a04a3cefc', '019c4d42-49ca-7156-a4a7-2981fea25b77', 'father', TRUE),
('019c4d42-49ca-7503-9b64-ee648ba040ad', '019c4d42-49ca-7b45-ad5e-f13ce2b12cca', 'mother', TRUE);

-- ============================================
-- 3. HRMS (Employees & Payroll)
-- ============================================

-- Salary Structures (Line 135)
INSERT INTO salary_structures (id, tenant_id, name, basic, hra, da) VALUES
('019c4d42-49ca-7337-b9f0-7d04d8d901b6', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Standard Faculty A', 45000.00, 15000.00, 5000.00);

-- Employees (Linking teacher from seed_production + new line 130)
INSERT INTO employees (id, tenant_id, user_id, employee_code, full_name, designation, salary_structure_id) VALUES
('019c4d42-49ca-70ee-9169-0e1d2e446462', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-765c-a638-deef0366aff8', 'EMP2025001', 'Ms. Priya Sharma', 'Senior Mathematics Mentor', '019c4d42-49ca-7337-b9f0-7d04d8d901b6');

-- ============================================
-- 4. ATTENDANCE
-- ============================================

-- Attendance Session (Line 140)
INSERT INTO attendance_sessions (id, tenant_id, class_section_id, date, marked_by) VALUES
('019c4d42-49ca-7651-84c4-c5396a5dfc96', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-71a1-bf87-9053f8107881', CURRENT_DATE, '019c4d42-49ca-765c-a638-deef0366aff8');

-- Entries
INSERT INTO attendance_entries (session_id, student_id, status) VALUES
('019c4d42-49ca-7651-84c4-c5396a5dfc96', '019c4d42-49ca-794f-b77f-68b3b291152c', 'present'),
('019c4d42-49ca-7651-84c4-c5396a5dfc96', '019c4d42-49ca-7d7d-8d5b-dd8f34b5d0af', 'present');

-- ============================================
-- 5. FEES
-- ============================================

-- Fee Heads (Lines 150-151)
INSERT INTO fee_heads (id, tenant_id, name, type) VALUES
('019c4d42-49ca-766b-af08-9fc7f638f168', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Academic Tuition', 'recurring'),
('019c4d42-49ca-7e5b-9c2d-6c1ff19a3ee3', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Digital Lab Access', 'recurring');

-- Fee Plans (Line 154)
INSERT INTO fee_plans (id, tenant_id, name, academic_year_id, total_amount) VALUES
('019c4d42-49ca-7b81-a6a3-548c83d93975', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Premium Grade 10 Plan', '019c4d42-49ca-7ec3-a3fc-de2bd942e1e6', 7500000);

-- Plan Items
INSERT INTO fee_plan_items (plan_id, head_id, amount, due_date) VALUES
('019c4d42-49ca-7b81-a6a3-548c83d93975', '019c4d42-49ca-766b-af08-9fc7f638f168', 6500000, '2025-05-15'),
('019c4d42-49ca-7b81-a6a3-548c83d93975', '019c4d42-49ca-7e5b-9c2d-6c1ff19a3ee3', 1000000, '2025-05-15');

-- Assign to Student
INSERT INTO student_fee_plans (student_id, plan_id) VALUES
('019c4d42-49ca-794f-b77f-68b3b291152c', '019c4d42-49ca-7b81-a6a3-548c83d93975');

-- ============================================
-- 6. EXAMS & MARKS
-- ============================================

-- Exams (Line 160)
INSERT INTO exams (id, tenant_id, academic_year_id, name, status) VALUES
('019c4d42-49ca-7e3a-a998-b5cd5afdc6bc', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-7ec3-a3fc-de2bd942e1e6', 'Monthly Assessment - April', 'published');

-- Exam Subjects
INSERT INTO exam_subjects (exam_id, subject_id, max_marks) VALUES
('019c4d42-49ca-7e3a-a998-b5cd5afdc6bc', '019c4d42-49ca-7c0b-a93a-98359014061f', 50),
('019c4d42-49ca-7e3a-a998-b5cd5afdc6bc', '019c4d42-49ca-73fa-9adc-56a8440aa164', 50);

-- Marks Entries
INSERT INTO marks_entries (exam_id, subject_id, student_id, marks_obtained, entered_by) VALUES
('019c4d42-49ca-7e3a-a998-b5cd5afdc6bc', '019c4d42-49ca-7c0b-a93a-98359014061f', '019c4d42-49ca-794f-b77f-68b3b291152c', 48.50, '019c4d42-49ca-765c-a638-deef0366aff8'),
('019c4d42-49ca-7e3a-a998-b5cd5afdc6bc', '019c4d42-49ca-73fa-9adc-56a8440aa164', '019c4d42-49ca-794f-b77f-68b3b291152c', 44.00, '019c4d42-49ca-765c-a638-deef0366aff8');

-- ============================================
-- 7. NOTICES & AI KB
-- ============================================

-- Notice (Line 170)
INSERT INTO notices (id, tenant_id, title, body, scope, created_by) VALUES
('019c4d42-49ca-79b5-ae6e-dec30316762b', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Annual Sports Week', 'Join us for the most exciting week of the year starting April 20th!', '{"type": "all"}', '019c4d42-49ca-765c-a638-deef0366aff8');

-- AI KB (Lines 171-172)
INSERT INTO ai_knowledge_base (id, tenant_id, title, content, content_type) VALUES
('019c4d42-49ca-7114-8749-9c4dc7454336', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Emergency Contact Protocol', 'In case of medical emergency, contact the school health clinic at ext 911. Parent notification will be immediate.', 'policy'),
('019c4d42-49ca-79b4-ae8a-7504b79cb6a9', '019c4d42-49ca-7861-9293-59cbaaea5d14', 'Elite Academy Scholarship', 'We offer 100% tuition coverage for students maintaining a GPA of 3.8+ and demonstrating leadership.', 'faq');

COMMIT;
