import { ErrorCode } from "../../shared/errors.js";
import { AppError } from "../../utils/index.js";
import { PostStatus, MessageType, TargetType } from "../../shared/enums.js";
import { prisma } from "../../infra/prisma/client.js";
import { createMessage } from "../../utils/notify.js";
import * as postRepo from "./post.repo.js";
import type { CreatePostDTO, UpdatePostDTO, PostListQueryDTO, MyPostListQueryDTO } from "./post.dto.js";

// 数据库原始帖子类型，BigInt字段在序列化时需转为string
interface PostFromDb {
  postId: bigint;
  title: string;
  content: string;
  imageUrls: unknown;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  status: number;
  isTop: number;
  rejectReason: string | null;
  createTime: Date;
  author: { userId: bigint; nickname: string; avatar: string | null };
  category: { categoryId: number; categoryName: string };
}

/** 将数据库帖子对象转换为API响应格式，BigInt转string，提取摘要 */
function toPostItem(post: PostFromDb) {
  return {
    postId: post.postId.toString(),
    author: {
      userId: post.author.userId.toString(),
      nickname: post.author.nickname,
      avatar: post.author.avatar,
    },
    category: {
      categoryId: post.category.categoryId.toString(),
      categoryName: post.category.categoryName,
    },
    title: post.title,
    content: post.content,
    excerpt: post.content.slice(0, 200), // 帖子列表只返回前200字摘要
    imageUrls: (post.imageUrls as string[]) ?? [],
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    viewCount: post.viewCount,
    status: post.status,
    isTop: post.isTop === 1,  // 数据库存0/1，转为布尔值
    rejectReason: post.rejectReason,
    createTime: post.createTime.toISOString(),
  };
}

/**
 * 创建帖子
 * 业务规则：
 * 1. 分类必须存在且未隐藏
 * 2. 分类的allowUserPost字段控制是否允许普通用户发帖（某些分类仅管理员可发）
 * 3. 采用"先发后审"策略：帖子创建后状态为Pending，管理员审核通过后才对其他用户可见
 */
export async function createPost(userId: string, dto: CreatePostDTO) {
  const categoryId = Number(dto.categoryId);
  const category = await prisma.category.findUnique({ where: { categoryId } });
  if (!category || category.status !== 0) {
    throw AppError.badRequest(ErrorCode.InternalError, "分类不存在");
  }
  // 权限检查：allowUserPost=0表示该分类仅管理员可发布（如"公告"分类）
  if (category.allowUserPost === 0) {
    throw AppError.badRequest(ErrorCode.InternalError, "该分类仅管理员可发布");
  }

  // 先发后审：帖子发布后立即可见于"我的帖子"，但需管理员审核后才进入公共列表
  const isPreReview = true;
  const status = isPreReview ? PostStatus.Pending : PostStatus.Approved;

  const post = await postRepo.createPost({
    userId: BigInt(userId),
    categoryId,
    title: dto.title,
    content: dto.content,
    imageUrls: dto.imageUrls ?? [],
    status,
  });

  return {
    postId: post.postId.toString(),
    status: post.status,
  };
}

/**
 * 获取帖子详情
 * 权限控制：未审核通过的帖子只有作者本人可以查看
 */
export async function getPostDetail(postId: string, userId?: string) {
  const post = await postRepo.findPostById(BigInt(postId));
  if (!post || post.deletedAt) {
    throw AppError.badRequest(ErrorCode.PostNotFound, "帖子不存在");
  }

  // 非已审核状态 && 非作者本人 → 禁止访问
  if (post.status !== PostStatus.Approved && post.userId.toString() !== userId) {
    throw AppError.badRequest(ErrorCode.PostForbidden, "帖子未审核通过");
  }

  return toPostItem(post as PostFromDb);
}

/** 获取公开帖子列表（只返回已审核通过的帖子） */
export async function getPostList(query: PostListQueryDTO) {
  const result = await postRepo.getPostList({
    page: query.page,
    size: query.size,
    categoryId: query.categoryId !== undefined ? Number(query.categoryId) : undefined,
    keyword: query.keyword,
    sort: query.sort,
    status: PostStatus.Approved,
  } as { page: number; size: number; categoryId?: number; keyword?: string; sort: "latest" | "hot"; status: number });

  return {
    list: result.list.map((p) => toPostItem(p as PostFromDb)),
    total: result.total,
    page: query.page,
    size: query.size,
    hasMore: query.page * query.size < result.total,
  };
}

/** 获取"我的帖子"列表（包含所有状态：待审核、已通过、已驳回） */
export async function getMyPostList(userId: string, query: MyPostListQueryDTO) {
  const result = await postRepo.getMyPostList(BigInt(userId), query.page, query.size, query.status);

  return {
    list: result.list.map((p) => toPostItem(p as PostFromDb)),
    total: result.total,
    page: query.page,
    size: query.size,
    hasMore: query.page * query.size < result.total,
  };
}

/** 编辑帖子（仅作者本人可操作） */
export async function updatePost(postId: string, userId: string, dto: UpdatePostDTO) {
  const post = await postRepo.findPostById(BigInt(postId));
  if (!post || post.deletedAt) {
    throw AppError.badRequest(ErrorCode.PostNotFound, "帖子不存在");
  }
  if (post.userId.toString() !== userId) {
    throw AppError.badRequest(ErrorCode.PostForbidden, "无权编辑此帖子");
  }

  const data: { categoryId?: number; title?: string; content?: string; imageUrls?: string[] } = {};
  if (dto.categoryId !== undefined) data.categoryId = Number(dto.categoryId);
  if (dto.title !== undefined) data.title = dto.title;
  if (dto.content !== undefined) data.content = dto.content;
  if (dto.imageUrls !== undefined) data.imageUrls = dto.imageUrls;

  await postRepo.updatePost(BigInt(postId), data);
}

/** 删除帖子（软删除，仅作者本人可操作） */
export async function deletePost(postId: string, userId: string) {
  const post = await postRepo.findPostById(BigInt(postId));
  if (!post || post.deletedAt) {
    throw AppError.badRequest(ErrorCode.PostNotFound, "帖子不存在");
  }
  if (post.userId.toString() !== userId) {
    throw AppError.badRequest(ErrorCode.PostForbidden, "无权删除此帖子");
  }

  await postRepo.deletePost(BigInt(postId));
}

/**
 * 管理员审核帖子状态
 * 驳回时自动发送系统消息通知帖子作者，包含驳回原因
 */
export async function adminUpdatePostStatus(postId: string, status: number, rejectReason?: string) {
  const post = await postRepo.findPostById(BigInt(postId));
  if (!post || post.deletedAt) {
    throw AppError.badRequest(ErrorCode.PostNotFound, "帖子不存在");
  }

  if (status === 2 && !rejectReason?.trim()) {
    throw AppError.badRequest(ErrorCode.InternalError, "驳回原因不能为空");
  }

  await postRepo.updatePostStatus(BigInt(postId), status, rejectReason);

  // 驳回时给帖子作者发系统通知
  if (status === 2 && rejectReason) {
    await createMessage({
      toUserId: post.userId,
      fromUserId: null,
      type: MessageType.System,
      targetType: TargetType.Post,
      targetId: post.postId,
      content: `您的帖子「${post.title}」未通过审核，原因：${rejectReason}`,
    });
  }
}

/** 管理员删除帖子（软删除） */
export async function adminDeletePost(postId: string) {
  const post = await postRepo.findPostById(BigInt(postId));
  if (!post || post.deletedAt) {
    throw AppError.badRequest(ErrorCode.PostNotFound, "帖子不存在");
  }

  await postRepo.deletePost(BigInt(postId));
}

/** 管理员帖子列表（可查看所有状态，支持按状态、分类、关键词筛选） */
export async function adminGetPostList(params: {
  page: number;
  size: number;
  status?: number;
  categoryId?: string;
  keyword?: string;
}) {
  const result = await postRepo.getAdminPostList({
    page: params.page,
    size: params.size,
    status: params.status,
    categoryId: params.categoryId !== undefined ? Number(params.categoryId) : undefined,
    keyword: params.keyword,
  } as { page: number; size: number; status?: number; categoryId?: number; keyword?: string });

  return {
    list: result.list.map((p) => toPostItem(p as PostFromDb)),
    total: result.total,
    page: params.page,
    size: params.size,
    hasMore: params.page * params.size < result.total,
  };
}
