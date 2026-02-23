Scaffold a complete feature end-to-end following ALL project conventions.

Feature name: $ARGUMENTS

You are a senior NestJS + Next.js full-stack engineer. Follow these steps precisely:

## Step 1: Analyze Requirements
- Parse the feature name to understand what entity/resource is needed
- Check existing modules for similar patterns to follow
- Determine if this needs: Entity, Repository, Service, Controller, DTOs, Queue jobs, Frontend page

## Step 2: Backend — Entity + Repository
- Create entity at `packages/backend/src/modules/database/entities/{name}.entity.ts`
- MUST extend BaseEntity pattern: UUID PK, createdAt/updatedAt (timestamptz), deletedAt (soft delete)
- Use snake_case column names with `name` parameter
- Add proper @Index decorators for query performance
- Use enums defined in same file for status fields
- Use `type: 'jsonb'` for flexible metadata
- Create repository at `packages/backend/src/modules/database/repositories/{name}.repository.ts`
- Repository MUST extend `Repository<Entity>` with `@InjectDataSource()` constructor
- Add domain-specific query methods (not just CRUD)
- Register both in DatabaseModule

## Step 3: Backend — Service
- Create service with `@Injectable()`
- Inject repositories via constructor
- Implement: create, findAll (with pagination), findOne, update, delete (soft)
- Use `PaginatedResult<T>` for list endpoints
- Throw `NotFoundException`, `BadRequestException` for errors
- Add queue job triggers if async processing needed

## Step 4: Backend — Controller + DTOs
- Controller: `@ApiTags()`, `@Controller('api/v1/{resource}')`
- DTOs: `Create{Name}Dto`, `Update{Name}Dto`, `List{Name}Dto extends PaginationDto`
- Use class-validator decorators: @IsString, @IsOptional, @IsEnum, etc.
- Use @ApiPropertyOptional for Swagger
- Response format: `{ success: true, data: ..., meta?: { total, page, limit, totalPages } }`
- Add @Throttle per endpoint
- Add @ApiOperation({ summary }) for each endpoint

## Step 5: Frontend — Page + Components
- Create page at `packages/web/src/app/{resource}/page.tsx`
- Use React Query: `useQuery({ queryKey: ['{resource}'], queryFn: ... })`
- Add API client methods to `packages/web/src/lib/api.ts`
- Add TypeScript types to `packages/web/src/types/api.ts`
- Use shadcn/ui components (Table, Badge, Button, Dialog)
- Follow existing status color mapping patterns
- Add to sidebar navigation

## Step 6: Queue Jobs (if applicable)
- Add queue name to `shared/constants/queue.ts`
- Add producer method to QueueService
- Create consumer extending WorkerHost
- Use exponential backoff for retries

## Step 7: Verify
- Run `make lint` to check for errors
- Run `make build` to ensure compilation
- List all created/modified files
