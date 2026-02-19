#!/usr/bin/env bash
set -euo pipefail

# Add common psql paths for macOS/Linux
export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin:/Library/PostgreSQL/14/bin"

# Database connection details
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
  --bootstrap | --reset)
    echo "Applying COMPREHENSIVE v7 seed: infra/seed/seed_data.sql"
    psql "$DB_URL" -v ON_ERROR_STOP=1 -f infra/seed/seed_data.sql
    ;;
  --marketing)
    echo "Marketing mode is now deprecated. Use --bootstrap for unified data."
    echo "Falling back to comprehensive seed..."
    psql "$DB_URL" -v ON_ERROR_STOP=1 -f infra/seed/seed_data.sql
    ;;
  *)
    usage
    exit 1
    ;;
esac

echo "Seeding complete."
