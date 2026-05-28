import { ErrorCode } from "../shared/errors.js";

/**
 * 业务异常类
 * 区分于系统异常：AppError表示可预期的业务错误（如"用户不存在"），会被errorHandler捕获并返回给客户端
 * 提供静态工厂方法快速创建常见HTTP错误
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }

  static notFound(message: string): AppError {
    return new AppError(ErrorCode.InternalError, message, 404);
  }

  static unauthorized(message = "未登录"): AppError {
    return new AppError(ErrorCode.InternalError, message, 401);
  }

  static forbidden(message = "无权限"): AppError {
    return new AppError(ErrorCode.InternalError, message, 403);
  }

  static badRequest(code: ErrorCode, message: string): AppError {
    return new AppError(code, message, 400);
  }

  static internal(message = "服务器内部错误"): AppError {
    return new AppError(ErrorCode.InternalError, message, 500);
  }
}
