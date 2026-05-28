/**
 * 统一API响应格式
 * code=0表示成功，非0为错误码（见shared/errors.ts）
 * traceId贯穿整个请求链路，方便日志追踪和问题排查
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
}

/** 分页结果包装 */
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;  // 是否还有更多数据，前端用于判断是否继续加载
}

/** 分页查询参数基类 */
export interface PageQuery {
  page?: number;
  size?: number;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
