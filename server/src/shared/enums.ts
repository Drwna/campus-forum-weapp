/** 用户角色：学生(0) → 版主(1) → 管理员(2)，权限递增 */
export enum UserRole {
  Student = 0,
  Moderator = 1,
  Admin = 2,
}

/** 用户状态：正常(0)、封禁(1) */
export enum UserStatus {
  Normal = 0,
  Banned = 1,
}

/**
 * 帖子状态机：Pending(0) → Approved(1) 或 Rejected(2)
 * 采用"先发后审"策略：用户发帖后立即进入Pending状态，管理员审核通过后变为Approved
 * Deleted(3)为软删除状态
 */
export enum PostStatus {
  Pending = 0,   // 待审核
  Approved = 1,  // 已通过
  Rejected = 2,  // 已驳回
  Deleted = 3,   // 已删除（软删除）
}

export enum CommentStatus {
  Normal = 0,
  Deleted = 1,
  Hidden = 2,
}

/**
 * 文件状态：上传成功(0) → 已绑定到帖子(1)
 * 未绑定的文件会被定时任务标记为Orphan(2)并清理
 */
export enum FileStatus {
  Uploaded = 0,
  Bound = 1,
  Orphan = 2,
  Deleted = 3,
}

/** 举报状态 */
export enum ReportStatus {
  Pending = 0,
  Processing = 1,
  Resolved = 2,
  Rejected = 3,
}

/** 消息类型：评论、回复、点赞、关注、系统通知 */
export enum MessageType {
  Comment = 1,
  Reply = 2,
  Like = 3,
  Follow = 4,
  System = 5,
}

/** 目标类型：帖子、评论、用户（用于关联消息和举报的目标对象） */
export enum TargetType {
  Post = 1,
  Comment = 2,
  User = 3,
}

export enum CategoryStatus {
  Active = 0,
  Hidden = 1,
}

export enum NoticeStatus {
  Draft = 0,
  Published = 1,
  Archived = 2,
}

/** 应用配置值类型，用于动态配置存储 */
export enum ConfigValueType {
  String = "string",
  Number = "number",
  Boolean = "boolean",
  JSON = "json",
}

export enum SensitiveWordStatus {
  Active = 0,
  Disabled = 1,
}
