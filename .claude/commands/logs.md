View Docker service logs.

Steps:
1. If argument is "api": run `docker compose logs -f --tail=100 api`
2. If argument is "worker": run `docker compose logs -f --tail=100 worker`
3. If argument is "bot": run `docker compose logs -f --tail=100 bot`
4. If argument is "web": run `docker compose logs -f --tail=100 web`
5. If argument is "db" or "postgres": run `docker compose logs -f --tail=100 postgres`
6. If argument is "redis": run `docker compose logs -f --tail=100 redis`
7. If no argument: run `docker compose logs -f --tail=100` for all services

Argument: $ARGUMENTS (optional: api, worker, bot, web, db, postgres, redis)
