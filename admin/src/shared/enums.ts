export enum UserRole {
  Student = 0,
  Moderator = 1,
  Admin = 2,
}

export enum UserStatus {
  Normal = 0,
  Banned = 1,
}

export enum PostStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Deleted = 3,
}

export enum CommentStatus {
  Normal = 0,
  Deleted = 1,
  Hidden = 2,
}

export enum FileStatus {
  Uploaded = 0,
  Bound = 1,
  Orphan = 2,
  Deleted = 3,
}

export enum ReportStatus {
  Pending = 0,
  Processing = 1,
  Resolved = 2,
  Rejected = 3,
}

export enum MessageType {
  Comment = 1,
  Reply = 2,
  Like = 3,
  Follow = 4,
  System = 5,
}

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
