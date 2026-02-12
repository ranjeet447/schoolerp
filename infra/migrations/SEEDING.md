# Seeding Guide

This directory intentionally contains two different seed flows:

1. `seed_users.sql` (default)
- Safe, idempotent bootstrap seed.
- No truncation; can be run repeatedly.
- Use this for local setup, shared dev DBs, and production bootstrapping.

2. `seed_production.sql`
- Destructive reset + reseed.
- Truncates core tables before inserting fixtures.
- Use only when you intentionally want a clean wipe.

## Commands

```bash
# Safe default
make seed
# or
make seed-bootstrap

# Destructive reset
make seed-reset

# Marketing fixtures only
make seed-marketing
```

## Default login credentials

All seeded users use password: `password123`

- `saas_admin@schoolerp.com`
- `admin@demo.school`
- `teacher@demo.school`
- `admin@school.edu.in`
