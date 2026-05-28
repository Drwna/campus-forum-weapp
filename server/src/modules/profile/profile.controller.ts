import type { Request, Response, NextFunction } from "express";
import { success } from "../../utils/index.js";
import { SubmitProfileReviewSchema } from "./profile.dto.js";
import * as profileService from "./profile.service.js";

export async function submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = SubmitProfileReviewSchema.parse(req.body);
    const result = await profileService.submitReview(req.userId!, dto);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function getMyReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await profileService.getMyReview(req.userId!);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function getReviewList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 20);
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const params: { page: number; size: number; status?: number } = { page, size };
    if (status !== undefined) params.status = status;
    const result = await profileService.getReviewList(params);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function approveReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await profileService.approveReview(req.params.id!, req.userId!);
    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function rejectReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rejectReason } = req.body as { rejectReason: string };
    await profileService.rejectReview(req.params.id!, req.userId!, rejectReason);
    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
}
