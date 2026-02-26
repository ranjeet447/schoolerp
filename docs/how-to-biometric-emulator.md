# How To: Biometric Emulator (Dev/Test)

Use the dev emulator to simulate biometric device punches without hardware.

Script:
- `scripts/dev/biometric-emulator.sh`

## Prerequisites

- API running locally
- Tenant admin JWT token (or role allowed to call biometric endpoints)
- Tenant ID for the school you want to test

## Example

```bash
API_BASE_URL=http://localhost:8080/v1 \
TENANT_ID=<tenant-uuid> \
JWT_TOKEN=<jwt> \
DEVICE_ID=BIO-EMU-01 \
IDENTIFIER=RFID-1001 \
DIRECTION=in \
COUNT=3 \
DELAY_MS=500 \
bash scripts/dev/biometric-emulator.sh
```

## What to validate

- `POST /v1/admin/biometric/ingest` accepts device punches
- Duplicate punches do not create duplicate student attendance rows (`attendance_entries` upsert path)
- Staff `in/out` drift handling preserves earliest check-in and latest check-out
- `GET /v1/admin/biometric/devices` and `GET /v1/admin/biometric/logs` reflect ingested data

## Notes

- This is a dev/test convenience tool only.
- It does not emulate vendor-specific biometric protocols; it exercises the SchoolERP ingest API contract.
