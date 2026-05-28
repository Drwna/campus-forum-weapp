import bcrypt from "bcryptjs";
import { ErrorCode } from "../../shared/errors.js";
import { AppError } from "../../utils/index.js";
import { redis } from "../../infra/redis/client.js";
import { prisma } from "../../infra/prisma/client.js";
import { findUserByOpenid, createUserWithOpenid, findAdminByAccount, updateLastLoginAt, findUserById } from "./auth.repo.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken, getTokenExpiresAt } from "./jwt.js";
import type { WechatLoginDTO, AdminLoginDTO, RefreshTokenDTO } from "./auth.dto.js";

interface LoginResult {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    userId: string;
    nickname: string;
    avatar: string | null;
    role: number;
  };
}

/** 将数据库用户对象转换为登录响应DTO，同时签发accessToken和refreshToken */
function toLoginResult(user: { userId: bigint; nickname: string; avatar: string | null; role: number }): LoginResult {
  const userIdStr = user.userId.toString();
  // accessToken用于API认证，refreshToken用于无感续签
  const token = signAccessToken({ userId: userIdStr, role: user.role });
  const refreshToken = signRefreshToken({ userId: userIdStr, role: user.role });

  return {
    token,
    refreshToken,
    expiresIn: getTokenExpiresAt(),
    user: {
      userId: userIdStr,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
    },
  };
}

/**
 * 微信小程序登录流程：
 * 1. 前端调用wx.login()获取code
 * 2. 后端用code换取openid（当前为mock模式，正式接入需实现微信API调用）
 * 3. openid存在则登录，不存在则自动注册
 * 4. 每次登录同步最新的昵称和头像
 */
export async function wechatLogin(dto: WechatLoginDTO): Promise<LoginResult> {
  const isMockEnabled = process.env.WECHAT_MOCK_ENABLED === "true";
  let openid: string;

  if (isMockEnabled) {
    // Mock模式：直接用code作为openid后缀，方便开发调试
    openid = `mock_${dto.code}`;
  } else {
    // TODO: 正式接入微信登录API，调用code2Session接口获取openid
    throw AppError.badRequest(ErrorCode.WechatLoginFailed, "微信登录暂未实现");
  }

  let user = await findUserByOpenid(openid);

  if (!user) {
    // 新用户：自动注册，默认角色为学生(0)，状态为正常(0)
    user = await createUserWithOpenid(openid, dto.nickname ?? `用户${openid.slice(-6)}`, dto.avatar ?? null);
  } else {
    // 已有用户：同步微信头像和昵称（微信侧可能随时变更）
    const updateData: { nickname?: string; avatar?: string } = {};
    if (dto.nickname) updateData.nickname = dto.nickname;
    if (dto.avatar) updateData.avatar = dto.avatar;
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({ where: { userId: user.userId }, data: updateData });
      user = await findUserByOpenid(openid) ?? user;
    }
  }

  // 被封禁的用户不允许登录
  if (user.status === 1) {
    throw AppError.badRequest(ErrorCode.UserBanned, "账号已被禁用");
  }

  await updateLastLoginAt(user.userId);
  return toLoginResult(user);
}

/**
 * 管理员账号密码登录
 * 密码使用bcrypt哈希验证，防彩虹表攻击
 */
export async function adminLogin(dto: AdminLoginDTO): Promise<LoginResult> {
  const user = await findAdminByAccount(dto.account);
  if (!user || !user.passwordHash) {
    // 统一返回"账号或密码错误"，不暴露是账号不存在还是密码错误（防枚举攻击）
    throw AppError.badRequest(ErrorCode.AdminPasswordInvalid, "账号或密码错误");
  }

  if (user.status === 1) {
    throw AppError.badRequest(ErrorCode.UserBanned, "账号已被禁用");
  }

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) {
    throw AppError.badRequest(ErrorCode.AdminPasswordInvalid, "账号或密码错误");
  }

  await updateLastLoginAt(user.userId);
  return toLoginResult(user);
}

/**
 * 刷新accessToken
 * 流程：验证refreshToken有效性 → 检查是否在黑名单 → 重新签发双token
 * 实现无感续签：用户accessToken过期后，前端用refreshToken换取新的token对
 */
export async function refreshToken(dto: RefreshTokenDTO): Promise<{ token: string; refreshToken: string; expiresIn: number }> {
  const payload = verifyRefreshToken(dto.refreshToken);
  if (!payload) {
    throw AppError.badRequest(ErrorCode.InternalError, "refreshToken 无效或已过期");
  }

  // 检查refreshToken是否已被加入黑名单（登出时会加入）
  const blacklisted = await redis.get(`bl:${dto.refreshToken}`);
  if (blacklisted) {
    throw AppError.badRequest(ErrorCode.InternalError, "refreshToken 已失效");
  }

  // 再次确认用户状态，防止已被封禁的用户通过refreshToken继续访问
  const user = await findUserById(BigInt(payload.userId));
  if (!user || user.status === 1) {
    throw AppError.badRequest(ErrorCode.UserBanned, "账号已被禁用");
  }

  const token = signAccessToken({ userId: payload.userId, role: user.role });
  const newRefreshToken = signRefreshToken({ userId: payload.userId, role: user.role });

  return {
    token,
    refreshToken: newRefreshToken,
    expiresIn: getTokenExpiresAt(),
  };
}

/**
 * 登出：将token加入Redis黑名单
 * accessToken黑名单TTL=2h（等于token有效期），refreshToken黑名单TTL=30d
 * 黑名单机制实现即时失效：用户登出后token立即不可用，无需等待自然过期
 */
export async function logout(token: string, refreshTokenStr: string): Promise<void> {
  const payload = verifyRefreshToken(refreshTokenStr);
  if (payload) {
    await redis.setex(`bl:${refreshTokenStr}`, 2592000, "1");
  }

  await redis.setex(`bl:${token}`, 7200, "1");
}
