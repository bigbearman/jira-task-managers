Run tests for the project.

Steps:
1. If argument is "e2e": run `make test-e2e`
2. If argument is a specific file path: run `cd packages/backend && pnpm jest $ARGUMENTS`
3. If argument is "watch": run `cd packages/backend && pnpm jest --watch`
4. If no argument: run `make test`
5. Report test results and any failures

Argument: $ARGUMENTS (optional: e2e, watch, or specific test file path)
