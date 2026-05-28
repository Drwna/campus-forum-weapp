import { prisma } from "../../infra/prisma/client.js";
import type { Prisma } from "@prisma/client";

export async function createComment(data: {
  postId: bigint;
  userId: bigint;
  parentId: bigint | null;
  replyToUserId: bigint | null;
  content: string;
}) {
  return prisma.comment.create({
    data: {
      postId: data.postId,
      userId: data.userId,
      parentId: data.parentId,
      replyToUserId: data.replyToUserId,
      content: data.content,
    },
  });
}

export async function incrementPostCommentCount(postId: bigint) {
  return prisma.post.update({
    where: { postId },
    data: { commentCount: { increment: 1 } },
  });
}

export async function getCommentList(postId: bigint, page: number, size: number, parentId?: bigint) {
  const where: Prisma.CommentWhereInput = {
    postId,
    status: 0,
    deletedAt: null,
    parentId: parentId ?? null,
  };

  const [list, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createTime: "asc" },
      skip: (page - 1) * size,
      take: size,
      include: {
        author: { select: { userId: true, nickname: true, avatar: true } },
        replyToUser: { select: { userId: true, nickname: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { list, total };
}

export async function getReplies(parentId: bigint, page: number, size: number) {
  const where: Prisma.CommentWhereInput = {
    parentId,
    status: 0,
    deletedAt: null,
  };

  const [list, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createTime: "asc" },
      skip: (page - 1) * size,
      take: size,
      include: {
        author: { select: { userId: true, nickname: true, avatar: true } },
        replyToUser: { select: { userId: true, nickname: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { list, total };
}

export async function findCommentById(commentId: bigint) {
  return prisma.comment.findUnique({
    where: { commentId },
  });
}

export async function deleteComment(commentId: bigint) {
  return prisma.comment.update({
    where: { commentId },
    data: { deletedAt: new Date(), status: 1 },
  });
}

export async function decrementPostCommentCount(postId: bigint) {
  return prisma.post.update({
    where: { postId },
    data: { commentCount: { decrement: 1 } },
  });
}

export async function getAdminCommentList(params: { page: number; size: number; postId?: string }) {
  const where: Prisma.CommentWhereInput = {
    deletedAt: null,
  };

  if (params.postId) {
    where.postId = BigInt(params.postId);
  }

  const [list, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createTime: "desc" },
      skip: (params.page - 1) * params.size,
      take: params.size,
      include: {
        author: { select: { userId: true, nickname: true, avatar: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { list, total };
}

export async function getMyComments(userId: bigint, page: number, size: number) {
  const where: Prisma.CommentWhereInput = {
    userId,
    deletedAt: null,
  };

  const [list, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createTime: "desc" },
      skip: (page - 1) * size,
      take: size,
      include: {
        author: { select: { userId: true, nickname: true, avatar: true } },
        post: { select: { postId: true, title: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { list, total };
}
