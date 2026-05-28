/**
 * 全局错误码枚举
 * 编码规则：4位数字，前2位代表模块，后2位代表具体错误
 * 10xx = 用户模块，20xx = 帖子模块，30xx = 评论模块，40xx = 互动模块，50xx = 审核模块，90xx = 系统级
 */
export enum ErrorCode {
  Ok = 0,
  // ── 用户模块 (10xx) ──
  UserNotFound = 1001,       // 用户不存在
  UserBanned = 1002,         // 用户已被封禁
  WechatLoginFailed = 1003,  // 微信登录失败（code换取openid失败）
  AdminPasswordInvalid = 1004, // 管理员账号或密码错误
  // ── 帖子模块 (20xx) ──
  PostNotFound = 2001,       // 帖子不存在或已删除
  PostForbidden = 2002,      // 无权操作该帖子（非作者）
  PostSensitiveContent = 2003, // 帖子内容包含敏感词
  // ── 评论模块 (30xx) ──
  CommentNotFound = 3001,    // 评论不存在
  CommentForbidden = 3002,   // 无权操作该评论
  // ── 互动模块 (40xx) ──
  AlreadyInteracted = 4001,  // 重复操作（如已点赞再点赞）
  NotInteracted = 4002,      // 操作前提不满足（如未点赞却取消点赞）
  // ── 审核模块 (50xx) ──
  InvalidModerationStatus = 5001, // 无效的审核状态转换
  CategoryNotEmpty = 5002,   // 分类下仍有帖子，无法删除
  // ── 系统级 (90xx) ──
  RateLimited = 9001,        // 请求频率超限
  InternalError = 9002,      // 服务器内部错误（兜底错误码）
}
