import type { Request, Response, NextFunction } from "express";
import { success } from "../../utils/index.js";
import { WechatLoginSchema, AdminLoginSchema, RefreshTokenSchema } from "./auth.dto.js";
import * as authService from "./auth.service.js";

export async function wechatLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = WechatLoginSchema.parse(req.body);
    const result = await authService.wechatLogin(dto);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = AdminLoginSchema.parse(req.body);
    const result = await authService.adminLogin(dto);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = RefreshTokenSchema.parse(req.body);
    const result = await authService.refreshToken(dto);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.slice(7) ?? "";
    const { refreshToken: refreshTokenStr } = req.body as { refreshToken?: string };
    await authService.logout(token, refreshTokenStr ?? "");
    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
}
