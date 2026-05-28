import http from "./http.js";

interface NoticeItem {
  noticeId: string;
  title: string;
  content: string;
  type: number;           // 公告类型
  status: number;         // 0=草稿, 1=已发布, 2=已归档
  isTop: boolean;         // 是否置顶显示
  startTime: string | null; // 生效开始时间（预留字段）
  endTime: string | null;   // 生效结束时间（预留字段）
  createTime: string;
}

interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}

/** 获取公告列表（管理端），支持按状态筛选 */
export function getAdminNotices(params: { page?: number; size?: number; status?: number }) {
  return http.get<{ data: PageResult<NoticeItem> }>("/admin/notices", { params });
}

/** 新增公告，默认为草稿状态 */
export function createNotice(data: { title: string; content: string; type?: number; isTop?: boolean }) {
  return http.post("/admin/notices", data);
}

/** 更新公告（管理端），可修改标题/内容/状态/置顶 */
export function updateNotice(id: string, data: { title?: string; content?: string; status?: number; isTop?: boolean }) {
  return http.put(`/admin/notices/${id}`, data);
}

/** 删除公告（管理端） */
export function deleteNotice(id: string) {
  return http.delete(`/admin/notices/${id}`);
}
