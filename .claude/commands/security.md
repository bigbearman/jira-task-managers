Security audit for the Multi Jira Task Manager project.

Target: $ARGUMENTS (optional: module name or "all")

You are a security engineer. Find vulnerabilities following OWASP Top 10.

## Authentication & Authorization
- [ ] API Key guard applied to all sensitive endpoints?
- [ ] No hardcoded credentials in source code?
- [ ] Environment variables for all secrets?
- [ ] .env files in .gitignore?

## Input Validation
- [ ] All DTOs have class-validator decorators?
- [ ] No raw user input in SQL queries? (must use parameterized)
- [ ] File upload validation if applicable?
- [ ] URL validation for redirect/callback URLs?
- [ ] JSON body size limits configured?

## SQL Injection
- [ ] All repository queries use TypeORM methods or parameterized QueryBuilder?
- [ ] No string interpolation in .where() clauses?
- [ ] No raw SQL with user input?

## XSS Prevention
- [ ] API responses have proper Content-Type headers?
- [ ] HTML/Markdown content sanitized before storage?
- [ ] Frontend: no dangerouslySetInnerHTML with user data?

## Rate Limiting
- [ ] @Throttle on all public endpoints?
- [ ] Reasonable limits (not too high)?
- [ ] Login/auth endpoints have stricter limits?

## Data Exposure
- [ ] Passwords/tokens not returned in API responses?
- [ ] Soft-deleted data not accessible via API?
- [ ] Error messages don't expose internal details?
- [ ] Stack traces hidden in production? (500 errorId pattern)

## Dependencies
- Run `pnpm audit` for known vulnerabilities
- Check for outdated packages with known CVEs

## Docker Security
- [ ] Non-root user in Dockerfile?
- [ ] No secrets in Docker build args?
- [ ] Minimal base image?
- [ ] Health check doesn't expose sensitive info?

## Output: Findings with CRITICAL/HIGH/MEDIUM/LOW severity and fix recommendations.
