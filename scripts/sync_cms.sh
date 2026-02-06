#!/bin/bash

# Configuration
DIRECTUS_URL=${CMS_URL:-"http://localhost:8055"}
ADMIN_TOKEN=${CMS_TOKEN:-""}

echo "--- SchoolERP CMS Verification ---"

if [ -z "$ADMIN_TOKEN" ]; then
    echo "Warning: CMS_TOKEN not set. Skipping authenticated checks."
    exit 0
fi

# 1. Health Check
echo "Checking Directus health at $DIRECTUS_URL..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$DIRECTUS_URL/server/health")
if [ "$HEALTH" != "200" ]; then
    echo "Error: Directus is not responding (Status: $HEALTH)"
    exit 1
fi

# 2. Collection Verification (ERP Content Model)
declare -a collections=("notices" "website_sections" "faq" "school_configuration")

for coll in "${collections[@]}"; do
    echo "Verifying collection: $coll"
    CHECK=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$DIRECTUS_URL/collections/$coll")
    if echo "$CHECK" | grep -q "errors"; then
        echo "  [MISSING] $coll"
    else
        echo "  [OK] $coll"
    fi
done

echo "CMS synchronization check complete."
