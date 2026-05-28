import { prisma } from "../../infra/prisma/client.js";
import type { User } from "@prisma/client";

/** 通过微信openid查找用户（微信登录场景） */
export async function findUserByOpenid(openid: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { wechatOpenid: openid } });
}

/** 新用户注册：默认角色为学生(0)，状态为正常(0) */
export async function createUserWithOpenid(openid: string, nickname: string, avatar: string | null): Promise<User> {
  return prisma.user.create({
    data: {
      wechatOpenid: openid,
      nickname,
      avatar,
      role: 0,
      status: 0,
    },
  });
}

/** 通过用户ID查找用户 */
export async function findUserById(userId: bigint): Promise<User | null> {
  return prisma.user.findUnique({ where: { userId } });
}

/** 通过管理员账号查找用户（管理员登录场景） */
export async function findAdminByAccount(account: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { adminAccount: account } });
}

/** 更新最后登录时间 */
export async function updateLastLoginAt(userId: bigint): Promise<void> {
  await prisma.user.update({
    where: { userId },
    data: { lastLoginAt: new Date() },
  });
}
