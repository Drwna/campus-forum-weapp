import { z } from "zod";

// 使用zod做运行时参数校验，同时通过z.infer自动推导TypeScript类型
// 这样既保证了类型安全，又能在请求入口处拦截非法参数

/** 微信登录：code必填（wx.login获取），昵称和头像可选（首次登录时传入） */
export const WechatLoginSchema = z.object({
  code: z.string().min(1, "code 不能为空"),
  nickname: z.string().max(64).optional(),
  avatar: z.string().max(512).optional(),
});

/** 管理员登录：账号密码必填 */
export const AdminLoginSchema = z.object({
  account: z.string().min(1, "账号不能为空").max(64),
  password: z.string().min(6, "密码至少 6 位").max(128),
});

/** 刷新令牌 */
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken 不能为空"),
});

export type WechatLoginDTO = z.infer<typeof WechatLoginSchema>;
export type AdminLoginDTO = z.infer<typeof AdminLoginSchema>;
export type RefreshTokenDTO = z.infer<typeof RefreshTokenSchema>;
