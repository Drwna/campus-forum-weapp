import { ErrorCode } from "../../shared/errors.js";
import { AppError } from "../../utils/index.js";
import * as userRepo from "./user.repo.js";
import type { UpdateProfileDTO } from "./user.dto.js";

export async function getCurrentUser(userId: string) {
  const user = await userRepo.getUserWithCounts(BigInt(userId));
  if (!user) {
    throw AppError.badRequest(ErrorCode.UserNotFound, "用户不存在");
  }

  return {
    userId: user.userId.toString(),
    nickname: user.nickname,
    avatar: user.avatar,
    bio: user.bio,
    gender: user.gender,
    age: user.age,
    showGender: user.showGender,
    showAge: user.showAge,
    role: user.role,
    status: user.status,
    createTime: user.createTime.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    postCount: user._count.posts,
    followerCount: user._count.followers,
    followingCount: user._count.following,
  };
}

export async function updateCurrentUser(userId: string, dto: UpdateProfileDTO) {
  const data: { nickname?: string; avatar?: string; bio?: string; gender?: number; age?: number; showGender?: number; showAge?: number } = {};
  if (dto.nickname !== undefined) data.nickname = dto.nickname;
  if (dto.avatar !== undefined) data.avatar = dto.avatar;
  if (dto.bio !== undefined) data.bio = dto.bio;
  if (dto.gender !== undefined) data.gender = dto.gender;
  if (dto.age !== undefined) data.age = dto.age;
  if (dto.showGender !== undefined) data.showGender = dto.showGender;
  if (dto.showAge !== undefined) data.showAge = dto.showAge;

  const user = await userRepo.updateUserProfile(BigInt(userId), data);
  return {
    userId: user.userId.toString(),
    nickname: user.nickname,
    avatar: user.avatar,
    bio: user.bio,
    gender: user.gender,
    age: user.age,
    showGender: user.showGender,
    showAge: user.showAge,
  };
}

export async function getUserById(targetId: string) {
  const user = await userRepo.getUserPublicProfile(BigInt(targetId));
  if (!user) {
    throw AppError.badRequest(ErrorCode.UserNotFound, "用户不存在");
  }

  return {
    userId: user.userId.toString(),
    nickname: user.nickname,
    avatar: user.avatar,
    bio: user.bio,
    gender: user.showGender === 1 ? user.gender : null,
    age: user.showAge === 1 ? user.age : null,
    showGender: user.showGender,
    showAge: user.showAge,
    createTime: user.createTime.toISOString(),
    postCount: user._count.posts,
    followerCount: user._count.followers,
    followingCount: user._count.following,
  };
}
