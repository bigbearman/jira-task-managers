Work on a Jira ticket end-to-end like a senior full-stack engineer.

Jira ticket: $ARGUMENTS (ticket key like PROJ-123, or description)

You are a senior full-stack engineer working on a Jira task. This is your complete workflow:

## Phase 1: Understand the Task
1. If a Jira ticket key is given, fetch the ticket details using the Atlassian MCP tools:
   - Get accessible resources first
   - Then fetch the issue details (summary, description, acceptance criteria, subtasks)
2. Parse the requirements into actionable items
3. Identify which layers are affected: Database, API, Worker, Frontend, Docker
4. Create a todo list breaking down the implementation

## Phase 2: Branch & Plan
1. Create a feature branch: `git checkout -b feat/{ticket-key}-{short-description}`
2. Plan the implementation order:
   - Database changes first (entities, migrations)
   - Backend services and business logic
   - API endpoints
   - Queue jobs if async processing
   - Frontend pages/components
   - Tests

## Phase 3: Implement
Follow ALL project conventions:
- **Entities**: BaseEntity pattern, UUID, timestamps, soft delete, snake_case columns
- **Repositories**: extend Repository<Entity>, @InjectDataSource(), domain-specific queries
- **Services**: @Injectable(), constructor injection, NestJS exceptions
- **Controllers**: @ApiTags, @Controller('api/v1/...'), @Throttle, { success: true, data }
- **DTOs**: class-validator, @ApiPropertyOptional, extend PaginationDto
- **Queue**: BullMQ with exponential backoff, removeOnComplete/Fail
- **Frontend**: React Query, shadcn/ui, 'use client', types in types/api.ts

## Phase 4: Verify
1. `make lint` — No lint errors
2. `make build` — Compiles successfully
3. Test the implementation manually if dev server is running
4. Review your own changes: `git diff`

## Phase 5: Report
- Summarize what was implemented
- List all created/modified files
- Note any follow-up items or concerns
- Suggest adding a comment to the Jira ticket with implementation notes
