import type { Request, Response, NextFunction } from "express";
import { success } from "../../utils/index.js";
import { UpdateProfileSchema } from "./user.dto.js";
import * as userService from "./user.service.js";

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await userService.getCurrentUser(req.userId!);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = UpdateProfileSchema.parse(req.body);
    const result = await userService.updateCurrentUser(req.userId!, dto);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await userService.getUserById(req.params.id!);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}
