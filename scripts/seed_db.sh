#!/usr/bin/env bash
set -euo pipefail

# Configuration
DB_URL=${DATABASE_URL:-"postgres://schoolerp:password@localhost:5432/schoolerp?sslmode=disable"}
MODE=${1:---bootstrap}

usage() {
  cat <<'EOF'
Usage:
  ./scripts/seed_db.sh --bootstrap   # Safe idempotent seed (default)
  ./scripts/seed_db.sh --reset       # Destructive reset + reseed
  ./scripts/seed_db.sh --marketing   # Marketing demo fixtures only
EOF
}

echo "--- SchoolERP Database Seeding ---"
echo "Database: $DB_URL"

case "$MODE" in
  --bootstrap)
    echo "Applying SAFE bootstrap seed: infra/migrations/seed_users.sql"
    psql "$DB_URL" -v ON_ERROR_STOP=1 -f infra/migrations/seed_users.sql
    ;;
  --reset)
    echo "Applying DESTRUCTIVE reset seed: infra/migrations/seed_production.sql"
    psql "$DB_URL" -v ON_ERROR_STOP=1 -f infra/migrations/seed_production.sql
    ;;
  --marketing)
    echo "Applying marketing demo fixtures: infra/seed/demo_seed.sql"
    psql "$DB_URL" -v ON_ERROR_STOP=1 -f infra/seed/demo_seed.sql
    ;;
  *)
    usage
    exit 1
    ;;
esac

echo "Seeding complete."
