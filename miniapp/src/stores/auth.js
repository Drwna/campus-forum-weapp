import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { wechatLogin, logout } from "../api/auth.js";

/**
 * 认证状态管理 Store（Pinia Composition API 写法）
 *
 * 职责：
 * 1. 管理用户登录状态（token、用户信息）
 * 2. 提供登录/登出方法
 * 3. 自动同步到 uni.storage，实现持久化（小程序中没有 localStorage，用 uni.getStorageSync 代替）
 *
 * 为什么手动同步 storage？
 * - Pinia 默认不持久化，页面刷新/小程序重启后 state 会丢失
 * - 初始化时从 storage 读取，登录/登出时同步写入，保证状态不丢失
 */
export const useAuthStore = defineStore("auth", () => {
  // 从本地存储恢复登录状态，小程序冷启动时不会丢失登录态
  const token = ref(uni.getStorageSync("token") ?? "");
  const refreshTokenVal = ref(uni.getStorageSync("refreshToken") ?? "");
  const userId = ref(uni.getStorageSync("userId") ?? "");
  const nickname = ref(uni.getStorageSync("nickname") ?? "");
  const avatar = ref(uni.getStorageSync("avatar") ?? "");
  const role = ref(Number(uni.getStorageSync("role") ?? "0"));

  // 是否已登录的计算属性，其他组件通过此属性判断登录状态
  const isLoggedIn = computed(() => !!token.value);

  /**
   * 微信登录流程：
   * 1. 前端调用 uni.login 获取微信 code
   * 2. 将 code + 用户信息发送到后端
   * 3. 后端用 code 换取 openid，创建/查找用户，返回 JWT token
   * 4. 前端保存 token 和用户信息到 state 和 storage
   */
  async function login(code, nicknameParam, avatarParam) {
    const res = await wechatLogin(code, nicknameParam, avatarParam);
    const result = res.data;

    // 更新响应式状态
    token.value = result.token;
    refreshTokenVal.value = result.refreshToken;
    userId.value = result.user.userId;
    nickname.value = result.user.nickname;
    avatar.value = result.user.avatar ?? "";
    role.value = result.user.role;

    // 同步持久化到本地存储
    uni.setStorageSync("token", result.token);
    uni.setStorageSync("refreshToken", result.refreshToken);
    uni.setStorageSync("userId", result.user.userId);
    uni.setStorageSync("nickname", result.user.nickname);
    uni.setStorageSync("avatar", result.user.avatar ?? "");
    uni.setStorageSync("role", String(result.user.role));
  }

  /**
   * 登出操作：
   * 1. 通知后端吊销 refreshToken（加入黑名单）
   * 2. 清空本地 state 和 storage
   * 即使后端请求失败也不阻塞登出（catch 为空），因为本地清除最重要
   */
  async function logoutAction() {
    try {
      await logout(refreshTokenVal.value);
    } catch {
      // 即使后端吊销失败，也要清除本地状态
    }

    // 清空内存中的状态
    token.value = "";
    refreshTokenVal.value = "";
    userId.value = "";
    nickname.value = "";
    avatar.value = "";
    role.value = 0;

    // 清除本地存储
    uni.removeStorageSync("token");
    uni.removeStorageSync("refreshToken");
    uni.removeStorageSync("userId");
    uni.removeStorageSync("nickname");
    uni.removeStorageSync("avatar");
    uni.removeStorageSync("role");
  }

  return { token, refreshToken: refreshTokenVal, userId, nickname, avatar, role, isLoggedIn, login, logoutAction };
});
