import type { ID } from "./ids";
import type { PostStatus, TargetType } from "./enums";

// ── Auth ──

export interface WechatLoginRequestDTO {
  code: string;
  nickname?: string;
  avatar?: string;
}

export interface AdminLoginRequestDTO {
  account: string;
  password: string;
}

// ── Post ──

export interface CreatePostRequestDTO {
  categoryId: ID;
  title: string;
  content: string;
  imageUrls?: string[];
}

export interface UpdatePostRequestDTO {
  categoryId?: ID;
  title?: string;
  content?: string;
  imageUrls?: string[];
}

// ── Comment ──

export interface CreateCommentRequestDTO {
  content: string;
  parentId?: ID;
  replyToUserId?: ID;
}

// ── User ──

export interface UpdateUserProfileRequestDTO {
  nickname?: string;
  avatar?: string;
  bio?: string;
  gender?: number;
}

// ── Report ──

export interface CreateReportRequestDTO {
  targetType: TargetType;
  targetId: ID;
  reasonType: number;
  reasonText?: string;
}

// ── Moderation ──

export interface ModeratePostRequestDTO {
  status: PostStatus;
  rejectReason?: string;
}
