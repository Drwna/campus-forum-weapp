import { prisma } from "../../infra/prisma/client.js";
import type { User } from "@prisma/client";

export async function findUserById(userId: bigint): Promise<User | null> {
  return prisma.user.findUnique({ where: { userId } });
}

export async function getUserWithCounts(userId: bigint) {
  return prisma.user.findUnique({
    where: { userId },
    include: {
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });
}

export async function updateUserProfile(
  userId: bigint,
  data: { nickname?: string; avatar?: string; bio?: string; gender?: number; age?: number; showGender?: number; showAge?: number },
): Promise<User> {
  return prisma.user.update({
    where: { userId },
    data,
  });
}

export async function getUserPublicProfile(userId: bigint) {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      userId: true,
      nickname: true,
      avatar: true,
      bio: true,
      gender: true,
      age: true,
      showGender: true,
      showAge: true,
      createTime: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });
  return user;
}
