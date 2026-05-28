import type { Request, Response, NextFunction } from "express";
import { redis } from "../infra/redis/client.js";
import { fail } from "../utils/index.js";

// 已登录用户每分钟60次，未登录（按IP）每分钟200次
// 未登录限制更宽松是因为IP粒度较粗，同一校园网可能共享出口IP
const RATE_LIMIT_USER_PER_MINUTE = Number(process.env.RATE_LIMIT_USER_PER_MINUTE ?? 60);
const RATE_LIMIT_IP_PER_MINUTE = Number(process.env.RATE_LIMIT_IP_PER_MINUTE ?? 200);

/**
 * 滑动窗口限流中间件（基于Redis）
 * 算法：固定窗口计数器，每60秒一个窗口
 * key格式：rl:user:{userId}:{窗口时间戳} 或 rl:ip:{ip}:{窗口时间戳}
 * 使用Redis MULTI原子操作保证并发安全
 */
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.userId ? `rl:user:${req.userId}` : `rl:ip:${req.ip}`;
  const limit = req.userId ? RATE_LIMIT_USER_PER_MINUTE : RATE_LIMIT_IP_PER_MINUTE;

  const now = Math.floor(Date.now() / 1000);
  // 按分钟整数划分窗口，同一分钟内共享计数器
  const windowKey = `${key}:${Math.floor(now / 60)}`;

  redis
    .multi()
    .incr(windowKey)      // 计数+1（key不存在时自动创建并返回1）
    .expire(windowKey, 60) // 设置60秒过期，窗口结束后自动清理
    .exec()
    .then((results: [Error | null, unknown][] | null) => {
      const count = results?.[0]?.[1] as number | undefined;
      if (count !== undefined && count > limit) {
        fail(res, 9001, "请求过于频繁，请稍后再试", req.traceId, 429);
        return;
      }
      next();
    })
    .catch(() => {
      // Redis故障时放行，避免限流组件故障导致服务完全不可用（降级策略）
      next();
    });
}
