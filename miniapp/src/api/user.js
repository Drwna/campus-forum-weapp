/**
 * 用户相关 API
 * 支持：获取当前用户信息、更新资料、查看其他用户信息
 */
import { get, put } from "../utils/http.js";

/** 获取当前登录用户的详细信息（含帖子数、粉丝数等统计） */
export function getMe() {
  return get("/users/me");
}

/** 更新当前用户资料（昵称、头像、性别等） */
export function updateMe(data) {
  return put("/users/me", data);
}

/** 根据用户 ID 获取其他用户的公开信息 */
export function getUserById(id) {
  return get(`/users/${id}`);
}
