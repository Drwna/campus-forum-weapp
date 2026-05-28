# CampusHub 校园论坛平台

CampusHub 是一个校园论坛平台，由三个独立项目组成。

## 项目结构

| 项目 | 技术栈 | 包管理器 | 说明 |
|---|---|---|---|
| `miniapp/` | uni-app 3 + Vue 3 + Pinia | npm | 微信小程序客户端 |
| `admin/` | Vue 3 + Vite + TypeScript + Element Plus | pnpm | 管理后台 |
| `server/` | Express 4 + TypeScript + Prisma 7 + ioredis | pnpm | 后端服务 |

## 快速开始

### 1. 启动依赖服务

```bash
docker-compose -f deploy/docker-compose.dev.yml up -d   # MySQL 8 + Redis 7
cp .env.example .env                                      # 按需修改
```

### 2. 启动后端服务

```bash
cd server
pnpm install
pnpm prisma generate      # 生成 Prisma client
pnpm prisma migrate dev   # 执行数据库迁移
pnpm prisma db seed       # 填充种子数据
pnpm dev                  # 启动开发服务器 (端口 3001)
```

### 3. 启动管理后台

```bash
cd admin
pnpm install
pnpm dev                  # 启动开发服务器 (端口 5173)
```

### 4. 启动小程序

```bash
cd miniapp
npm install
npm run dev:h5            # H5 开发模式 (端口 5174)
npm run dev:mp-weixin     # 微信小程序开发模式
```

## 默认账号

- **管理员账号**：`admin` / `ChangeMe_123456`
- **测试环境**：微信登录使用 mock 模式（`WECHAT_MOCK_ENABLED=true`）

## 主要功能

### 客户端功能

- 🏠 **首页**：帖子信息流、分类筛选、下拉刷新、公告横幅
- 📝 **发帖**：选择分类、输入标题/内容、上传图片
- 💬 **评论**：帖子评论、回复、敏感词过滤（可配置）
- ❤️ **点赞**：帖子点赞（Redis 计数器）
- 👤 **用户**：个人主页、关注/粉丝、帖子管理
- 🔔 **消息**：评论/点赞/关注/系统通知
- 📢 **公告**：系统公告列表
- 🚨 **举报**：举报帖子/评论、查看举报结果通知

### 管理后台功能

- 📊 **数据概览**：统计卡片、待办事项快捷入口
- 📋 **帖子管理**：列表、审核（通过/驳回）、删除
- 👥 **用户管理**：列表、角色切换、禁用/启用
- 💬 **评论管理**：列表、删除
- 📂 **分类管理**：CRUD、allowUserPost 控制
- 📢 **公告管理**：CRUD、置顶
- 🚨 **举报管理**：列表、查看被举报内容、解决/驳回、通知举报人
- ✅ **资料审核**：审核 bio/昵称/性别/年龄修改
- ⚙️ **系统配置**：评论敏感词过滤开关等配置项管理

## 技术特性

### 后端架构

- **分层架构**：Routes → Controllers → Services → Repositories
- **中间件链**：helmet → cors → traceId → rateLimit → auth → rbac → validate → controller → errorHandler
- **数据库**：MySQL 8 + Prisma 7（MariaDB 适配器）
- **缓存**：Redis 7（帖子缓存、点赞计数器、限流、JWT 黑名单）
- **文件上传**：Multer + Sharp（200px/600px/原图缩略图）
- **内容审核**：敏感词过滤（可配置开关，5 分钟缓存刷新）
- **举报系统**：用户举报 → 管理员处理 → 结果通知举报人

### 小程序特性

- **框架**：uni-app 3 + Vue 3 Composition API
- **状态管理**：Pinia
- **图片处理**：服务器返回相对路径，客户端通过 `resolveImageUrl()` 转完整 URL
- **登录流程**：`chooseAvatar` 选择头像 + `nickname` 输入框 + `wx.login` 获取 code
- **举报功能**：帖子/评论举报、原因选择、结果通知

## 项目文档

| 文档 | 说明 |
|---|---|
| `项目落地方案.md` | 完整项目方案（架构、DB 设计、API 设计、里程碑） |
| `docs/openapi.yaml` | API 契约（1376 行） |
| `AGENTS.md` | 开发指南（项目结构、命令、架构说明） |
| `.env.example` | 环境变量模板 |

## 开发命令

### Server

```bash
pnpm dev                  # tsx watch 热重载
pnpm typecheck            # tsc --noEmit 类型检查
pnpm lint                 # eslint src 代码检查
pnpm test                 # vitest run 单元测试
```

### Admin

```bash
pnpm dev                  # vite 开发服务器
pnpm build                # vue-tsc + vite 生产构建
pnpm typecheck            # vue-tsc --noEmit 类型检查
pnpm lint                 # eslint src 代码检查
```

### Miniapp

```bash
npm run dev:h5            # H5 开发模式（浏览器调试）
npm run dev:mp-weixin     # 微信小程序开发模式
npm run build:mp-weixin   # 微信小程序生产构建
```

## 环境变量

主要环境变量（详见 `.env.example`）：

```bash
# 数据库
DATABASE_URL=mysql://root:mysql123456@localhost:3306/campus_forum

# Redis
REDIS_URL=redis://:123456@localhost:6379/0

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# 微信小程序
WECHAT_APP_ID=your-app-id
WECHAT_APP_SECRET=your-app-secret
WECHAT_MOCK_ENABLED=true  # 开发环境启用 mock

# 服务配置
PORT=3001
API_BASE_PATH=/api/v1
UPLOAD_ROOT=./data/uploads
```

## 部署

### 开发环境

```bash
# 启动 MySQL + Redis
docker-compose -f deploy/docker-compose.dev.yml up -d

# 启动所有服务
cd server && pnpm dev &
cd admin && pnpm dev &
cd miniapp && npm run dev:h5 &
```

### 生产环境

```bash
# 构建
cd admin && pnpm build
cd miniapp && npm run build:mp-weixin

# 部署服务器
cd server && pnpm prisma migrate deploy
cd server && pnpm start
```

## 相关链接

- [uni-app 文档](https://uniapp.dcloud.net.cn/)
- [Vue 3 文档](https://vuejs.org/)
- [Prisma 文档](https://www.prisma.io/docs)
- [Element Plus 文档](https://element-plus.org/)
- [Express 文档](https://expressjs.com/)

## 许可证

MIT
