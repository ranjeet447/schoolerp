-- 000077_certificate_issuance.down.sql

DROP TABLE IF EXISTS certificates;

DELETE FROM permissions WHERE code IN ('sis:certificates.read', 'sis:certificates.write');
