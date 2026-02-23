Trigger Jira sync and check status.

Steps:
1. If argument is "status" or "logs": run `curl -s http://localhost:3000/api/v1/sync/logs | jq` to show recent sync logs
2. If argument is "all" or no argument: run `curl -s -X POST http://localhost:3000/api/v1/sync | jq` to trigger full sync
3. If argument is an instance slug: run `curl -s -X POST http://localhost:3000/api/v1/sync/$ARGUMENTS | jq` to sync specific instance
4. Report the result

Argument: $ARGUMENTS (optional: all, status, logs, or instance-slug)
