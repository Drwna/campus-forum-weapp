import http from "./http.js";

/**
 * 资料审核项
 * 用户修改昵称/头像/简介/性别/年龄时，变更不会立即生效，需管理员审核通过后才写入用户表
 */
interface ProfileReviewItem {
  reviewId: string;
  userId: string;
  user: { userId: string; nickname: string; avatar: string | null };
  nickname: string | null;    // 待审核的新昵称（null 表示未修改）
  avatar: string | null;      // 待审核的新头像 URL
  bio: string | null;         // 待审核的新简介
  gender: number | null;      // 待审核的新性别
  age: number | null;         // 待审核的新年龄
  status: number;             // 0=待审核, 1=已通过, 2=已驳回
  rejectReason: string | null;
  handler: { userId: string; nickname: string } | null; // 审核人
  handleTime: string | null;
  createTime: string;
}

interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}

/** 获取资料变更审核列表，默认按待审核状态筛选 */
export function getProfileReviews(params: { page?: number; size?: number; status?: number }) {
  return http.get<{ data: PageResult<ProfileReviewItem> }>("/admin/profile-reviews", { params });
}

/** 通过资料审核，将待审核字段写入用户表 */
export function approveProfileReview(id: string) {
  return http.put(`/admin/profile-reviews/${id}/approve`);
}

/** 驳回资料审核，需附带驳回原因 */
export function rejectProfileReview(id: string, rejectReason: string) {
  return http.put(`/admin/profile-reviews/${id}/reject`, { rejectReason });
}
