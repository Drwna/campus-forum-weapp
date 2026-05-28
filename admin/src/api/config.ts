import http from "./http.js";

/** 配置项结构 */
export interface ConfigItem {
  configKey: string;
  configValue: string;
  valueType: string;
  description: string | null;
  isPublic: number;
  updateTime: string;
}

/** 获取所有配置项 */
export function getConfigs() {
  return http.get<{ data: ConfigItem[] }>("/admin/configs");
}

/** 更新配置项 */
export function updateConfig(key: string, value: string) {
  return http.put(`/admin/configs/${key}`, { configValue: value });
}
