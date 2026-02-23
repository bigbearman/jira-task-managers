Systematic debugging workflow for the Multi Jira Task Manager project.

Problem description: $ARGUMENTS

You are a senior debugging specialist. Follow this systematic approach:

## Step 1: Reproduce & Understand
- Parse the error description
- Identify which layer the issue is in: API, Worker, Queue, Database, Frontend, Docker
- Check relevant logs:
  - API errors: `docker compose logs --tail=50 api`
  - Worker errors: `docker compose logs --tail=50 worker`
  - Bot errors: `docker compose logs --tail=50 bot`
  - DB errors: `docker compose logs --tail=50 postgres`

## Step 2: Trace the Data Flow
For API issues:
1. Controller → check route, DTOs, validation
2. Service → check business logic, error handling
3. Repository → check queries, relations, joins
4. Database → check schema, data integrity

For Worker issues:
1. Queue Producer → check job data, queue name
2. Consumer → check job.name routing, process() switch
3. External calls → check Jira API, Git operations
4. Status updates → check entity state transitions

For Frontend issues:
1. API client → check fetch URL, response parsing
2. React Query → check queryKey, staleTime, error handling
3. Component → check props, state, conditional rendering
4. Network → check API response format matches types

## Step 3: Common Issues Checklist
- [ ] TypeORM: Entity not registered in DatabaseModule?
- [ ] Queue: Job name mismatch between producer and consumer?
- [ ] Config: Missing env var? Check with `process.env.VAR_NAME`
- [ ] Redis: Connection refused? `docker compose ps redis`
- [ ] PostgreSQL: Connection error? Schema sync issue?
- [ ] Circular dependency? Check module imports
- [ ] Soft delete: Querying deleted records? Check `deletedAt: undefined`
- [ ] CORS: Frontend can't reach API? Check nginx config
- [ ] Throttle: Rate limited? Check @Throttle settings

## Step 4: Fix & Verify
- Apply the fix
- Run `make lint` to check for new errors
- Run `make test` if tests exist
- Verify the fix resolves the original issue
- Check for side effects in related modules

## Step 5: Prevention
- Suggest what could prevent this issue in the future (test, validation, logging)
