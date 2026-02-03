-- infra/seed/demo_seed.sql

-- 1. Insert Demo Types
INSERT INTO demo_types (name, duration_minutes, description) VALUES
('Academic Focus', 30, 'Deep dive into student records, attendance, and examinations.'),
('Finance & ERP', 45, 'Detailed look at fee collection, payroll, and inventory management.'),
('Full School Vision', 60, 'Complete strategic overview for Principals and Administrators.');

-- 2. Insert Default Availability Rules (Mon-Fri, 10 AM - 6 PM IST)
-- start_time and end_time are relative to the rule's timezone (Asia/Kolkata)
INSERT INTO availability_rules (day_of_week, start_time, end_time, slot_interval_minutes)
SELECT d, '10:00:00', '18:00:00', 30
FROM generate_series(1, 5) d;

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
);
