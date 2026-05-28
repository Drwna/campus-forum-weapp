import type { ID } from "./ids.js";
import type { PostStatus, TargetType } from "./enums.js";

export interface WechatLoginRequestDTO {
  code: string;
  nickname?: string;
  avatar?: string;
}

export interface AdminLoginRequestDTO {
  account: string;
  password: string;
}

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

export interface CreateCommentRequestDTO {
  content: string;
  parentId?: ID;
  replyToUserId?: ID;
}

export interface UpdateUserProfileRequestDTO {
  nickname?: string;
  avatar?: string;
  bio?: string;
  gender?: number;
}

export interface CreateReportRequestDTO {
  targetType: TargetType;
  targetId: ID;
  reasonType: number;
  reasonText?: string;
}

export interface ModeratePostRequestDTO {
  status: PostStatus;
  rejectReason?: string;
}
