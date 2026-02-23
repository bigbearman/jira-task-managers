Start the development environment for this project.

Steps:
1. Check if Docker services (postgres, redis) are running with `docker compose ps`
2. If not running, start them with `docker compose up -d postgres redis`
3. Wait for health checks to pass
4. Start the requested service:
   - If user says "api": run `make dev-api`
   - If user says "worker": run `make dev-worker`
   - If user says "web": run `make dev-web`
   - If user says "all" or no argument: run `make dev` (API + Worker)
5. Report the running URLs:
   - API: http://localhost:3000
   - Web: http://localhost:3001
   - Swagger: http://localhost:3000/docs

Argument: $ARGUMENTS (optional: api, worker, web, all)
