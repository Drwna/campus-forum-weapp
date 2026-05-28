export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}

export interface PageQuery {
  page?: number;
  size?: number;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
