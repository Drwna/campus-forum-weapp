import type { Request, Response, NextFunction } from "express";
import { success, AppError } from "../../utils/index.js";
import { ErrorCode } from "../../shared/errors.js";
import { CreatePostSchema, UpdatePostSchema, PostListQuerySchema, MyPostListQuerySchema } from "./post.dto.js";
import * as postService from "./post.service.js";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = CreatePostSchema.parse(req.body);
    const result = await postService.createPost(req.userId!, dto);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function getDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await postService.getPostDetail(req.params.id!, req.userId);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function getList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = PostListQuerySchema.parse(req.query);
    const result = await postService.getPostList(query);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function getMyList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = MyPostListQuerySchema.parse(req.query);
    const result = await postService.getMyPostList(req.userId!, query);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = UpdatePostSchema.parse(req.body);
    await postService.updatePost(req.params.id!, req.userId!, dto);
    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await postService.deletePost(req.params.id!, req.userId!);
    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function adminGetList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = PostListQuerySchema.parse(req.query);
    const params: { page: number; size: number; status?: number; categoryId?: string; keyword?: string } = {
      page: query.page,
      size: query.size,
    };
    if (query.status !== undefined) params.status = query.status;
    if (query.categoryId !== undefined) params.categoryId = query.categoryId;
    if (query.keyword !== undefined) params.keyword = query.keyword;
    const result = await postService.adminGetPostList(params);
    success(res, result, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, rejectReason } = req.body as { status: number; rejectReason?: string };
    if (status === 2 && !rejectReason?.trim()) {
      throw AppError.badRequest(ErrorCode.InternalError, "驳回原因不能为空");
    }
    await postService.adminUpdatePostStatus(req.params.id!, status, rejectReason);
    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
}

export async function adminRemove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await postService.adminDeletePost(req.params.id!);
    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
}
