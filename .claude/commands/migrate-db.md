Handle TypeORM database migration workflow.

Action: $ARGUMENTS (generate, run, revert, status, or description of schema change)

## If "generate" or a schema change description:
1. Read the current entities to understand what changed
2. Generate migration: `cd packages/backend && pnpm migration:generate`
3. Review the generated migration file
4. Check for:
   - Correct column types (timestamptz, uuid, enum, jsonb)
   - Proper index creation
   - Foreign key constraints
   - No data loss in ALTER operations
5. If the migration looks wrong, suggest manual adjustments

## If "run":
1. `cd packages/backend && pnpm migration:run`
2. Verify with: `docker compose exec postgres psql -U postgres -d multi_jira -c "\dt"`
3. Check for errors

## If "revert":
1. WARN: This will undo the last migration
2. If confirmed: `cd packages/backend && pnpm migration:revert`
3. Verify the revert

## If "status":
1. Show pending migrations
2. Show current schema: `docker compose exec postgres psql -U postgres -d multi_jira -c "\dt"`
3. Compare with entities

## Safety Rules:
- NEVER drop columns with data without user confirmation
- Always check if migration is reversible
- Backup reminder for production changes
- Check DB_SYNC setting (should be false in production)
