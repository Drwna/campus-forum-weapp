/**
 * 评论相关 API
 * 支持：获取帖子评论、发表评论、获取回复、删除评论、获取我的评论
 * 评论嵌套在帖子下，采用 RESTful 子资源路由风格（/posts/:id/comments）
 */
import { get, post, del } from "../utils/http.js";

/** 获取指定帖子的评论列表（分页） */
export function getComments(postId, params) {
  return get(`/posts/${postId}/comments`, params);
}

/** 对指定帖子发表评论 */
export function createComment(postId, data) {
  return post(`/posts/${postId}/comments`, data);
}

/** 获取指定评论下的回复列表（二级评论） */
export function getReplies(commentId, params) {
  return get(`/comments/${commentId}/replies`, params);
}

/** 删除自己的评论 */
export function deleteComment(id) {
  return del(`/comments/${id}`);
}

/** 获取当前用户发表过的所有评论（分页） */
export function getMyComments(params) {
  return get("/comments/mine", params);
}
