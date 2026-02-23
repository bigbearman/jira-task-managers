Fix a bug with systematic root cause analysis.

Bug description: $ARGUMENTS

You are a senior engineer fixing a production bug. Be methodical — don't guess.

## Phase 1: Reproduce
1. Understand the bug from the description
2. If a Jira ticket is referenced, fetch its details
3. Identify the affected component: API, Worker, Bot, Frontend, Database
4. Check logs for error traces:
   - `docker compose logs --tail=100 api 2>&1 | grep -i error`
   - `docker compose logs --tail=100 worker 2>&1 | grep -i error`

## Phase 2: Root Cause Analysis
1. Trace the code path:
   - Start from the entry point (controller endpoint, consumer job, bot handler)
   - Follow the data flow through service → repository → database
   - Check each transformation step
2. Common root causes in this project:
   - TypeORM: Missing relation in find options, entity not registered
   - Queue: Job name mismatch between producer and consumer
   - Config: Missing env var, wrong type conversion
   - Async: Unhandled promise rejection, missing await
   - Soft delete: Query returns deleted records
   - Multi-instance: Wrong instance credentials used
   - Frontend: Type mismatch with backend response

## Phase 3: Fix
1. Make the minimal change that fixes the root cause
2. Don't refactor unrelated code
3. Add defensive checks if the bug could recur
4. Follow project patterns exactly

## Phase 4: Verify
1. `make lint` — Clean
2. `make build` — No errors
3. The fix addresses the root cause, not just the symptom
4. No side effects on related features
5. `git diff` — Review the changes

## Phase 5: Commit
- Branch: `fix/{ticket-key}-{short-description}` or `fix/{description}`
- Commit message: `fix: {concise description of what was wrong and how it's fixed}`
- Include the root cause in the commit body
