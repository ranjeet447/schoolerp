.PHONY: up down dev-api dev-worker dev-web dev-marketing storybook test-ui test-all

up:
	docker-compose -f infra/docker-compose.yml up -d

up-cms:
	docker-compose -f infra/docker-compose.yml --profile cms up -d

down:
	docker-compose -f infra/docker-compose.yml down

dev-api:
	cd services/api && export PATH=$$PATH:/usr/local/go/bin && go run cmd/api/main.go

dev-worker:
	cd services/worker && export PATH=$$PATH:/usr/local/go/bin && go run cmd/worker/main.go

dev-web:
	pnpm --filter @schoolerp/web dev

dev-marketing:
	pnpm --filter @schoolerp/marketing dev

storybook:
	pnpm --filter @schoolerp/storybook storybook

test-ui:
	pnpm exec playwright test

test-all:
	pnpm lint && pnpm test && pnpm exec playwright test

test-marketing-ui:
	cd apps/marketing && pnpm exec playwright test

test-demo-booking:
	cd apps/marketing && pnpm exec playwright test tests/demo-booking.spec.ts

seed-marketing:
	docker exec -i schoolerp-db psql -U user -d schoolerp < infra/seed/marketing_seed.sql

seed-demo:
	docker exec -i schoolerp-db psql -U user -d schoolerp < infra/seed/demo_seed.sql
