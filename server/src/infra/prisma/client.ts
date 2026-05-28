import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { logger } from "../../utils/logger.js";

// 开发环境下的全局单例：避免HMR热重载时创建多个PrismaClient实例导致连接池耗尽
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/** 将MySQL连接URL解析为各组件，供MariaDB驱动使用 */
function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.slice(1),
  };
}

/**
 * 创建PrismaClient实例
 * 使用MariaDB适配器替代默认的mysql2驱动，兼容性更好
 */
function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? "mysql://root:mysql123456@localhost:3306/campus_forum";
  const connInfo = parseDatabaseUrl(dbUrl);

  // 连接池配置：最多10个并发连接，获取连接超时60s，初始连接超时10s
  const adapter = new PrismaMariaDb({
    host: connInfo.host,
    port: connInfo.port,
    user: connInfo.user,
    password: connInfo.password,
    database: connInfo.database,
    connectionLimit: 10,
    acquireTimeout: 60000,
    connectTimeout: 10000,
  });
  return new PrismaClient({
    adapter,
    // 开发环境记录错误和警告，生产环境只记录错误，减少日志噪音
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// 导出单例：开发环境复用全局实例，生产环境每次创建新实例
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("Database connected");
  } catch (error) {
    logger.error("Database connection failed", { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info("Database disconnected");
}
