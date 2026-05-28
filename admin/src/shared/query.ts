import type { ID } from "./ids";
import type {
  MessageType,
  NoticeStatus,
  PostStatus,
  ReportStatus,
  SensitiveWordStatus,
  TargetType,
  UserRole,
  UserStatus,
} from "./enums";
import type { PageQuery } from "./response";

// ── Post ──

export interface PostListQueryDTO extends PageQuery {
  categoryId?: ID;
  keyword?: string;
  sort?: "latest" | "hot";
}

export interface MyPostListQueryDTO extends PageQuery {
  status?: PostStatus;
}

// ── Comment ──

export interface CommentListQueryDTO extends PageQuery {
  postId: ID;
  parentId?: ID;
}

// ── Admin ──

export interface AdminPostListQueryDTO extends PageQuery {
  status?: PostStatus;
  categoryId?: ID;
  keyword?: string;
  userId?: ID;
}

export interface AdminUserListQueryDTO extends PageQuery {
  role?: UserRole;
  status?: UserStatus;
  keyword?: string;
}

export interface AdminReportListQueryDTO extends PageQuery {
  status?: ReportStatus;
  targetType?: TargetType;
}

// ── Message ──

export interface MessageListQueryDTO extends PageQuery {
  isRead?: boolean;
  type?: MessageType;
}

// ── Notice ──

export interface NoticeListQueryDTO extends PageQuery {
  status?: NoticeStatus;
}

// ── Follow ──

export interface FollowListQueryDTO extends PageQuery {
  userId: ID;
}

// ── Sensitive Word ──

export interface SensitiveWordListQueryDTO extends PageQuery {
  keyword?: string;
  status?: SensitiveWordStatus;
}
