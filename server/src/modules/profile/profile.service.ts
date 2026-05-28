import { AppError } from "../../utils/index.js";
import { ErrorCode } from "../../shared/errors.js";
import { createMessage } from "../../utils/notify.js";
import { MessageType, TargetType } from "../../shared/enums.js";
import * as profileRepo from "./profile.repo.js";
import type { SubmitProfileReviewDTO } from "./profile.dto.js";

export async function submitReview(userId: string, dto: SubmitProfileReviewDTO) {
  // 检查是否有待审核的变更
  const pending = await profileRepo.findPendingReviewByUserId(BigInt(userId));
  if (pending) {
    throw AppError.badRequest(ErrorCode.InternalError, "您有资料变更正在审核中，请等待审核完成");
  }

  // 至少要有一个字段变更
  if (!dto.nickname && !dto.avatar && !dto.bio && dto.gender === undefined && dto.age === undefined) {
    throw AppError.badRequest(ErrorCode.InternalError, "请至少修改一项资料");
  }

  const reviewData: { userId: bigint; nickname?: string; avatar?: string; bio?: string; gender?: number; age?: number } = {
    userId: BigInt(userId),
  };
  if (dto.nickname !== undefined) reviewData.nickname = dto.nickname;
  if (dto.avatar !== undefined) reviewData.avatar = dto.avatar;
  if (dto.bio !== undefined) reviewData.bio = dto.bio;
  if (dto.gender !== undefined) reviewData.gender = dto.gender;
  if (dto.age !== undefined) reviewData.age = dto.age;

  const review = await profileRepo.createReview(reviewData);

  return {
    reviewId: review.reviewId.toString(),
    status: review.status,
  };
}

export async function getReviewList(params: { page: number; size: number; status?: number }) {
  const result = await profileRepo.getReviewList(params);

  return {
    list: result.list.map((r) => ({
      reviewId: r.reviewId.toString(),
      userId: r.userId.toString(),
      user: {
        userId: r.user.userId.toString(),
        nickname: r.user.nickname,
        avatar: r.user.avatar,
      },
      nickname: r.nickname,
      avatar: r.avatar,
      bio: r.bio,
      gender: r.gender,
      age: r.age,
      status: r.status,
      rejectReason: r.rejectReason,
      handler: r.handler
        ? { userId: r.handler.userId.toString(), nickname: r.handler.nickname }
        : null,
      handleTime: r.handleTime?.toISOString() ?? null,
      createTime: r.createTime.toISOString(),
    })),
    total: result.total,
    page: params.page,
    size: params.size,
    hasMore: params.page * params.size < result.total,
  };
}

export async function approveReview(reviewId: string, handlerId: string) {
  const review = await profileRepo.approveReview(BigInt(reviewId), BigInt(handlerId));

  // 构建变更内容描述
  const changes: string[] = [];
  if (review.nickname) changes.push("昵称");
  if (review.avatar) changes.push("头像");
  if (review.bio) changes.push("个人介绍");
  if (review.gender !== null) changes.push("性别");
  if (review.age !== null) changes.push("年龄");

  // 发送系统消息通知用户
  await createMessage({
    toUserId: review.userId,
    fromUserId: null,
    type: MessageType.System,
    targetType: TargetType.User,
    targetId: review.userId,
    content: `您提交的资料变更已审核通过，已更新：${changes.join("、")}`,
  });

  return review;
}

export async function rejectReview(reviewId: string, handlerId: string, rejectReason: string) {
  if (!rejectReason.trim()) {
    throw AppError.badRequest(ErrorCode.InternalError, "驳回原因不能为空");
  }
  const review = await profileRepo.findReviewById(BigInt(reviewId));
  await profileRepo.rejectReview(BigInt(reviewId), BigInt(handlerId), rejectReason);

  // 发送系统消息通知用户
  if (review) {
    await createMessage({
      toUserId: review.userId,
      fromUserId: null,
      type: MessageType.System,
      targetType: TargetType.User,
      targetId: review.userId,
      content: `您提交的资料变更未通过审核，原因：${rejectReason}`,
    });
  }
}

export async function getMyReview(userId: string) {
  const review = await profileRepo.getMyReview(BigInt(userId));
  if (!review) return null;

  return {
    reviewId: review.reviewId.toString(),
    nickname: review.nickname,
    avatar: review.avatar,
    bio: review.bio,
    gender: review.gender,
    age: review.age,
    status: review.status,
    rejectReason: review.rejectReason,
    createTime: review.createTime.toISOString(),
  };
}
