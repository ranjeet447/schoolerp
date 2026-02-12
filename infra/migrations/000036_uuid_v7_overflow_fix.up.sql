-- 000036_uuid_v7_overflow_fix.up.sql
-- Fix uuid_generate_v7() overflow from previous implementation.
--
-- Prior logic attempted to compute:
--   2 * 4611686018427387904 + rand
-- which overflows bigint (2^63) in PostgreSQL.
--
-- This implementation assembles UUIDv7 as hex segments without overflowing bigint.

CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid
AS $$
DECLARE
  v_unix_t bigint;
  v_rand_a integer;
  v_variant_nibble integer;
  v_rand_b bigint;
  v_hex text;
BEGIN
  -- 48-bit unix milliseconds
  v_unix_t := floor(EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint;

  -- 12 random bits
  v_rand_a := floor(random() * 4096)::integer;

  -- Variant nibble 10xx (8..11)
  v_variant_nibble := 8 + floor(random() * 4)::integer;

  -- 60 random bits (keeps arithmetic inside bigint range)
  v_rand_b := floor(random() * 1152921504606846976)::bigint; -- 2^60

  v_hex :=
    lpad(to_hex(v_unix_t), 12, '0') ||
    lpad(to_hex((7 << 12) + v_rand_a), 4, '0') ||
    to_hex(v_variant_nibble) ||
    lpad(to_hex(v_rand_b), 15, '0');

  RETURN (
    substr(v_hex, 1, 8) || '-' ||
    substr(v_hex, 9, 4) || '-' ||
    substr(v_hex, 13, 4) || '-' ||
    substr(v_hex, 17, 4) || '-' ||
    substr(v_hex, 21, 12)
  )::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;
