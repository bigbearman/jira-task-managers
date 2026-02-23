Create a well-structured Pull Request for the current branch.

Context: $ARGUMENTS (optional: Jira ticket key, additional context)

## Step 1: Analyze Changes
1. `git log main..HEAD --oneline` — All commits on this branch
2. `git diff main...HEAD --stat` — Changed files summary
3. `git diff main...HEAD` — Full diff for understanding
4. Identify: What was added, changed, removed, and why

## Step 2: Categorize Changes
- New features (entities, endpoints, pages)
- Bug fixes (what was broken, how it's fixed)
- Refactoring (what improved, no behavior change)
- Infrastructure (Docker, CI, configs)

## Step 3: Create PR
Use `gh pr create` with:
- **Title**: Short, imperative. Prefix with type: `feat:`, `fix:`, `refactor:`, `chore:`
- **Body** format:

```markdown
## Summary
- Bullet points of what changed and WHY

## Changes
### Backend
- Entity/repo/service/controller changes

### Frontend
- Page/component changes

### Infrastructure
- Docker/config changes

## Jira
- Links to related tickets if any

## Testing
- [ ] `make lint` passes
- [ ] `make build` passes
- [ ] Manual testing steps...

## Screenshots
(if frontend changes)
```

## Step 4: Push and Create
1. `git push -u origin HEAD`
2. Create PR with gh CLI
3. Return the PR URL
