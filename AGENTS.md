# AGENTS.md

## Project

**CampusHub** — 校园论坛平台，三个独立项目，无 monorepo。

| 项目 | 技术栈 | 包管理器 | 入口 |
|---|---|---|---|
| `miniapp/` | uni-app 3 + Vue 3 + Pinia（JavaScript） | npm | HBuilderX 或 `npm run dev:h5` |
| `admin/` | Vue 3 + Vite + TypeScript + Element Plus + ECharts | pnpm | `pnpm dev` |
| `server/` | Express 4 + TypeScript + Prisma 7 + ioredis + Sharp | pnpm | `pnpm dev`（tsx watch src/app.ts） |

## Setup

```bash
# 启动依赖服务
docker-compose -f deploy/docker-compose.dev.yml up -d   # MySQL 8 + Redis 7
cp .env.example .env                                      # 按需修改

# Server
cd server && pnpm install
pnpm prisma generate && pnpm prisma migrate dev && pnpm prisma db seed

# Admin
cd admin && pnpm install

# Miniapp
cd miniapp && npm install
```

Seed 创建：管理员账号（`admin` / `ChangeMe_123456`，role=2）、4 个分类、应用配置、2 个测试敏感词。

## Commands

**Server** (`cd server`)：
```bash
pnpm dev                  # tsx watch 热重载
pnpm typecheck            # tsc --noEmit 类型检查
pnpm lint                 # eslint src 代码检查
pnpm test                 # vitest run 单元测试
pnpm prisma generate      # 重新生成 Prisma client
pnpm prisma migrate dev   # 执行数据库迁移
pnpm prisma db seed       # 填充种子数据
```

**Admin** (`cd admin`)：
```bash
pnpm dev                  # vite 开发服务器
pnpm build                # vue-tsc + vite 生产构建
pnpm typecheck            # vue-tsc --noEmit 类型检查
pnpm lint                 # eslint src 代码检查
pnpm test                 # vitest run 单元测试
```

**Miniapp** (`cd miniapp`)：
```bash
npm run dev:h5            # H5 开发模式（浏览器调试）
npm run dev:mp-weixin     # 微信小程序开发模式
npm run build:mp-weixin   # 微信小程序生产构建
```

## Architecture

### 后端分层架构

`server/src/` 采用四层架构：**Routes → Controllers → Services → Repositories**

- **Routes**：路由定义，绑定中间件和控制器
- **Controllers**：请求/响应编排，参数校验
- **Services**：业务规则（唯一的业务逻辑层）
- **Repositories**：数据访问，Prisma 查询

每个业务域是 `src/modules/` 下的独立模块：
```
src/modules/
├── auth/          # 认证（微信登录、管理员登录、JWT）
├── user/          # 用户信息、资料审核
├── post/          # 帖子 CRUD、分类权限
├── comment/       # 评论 CRUD、敏感词过滤
├── like/          # 点赞（Redis 计数器 + 异步同步）
├── follow/        # 关注关系
├── category/      # 分类管理
├── message/       # 站内消息（评论/点赞/关注/系统通知）
├── notice/        # 公告管理
├── profile/       # 个人资料审核（bio/昵称/性别/年龄）
├── file/          # 文件上传（Multer + Sharp 缩略图）
├── moderation/    # 敏感词过滤（可配置开关）
├── report/        # 举报管理（用户举报、结果通知）
└── admin/         # 管理后台 API（统计、审核、用户、配置管理）
```

### 中间件链

```
请求 → helmet → cors → traceId → rateLimit → auth(JWT) → rbac(角色) → validate(zod) → controller → errorHandler
```

### 基础设施

- `src/infra/prisma/client.ts` — Prisma 客户端（MariaDB 适配器，全局单例）
- `src/infra/redis/client.ts` — Redis 客户端（缓存、计数器、限流、JWT 黑名单）
- `src/infra/moderation/filter.ts` — 敏感词过滤（可配置开关，5 分钟缓存）
- `src/utils/notify.ts` — 消息通知工具（支持系统消息、举报结果通知）

## Data

- **MySQL 8**：通过 Prisma 访问，Schema 位于 `server/prisma/schema.prisma`（13 个模型）
- **Redis 7**：通过 ioredis 访问
  - 帖子列表缓存（5 分钟 TTL）
  - 点赞计数器（INCR/DECR + 每 5 秒批量同步 MySQL）
  - 限流（滑动窗口算法）
  - JWT 黑名单（登出/封禁时即时失效）
- **文件上传**：存储到 `/data/uploads/`，通过 Express 静态服务 `/uploads/*`
- **缩略图**：Sharp 生成 200px/600px/原图三种尺寸
- **敏感词过滤**：从 `sensitive_word` 表加载，内存缓存 5 分钟，通过 `app_config.comment_filter_enabled` 配置开关

## Shared Types

每个项目在 `src/shared/` 下有独立的共享类型副本（7 个文件，约 470 行）。通过 `./shared` 或 `@/shared` 导入。类型是手动同步的——修改时需保持一致。

## API Contract

- 基础路径：`/api/v1/{module}/{resource}`
- 鉴权：`Authorization: Bearer <jwt>`
- 统一响应：`{ code, message, data, traceId }`
- 错误码：4 位数字，前 2 位为模块（10=用户, 20=帖子, 30=评论, 40=互动, 50=审核, 90=系统）
- 分页：`?page=1&size=20` → `{ list, total, page, size, hasMore }`
- 完整规范：`docs/openapi.yaml`

## TypeScript 配置

- admin 和 server 的 `tsconfig.json` 启用 `noUncheckedIndexedAccess` 和 `exactOptionalPropertyTypes`
- Server 使用 `module: "NodeNext"` / `moduleResolution: "NodeNext"`（导入需 `.js` 扩展名）
- Admin 使用 `moduleResolution: "Bundler"`（无需 `.js` 扩展名）

## Lint 规则

ESLint flat config（每个项目 `eslint.config.js`）：
- `@typescript-eslint/consistent-type-imports`（error）
- `no-unused-vars`（error，`_` 前缀参数忽略）
- `vue/multi-word-component-names`（off，仅 admin）

Prettier（每个项目 `.prettierrc.json`）：
- `printWidth: 100`，`singleQuote: false`，`semi: true`，`trailingComma: "all"`

## Key Decisions

- 无 monorepo — 三个独立项目，各自管理依赖
- 单体后端（非微服务）
- JWT 无状态鉴权；Redis 黑名单实现即时失效（封禁/登出）
- 帖子先审后发：DFA + 微信内容安全预扫后入库，管理员事后审核
- 点赞计数器在 Redis，异步批量同步 MySQL
- 两种角色：用户（微信登录）和管理员（账号密码）
- Prisma 使用 BigInt 存储 ID；API 层统一转为字符串（避免 JS 精度丢失）
- miniapp 使用 npm（uni-app/HBuilderX 要求），admin/server 使用 pnpm
- `allowUserPost=0` 的分类（如活动公告）仅管理员可发布
- 个人资料审核：bio/昵称/性别/年龄修改需管理员审核，隐私设置（showGender/showAge）直接生效
- 评论敏感词过滤：可配置开关（`app_config.comment_filter_enabled`），5 分钟缓存刷新
- 举报结果通知：管理员处理举报后，系统自动通知举报人处理结果

## miniapp 说明

- uni-app 项目 — 必须遵循官方目录结构（`pages/`, `components/`, `static/`, `uni_modules/`）
- 需要 `pages.json`, `manifest.json`, `App.vue`, `main.js` 才能编译
- 使用 JavaScript（非 TypeScript），Vue 3 Composition API
- 通过 HBuilderX 或 `@dcloudio/vite-plugin-uni` CLI 编译
- 图片 URL 处理：服务器返回相对路径 `/uploads/...`，客户端通过 `resolveImageUrl()` 转为完整 URL
- 微信登录流程：`chooseAvatar` 选择头像 + `nickname` 输入框 + `wx.login` 获取 code
- 举报功能：帖子详情页右上角举报帖子，每条评论右侧举报评论

## 功能模块清单

### 客户端（miniapp）

| 页面 | 路径 | 功能 |
|---|---|---|
| 首页 | `/pages/index/index` | 帖子信息流、分类筛选、下拉刷新、公告横幅 |
| 帖子详情 | `/pages/detail/detail` | 内容展示、图片预览、点赞、评论列表、评论输入、举报帖子/评论 |
| 发帖 | `/pages/publish/publish` | 选择分类、输入标题/内容、上传图片 |
| 我的 | `/pages/mine/mine` | 用户卡片、帖子/粉丝/关注统计、功能菜单 |
| 消息 | `/pages/message/message` | 评论/点赞/关注/系统通知、下拉刷新、批量已读 |
| 登录 | `/pages/login/login` | 微信头像选择、昵称输入、一键登录 |
| 个人资料 | `/pages/editprofile/editprofile` | 编辑资料（bio 走审核）、隐私设置 |
| 我的帖子 | `/pages/myposts/myposts` | 帖子列表、审核状态筛选 |
| 我的评论 | `/pages/mycomments/mycomments` | 评论列表、跳转原帖 |
| 公告 | `/pages/notices/notices` | 公告列表、详情弹窗 |
| 设置 | `/pages/settings/settings` | 退出登录 |
| 用户主页 | `/pages/user/user` | 用户信息、帖子列表、关注/取消关注 |
| 关注列表 | `/pages/followlist/followlist` | 粉丝/关注切换 |

### 管理后台（admin）

| 页面 | 路径 | 功能 |
|---|---|---|
| 数据概览 | `/dashboard` | 统计卡片、待办事项快捷入口 |
| 帖子管理 | `/posts` | 列表、审核（通过/驳回）、删除 |
| 用户管理 | `/users` | 列表、角色切换、禁用/启用 |
| 评论管理 | `/comments` | 列表、删除 |
| 分类管理 | `/categories` | CRUD、allowUserPost 控制 |
| 公告管理 | `/notices` | CRUD、置顶 |
| 举报管理 | `/reports` | 列表、查看被举报内容、解决/驳回、通知举报人 |
| 资料审核 | `/profile-review` | 审核 bio/昵称/性别/年龄修改 |
| 系统配置 | `/configs` | 评论敏感词过滤开关等配置项管理 |
| 登录 | `/login` | 管理员账号密码登录 |

### 后端 API 模块

| 模块 | 路径 | 功能 |
|---|---|---|
| auth | `/api/v1/auth/` | 微信登录、管理员登录、刷新令牌、登出 |
| user | `/api/v1/users/` | 当前用户、用户详情、资料更新 |
| post | `/api/v1/posts/` | 帖子 CRUD、我的帖子 |
| comment | `/api/v1/comments/` | 评论 CRUD |
| like | `/api/v1/posts/:id/like` | 点赞/取消点赞 |
| follow | `/api/v1/users/:id/follow` | 关注/取消关注 |
| category | `/api/v1/categories/` | 分类列表 |
| message | `/api/v1/messages/` | 消息列表、未读数、标记已读 |
| file | `/api/v1/files/` | 文件上传（Multer + Sharp） |
| notice | `/api/v1/notices/` | 公告列表 |
| profile | `/api/v1/profile/` | 资料审核提交 |
| report | `/api/v1/reports/` | 用户举报（帖子/评论） |
| admin | `/api/v1/admin/` | 后台管理 API（统计、审核、用户、配置管理） |

## Files to Know

| 路径 | 用途 |
|---|---|
| `项目落地方案.md` | 完整项目方案（架构、DB 设计、API 设计、里程碑） |
| `docs/openapi.yaml` | API 契约（1376 行） |
| `server/prisma/schema.prisma` | 数据库 Schema（13 个模型） |
| `server/prisma/seed.ts` | 种子数据 |
| `.env.example` | 环境变量模板 |
| `deploy/docker-compose.dev.yml` | 本地开发 MySQL + Redis |
| `deploy/nginx.conf` | Nginx 反向代理配置 |
| `server/src/shared/errors.ts` | 错误码定义 |
| `server/src/utils/notify.ts` | 消息通知工具 |
| `server/src/infra/moderation/filter.ts` | 敏感词过滤（可配置开关） |
| `server/src/modules/report/report.routes.ts` | 举报 API |
| `miniapp/src/utils/http.js` | 请求封装 + 图片 URL 解析 |
| `miniapp/src/api/report.js` | 举报 API 接口 |
| `miniapp/src/stores/auth.js` | 客户端认证状态管理 |
| `admin/src/api/http.ts` | 管理后台 Axios 封装 |
| `admin/src/api/config.ts` | 配置管理 API |
| `admin/src/views/ConfigList.vue` | 系统配置管理页面 |
| `admin/src/views/ReportList.vue` | 举报管理页面 |
