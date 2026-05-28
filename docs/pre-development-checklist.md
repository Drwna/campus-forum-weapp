# Pre-Development Checklist

Use this checklist before implementing business modules.

## Contract Freeze

- OpenAPI paths for MVP flows are present in `docs/openapi.yaml`.
- All API IDs are strings, including IDs backed by MySQL `BIGINT`.
- Unified response is `{ code, message, data, traceId }`.
- Pagination is `{ list, total, page, size, hasMore }`.
- Admin APIs document moderator/admin role requirements.

## Data Model

- Prisma schema is present in `packages/server/prisma/schema.prisma`.
- Seed data creates a default admin, default categories, basic app config, and test sensitive words.
- Fulltext `ngram` index is tracked as a manual migration item.
- User identity rules are enforced in service code as well as database constraints where possible.

## Local Environment

- Copy `.env.example` to `.env` and fill secrets.
- Start MySQL and Redis with `docker-compose -f deploy/docker-compose.dev.yml up -d`.
- Run `pnpm install` before Prisma generation or type checks.
- Run `pnpm prisma:generate` and `pnpm prisma:migrate` after dependencies are installed.

## Implementation Order

1. Shared zod schemas or DTO mappers.
2. Server infra: env, logger, response, error, traceId, auth middleware.
3. Prisma migration and seed verification.
4. Auth/User.
5. File/Storage.
6. Post/Category.
7. Comment/Message.
8. Like/Follow with Redis Stream worker.
9. Admin moderation workflows.
10. Miniapp and admin UI integration.
