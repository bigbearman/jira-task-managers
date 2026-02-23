Create a new TypeORM entity following project conventions.

The entity name is: $ARGUMENTS

Steps:
1. Read existing entities in `packages/backend/src/modules/database/entities/` to understand patterns
2. Create the entity file at `packages/backend/src/modules/database/entities/$ARGUMENTS.entity.ts`
3. Follow conventions:
   - Extend BaseEntity pattern (UUID primary key, createdAt, updatedAt, deletedAt with soft delete)
   - Use proper TypeORM decorators (@Entity, @Column, @PrimaryGeneratedColumn, etc.)
   - Add proper indexes and relations
4. Create repository at `packages/backend/src/modules/database/repositories/$ARGUMENTS.repository.ts`
5. Register entity in DatabaseModule
6. Report what was created and remind about migrations

Argument: $ARGUMENTS (required: entity name in kebab-case, e.g. "project" or "sprint")
