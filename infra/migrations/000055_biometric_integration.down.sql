-- 000055_biometric_integration.down.sql

DROP TABLE IF EXISTS biometric_logs;

ALTER TABLE students DROP COLUMN IF EXISTS rfid_tag;
ALTER TABLE students DROP COLUMN IF EXISTS biometric_id;

ALTER TABLE employees DROP COLUMN IF EXISTS rfid_tag;
ALTER TABLE employees DROP COLUMN IF EXISTS biometric_id;
