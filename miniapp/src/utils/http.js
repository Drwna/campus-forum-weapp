/**
 * HTTP 请求工具模块
 *
 * 对 uni.request 的封装，提供：
 * 1. 统一的 API 基地址（BASE_URL）
 * 2. 自动注入 JWT token 到请求头
 * 3. 统一的错误处理（401 自动跳转登录页、其他错误 toast 提示）
 * 4. 便捷方法：get/post/put/del
 * 5. 图片 URL 解析（将相对路径转为完整 URL）
 */

// 后端 API 基地址，所有请求会自动拼接此前缀
const BASE_URL = "http://localhost:3001/api/v1";
// 服务器基地址，用于拼接图片等静态资源的完整路径
const SERVER_BASE = "http://localhost:3001";

/**
 * 解析图片 URL
 * 后端返回的图片路径可能是相对路径（如 /uploads/xxx.jpg），需要拼接服务器地址
 * 如果已经是完整 URL（http/https 开头），则直接返回
 */
export function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return SERVER_BASE + url;
}

/** 从本地存储获取 JWT token */
function getToken() {
  return uni.getStorageSync("token") ?? "";
}

/**
 * 核心请求方法，封装 uni.request
 *
 * 错误处理策略：
 * - 401: token 过期或无效，清除本地 token 并跳转登录页
 * - 4xx/5xx: 弹出后端返回的错误消息
 * - 网络错误: 弹出通用提示
 *
 * @param {Object} options - { url, method, data, header }
 * @returns {Promise} 返回后端响应的 data 字段
 */
export function request(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method ?? "GET",
      data: options.data,
      header: {
        "Content-Type": "application/json",
        // 自动携带 JWT token，后端中间件会解析并注入 req.user
        Authorization: getToken() ? `Bearer ${getToken()}` : "",
        // 允许调用方自定义 header（如覆盖 Content-Type）
        ...options.header,
      },
      success(res) {
        // 401 表示 token 无效或过期，需要重新登录
        if (res.statusCode === 401) {
          uni.removeStorageSync("token");
          uni.removeStorageSync("refreshToken");
          // reLaunch 会关闭所有页面并跳转，防止用户按返回键回到需要登录的页面
          uni.reLaunch({ url: "/pages/login/login" });
          reject(new Error("登录已过期"));
          return;
        }
        // 其他 4xx/5xx 错误，显示后端返回的错误消息
        if (res.statusCode >= 400) {
          const msg = res.data?.message ?? "请求失败";
          uni.showToast({ title: msg, icon: "none" });
          reject(new Error(msg));
          return;
        }
        // 成功时返回完整的响应体（包含 code/message/data）
        resolve(res.data);
      },
      fail(err) {
        // 网络连接失败（无网络、超时等）
        uni.showToast({ title: "网络连接失败", icon: "none" });
        reject(err);
      },
    });
  });
}

// 便捷方法，自动设置 HTTP 方法
export function get(url, data) {
  return request({ url, method: "GET", data });
}

export function post(url, data) {
  return request({ url, method: "POST", data });
}

export function put(url, data) {
  return request({ url, method: "PUT", data });
}

export function del(url, data) {
  return request({ url, method: "DELETE", data });
}
