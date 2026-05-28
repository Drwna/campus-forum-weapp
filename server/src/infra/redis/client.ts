import { Redis } from "ioredis";
import { logger } from "../../utils/logger.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379/0";

// 创建Redis连接实例
// 用途：帖子列表缓存(5min TTL)、点赞计数器(INCR/DECR+批量同步)、限流、JWT黑名单
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  // 重试策略：每次重试间隔递增200ms，最大3s，避免重连风暴
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
});

redis.on("connect", () => {
  logger.info("Redis connected");
});

redis.on("error", (error: Error) => {
  logger.error("Redis error", { error: error.message });
});

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info("Redis disconnected");
}
