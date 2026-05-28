# CLAUDE.md

## Project

**CampusHub** — campus forum platform. Three independent projects, no monorepo.

| Project | Stack | Pkg Manager | Entry |
|---|---|---|---|
| `miniapp/` | uni-app 3 + Vue 3 + Pinia | npm | HBuilderX or `npm run dev:mp-weixin` |
| `admin/` | Vue 3 + Vite + TS + Element Plus + ECharts | pnpm | `pnpm dev` |
| `server/` | Express 4 + TS + Prisma 7 + ioredis + Sharp | pnpm | `pnpm dev` (tsx watch src/app.ts) |

## Setup

```bash
docker-compose -f deploy/docker-compose.dev.yml up -d   # MySQL 8 + Redis 7
cp .env.example .env                                      # edit as needed

# Server
cd server && pnpm install
pnpm prisma generate && pnpm prisma migrate dev && pnpm prisma db seed

# Admin
cd admin && pnpm install

# Miniapp
cd miniapp && npm install
```

Seed creates: admin account (`admin` / `ChangeMe_123456`, role=2), 4 categories, app configs, 2 test sensitive words.

## Commands

**Server** (`cd server`):
```bash
pnpm dev                  # tsx watch
pnpm typecheck            # tsc --noEmit
pnpm lint                 # eslint src
pnpm test                 # vitest run
pnpm prisma generate      # regenerate Prisma client
pnpm prisma migrate dev   # run migrations
pnpm prisma db seed       # seed database
```

**Admin** (`cd admin`):
```bash
pnpm dev                  # vite dev server
pnpm build                # vue-tsc + vite build
pnpm typecheck            # vue-tsc --noEmit
pnpm lint                 # eslint src
pnpm test                 # vitest run
```

**Miniapp** (`cd miniapp`):
```bash
npm run dev:mp-weixin     # uni dev for WeChat
npm run build:mp-weixin   # uni build for WeChat
```

## Architecture

Backend (`server/src/`) layering: **Routes → Controllers → Services → Repositories**. Business rules only in Services. Each domain is a module under `src/modules/{auth,post,comment,like,follow,category,message,moderation,notice,admin}/` with `*.controller.ts`, `*.service.ts`, `*.repo.ts`, `*.dto.ts`, `*.routes.ts`.

Middleware chain: auth (JWT) → rbac → validate (zod) → rateLimit → logger → errorHandler.

Infra: `src/infra/prisma` (client), `src/infra/wechat`, `src/infra/storage` (local disk + Sharp thumbnails), `src/infra/moderation` (DFA filter).

Async jobs: `src/jobs/` — likeSync (Redis→MySQL), orphanFileClean, messageMerge.

## Data

- **MySQL 8** via Prisma. Schema: `server/prisma/schema.prisma`. Uses `@prisma/adapter-mariadb` driver.
- **Redis 7** via ioredis — post list cache (5min TTL), like counters (INCR/DECR + batch sync every 5s), rate limiting, JWT blacklist.
- **Uploads** to `/data/uploads/`, served by nginx at `/uploads/*`. Sharp generates 200px/600px/original thumbnails.

## Shared Types

Each project has its own copy of the shared types in `src/shared/` (7 files, ~470 lines). Import via `./shared` or `@/shared`. Types are duplicated — keep them in sync manually if changes are needed.

## API Contract

- Base: `/api/v1/{module}/{resource}`
- Auth: `Authorization: Bearer <jwt>`
- Response: `{ code, message, data, traceId }` — see `server/src/shared/` for types
- Error codes: 4-digit, first 2 = module (10=user, 20=post, 30=comment, 40=interaction, 50=moderation, 90=system)
- Pagination: `?page=1&size=20` → `{ list, total, page, size, hasMore }`
- Full spec: `docs/openapi.yaml`

## TypeScript Strictness

Both admin and server `tsconfig.json` enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Server uses `module: "NodeNext"` / `moduleResolution: "NodeNext"`.

## Lint Rules

ESLint flat config (`eslint.config.js` in each project): `@typescript-eslint/consistent-type-imports` (error), `no-unused-vars` (error, `_`-prefixed args ignored), `vue/multi-word-component-names` (off, admin only).

Prettier (`.prettierrc.json` in each project): `printWidth: 100`, `singleQuote: false`, `semi: true`, `trailingComma: "all"`.

## Key Decisions

- No monorepo — three independent projects, each with own package manager
- Monolith backend (not microservices)
- JWT stateless auth; token blacklist in Redis for instant revocation (bans)
- Post-then-review: posts live after DFA + WeChat content safety pre-scan; admin reviews after
- Like counters in Redis with async batch sync to MySQL
- Two roles: user (WeChat login) and admin (account+password)
- Prisma uses BigInt for IDs; shared types use `ID = string`
- miniapp uses npm (uni-app/HBuilderX requirement), admin/server use pnpm

## miniapp Notes

- uni-app project — must follow official directory structure (`pages/`, `components/`, `static/`, `uni_modules/`)
- Requires `pages.json`, `manifest.json`, `App.vue`, `main.js` for HBuilderX compilation
- Uses JavaScript (not TypeScript), Vue 3 Composition API
- Compiled by HBuilderX or `@dcloudio/vite-plugin-uni` CLI

## Files to Know

| Path | Purpose |
|---|---|
| `项目落地方案.md` | Full project plan (architecture, DB schema, API design, milestones) |
| `docs/openapi.yaml` | API contract (1376 lines) |
| `server/prisma/schema.prisma` | Database schema (13 models) |
| `server/prisma/seed.ts` | Seed data |
| `.env.example` | All env vars with defaults |
| `deploy/docker-compose.dev.yml` | MySQL + Redis for local dev |
| `deploy/nginx.conf` | Reverse proxy + static file serving |
