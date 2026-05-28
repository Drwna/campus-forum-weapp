import http from "./http.js";

/** 通用分页结果结构，对应后端 PaginatedResult<T> */
interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}

/** 帖子审核项，包含作者和分类的嵌套信息 */
interface ModerationPost {
  postId: string;
  author: { userId: string; nickname: string; avatar: string | null };
  category: { categoryId: string; categoryName: string };
  title: string;
  content: string;
  imageUrls: string[];
  status: number; // 0=待审核, 1=已通过, 2=已驳回, 3=已删除
  createTime: string;
}

interface CommentItem {
  commentId: string;
  content: string;
  author: { nickname: string };
  postId: string;
  createTime: string;
}

/** 举报项，targetType: 1=帖子, 2=评论, 3=用户 */
interface ReportItem {
  reportId: string;
  reporterId: string;
  targetType: number;
  targetId: string;
  reasonType: number;
  reasonText: string | null;
  status: number; // 0=待处理, 1=处理中, 2=已解决, 3=已驳回
  createTime: string;
}

// ── 帖子管理 ──

/** 获取帖子列表（管理端），支持按状态/分类/关键词筛选 */
export function getAdminPosts(params: {
  page?: number;
  size?: number;
  status?: number | undefined;
  categoryId?: string;
  keyword?: string;
}) {
  return http.get<{ data: PageResult<ModerationPost> }>("/admin/posts", { params });
}

/** 更新帖子审核状态：1=通过, 2=驳回（需附带驳回原因） */
export function updatePostStatus(id: string, status: number, rejectReason?: string) {
  return http.put(`/admin/posts/${id}/status`, { status, rejectReason });
}

/** 物理删除帖子（管理端），会同时清理关联的图片文件 */
export function deleteAdminPost(id: string) {
  return http.delete(`/admin/posts/${id}`);
}

// ── 评论管理 ──

/** 获取评论列表（管理端），可按帖子ID筛选 */
export function getAdminComments(params: { page?: number; size?: number; postId?: string }) {
  return http.get<{ data: PageResult<CommentItem> }>("/admin/comments", { params });
}

/** 删除评论（管理端） */
export function deleteAdminComment(id: string) {
  return http.delete(`/admin/comments/${id}`);
}

// ── 举报管理 ──

/** 获取举报列表（管理端），支持按处理状态筛选 */
export function getAdminReports(params: { page?: number; size?: number; status?: number | undefined }) {
  return http.get<{ data: PageResult<ReportItem> }>("/admin/reports", { params });
}

/** 更新举报处理状态：2=已解决, 3=已驳回，可附带处理结果说明 */
export function updateReportStatus(id: string, status: number, handleResult?: string) {
  return http.put(`/admin/reports/${id}/status`, { status, handleResult });
}
