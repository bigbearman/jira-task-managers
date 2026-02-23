Database operations for the Multi Jira Task Manager project.

Steps:
1. If argument is "shell": run `docker compose exec postgres psql -U postgres -d multi_jira`
2. If argument is "migrate": run `make migrate`
3. If argument is "generate": run `make migrate-generate`
4. If argument is "reset": warn the user that this will drop all data, then if confirmed run `docker compose exec postgres psql -U postgres -d multi_jira -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`
5. If argument is "status": run `docker compose exec postgres psql -U postgres -d multi_jira -c "\dt"` to list tables
6. If no argument: show available sub-commands

Argument: $ARGUMENTS (optional: shell, migrate, generate, reset, status)
