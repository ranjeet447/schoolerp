-- 000035_uuid_v7_support.up.sql
-- Implements UUID v7 generation in Pure SQL (PL/pgSQL)
-- UUID v7 is time-ordered and much better for DB indexing than v4.

CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid
AS $$
DECLARE
  v_time timestamp with time zone:= clock_timestamp();
  v_unix_t bigint;
  v_rand_a bigint;
  v_rand_b bigint;
  v_bytea bytea;
BEGIN
  v_unix_t := (EXTRACT(EPOCH FROM v_time) * 1000)::bigint;
  v_rand_a := (random() * 4096)::int; -- 12 bits
  v_rand_b := (random() * 4611686018427387904)::bigint; -- 62 bits
  
  -- Build bytea: 48 bits time, 4 bits version (7), 12 bits rand_a, 2 bits variant (10), 62 bits rand_b
  v_bytea := decode(
    lpad(to_hex(v_unix_t), 12, '0') ||
    to_hex(7 * 4096 + v_rand_a) ||
    to_hex(2 * 4611686018427387904 + v_rand_b),
    'hex'
  );
  
  RETURN encode(v_bytea, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Update Core SaaS table defaults
ALTER TABLE tenants ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE branches ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE users ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE user_identities ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE sessions ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE roles ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE permissions ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE role_assignments ALTER COLUMN id SET DEFAULT uuid_generate_v7();

-- Update SIS table defaults
ALTER TABLE students ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE guardians ALTER COLUMN id SET DEFAULT uuid_generate_v7();

-- Update HRMS table defaults
ALTER TABLE employees ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE payroll_runs ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE payslips ALTER COLUMN id SET DEFAULT uuid_generate_v7();

-- Update Fees table defaults
ALTER TABLE receipts ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE payment_orders ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE fee_plans ALTER COLUMN id SET DEFAULT uuid_generate_v7();

-- Update AI KB table defaults
ALTER TABLE ai_knowledge_base ALTER COLUMN id SET DEFAULT uuid_generate_v7();
