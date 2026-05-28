import winston from "winston";

const level = process.env.LOG_LEVEL ?? "info";

/**
 * 日志工具（基于winston）
 * 生产环境：JSON格式输出，方便日志采集系统解析
 * 开发环境：彩色+简洁格式，便于人工阅读
 */
export const logger = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === "production"
          ? winston.format.json()
          : winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});
