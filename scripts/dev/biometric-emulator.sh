#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8080/v1}"
TENANT_ID="${TENANT_ID:-}"
JWT_TOKEN="${JWT_TOKEN:-}"
DEVICE_ID="${DEVICE_ID:-BIO-EMU-01}"
IDENTIFIER="${IDENTIFIER:-RFID-1001}"
DIRECTION="${DIRECTION:-in}"
COUNT="${COUNT:-1}"
DELAY_MS="${DELAY_MS:-300}"

if [[ -z "${TENANT_ID}" ]]; then
  echo "TENANT_ID is required"
  exit 1
fi

if [[ -z "${JWT_TOKEN}" ]]; then
  echo "JWT_TOKEN is required"
  exit 1
fi

for ((i=1; i<=COUNT; i++)); do
  ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  payload="$(cat <<JSON
{"device_id":"${DEVICE_ID}","identifier":"${IDENTIFIER}","direction":"${DIRECTION}","timestamp":"${ts}"}
JSON
)"
  echo "[$i/$COUNT] POST ${API_BASE_URL}/admin/biometric/ingest ${payload}"
  curl -sS -X POST "${API_BASE_URL}/admin/biometric/ingest" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-ID: ${TENANT_ID}" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    --data "${payload}" | sed 's/^/  response: /'
  echo
  if [[ "$i" -lt "$COUNT" ]]; then
    perl -e "select(undef, undef, undef, ${DELAY_MS}/1000)"
  fi
done

cat <<EOF
Done.
- Repeat same IDENTIFIER within a few seconds to validate duplicate-punch idempotent upsert behavior.
- Use DIRECTION=out to simulate staff check-out max-time updates.
EOF
