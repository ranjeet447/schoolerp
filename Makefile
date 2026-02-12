.PHONY: dev build migrate seed seed-bootstrap seed-reset seed-marketing test help

# Standard local development
dev:
	pnpm dev

# Build all services
build:
	pnpm build
	cd services/api && go build ./...
	cd services/worker && go build ./...

# Run all tests
test:
	cd services/api && go test -v ./...
	cd services/worker && go test -v ./...
	pnpm --filter @schoolerp/web test:e2e

# Database Migrations
migrate:
	# Requires golang-migrate installed
	migrate -path infra/migrations -database "$(DATABASE_URL)" up

# Database Seeding
seed:
	@$(MAKE) seed-bootstrap

seed-bootstrap:
	chmod +x scripts/seed_db.sh
	./scripts/seed_db.sh --bootstrap

seed-reset:
	chmod +x scripts/seed_db.sh
	./scripts/seed_db.sh --reset

seed-marketing:
	chmod +x scripts/seed_db.sh
	./scripts/seed_db.sh --marketing

# Help
help:
	@echo "SchoolERP Makefile"
	@echo "  make dev      - Start all services (web, api, worker)"
	@echo "  make build    - Build all services"
	@echo "  make migrate  - Run DB migrations"
	@echo "  make seed     - Safe bootstrap seed (default)"
	@echo "  make seed-bootstrap - Safe idempotent seed"
	@echo "  make seed-reset - Destructive reset + reseed"
	@echo "  make seed-marketing - Marketing demo fixtures only"
