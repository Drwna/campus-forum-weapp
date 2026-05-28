import http from "./http.js";

/** 仪表盘统计数据，由 /admin/stats 接口返回 */
interface DashboardStats {
  todayPosts: number;           // 今日新帖数
  totalUsers: number;           // 用户总数
  todayComments: number;        // 今日新评论数
  pendingPosts: number;         // 待审核帖子数
  pendingProfileReviews: number; // 待审核资料变更数
  pendingReports: number;       // 待处理举报数
  pendingTotal: number;         // 待处理总数（上述三项之和）
}

/** 获取管理后台仪表盘概览数据 */
export function getDashboardStats() {
  return http.get<{ data: DashboardStats }>("/admin/stats");
}
