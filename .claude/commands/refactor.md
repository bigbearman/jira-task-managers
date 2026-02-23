Smart refactoring following project conventions and best practices.

Target: $ARGUMENTS (file path, module name, or description of what to refactor)

You are a software architect performing a careful refactoring. Zero regressions.

## Principles
1. **Read before change** — Read ALL related files before modifying anything
2. **Preserve behavior** — Same inputs must produce same outputs
3. **Follow conventions** — Match existing patterns exactly
4. **Small steps** — One logical change at a time
5. **Verify** — Lint + build after each step

## Step 1: Scope Analysis
- Read the target file(s) and all imports/dependents
- Search for all usages: `grep -r "ClassName\|methodName" packages/`
- Map the dependency graph
- Identify what CAN change vs what MUST stay stable (public API)

## Step 2: Refactoring Patterns for This Project

**Extract Service from Controller:**
- Move business logic out of controller into service
- Controller should only: validate input, call service, format response
- Service handles: business rules, repository calls, queue triggers

**Normalize Entity:**
- Ensure BaseEntity pattern (UUID, timestamps, soft delete)
- Move inline enums to entity file
- Add missing indexes on foreign keys and frequently queried columns
- Use `name` parameter for snake_case column naming

**Extract Repository Methods:**
- Move complex queries from service to repository
- Use QueryBuilder for joins, aggregations, subqueries
- Add pagination support to list methods

**Consolidate DTOs:**
- Group related DTOs in one file per entity
- Ensure all fields have class-validator decorators
- Add @ApiPropertyOptional for Swagger docs
- Extend PaginationDto for list DTOs

**Queue Job Extraction:**
- Move heavy processing from API request to queue job
- Add proper retry config with exponential backoff
- Track job status in database

**Frontend Component Split:**
- Extract reusable components to components/shared/
- Keep page components thin (data fetching + layout)
- Move API types to types/api.ts

## Step 3: Execute
- Make changes file by file
- Run `make lint` after each file
- Run `make build` after all changes
- List all modified files with summary of changes

## Step 4: Verify
- No TypeScript errors
- No lint warnings
- Build succeeds
- All imports resolve correctly
