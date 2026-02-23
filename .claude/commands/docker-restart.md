Rebuild and restart all Docker services for the Multi Jira Task Manager project.

Steps:
1. Run `docker compose down` to stop all services
2. Run `docker compose build` to rebuild images
3. Run `docker compose up -d` to start all services
4. Wait a few seconds for services to initialize
5. Run `docker compose ps` to verify all services are healthy
6. Show the access URLs:
   - API: http://localhost:3000
   - Web: http://localhost:3001
   - Nginx: http://localhost:8080
   - Swagger: http://localhost:3000/docs
