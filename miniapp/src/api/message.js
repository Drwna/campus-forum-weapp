/**
 * 消息（站内通知）相关 API
 * 消息类型包括：评论、回复、点赞、关注、系统通知
 * 后端通过异步任务（jobs/messageMerge）批量生成消息
 */
import { get, put } from "../utils/http.js";

/** 获取消息列表（分页） */
export function getMessages(params) {
  return get("/messages", params);
}

/** 获取未读消息数量，用于 TabBar 角标 */
export function getUnreadCount() {
  return get("/messages/unread-count");
}

/** 标记单条消息为已读 */
export function markRead(id) {
  return put(`/messages/${id}/read`);
}

/** 标记所有消息为已读 */
export function markAllRead() {
  return put("/messages/read-all");
}
