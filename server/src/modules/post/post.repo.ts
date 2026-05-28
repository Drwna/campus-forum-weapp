import { prisma } from "../../infra/prisma/client.js";
import { PostStatus } from "../../shared/enums.js";
import { Prisma } from "@prisma/client";

/** 创建帖子，imageUrls为空时存入JSON null（Prisma要求） */
export async function createPost(data: {
  userId: bigint;
  categoryId: number;
  title: string;
  content: string;
  imageUrls: string[];
  status: number;
}) {
  return prisma.post.create({
    data: {
      userId: data.userId,
      categoryId: data.categoryId,
      title: data.title,
      content: data.content,
      imageUrls: data.imageUrls.length > 0 ? data.imageUrls : Prisma.JsonNull,
      status: data.status,
    },
  });
}

/** 查询帖子详情，关联作者和分类信息 */
export async function findPostById(postId: bigint) {
  return prisma.post.findUnique({
    where: { postId },
    include: {
      author: { select: { userId: true, nickname: true, avatar: true } },
      category: { select: { categoryId: true, categoryName: true } },
    },
  });
}

/**
 * 帖子列表查询
 * 支持：分类筛选、关键词搜索（标题+内容）、排序（最新/最热）
 * "最热"排序：置顶帖优先 → 点赞数降序 → 创建时间降序
 * "最新"排序：置顶帖优先 → 创建时间降序
 * 使用Promise.all并行执行列表查询和计数，减少数据库往返
 */
export async function getPostList(params: {
  page: number;
  size: number;
  categoryId?: number;
  keyword?: string;
  sort: "latest" | "hot";
  status: number;
}) {
  const where: Prisma.PostWhereInput = {
    status: params.status,
    deletedAt: null,
  };

  if (params.categoryId !== undefined) {
    where.categoryId = params.categoryId;
  }

  if (params.keyword) {
    where.OR = [
      { title: { contains: params.keyword } },
      { content: { contains: params.keyword } },
    ];
  }

  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    params.sort === "hot"
      ? [{ isTop: "desc" }, { likeCount: "desc" }, { createTime: "desc" }]
      : [{ isTop: "desc" }, { createTime: "desc" }];

  const [list, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip: (params.page - 1) * params.size,
      take: params.size,
      include: {
        author: { select: { userId: true, nickname: true, avatar: true } },
        category: { select: { categoryId: true, categoryName: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { list, total };
}

/** 我的帖子列表（不过滤状态，作者本人可查看所有状态的帖子） */
export async function getMyPostList(userId: bigint, page: number, size: number, status?: number) {
  const where: Prisma.PostWhereInput = {
    userId,
    deletedAt: null,
    ...(status !== undefined ? { status } : {}),
  };

  const [list, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createTime: "desc" },
      skip: (page - 1) * size,
      take: size,
      include: {
        author: { select: { userId: true, nickname: true, avatar: true } },
        category: { select: { categoryId: true, categoryName: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { list, total };
}

/** 更新帖子（只更新传入的字段，未传入的字段保持不变） */
export async function updatePost(postId: bigint, data: { categoryId?: number; title?: string; content?: string; imageUrls?: string[] }) {
  const updateData: Prisma.PostUpdateInput = {};
  if (data.categoryId !== undefined) updateData.category = { connect: { categoryId: data.categoryId } };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.imageUrls !== undefined) updateData.imageUrls = data.imageUrls;

  return prisma.post.update({
    where: { postId },
    data: updateData,
  });
}

/** 软删除帖子：设置deletedAt时间戳，状态改为Deleted */
export async function deletePost(postId: bigint) {
  return prisma.post.update({
    where: { postId },
    data: { deletedAt: new Date(), status: PostStatus.Deleted },
  });
}

/** 更新帖子审核状态（通过/驳回） */
export async function updatePostStatus(postId: bigint, status: number, rejectReason?: string) {
  return prisma.post.update({
    where: { postId },
    data: {
      status,
      ...(rejectReason !== undefined ? { rejectReason } : {}),
    },
  });
}

/** 管理员帖子列表：可查看所有状态，支持按状态、分类、关键词筛选 */
export async function getAdminPostList(params: {
  page: number;
  size: number;
  status?: number;
  categoryId?: number;
  keyword?: string;
}) {
  const where: Prisma.PostWhereInput = {
    deletedAt: null,
  };

  if (params.status !== undefined) {
    where.status = params.status;
  }

  if (params.categoryId !== undefined) {
    where.categoryId = params.categoryId;
  }

  if (params.keyword) {
    where.OR = [
      { title: { contains: params.keyword } },
      { content: { contains: params.keyword } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createTime: "desc" },
      skip: (params.page - 1) * params.size,
      take: params.size,
      include: {
        author: { select: { userId: true, nickname: true, avatar: true } },
        category: { select: { categoryId: true, categoryName: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { list, total };
}
