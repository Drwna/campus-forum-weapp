import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../modules/auth/jwt.js";
import { AppError } from "../utils/index.js";

/**
 * 认证中间件：验证JWT令牌
 * 从Authorization头提取Bearer token，验证后将userId和role挂载到req上
 * 后续路由可通过req.userId和req.userRole获取当前用户信息
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw AppError.unauthorized();
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);
  if (!payload) {
    throw AppError.unauthorized("token 无效或已过期");
  }

  // 将解析出的用户信息挂载到请求对象，供后续处理器使用
  req.userId = payload.userId;
  req.userRole = payload.role;
  next();
}

/**
 * 角色鉴权中间件：检查当前用户是否具有指定角色
 * 使用方式：requireRole(UserRole.Admin) 或 requireRole(UserRole.Admin, UserRole.Moderator)
 * 角色值定义见 shared/enums.ts: UserRole (0=学生, 1=版主, 2=管理员)
 */
export function requireRole(...roles: number[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.userRole === undefined || !roles.includes(req.userRole)) {
      throw AppError.forbidden();
    }
    next();
  };
}
