.PHONY: help install dev dev-api dev-worker build test lint docker-up docker-down docker-build docker-logs migrate sync-all status

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ============================================
# Development
# ============================================

install: ## Install all dependencies
	pnpm install

dev: ## Run API + Worker in dev mode (both in one process)
	cd packages/backend && IS_API=1 IS_WORKER=1 pnpm dev

dev-api: ## Run API only in dev mode
	cd packages/backend && IS_API=1 IS_WORKER=0 pnpm dev

dev-worker: ## Run Worker only in dev mode
	cd packages/backend && IS_API=0 IS_WORKER=1 pnpm dev

build: ## Build all packages
	pnpm build

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

docker-restart: ## Rebuild and restart
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

setup: install docker-up ## Full setup: install deps + start Docker
	@echo "Waiting for services to be ready..."
	@sleep 5
	@echo "Setup complete! API: http://localhost:3000, Docs: http://localhost:3000/docs"
