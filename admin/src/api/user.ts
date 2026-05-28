import http from "./http.js";

/** 当前登录用户的完整资料（/users/me 返回） */
interface UserProfile {
  userId: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  gender: number;
  role: number;
  status: number;
  createTime: string;
  lastLoginAt: string | null;
}

/** 公开用户信息（/users/:id 返回），含社交统计 */
interface UserPublic {
  userId: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  gender: number;
  createTime: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
}

interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}

/** 管理端用户列表项，比公开信息多了 role/status/commentCount 等管理字段 */
interface AdminUserItem {
  userId: string;
  nickname: string;
  avatar: string | null;
  role: number;
  status: number;
  postCount: number;
  commentCount: number;
  createTime: string;
  lastLoginAt: string | null;
}

/** 获取当前登录管理员的个人信息 */
export function getMe() {
  return http.get<{ data: UserProfile }>("/users/me");
}

/** 根据用户ID获取公开信息（用于查看用户详情） */
export function getUserById(id: string) {
  return http.get<{ data: UserPublic }>(`/users/${id}`);
}

/** 管理端用户列表查询，支持按角色/状态/关键词筛选 */
export function getAdminUsers(params: {
  page?: number;
  size?: number;
  role?: number | undefined;
  status?: number | undefined;
  keyword?: string;
}) {
  return http.get<{ data: PageResult<AdminUserItem> }>("/admin/users", { params });
}

/** 切换用户状态：0=正常, 1=禁用 */
export function updateUserStatus(id: string, status: number) {
  return http.put(`/admin/users/${id}/status`, { status });
}
