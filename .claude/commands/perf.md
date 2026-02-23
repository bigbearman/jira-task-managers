Performance audit for the Multi Jira Task Manager project.

Target: $ARGUMENTS (optional: module name, "backend", "frontend", "db", or "all")

You are a performance engineer. Find and fix bottlenecks.

## Database Performance
- [ ] Check all entities for missing indexes (especially foreign keys, status columns, slug/key columns)
- [ ] Look for N+1 queries: service methods that query in loops
- [ ] Check eager loading: are we loading too many relations by default?
- [ ] Review QueryBuilder queries for missing .select() (loading all columns when not needed)
- [ ] Check for missing composite indexes on multi-column WHERE clauses
- [ ] Verify soft delete queries include deletedAt filter

## Queue Performance
- [ ] Concurrency settings appropriate? (CPU-bound vs I/O-bound)
- [ ] removeOnComplete/removeOnFail set? (prevent Redis memory leak)
- [ ] Job timeout configured?
- [ ] Retry strategy: exponential backoff vs fixed?
- [ ] Are we batching where possible? (bulk upsert vs single inserts)

## API Performance
- [ ] Pagination on all list endpoints?
- [ ] Response size: returning only needed fields?
- [ ] Rate limiting appropriate?
- [ ] Cache headers for static data?
- [ ] Compression enabled?

## Frontend Performance
- [ ] React Query staleTime/cacheTime configured?
- [ ] Components properly memoized?
- [ ] Images optimized with Next.js Image?
- [ ] Bundle size: unnecessary imports?
- [ ] Suspense boundaries for progressive loading?

## Docker/Infrastructure
- [ ] PostgreSQL: shared_buffers, work_mem configured?
- [ ] Redis: maxmemory policy set?
- [ ] Node.js: --max-old-space-size appropriate?
- [ ] Health checks: appropriate intervals?

## Output
For each finding:
```
[IMPACT: HIGH/MEDIUM/LOW] Location — Issue
  Current: what it does now
  Fix: what to change
  Expected improvement: description
```
