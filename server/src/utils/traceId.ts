import { randomUUID } from "node:crypto";

/** 生成UUID v4作为请求追踪ID */
export function generateTraceId(): string {
  return randomUUID();
}
