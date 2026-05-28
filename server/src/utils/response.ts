import type { Response } from "express";
import type { ApiResponse } from "../shared/response.js";

/** 成功响应：code=0，HTTP状态码默认200 */
export function success<T>(res: Response, data: T, traceId: string): void {
  const body: ApiResponse<T> = {
    code: 0,
    message: "ok",
    data,
    traceId,
  };
  res.json(body);
}

/** 失败响应：自定义错误码和HTTP状态码，data固定为null */
export function fail(res: Response, code: number, message: string, traceId: string, status = 400): void {
  const body: ApiResponse<null> = {
    code,
    message,
    data: null,
    traceId,
  };
  res.status(status).json(body);
}
