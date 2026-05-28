/**
 * 分类（版块）相关 API
 * 获取帖子分类列表，用于首页分类标签和发帖时选择分类
 */
import { get } from "../utils/http.js";

/** 获取所有帖子分类 */
export function getCategories() {
  return get("/categories");
}
