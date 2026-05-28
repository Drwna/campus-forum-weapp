/**
 * 智能时间格式化工具
 * 根据时间差自动选择合适的显示格式：
 *   - 1分钟内 → "刚刚"
 *   - 1小时内 → "X分钟前"
 *   - 24小时内 → "X小时前"
 *   - 7天内 → "X天前"
 *   - 超过7天 → "MM-DD HH:mm"（今年）或 "YYYY-MM-DD HH:mm"（跨年）
 */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";

  const now = new Date();
  const diff = now.getTime() - d.getTime();

  // 1分钟内
  if (diff < 60000) return "刚刚";
  // 1小时内
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  // 24小时内
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  // 7天内
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

  // 超过7天显示完整日期
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  // 今年不显示年份，节省空间
  if (year === now.getFullYear()) {
    return `${month}-${day} ${hours}:${minutes}`;
  }
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/** 简单日期格式化：YYYY-MM-DD */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
