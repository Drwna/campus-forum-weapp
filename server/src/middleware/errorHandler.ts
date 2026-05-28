import type { Request, Response, NextFunction } from "express";
import { AppError, fail, logger } from "../utils/index.js";

// 扩展Express的Request类型，添加项目自定义字段
// 这些字段由中间件链注入：traceIdMiddleware → requireAuth
declare global {
  namespace Express {
    interface Request {
      traceId: string;    // 请求追踪ID，贯穿整个链路
      userId?: string;    // 当前登录用户ID（由requireAuth注入）
      userRole?: number;  // 当前用户角色（由requireAuth注入）
    }
  }
}

/**
 * 全局错误处理中间件（Express要求4个参数签名）
 * 区分两种错误：
 * 1. AppError（业务错误）：返回对应的错误码和消息，HTTP状态码由AppError决定
 * 2. 未捕获异常（程序bug）：返回通用500错误，隐藏内部细节，记录完整堆栈
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const traceId = req.traceId ?? "unknown";

  if (err instanceof AppError) {
    logger.warn("AppError", {
      traceId,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
    });
    fail(res, err.code, err.message, traceId, err.statusCode);
    return;
  }

  // 未处理的异常：记录完整堆栈，但不暴露给客户端
  logger.error("Unhandled error", {
    traceId,
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  fail(res, 9002, "服务器内部错误", traceId, 500);
}
