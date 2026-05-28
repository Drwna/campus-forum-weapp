import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { adminLogin as adminLoginApi, logout as logoutApi } from "../api/auth.js";
import router from "../router/index.js";

/**
 * 认证状态管理
 * 使用 Composition API 风格的 Pinia Store
 * 状态持久化方案：localStorage 存储，页面刷新后自动恢复
 * 后端角色枚举：0=学生, 1=审核员, 2=管理员
 */
export const useAuthStore = defineStore("auth", () => {
  // 从 localStorage 恢复登录状态，实现免登录刷新
  const token = ref(localStorage.getItem("token") ?? "");
  const refreshTokenVal = ref(localStorage.getItem("refreshToken") ?? "");
  const userId = ref(localStorage.getItem("userId") ?? "");
  const nickname = ref(localStorage.getItem("nickname") ?? "");
  const role = ref(Number(localStorage.getItem("role") ?? "0"));

  const isLoggedIn = computed(() => !!token.value);
  // 管理员权限：role >= 2（管理员），区别于审核员(1)和学生(0)
  const isAdmin = computed(() => role.value >= 2);

  /**
   * 管理员登录
   * 调用 /auth/admin-login 接口，成功后将凭证写入 store 和 localStorage，然后跳转首页
   */
  async function login(account: string, password: string) {
    const { data } = await adminLoginApi(account, password);
    const result = data.data;

    token.value = result.token;
    refreshTokenVal.value = result.refreshToken;
    userId.value = result.user.userId;
    nickname.value = result.user.nickname;
    role.value = result.user.role;

    // 同步持久化到 localStorage，确保刷新后状态不丢失
    localStorage.setItem("token", result.token);
    localStorage.setItem("refreshToken", result.refreshToken);
    localStorage.setItem("userId", result.user.userId);
    localStorage.setItem("nickname", result.user.nickname);
    localStorage.setItem("role", String(result.user.role));

    router.push("/");
  }

  /**
   * 退出登录
   * 先调用后端 logout 接口将 refreshToken 加入黑名单（即使失败也继续清理本地状态）
   */
  async function logout() {
    try {
      await logoutApi(refreshTokenVal.value);
    } catch {
      // 接口失败不影响本地清理，静默处理
    }

    // 清空 store 状态
    token.value = "";
    refreshTokenVal.value = "";
    userId.value = "";
    nickname.value = "";
    role.value = 0;

    // 清除 localStorage 持久化数据
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("nickname");
    localStorage.removeItem("role");

    router.push("/login");
  }

  return { token, refreshToken: refreshTokenVal, userId, nickname, role, isLoggedIn, isAdmin, login, logout };
});
