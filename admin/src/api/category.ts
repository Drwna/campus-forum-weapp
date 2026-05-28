import http from "./http.js";

interface CategoryItem {
  categoryId: string;
  categoryName: string;
  categoryDesc: string | null;
  sortOrder: number;        // 排序权重，数值越小越靠前
  status: number;           // 0=启用, 1=隐藏
  allowUserPost: number;    // 1=允许普通用户发帖, 0=仅管理员可发
}

/** 获取所有分类（公开接口，用于下拉选择等场景） */
export function getCategories() {
  return http.get<{ data: CategoryItem[] }>("/categories");
}

/** 新增分类（管理端） */
export function createCategory(data: {
  categoryName: string;
  categoryDesc?: string;
  sortOrder?: number;
  allowUserPost?: number;
}) {
  return http.post("/admin/categories", data);
}

/** 更新分类（管理端），支持部分更新 */
export function updateCategory(
  id: string,
  data: {
    categoryName?: string;
    categoryDesc?: string;
    sortOrder?: number;
    status?: number;
    allowUserPost?: number;
  },
) {
  return http.put(`/admin/categories/${id}`, data);
}

/** 删除分类（管理端），若有帖子关联则后端会拒绝删除 */
export function deleteCategory(id: string) {
  return http.delete(`/admin/categories/${id}`);
}
