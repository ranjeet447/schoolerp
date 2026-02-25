-- 000080_integrations_addons_credits.down.sql

DROP INDEX IF EXISTS idx_webhook_logs_created_at;
DROP INDEX IF EXISTS idx_webhook_logs_tenant_provider_created;

DROP INDEX IF EXISTS idx_tenant_credit_ledger_tenant_wallet_created;
DROP TABLE IF EXISTS tenant_credit_ledger;
DROP TABLE IF EXISTS tenant_credit_wallets;

DROP INDEX IF EXISTS idx_live_class_events_teacher;
DROP INDEX IF EXISTS idx_live_class_events_tenant_schedule;
DROP TABLE IF EXISTS live_class_events;

DROP INDEX IF EXISTS idx_tenant_integrations_status;
DROP TABLE IF EXISTS tenant_integrations;

ALTER TABLE tenant_addons
  DROP COLUMN IF EXISTS metadata,
  DROP COLUMN IF EXISTS billing_source,
  DROP COLUMN IF EXISTS renew_at,
  DROP COLUMN IF EXISTS end_at,
  DROP COLUMN IF EXISTS start_at;

ALTER TABLE platform_addons
  DROP COLUMN IF EXISTS included_credits,
  DROP COLUMN IF EXISTS integration_unlocked,
  DROP COLUMN IF EXISTS features_unlocked,
  DROP COLUMN IF EXISTS requires_approval,
  DROP COLUMN IF EXISTS status;

