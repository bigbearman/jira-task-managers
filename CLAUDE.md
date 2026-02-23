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

## Coding Standards (MUST follow)

### Entity Rules
- ALWAYS extend BaseEntity: `@PrimaryGeneratedColumn('uuid')`, `@CreateDateColumn({ type: 'timestamptz' })`, `@UpdateDateColumn`, `@DeleteDateColumn` (soft delete)
- Column names MUST use snake_case via `name` parameter: `@Column({ name: 'jira_key' })`
- Enums defined in same entity file, used with `type: 'enum'`
- JSONB for flexible data: `@Column({ type: 'jsonb', nullable: true })`
- Always add `@Index()` on foreign keys and frequently queried columns

### Repository Rules
- MUST extend `Repository<Entity>` with `@InjectDataSource()` constructor pattern
- Implement domain-specific query methods, not just CRUD
- Use QueryBuilder for complex queries with parameterized values (`:param`)
- ILIKE for case-insensitive search, `.skip()/.take()` for pagination

### Controller Rules
- Decorator order: `@ApiTags()` → `@Controller('api/v1/{resource}')` → class
- Every endpoint: `@ApiOperation({ summary })` + `@Throttle({ default: { ttl: 60000, limit: N } })`
- Response format: `{ success: true, data: T }` or `{ success: true, data: T[], meta: { total, page, limit, totalPages } }`
- Use NestJS exceptions: `NotFoundException`, `BadRequestException`, `UnauthorizedException`
- Controllers call services, NEVER repositories directly

### DTO Rules
- Naming: `Create{Name}Dto`, `Update{Name}Dto`, `List{Name}Dto extends PaginationDto`
- EVERY field: class-validator decorator (`@IsString`, `@IsOptional`, `@IsEnum`, etc.)
- Swagger: `@ApiPropertyOptional()` on optional fields
- Number params: `@Type(() => Number)` for class-transformer

### Service Rules
- `@Injectable()`, constructor injection only
- Business logic lives here, not in controllers
- Handle errors with NestJS exceptions
- Trigger queue jobs for async processing

### Queue Rules
- Constants in `shared/constants/queue.ts`: `QUEUE_NAME` and `QUEUE_PROCESSOR`
- Producer: always set `removeOnComplete`, `removeOnFail`, `attempts`, `backoff`
- Consumer: extend `WorkerHost`, route by `job.name` in `process()` switch
- Error handling: try/catch, update entity status to FAILED, rethrow

### Frontend Rules
- `'use client'` for interactive components
- React Query: `useQuery({ queryKey: ['resource', params], queryFn })` with proper keys
- API client in `lib/api.ts`, types in `types/api.ts`
- shadcn/ui components, Lucide icons, Sonner toasts
- Theme: next-themes with dark mode default

### Import Order
1. NestJS / external packages
2. Module imports (@/modules/...)
3. Shared imports (@/shared/...)
4. Local files (./relative)

### Naming Conventions
- Files: `kebab-case` (resource.controller.ts, resource.entity.ts)
- Classes: `PascalCase` (ResourceController, ResourceService)
- Methods: `camelCase` (findAll, createResource)
- Constants: `UPPER_SNAKE` (QUEUE_NAME, API_VERSION)
- DB columns: `snake_case` via `name` parameter
- API routes: `kebab-case` (/api/v1/sync-logs)
- Entity names: singular (Ticket, not Tickets)

### Git Conventions
- Branches: `feat/{ticket}-{desc}`, `fix/{ticket}-{desc}`, `refactor/{desc}`
- Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:` prefixes
- Always lint before commit: `make lint`

## Custom Commands

Use `/command-name` to trigger project-specific workflows:

| Command | Purpose |
|---------|---------|
| `/dev` | Start dev environment |
| `/build` | Build packages |
| `/test` | Run tests |
| `/status` | Project status overview |
| `/logs` | View service logs |
| `/sync` | Trigger Jira sync |
| `/db` | Database operations |
| `/docker-restart` | Rebuild Docker |
| `/feature` | Scaffold complete feature (entity → API → frontend) |
| `/add-module` | Scaffold NestJS module |
| `/add-entity` | Scaffold TypeORM entity |
| `/add-queue` | Add BullMQ queue with producer/consumer |
| `/api-design` | Design new API endpoint |
| `/review` | Code review with project standards |
| `/debug` | Systematic debugging workflow |
| `/fix-bug` | Bug fix with root cause analysis |
| `/refactor` | Smart refactoring |
| `/optimize` | Performance optimization |
| `/perf` | Performance audit |
| `/security` | Security audit |
| `/pr` | Create Pull Request |
| `/migrate-db` | Database migration workflow |
| `/jira-task` | Work on Jira ticket end-to-end |
