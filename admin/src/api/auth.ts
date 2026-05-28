import http from "./http.js";

/** 登录响应结构，对应后端 /auth/admin-login 的 data 字段 */
interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    userId: string;
    nickname: string;
    avatar: string | null;
    role: number;
  };
}

/** 管理员账号密码登录（非微信登录），仅限 role >= 2 的用户 */
export function adminLogin(account: string, password: string) {
  return http.post<{ data: LoginResponse }>("/auth/admin-login", { account, password });
}

/** 退出登录，将 refreshToken 加入 Redis 黑名单以实现即时失效 */
export function logout(refreshToken: string) {
  return http.post("/auth/logout", { refreshToken });
}

/** 刷新 Token，使用 refreshToken 换取新的 accessToken（当前前端未主动调用，预留接口） */
export function refreshToken(refreshToken: string) {
  return http.post<{ data: { token: string; refreshToken: string; expiresIn: number } }>(
    "/auth/refresh",
    { refreshToken },
  );
}
