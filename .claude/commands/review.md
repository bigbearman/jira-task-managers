Code review the current changes with project-specific standards.

Target: $ARGUMENTS (optional: file path, branch name, or "staged" for staged changes)

You are a principal engineer reviewing code for the Multi Jira Task Manager project. Be thorough but practical.

## Step 1: Gather Changes
- If argument is a file: read that file
- If argument is "staged" or empty: run `git diff --cached` and `git diff`
- If argument is a branch: run `git diff main...$ARGUMENTS`
- List all changed files

## Step 2: Architecture Review
- [ ] Does it follow the module structure? (database/, api/, queue/, worker/)
- [ ] Are entities in the right place with correct BaseEntity pattern?
- [ ] Are repositories using @InjectDataSource() constructor pattern?
- [ ] Is the response format consistent? `{ success: true, data: ... }`
- [ ] Are configs using registerAs('namespace') pattern?
- [ ] Is conditional module loading correct? (IS_API, IS_WORKER, IS_BOT flags)

## Step 3: Code Quality
- [ ] TypeORM: Using snake_case column names? Proper indexes?
- [ ] DTOs: class-validator decorators present? @ApiPropertyOptional for Swagger?
- [ ] Error handling: Using NestJS exceptions? (NotFoundException, BadRequestException)
- [ ] Async/await: No floating promises? Proper error boundaries?
- [ ] No hardcoded values? Using constants from shared/constants?
- [ ] Queue jobs: Have retry config? removeOnComplete/removeOnFail?

## Step 4: Security Check
- [ ] No secrets in code? (API keys, passwords, tokens)
- [ ] Input validation on all endpoints?
- [ ] SQL injection safe? (parameterized queries, TypeORM methods)
- [ ] Rate limiting (@Throttle) on public endpoints?
- [ ] ApiKeyGuard on protected endpoints?

## Step 5: Performance
- [ ] Database: Proper indexes on frequently queried columns?
- [ ] N+1 queries: Using relations/joins instead of loop queries?
- [ ] Queue: Appropriate concurrency settings?
- [ ] Pagination on list endpoints?
- [ ] No unnecessary eager loading?

## Step 6: Frontend (if applicable)
- [ ] 'use client' directive where needed?
- [ ] React Query: Proper queryKey for cache invalidation?
- [ ] Error states handled?
- [ ] Loading states with skeleton/spinner?
- [ ] shadcn/ui components used consistently?
- [ ] Types matching backend DTOs?

## Output Format
For each issue found, output:
```
[SEVERITY] file:line — Description
  Suggestion: How to fix
```
Severity levels: CRITICAL, WARNING, SUGGESTION

End with a summary: total issues by severity, overall assessment, and whether it's ready to merge.
