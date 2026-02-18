-- VERIFY PLATFORM SEED DATA
SELECT 'Platform Plans' as category, COUNT(*) as count FROM platform_plans;
SELECT 'Tenants' as category, COUNT(*) as count FROM tenants;
SELECT 'Subscriptions' as category, COUNT(*) as count FROM tenant_subscriptions;
SELECT 'Support Tickets' as category, COUNT(*) as count FROM support_tickets;
SELECT 'Signup Requests' as category, COUNT(*) as count FROM tenant_signup_requests;
SELECT 'Platform Settings' as category, COUNT(*) as count FROM platform_settings;
