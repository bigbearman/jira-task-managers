Design a new API endpoint following project REST conventions.

Endpoint description: $ARGUMENTS

You are a senior API architect. Design and implement following project standards.

## Step 1: Design
- Determine the resource name (plural, kebab-case)
- Define the HTTP methods needed:
  - `GET /api/v1/{resource}` — List with pagination
  - `GET /api/v1/{resource}/:id` — Get single
  - `POST /api/v1/{resource}` — Create
  - `PUT /api/v1/{resource}/:id` — Update
  - `DELETE /api/v1/{resource}/:id` — Soft delete
  - `POST /api/v1/{resource}/:id/{action}` — Custom actions

## Step 2: Response Contract
```typescript
// Success
{ success: true, data: T, message?: string }

// Paginated
{ success: true, data: T[], meta: { total, page, limit, totalPages, hasNext, hasPrev } }

// Error
{ success: false, message: string, statusCode: number, errorId?: string }
```

## Step 3: Implementation
1. Create/update DTOs with validation:
   - Request body: class-validator decorators
   - Query params: @Type(() => Number) for numeric, @IsOptional for optional
   - @ApiPropertyOptional for Swagger
2. Create/update controller:
   - @ApiTags for grouping
   - @ApiOperation({ summary }) per endpoint
   - @Throttle({ default: { ttl: 60000, limit: N } })
   - Inject service, not repository directly
3. Create/update service:
   - Business logic and validation
   - Repository calls
   - Queue triggers for async work

## Step 4: Swagger Verification
- Ensure all endpoints appear in /docs
- All DTOs documented
- Response schemas correct

## Step 5: Test the endpoint
- Show curl examples for each endpoint
- Include headers: Content-Type, x-api-key
