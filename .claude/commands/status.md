Show comprehensive project status.

Steps:
1. Run `docker compose ps` to show Docker service status
2. Run `git status` to show git changes
3. Run `git log --oneline -5` to show recent commits
4. Try `curl -s http://localhost:3000/api/v1/health` to check API health
5. Summarize:
   - Which services are running/stopped
   - Any uncommitted changes
   - API health status
   - Recent development activity
