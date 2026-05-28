import type { ID } from "./ids";
import type {
  CategoryStatus,
  CommentStatus,
  ConfigValueType,
  FileStatus,
  MessageType,
  NoticeStatus,
  PostStatus,
  ReportStatus,
  SensitiveWordStatus,
  TargetType,
  UserRole,
  UserStatus,
} from "./enums";

export interface UserDTO {
  userId: ID;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  role: UserRole;
  status: UserStatus;
}

export interface AuthTokensDTO {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResultDTO extends AuthTokensDTO {
  user: UserDTO;
}

export interface CategoryDTO {
  categoryId: ID;
  categoryName: string;
  categoryDesc: string | null;
  sortOrder: number;
  status: CategoryStatus;
}

export interface PostListItemDTO {
  postId: ID;
  author: UserDTO;
  category: CategoryDTO;
  title: string;
  excerpt: string;
  imageUrls: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  status: PostStatus;
  isTop: boolean;
  isLiked: boolean;
  createTime: string;
}

export interface PostDetailDTO extends PostListItemDTO {
  content: string;
  rejectReason: string | null;
  updateTime: string;
}

export interface CommentDTO {
  commentId: ID;
  postId: ID;
  parentId: ID | null;
  replyToUserId: ID | null;
  author: UserDTO;
  content: string;
  likeCount: number;
  status: CommentStatus;
  createTime: string;
  replies?: CommentDTO[];
}

export interface FileDTO {
  fileId: ID;
  url: string;
  thumbUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  status: FileStatus;
}

export interface MessageDTO {
  messageId: ID;
  fromUser: UserDTO | null;
  type: MessageType;
  targetType: TargetType;
  targetId: ID;
  content: string | null;
  isRead: boolean;
  createTime: string;
}

export interface ReportDTO {
  reportId: ID;
  reporterId: ID;
  targetType: TargetType;
  targetId: ID;
  reasonType: number;
  reasonText: string | null;
  status: ReportStatus;
  handleResult: string | null;
  createTime: string;
}

// ── Follow ──

export interface FollowUserDTO {
  userId: ID;
  nickname: string;
  avatar: string | null;
}

export interface FollowStateDTO {
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
}

// ── Admin ──

export interface AdminUserDTO {
  userId: ID;
  nickname: string;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  postCount: number;
  commentCount: number;
  createTime: string;
  lastLoginAt: string | null;
}

export interface AdminLogDTO {
  logId: ID;
  adminId: ID;
  action: string;
  targetType: string;
  targetId: ID | null;
  beforeJson: unknown;
  afterJson: unknown;
  createTime: string;
}

export interface ModerationPostDTO {
  postId: ID;
  author: UserDTO;
  category: CategoryDTO;
  title: string;
  content: string;
  imageUrls: string[];
  status: PostStatus;
  createTime: string;
}

export interface AdminReportDTO {
  reportId: ID;
  reporter: UserDTO;
  targetType: TargetType;
  targetId: ID;
  reasonType: number;
  reasonText: string | null;
  status: ReportStatus;
  handler: UserDTO | null;
  handleResult: string | null;
  createTime: string;
  handleTime: string | null;
}

// ── Notice / Config ──

export interface NoticeDTO {
  noticeId: ID;
  title: string;
  content: string;
  type: number;
  status: NoticeStatus;
  isTop: boolean;
  startTime: string | null;
  endTime: string | null;
  createTime: string;
  updateTime: string;
}

export interface SensitiveWordDTO {
  wordId: ID;
  word: string;
  level: number;
  category: string | null;
  status: SensitiveWordStatus;
  createTime: string;
  updateTime: string;
}

export interface AppConfigDTO {
  configKey: string;
  configValue: string;
  valueType: ConfigValueType;
  description: string | null;
  isPublic: boolean;
}
