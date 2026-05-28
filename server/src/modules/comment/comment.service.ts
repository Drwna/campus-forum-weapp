import { ErrorCode } from "../../shared/errors.js";
import { AppError } from "../../utils/index.js";
import { notifyComment, notifyReply } from "../../utils/notify.js";
import { checkSensitive } from "../../infra/moderation/filter.js";
import * as commentRepo from "./comment.repo.js";
import * as postRepo from "../post/post.repo.js";
import type { CreateCommentDTO, CommentListQueryDTO } from "./comment.dto.js";

interface CommentFromDb {
  commentId: bigint;
  postId: bigint;
  parentId: bigint | null;
  replyToUserId: bigint | null;
  content: string;
  likeCount: number;
  status: number;
  createTime: Date;
  author: { userId: bigint; nickname: string; avatar: string | null };
  replyToUser: { userId: bigint; nickname: string } | null;
}

function toCommentItem(c: CommentFromDb) {
  return {
    commentId: c.commentId.toString(),
    postId: c.postId.toString(),
    parentId: c.parentId?.toString() ?? null,
    replyToUserId: c.replyToUserId?.toString() ?? null,
    author: {
      userId: c.author.userId.toString(),
      nickname: c.author.nickname,
      avatar: c.author.avatar,
    },
    replyToUser: c.replyToUser
      ? { userId: c.replyToUser.userId.toString(), nickname: c.replyToUser.nickname }
      : null,
    content: c.content,
    likeCount: c.likeCount,
    status: c.status,
    createTime: c.createTime.toISOString(),
  };
}

export async function createComment(postId: string, userId: string, dto: CreateCommentDTO) {
  const post = await postRepo.findPostById(BigInt(postId));
  if (!post || post.deletedAt) {
    throw AppError.badRequest(ErrorCode.PostNotFound, "帖子不存在");
  }

  // 敏感词过滤（可配置开关）
  const filterResult = await checkSensitive(dto.content);
  if (!filterResult.passed) {
    throw AppError.badRequest(ErrorCode.PostSensitiveContent, `评论内容包含敏感词：${filterResult.word}`);
  }

  let parentId: bigint | null = null;
  if (dto.parentId) {
    const parent = await commentRepo.findCommentById(BigInt(dto.parentId));
    if (!parent || parent.postId.toString() !== postId) {
      throw AppError.badRequest(ErrorCode.CommentNotFound, "父评论不存在");
    }
    parentId = parent.commentId;
  }

  const comment = await commentRepo.createComment({
    postId: BigInt(postId),
    userId: BigInt(userId),
    parentId,
    replyToUserId: dto.replyToUserId ? BigInt(dto.replyToUserId) : null,
    content: dto.content,
  });

  await commentRepo.incrementPostCommentCount(BigInt(postId));

  // 发送消息通知
  if (parentId && dto.replyToUserId) {
    // 回复评论 → 通知评论作者
    await notifyReply(BigInt(dto.replyToUserId), BigInt(userId), BigInt(postId), dto.content);
  } else {
    // 评论帖子 → 通知帖子作者
    await notifyComment(post.userId, BigInt(userId), BigInt(postId), dto.content);
  }

  return { commentId: comment.commentId.toString() };
}

export async function getCommentList(postId: string, query: CommentListQueryDTO) {
  const result = await commentRepo.getCommentList(
    BigInt(postId),
    query.page,
    query.size,
    query.parentId ? BigInt(query.parentId) : undefined,
  );

  return {
    list: result.list.map((c) => toCommentItem(c as CommentFromDb)),
    total: result.total,
    page: query.page,
    size: query.size,
    hasMore: query.page * query.size < result.total,
  };
}

export async function getReplies(commentId: string, page: number, size: number) {
  const result = await commentRepo.getReplies(BigInt(commentId), page, size);

  return {
    list: result.list.map((c) => toCommentItem(c as CommentFromDb)),
    total: result.total,
    page,
    size,
    hasMore: page * size < result.total,
  };
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await commentRepo.findCommentById(BigInt(commentId));
  if (!comment || comment.deletedAt) {
    throw AppError.badRequest(ErrorCode.CommentNotFound, "评论不存在");
  }
  if (comment.userId.toString() !== userId) {
    throw AppError.badRequest(ErrorCode.CommentForbidden, "无权删除此评论");
  }

  await commentRepo.deleteComment(BigInt(commentId));
  await commentRepo.decrementPostCommentCount(comment.postId);
}

export async function adminDeleteComment(commentId: string) {
  const comment = await commentRepo.findCommentById(BigInt(commentId));
  if (!comment || comment.deletedAt) {
    throw AppError.badRequest(ErrorCode.CommentNotFound, "评论不存在");
  }

  await commentRepo.deleteComment(BigInt(commentId));
  await commentRepo.decrementPostCommentCount(comment.postId);
}

export async function adminGetCommentList(params: { page: number; size: number; postId?: string }) {
  const result = await commentRepo.getAdminCommentList(params);

  return {
    list: result.list.map((c) => toCommentItem(c as unknown as CommentFromDb)),
    total: result.total,
    page: params.page,
    size: params.size,
    hasMore: params.page * params.size < result.total,
  };
}

export async function getMyComments(userId: string, page: number, size: number) {
  const result = await commentRepo.getMyComments(BigInt(userId), page, size);

  return {
    list: result.list.map((c) => ({
      ...toCommentItem(c as unknown as CommentFromDb),
      post: (c as { post?: { postId: bigint; title: string } }).post
        ? {
            postId: (c as { post: { postId: bigint; title: string } }).post.postId.toString(),
            title: (c as { post: { postId: bigint; title: string } }).post.title,
          }
        : null,
    })),
    total: result.total,
    page,
    size,
    hasMore: page * size < result.total,
  };
}
