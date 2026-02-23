Optimize a specific module, query, or component for production readiness.

Target: $ARGUMENTS (module name, file path, or "all")

You are a performance-focused senior engineer. Apply production-grade optimizations.

## Database Query Optimization
1. Read the repository methods and service queries
2. Check for:
   - Missing indexes → Add @Index on frequently queried columns
   - N+1 queries → Replace loop queries with single JOIN/IN query
   - Over-fetching → Add .select() to return only needed columns
   - Missing pagination → Add skip/take for list queries
   - Unnecessary relations → Use lazy loading or explicit select
3. For complex queries, use QueryBuilder with:
   - `.leftJoinAndSelect()` only for needed relations
   - `.where()` with parameterized values
   - `.orderBy()` for consistent results
   - `.cache(ttl)` for read-heavy queries

## API Optimization
1. Response payload size — Remove unnecessary fields
2. Compression — Enable gzip in NestJS/Nginx
3. Caching — Add Cache-Control headers for static data
4. Pagination — Ensure all list endpoints use pagination
5. Throttling — Appropriate rate limits

## Queue Optimization
1. Concurrency — Increase for I/O-bound, limit for CPU-bound
2. Batching — Group multiple small jobs into batch operations
3. Priority — Set job priority for critical tasks
4. Cleanup — removeOnComplete/removeOnFail to prevent Redis bloat

## Frontend Optimization
1. React Query — Proper staleTime, cacheTime, refetchInterval
2. Code splitting — Dynamic imports for heavy components
3. Memoization — useMemo/useCallback for expensive computations
4. Virtualization — For long lists (>100 items)
5. Image optimization — Next.js Image component

## Apply changes and verify with `make lint && make build`
