# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Multi Jira Task Managers** — NestJS-based AI-powered multi-Jira task management system. Supports multiple Jira instances, provides AI analysis via Claude CLI, automated code generation, PR creation, and dual UI (Web + Telegram).

## Architecture

- **Monorepo**: pnpm workspaces (`packages/backend`, `packages/web`)
- **Backend**: NestJS 11, TypeORM, PostgreSQL 16, BullMQ + Redis 7
- **Modes**: `IS_API=1` (REST API + Swagger), `IS_WORKER=1` (BullMQ consumers + Cron), `IS_BOT=1` (Telegram)
- **Web**: Next.js 15 + Tailwind v4 + shadcn/ui (Phase 6)

## Quick Start

```bash
make setup          # Install deps + start Docker (postgres, redis)
make dev            # Run API + Worker (dev mode, both in one process)
make dev-api        # Run API only
make dev-worker     # Run Worker only
```

## Common Commands

```bash
# Development
make install        # Install dependencies
make build          # Build all packages
make test           # Run tests
make lint           # Lint code
make format         # Format code

# Docker
make docker-up      # Start services
make docker-down    # Stop services
make docker-build   # Build images
make docker-logs    # View logs
make docker-restart # Full rebuild

# Database
make docker-shell-db  # PostgreSQL shell

# Sync
make sync-all       # Trigger Jira sync
make status         # View sync logs
```

## Module Structure

```
packages/backend/src/
├── modules/
│   ├── database/       # TypeORM entities, repositories, migrations
│   ├── api/            # REST controllers, services, DTOs, guards
│   ├── queue/          # BullMQ queue definitions + producer service
│   ├── worker/         # BullMQ consumers + cron schedulers
│   ├── jira/           # Jira REST API client (multi-instance)
│   ├── claude/         # Claude CLI integration (Phase 3)
│   ├── git/            # Git + GitHub operations (Phase 4)
│   ├── telegram/       # Telegram bot (Phase 5)
│   └── notification/   # Cross-channel notifications
└── shared/
    ├── config/         # @nestjs/config registerAs patterns
    ├── constants/      # Queue names, Jira emoji maps
    └── utils/          # ADF parser, Telegram formatter, pagination
```

## Key Patterns

- **Multi-Jira**: Credentials stored per-instance in `jira_instances` table, passed to JiraService dynamically
- **TypeORM**: Entities extend BaseEntity (UUID, timestamps, soft delete). Repositories extend Repository<Entity>
- **Queues**: 4 BullMQ queues (jira-sync, ai-analysis, git-operation, notification)
- **Config**: All via env vars, structured with `registerAs('namespace')` pattern
- **Response format**: `{ success: true, data: ... }` consistently

## Environment Variables

See `.env.example` for full list. Key vars:
- `IS_API`, `IS_WORKER`, `IS_BOT` — Mode flags
- `DB_*` — PostgreSQL connection
- `REDIS_*` — Redis connection
- Jira credentials configured via API (`POST /api/v1/instances`)

## Docker Services

| Service | Container | Port (host) | Purpose |
|---------|-----------|-------------|---------|
| postgres | mjt-postgres | 5436 | Database |
| redis | mjt-redis | 6382 | Queue + Cache |
| api | mjt-api | 3000 | REST API |
| worker | mjt-worker | - | Background jobs |
| nginx | mjt-nginx | 8080 | Reverse proxy |

## API Endpoints

- `GET /api/v1/health` — Health check
- `GET/POST /api/v1/instances` — Manage Jira instances
- `POST /api/v1/instances/:slug/test` — Test connection
- `POST /api/v1/sync` — Trigger sync
- `GET /api/v1/sync/logs` — Sync history
- Swagger: `http://localhost:3000/docs`
