-- platform_extras_seed.sql

-- Notification Templates
INSERT INTO platform_notification_templates (name, code, type, subject_template, body_template, is_active) VALUES
('Welcome Email', 'welcome_email', 'email', 'Welcome to {{school_name}}', 'Hello {{user_name}}, welcome to our platform.', TRUE),
('Payment Received', 'payment_received', 'email', 'Payment Success - {{invoice_id}}', 'We have received your payment of {{amount}}.', TRUE),
('Low Balance Alert', 'sms_low_balance', 'sms', NULL, 'Your account balance is low. Please recharge.', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Document Templates
INSERT INTO platform_document_templates (name, code, file_url, is_active) VALUES
('Student ID Card', 'student_id_card', 'https://s3.amazonaws.com/templates/id_card_v1.pdf', TRUE),
('Monthly Invoice', 'monthly_invoice', 'https://s3.amazonaws.com/templates/invoice_v2.pdf', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Announcements
INSERT INTO platform_announcements (title, content, target_cohorts, starts_at, ends_at, is_active) VALUES
('Scheduled Maintenance', 'Platform will be down for maintenance on Sunday 2 AM.', '{"all"}', NOW(), NOW() + INTERVAL '7 days', TRUE),
('New Feature: Transport Management', 'We have launched new transport module. Check it out!', '{"pro", "enterprise"}', NOW(), NOW() + INTERVAL '30 days', TRUE)
ON CONFLICT DO NOTHING;

-- Changelogs
INSERT INTO platform_changelogs (version, title, content, type, published_at) VALUES
('1.2.0', 'Super Admin Extras', 'Implemented comprehensive super admin controls for settings, marketing, and analytics.', 'major', NOW()),
('1.1.5', 'Performance Fixes', 'Optimized database queries for faster reporting.', 'fix', NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

-- Analytics Snapshots
INSERT INTO platform_analytics_snapshots (metric_name, metric_value, dimensions, snapshot_date) VALUES
('revenue', 1250000.00, '{"region": "Maharashtra"}', CURRENT_DATE - INTERVAL '2 days'),
('revenue', 1320000.00, '{"region": "Maharashtra"}', CURRENT_DATE - INTERVAL '1 day'),
('revenue', 1482500.00, '{"region": "Maharashtra"}', CURRENT_DATE),
('active_schools', 115, '{}', CURRENT_DATE - INTERVAL '2 days'),
('active_schools', 120, '{}', CURRENT_DATE - INTERVAL '1 day'),
('active_schools', 124, '{}', CURRENT_DATE)
ON CONFLICT DO NOTHING;
