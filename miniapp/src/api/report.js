import { post } from "../utils/http.js";

/**
 * 提交举报
 * @param {number} targetType - 举报目标类型：1=帖子, 2=评论
 * @param {string} targetId - 举报目标ID
 * @param {number} reasonType - 举报原因类型：1=色情, 2=暴力, 3=广告, 4=政治, 5=侮辱, 6=其他
 * @param {string} reasonText - 举报原因描述（可选）
 */
export function createReport(targetType, targetId, reasonType, reasonText) {
  return post("/reports", { targetType, targetId, reasonType, reasonText });
}
