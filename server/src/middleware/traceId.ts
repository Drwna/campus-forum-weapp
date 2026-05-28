import type { Request, Response, NextFunction } from "express";
import { generateTraceId } from "../utils/index.js";

/**
 * 请求追踪中间件
 * 优先使用客户端传入的x-trace-id（支持链路追踪透传），否则自动生成UUID
 * traceId会贯穿整个请求生命周期：日志记录、错误响应、API响应都携带此ID
 */
export function traceIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.traceId = (req.headers["x-trace-id"] as string) ?? generateTraceId();
  next();
}
