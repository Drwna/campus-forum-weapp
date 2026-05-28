import { prisma } from "../infra/prisma/client.js";
import { MessageType, TargetType } from "../shared/enums.js";

/**
 * 创建消息通知
 * 规则：不给自己发消息（系统消息除外，fromUserId为null表示系统消息）
 */
export async function createMessage(params: {
  toUserId: bigint;
  fromUserId: bigint | null;
  type: number;
  targetType: number;
  targetId: bigint;
  content?: string;
}): Promise<void> {
  if (params.fromUserId !== null && params.toUserId === params.fromUserId) return;

  await prisma.message.create({
    data: {
      toUserId: params.toUserId,
      fromUserId: params.fromUserId,
      type: params.type,
      targetType: params.targetType,
      targetId: params.targetId,
      content: params.content ?? null,
    },
  });
}

/** 通知帖子作者有人评论了ta的帖子，内容截取前100字作为预览 */
export async function notifyComment(postAuthorId: bigint, commenterId: bigint, postId: bigint, commentContent: string): Promise<void> {
  await createMessage({
    toUserId: postAuthorId,
    fromUserId: commenterId,
    type: MessageType.Comment,
    targetType: TargetType.Post,
    targetId: postId,
    content: commentContent.slice(0, 100),
  });
}

/** 通知评论作者有人回复了ta的评论 */
export async function notifyReply(commentAuthorId: bigint, replierId: bigint, postId: bigint, replyContent: string): Promise<void> {
  await createMessage({
    toUserId: commentAuthorId,
    fromUserId: replierId,
    type: MessageType.Reply,
    targetType: TargetType.Post,
    targetId: postId,
    content: replyContent.slice(0, 100),
  });
}

/** 通知帖子作者有人点赞了ta的帖子 */
export async function notifyLike(postAuthorId: bigint, likerId: bigint, postId: bigint): Promise<void> {
  await createMessage({
    toUserId: postAuthorId,
    fromUserId: likerId,
    type: MessageType.Like,
    targetType: TargetType.Post,
    targetId: postId,
  });
}

/** 通知被关注者有新粉丝 */
export async function notifyFollow(followedUserId: bigint, followerId: bigint): Promise<void> {
  await createMessage({
    toUserId: followedUserId,
    fromUserId: followerId,
    type: MessageType.Follow,
    targetType: TargetType.User,
    targetId: followerId,
  });
}

/** 通知举报人举报结果 */
export async function notifyReportResult(reporterId: bigint, reportId: bigint, isResolved: boolean, handleResult?: string): Promise<void> {
  const content = isResolved
    ? `您的举报已处理：${handleResult || "已采纳"}`
    : `您的举报未通过：${handleResult || "举报不成立"}`;

  await createMessage({
    toUserId: reporterId,
    fromUserId: null, // 系统消息
    type: MessageType.System,
    targetType: TargetType.Post, // 举报关联的目标类型，这里用帖子作为占位
    targetId: reportId,
    content,
  });
}
