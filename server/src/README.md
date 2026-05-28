# Server Source Layout

Layering: **Routes → Controllers → Services → Repositories**

Planned directories:

```text
modules/      # domain modules (auth, post, comment, etc.)
middleware/   # auth, rbac, validate, rateLimit, logger, errorHandler
infra/        # prisma client, wechat SDK, storage, moderation
jobs/         # async workers (likeSync, orphanFileClean, messageMerge)
utils/        # helpers
shared/       # shared types (from @campushub/shared)
```
