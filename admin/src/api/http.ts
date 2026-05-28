import axios from "axios";
import { ElMessage } from "element-plus";
import router from "../router/index.js";

// 统一的 Axios 实例，所有 API 模块共用
// baseURL 对应 nginx 反向代理的 /api/v1 前缀
const http = axios.create({
  baseURL: "/api/v1",
  timeout: 15000,
});

// 请求拦截器：自动附加 JWT Token 到请求头
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一处理业务错误码和 HTTP 状态码
// 后端约定：code === 0 表示成功，非 0 为业务错误
http.interceptors.response.use(
  (response) => {
    const { code, message } = response.data as { code: number; message: string; data: unknown };
    if (code !== 0) {
      ElMessage.error(message);
      return Promise.reject(new Error(message));
    }
    return response;
  },
  (error) => {
    // 401：Token 失效或过期，清除本地凭证并跳转登录页
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      router.push("/login");
      ElMessage.error("登录已过期，请重新登录");
    } else if (error.response?.status === 403) {
      // 403：权限不足（非管理员访问管理接口等）
      ElMessage.error("无权限访问");
    } else if (error.response?.status === 429) {
      // 429：触发了 rateLimit 中间件
      ElMessage.error("请求过于频繁，请稍后再试");
    } else {
      ElMessage.error(error.message || "网络错误");
    }
    return Promise.reject(error);
  },
);

export default http;
