/**
 * 认证相关 API
 * 处理微信登录、token 刷新、登出等认证流程
 */
import { post } from "../utils/http.js";

/** 微信登录：将微信 code + 用户信息发送到后端，换取 JWT token */
export function wechatLogin(code, nickname, avatar) {
  return post("/auth/wechat-login", { code, nickname, avatar });
}

/** 刷新 token：使用 refreshToken 获取新的 accessToken */
export function refreshToken(refreshToken) {
  return post("/auth/refresh", { refreshToken });
}

/** 登出：通知后端吊销 refreshToken，使其失效 */
export function logout(refreshToken) {
  return post("/auth/logout", { refreshToken });
}
