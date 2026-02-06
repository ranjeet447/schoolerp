#!/bin/bash

# Configuration
DB_URL=${DATABASE_URL:-"postgres://schoolerp:password@localhost:5432/schoolerp?sslmode=disable"}

echo "--- SchoolERP Database Seeding ---"

# 1. Base Seed
echo "Applying base seed (permissions, roles)..."
psql "$DB_URL" -f infra/seed/seed.sql

# 2. Optional Demo Data
if [ "$1" == "--demo" ]; then
    echo "Applying demo seed data..."
    psql "$DB_URL" -f infra/seed/demo_seed.sql
fi

echo "Seeding complete."
