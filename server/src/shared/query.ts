import type { ID } from "./ids.js";
import type {
  MessageType,
  NoticeStatus,
  PostStatus,
  ReportStatus,
  SensitiveWordStatus,
  TargetType,
  UserRole,
  UserStatus,
} from "./enums.js";
import type { PageQuery } from "./response.js";

export interface PostListQueryDTO extends PageQuery {
  categoryId?: ID;
  keyword?: string;
  sort?: "latest" | "hot";
}

export interface MyPostListQueryDTO extends PageQuery {
  status?: PostStatus;
}

export interface CommentListQueryDTO extends PageQuery {
  postId: ID;
  parentId?: ID;
}

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

export interface MessageListQueryDTO extends PageQuery {
  isRead?: boolean;
  type?: MessageType;
}

export interface NoticeListQueryDTO extends PageQuery {
  status?: NoticeStatus;
}

export interface FollowListQueryDTO extends PageQuery {
  userId: ID;
}

export interface SensitiveWordListQueryDTO extends PageQuery {
  keyword?: string;
  status?: SensitiveWordStatus;
}
