-- infra/seed/demo_seed.sql

-- 1. Insert Demo Types
-- 1. Insert Demo Types
INSERT INTO demo_types (name, duration_minutes, description)
SELECT 'Academic Focus', 30, 'Deep dive into student records, attendance, and examinations.'
WHERE NOT EXISTS (SELECT 1 FROM demo_types WHERE name = 'Academic Focus');

INSERT INTO demo_types (name, duration_minutes, description)
SELECT 'Finance & ERP', 45, 'Detailed look at fee collection, payroll, and inventory management.'
WHERE NOT EXISTS (SELECT 1 FROM demo_types WHERE name = 'Finance & ERP');

INSERT INTO demo_types (name, duration_minutes, description)
SELECT 'Full School Vision', 60, 'Complete strategic overview for Principals and Administrators.'
WHERE NOT EXISTS (SELECT 1 FROM demo_types WHERE name = 'Full School Vision');

-- 2. Insert Default Availability Rules (Mon-Fri, 10 AM - 6 PM IST)
-- Only insert if table is empty to avoid duplicating rules
INSERT INTO availability_rules (day_of_week, start_time, end_time, slot_interval_minutes)
SELECT d, '10:00:00', '18:00:00', 30
FROM generate_series(1, 5) d
WHERE NOT EXISTS (SELECT 1 FROM availability_rules LIMIT 1);

-- 3. Insert a Sample Booking
INSERT INTO demo_bookings (
    demo_type_id, 
    start_at_utc, 
    end_at_utc, 
    timezone, 
    status, 
    name, 
    email, 
    phone, 
    school_name, 
    confirmation_token
) VALUES (
    (SELECT id FROM demo_types LIMIT 1),
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days' + INTERVAL '30 minutes',
    'Asia/Kolkata',
    'confirmed',
    'Test Administrator',
    'admin@testschool.edu.in',
    '+919000000001',
    'Global Public School',
    'seed-token-123'
) ON CONFLICT (confirmation_token) DO NOTHING;
