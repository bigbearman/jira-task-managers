# Multi Jira Task Manager

AI-powered multi-Jira task management system with Claude CLI integration. Syncs data from multiple Jira instances, provides AI analysis of tickets, automates code generation workflows (branch, code, test, PR), and delivers notifications via Telegram and web.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx (reverse proxy)                 │
│                     :8080 → API / Web                   │
├────────────────────────┬────────────────────────────────┤
│     API Server (:3000) │       Web UI (:3001)           │
│     NestJS + Express   │       Next.js 15               │
├────────────────────────┴────────────────────────────────┤
│                   Worker (BullMQ consumers)              │
│  Jira Sync │ Claude CLI │ Git Ops │ Notifications       │
├──────────────────┬──────────────────────────────────────┤
│  PostgreSQL 16   │           Redis 7                    │
│  (TypeORM)       │      (BullMQ + Cache)                │
└──────────────────┴──────────────────────────────────────┘
```

## Tech Stack

| Layer     | Technology                                             |
|-----------|--------------------------------------------------------|
| Backend   | NestJS 11, TypeORM, PostgreSQL 16, BullMQ, Redis 7    |
| Frontend  | Next.js 15, React 19, TailwindCSS 4, TanStack Query   |
| AI        | Claude CLI (code generation, ticket analysis)          |
| Infra     | Docker Compose, Nginx reverse proxy                    |
| Bot       | Telegraf (Telegram bot, optional)                      |

## Prerequisites

- Node.js >= 22.0.0
- pnpm >= 9
- Docker & Docker Compose

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/bigbearman/jira-task-managers.git
cd jira-task-managers
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Jira credentials, API keys, etc.

# 3. Start everything with Docker
make setup
```

This will install dependencies, build Docker images, and start all 6 services.

## Development

```bash
# Run API + Worker (NestJS dev mode with hot reload)
make dev

# Run API only
make dev-api

# Run Worker only
make dev-worker

# Run Web UI (Next.js dev server on :3001)
make dev-web

# Build all packages
make build

# Run unit tests (53 tests)
make test

# Run E2E tests (17 tests)
make test-e2e
```

## Environment Variables

| Variable                 | Description                            | Default     |
|--------------------------|----------------------------------------|-------------|
| `DB_HOST`                | PostgreSQL host                        | `localhost` |
| `DB_PORT`                | PostgreSQL port                        | `5432`      |
| `DB_USERNAME`            | Database user                          | `postgres`  |
| `DB_PASSWORD`            | Database password                      | `postgres`  |
| `DB_DATABASE`            | Database name                          | `multi_jira`|
| `DB_SYNC`                | TypeORM synchronize (dev only)         | `true`      |
| `REDIS_HOST`             | Redis host                             | `localhost` |
| `REDIS_PORT`             | Redis port                             | `6379`      |
| `API_KEY`                | API key for auth (optional)            | -           |
| `JIRA_*`                 | Jira instance credentials              | -           |
| `CLAUDE_CLI_PATH`        | Path to Claude CLI binary              | `claude`    |
| `CLAUDE_DEFAULT_MODEL`   | Default Claude model                   | `sonnet`    |
| `GIT_DEFAULT_BASE_BRANCH`| Default base branch for PRs            | `develop`   |
| `TELEGRAM_BOT_TOKEN`     | Telegram bot token (optional)          | -           |
| `TELEGRAM_ALLOWED_CHAT_IDS` | Allowed Telegram chat IDs           | -           |

## Docker Services

| Service    | Container      | Port  | Description              |
|------------|----------------|-------|--------------------------|
| PostgreSQL | mjt-postgres   | 5436  | Database                 |
| Redis      | mjt-redis      | 6382  | Queue + Cache            |
| API        | mjt-api        | 3000  | REST API server          |
| Worker     | mjt-worker     | -     | Background job processor |
| Web        | mjt-web        | 3001  | Next.js web UI           |
| Nginx      | mjt-nginx      | 8080  | Reverse proxy            |

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| GET    | `/health`                       | Health check                   |
| GET    | `/projects`                     | List all projects              |
| GET    | `/projects/:key`                | Project detail                 |
| GET    | `/projects/:key/stats`          | Project statistics             |
| GET    | `/tickets`                      | List tickets (paginated)       |
| GET    | `/tickets/:key`                 | Ticket detail                  |
| POST   | `/tickets/:key/analyze`         | Trigger AI analysis            |
| POST   | `/tickets/:key/approve`         | Approve + start code flow      |
| POST   | `/tickets/:key/reject`          | Reject ticket                  |
| GET    | `/sprints/active`               | Active sprints                 |
| GET    | `/dashboard/overview`           | Dashboard overview             |
| GET    | `/notifications/unread`         | Unread notifications           |
| POST   | `/sync`                         | Trigger full Jira sync         |

Swagger docs: `http://localhost:3000/docs`

## Project Structure

```
packages/
├── backend/                  # NestJS backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── api/          # Controllers, services, guards, filters
│   │   │   ├── database/     # TypeORM entities, repositories
│   │   │   ├── worker/       # BullMQ consumers (sync, Claude, git)
│   │   │   ├── queue/        # Queue service + module
│   │   │   ├── jira/         # Jira REST API client
│   │   │   ├── claude/       # Claude CLI integration
│   │   │   ├── git/          # Git operations service
│   │   │   ├── telegram/     # Telegram bot (Telegraf)
│   │   │   └── notification/ # Notification service + consumer
│   │   └── shared/           # Config, constants, utils
│   └── test/                 # Unit + E2E tests
└── web/                      # Next.js 15 frontend
    └── src/
        ├── app/              # App router pages
        ├── components/       # Shared components
        └── lib/              # API client, utilities
```

## License

MIT
