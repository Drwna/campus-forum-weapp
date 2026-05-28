/**
 * 帖子相关 API
 * 支持：帖子列表（带分页+分类筛选）、详情、发布、编辑、删除、我的帖子
 * 帖子发布后需要经过审核（DFA 敏感词过滤 + 微信内容安全检测）
 */
import { get, post, put, del } from "../utils/http.js";

/** 获取帖子列表（分页），支持 categoryId 筛选和 sort 排序 */
export function getPostList(params) {
  return get("/posts", params);
}

/** 获取帖子详情（含作者信息、图片、点赞状态等） */
export function getPostDetail(id) {
  return get(`/posts/${id}`);
}

/** 发布新帖子，data 包含 { categoryId, title, content, imageUrls } */
export function createPost(data) {
  return post("/posts", data);
}

/** 编辑已发布的帖子 */
export function updatePost(id, data) {
  return put(`/posts/${id}`, data);
}

/** 删除帖子（逻辑删除） */
export function deletePost(id) {
  return del(`/posts/${id}`);
}

/** 获取当前用户发布的帖子列表（分页），支持按审核状态筛选 */
export function getMyPosts(params) {
  return get("/posts/mine", params);
}
