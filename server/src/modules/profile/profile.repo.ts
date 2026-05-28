import { prisma } from "../../infra/prisma/client.js";
import type { Prisma } from "@prisma/client";

export async function createReview(data: {
  userId: bigint;
  nickname?: string;
  avatar?: string;
  bio?: string;
  gender?: number;
  age?: number;
}) {
  return prisma.profileReview.create({
    data: {
      userId: data.userId,
      nickname: data.nickname ?? null,
      avatar: data.avatar ?? null,
      bio: data.bio ?? null,
      gender: data.gender ?? null,
      age: data.age ?? null,
      status: 0,
    },
  });
}

export async function findPendingReviewByUserId(userId: bigint) {
  return prisma.profileReview.findFirst({
    where: { userId, status: 0 },
    orderBy: { createTime: "desc" },
  });
}

export async function getReviewList(params: { page: number; size: number; status?: number }) {
  const where: Prisma.ProfileReviewWhereInput = {};

  if (params.status !== undefined) {
    where.status = params.status;
  }

  const [list, total] = await Promise.all([
    prisma.profileReview.findMany({
      where,
      orderBy: { createTime: "desc" },
      skip: (params.page - 1) * params.size,
      take: params.size,
      include: {
        user: { select: { userId: true, nickname: true, avatar: true } },
        handler: { select: { userId: true, nickname: true } },
      },
    }),
    prisma.profileReview.count({ where }),
  ]);

  return { list, total };
}

export async function approveReview(reviewId: bigint, handlerId: bigint) {
  const review = await prisma.profileReview.findUnique({ where: { reviewId } });
  if (!review || review.status !== 0) {
    throw new Error("审核记录不存在或已处理");
  }

  // 更新审核状态
  await prisma.profileReview.update({
    where: { reviewId },
    data: {
      status: 1,
      handlerId,
      handleTime: new Date(),
    },
  });

  // 更新用户资料
  const updateData: Prisma.UserUpdateInput = {};
  if (review.nickname !== null) updateData.nickname = review.nickname;
  if (review.avatar !== null) updateData.avatar = review.avatar;
  if (review.bio !== null) updateData.bio = review.bio;
  if (review.gender !== null) updateData.gender = review.gender;
  if (review.age !== null) updateData.age = review.age;

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({
      where: { userId: review.userId },
      data: updateData,
    });
  }

  return review;
}

export async function rejectReview(reviewId: bigint, handlerId: bigint, rejectReason: string) {
  return prisma.profileReview.update({
    where: { reviewId },
    data: {
      status: 2,
      rejectReason,
      handlerId,
      handleTime: new Date(),
    },
  });
}

export async function findReviewById(reviewId: bigint) {
  return prisma.profileReview.findUnique({ where: { reviewId } });
}

export async function getMyReview(userId: bigint) {
  return prisma.profileReview.findFirst({
    where: { userId },
    orderBy: { createTime: "desc" },
  });
}
