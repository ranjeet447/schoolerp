.PHONY: dev build migrate seed help

# Standard local development
dev:
	pnpm dev

# Build all services
build:
	pnpm build
	cd services/api && go build ./...
	cd services/worker && go build ./...

# Database Migrations
migrate:
	# Requires golang-migrate installed
	migrate -path infra/migrations -database "$(DATABASE_URL)" up

# Database Seeding
seed:
	chmod +x scripts/seed_db.sh
	./scripts/seed_db.sh --demo

# Help
help:
	@echo "SchoolERP Makefile"
	@echo "  make dev      - Start all services (web, api, worker)"
	@echo "  make build    - Build all services"
	@echo "  make migrate  - Run DB migrations"
	@echo "  make seed     - Seed DB with demo data"
