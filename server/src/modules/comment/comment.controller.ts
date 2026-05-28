import type { Request, Response, NextFunction } from "express";
import { success } from "../../utils/index.js";
import { CreateCommentSchema, CommentListQuerySchema } from "./comment.dto.js";
import * as commentService from "./comment.service.js";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = CreateCommentSchema.parse(req.body);
    const result = await commentService.createComment(req.params.postId!, req.userId!, dto);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function getList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = CommentListQuerySchema.parse(req.query);
    const result = await commentService.getCommentList(req.params.postId!, query);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function getReplies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 20);
    const result = await commentService.getReplies(req.params.id!, page, size);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await commentService.deleteComment(req.params.id!, req.userId!);
    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function adminGetList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 20);
    const postId = req.query.postId as string | undefined;
    const params: { page: number; size: number; postId?: string } = { page, size };
    if (postId !== undefined) params.postId = postId;
    const result = await commentService.adminGetCommentList(params);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function adminRemove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await commentService.adminDeleteComment(req.params.id!);
    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function getMyList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 20);
    const result = await commentService.getMyComments(req.userId!, page, size);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}
