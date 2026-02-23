Create a new NestJS module in the backend following project conventions.

The module name is: $ARGUMENTS

Steps:
1. Create the module directory at `packages/backend/src/modules/$ARGUMENTS/`
2. Create the following files following existing patterns in the codebase:
   - `$ARGUMENTS.module.ts` — NestJS module with proper imports/exports
   - `$ARGUMENTS.service.ts` — Service class with @Injectable()
   - `$ARGUMENTS.controller.ts` — Controller with @Controller('api/v1/$ARGUMENTS') (only if it needs REST endpoints)
   - `dto/` directory for DTOs if needed
3. Follow project conventions:
   - Use TypeORM patterns from database module
   - Use BullMQ patterns from queue/worker modules
   - Use registerAs config pattern from shared/config
   - Follow response format: `{ success: true, data: ... }`
4. Register the new module in the appropriate parent module (AppModule or feature module)
5. Report what was created

Argument: $ARGUMENTS (required: module name in kebab-case)
