import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import path from "node:path";
import { logger } from "./utils/logger.js";
import { connectDatabase, disconnectDatabase } from "./infra/prisma/client.js";
import { disconnectRedis } from "./infra/redis/client.js";
import { traceIdMiddleware, errorHandler, rateLimitMiddleware } from "./middleware/index.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import categoryRoutes from "./modules/category/category.routes.js";
import postRoutes from "./modules/post/post.routes.js";
import commentRoutes from "./modules/comment/comment.routes.js";
import likeRoutes from "./modules/like/like.routes.js";
import messageRoutes from "./modules/message/message.routes.js";
import fileRoutes from "./modules/file/file.routes.js";
import noticeRoutes from "./modules/notice/notice.routes.js";
import profileRoutes from "./modules/profile/profile.routes.js";
import reportRoutes from "./modules/report/report.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const basePath = process.env.API_BASE_PATH ?? "/api/v1";
const uploadRoot = process.env.UPLOAD_ROOT ?? "./data/uploads";

// ── 全局中间件链 ──
// 执行顺序：helmet → cors → body解析 → traceId → 限流
// helmet: 设置安全HTTP头，cross-origin策略允许跨域加载静态资源（如图片）
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
// 限制请求体大小为10MB，适应包含图片URL的帖子内容
app.use(express.json({ limit: "10mb" }));
// 为每个请求分配唯一traceId，贯穿整个请求链路，方便日志追踪和问题排查
app.use(traceIdMiddleware);
// 基于Redis的滑动窗口限流，已登录用户按userId、未登录按IP分别限制
app.use(rateLimitMiddleware);

// ── 静态文件服务（用户上传的文件）──
app.use("/uploads", express.static(path.resolve(uploadRoot)));

// ── 健康检查端点，用于容器编排探活 ──
app.get("/healthz", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 业务路由注册 ──
// 按模块划分路由，前缀遵循RESTful规范：/api/v1/{模块名}
app.use(`${basePath}/auth`, authRoutes);         // 认证：登录、刷新token、登出
app.use(`${basePath}/users`, userRoutes);         // 用户信息查询
app.use(`${basePath}/categories`, categoryRoutes); // 分类管理
app.use(`${basePath}/posts`, postRoutes);         // 帖子CRUD（评论和点赞嵌套在帖子下，故用根路径）
app.use(`${basePath}`, commentRoutes);            // 评论：/posts/:id/comments
app.use(`${basePath}`, likeRoutes);               // 点赞：/posts/:id/like
app.use(`${basePath}/messages`, messageRoutes);   // 私信/消息
app.use(`${basePath}/files`, fileRoutes);         // 文件上传
app.use(`${basePath}/notices`, noticeRoutes);     // 系统公告
app.use(`${basePath}/profile`, profileRoutes);    // 个人资料编辑
app.use(`${basePath}/reports`, reportRoutes);     // 用户举报
app.use(`${basePath}/admin`, adminRoutes);        // 后台管理接口（需管理员权限）

// ── 全局错误处理（必须放在所有路由之后）──
// 捕获所有未处理的错误，统一返回 { code, message, data, traceId } 格式
app.use(errorHandler);

// ── 启动服务 ──
async function start() {
  // 先连接数据库，再启动HTTP服务，确保请求到来时数据库已就绪
  await connectDatabase();

  app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
    logger.info(`API base path: ${basePath}`);
  });
}

start().catch((error) => {
  logger.error("Failed to start server", { error });
  process.exit(1);
});

// ── 优雅关闭 ──
// 收到终止信号时，先断开数据库和Redis连接，释放资源，再退出进程
// 避免连接泄露和数据不一致
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down...");
  await disconnectDatabase();
  await disconnectRedis();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down...");
  await disconnectDatabase();
  await disconnectRedis();
  process.exit(0);
});
