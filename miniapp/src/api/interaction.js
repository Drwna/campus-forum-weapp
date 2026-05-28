/**
 * 互动相关 API（点赞、关注）
 * 点赞计数存储在 Redis 中，通过异步任务（jobs/likeSync）批量同步到 MySQL
 * 关注关系直接写入 MySQL 的 follow 表
 */
import { post, del, get } from "../utils/http.js";

/** 点赞帖子，返回 { isLiked, likeCount } */
export function likePost(id) {
  return post(`/posts/${id}/like`);
}

/** 取消点赞帖子，返回 { isLiked, likeCount } */
export function unlikePost(id) {
  return del(`/posts/${id}/like`);
}

/** 关注用户 */
export function followUser(id) {
  return post(`/users/${id}/follow`);
}

/** 取消关注用户 */
export function unfollowUser(id) {
  return del(`/users/${id}/follow`);
}

/** 获取指定用户的粉丝列表（分页） */
export function getFollowers(id, params) {
  return get(`/users/${id}/followers`, params);
}

/** 获取指定用户的关注列表（分页） */
export function getFollowing(id, params) {
  return get(`/users/${id}/following`, params);
}
