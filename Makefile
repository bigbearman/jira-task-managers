.PHONY: help install dev dev-api dev-worker dev-web build test lint docker-up docker-down docker-build docker-logs migrate sync-all status setup

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ============================================
# Development
# ============================================

install: ## Install all dependencies
	pnpm install

dev: ## Run API + Worker in dev mode
	cd packages/backend && IS_API=1 IS_WORKER=1 pnpm dev

dev-api: ## Run API only in dev mode
	cd packages/backend && IS_API=1 IS_WORKER=0 pnpm dev

dev-worker: ## Run Worker only in dev mode
	cd packages/backend && IS_API=0 IS_WORKER=1 pnpm dev

dev-web: ## Run Web UI in dev mode
	cd packages/web && pnpm dev

build: ## Build all packages
	pnpm --filter @mjt/backend build && pnpm --filter @mjt/web build

build-backend: ## Build backend only
	cd packages/backend && pnpm build

build-web: ## Build web only
	cd packages/web && pnpm build

test: ## Run tests
	cd packages/backend && pnpm test

test-e2e: ## Run e2e tests
	cd packages/backend && pnpm test:e2e

lint: ## Run linter
	cd packages/backend && pnpm lint

format: ## Format code
	cd packages/backend && pnpm format

# ============================================
# Database
# ============================================

migrate: ## Run TypeORM migrations
	cd packages/backend && pnpm migration:run

migrate-generate: ## Generate new migration
	cd packages/backend && pnpm migration:generate

# ============================================
# Docker
# ============================================

docker-up: ## Start all Docker services
	docker compose up -d

docker-down: ## Stop all Docker services
	docker compose down

docker-build: ## Build Docker images
	docker compose build

docker-build-nocache: ## Build Docker images without cache
	docker compose build --no-cache

docker-logs: ## View Docker logs
	docker compose logs -f

docker-logs-api: ## View API logs
	docker compose logs -f api

docker-logs-worker: ## View Worker logs
	docker compose logs -f worker

docker-logs-web: ## View Web UI logs
	docker compose logs -f web

docker-restart: ## Rebuild and restart all
	docker compose down && docker compose build && docker compose up -d

docker-shell-api: ## Shell into API container
	docker compose exec api sh

docker-shell-db: ## PostgreSQL shell
	docker compose exec postgres psql -U postgres -d multi_jira

docker-status: ## Show Docker service status
	docker compose ps

# ============================================
# Sync
# ============================================

sync-all: ## Trigger full sync via API
	curl -s -X POST http://localhost:3000/api/v1/sync | jq

status: ## Get recent sync logs
	curl -s http://localhost:3000/api/v1/sync/logs | jq

# ============================================
# Setup
# ============================================

setup: install docker-build docker-up ## Full setup: install deps + build + start Docker
	@echo "Waiting for services to be ready..."
	@sleep 8
	@docker compose ps
	@echo ""
	@echo "Setup complete!"
	@echo "  API:  http://localhost:$${API_PORT:-3000}"
	@echo "  Web:  http://localhost:$${WEB_PORT:-3001}"
	@echo "  All:  http://localhost:$${NGINX_PORT:-8080}"
	@echo "  Docs: http://localhost:$${API_PORT:-3000}/docs"
