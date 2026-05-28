import jwt from "jsonwebtoken";
import { logger } from "../../utils/logger.js";

// RSA密钥对：生产环境使用RS256非对称加密（更安全），开发环境回退到HS256对称加密
// 密钥通过BASE64编码存储在环境变量中，避免换行符问题
const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY_BASE64
  ? Buffer.from(process.env.JWT_PRIVATE_KEY_BASE64, "base64").toString("utf-8")
  : "";

const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY_BASE64
  ? Buffer.from(process.env.JWT_PUBLIC_KEY_BASE64, "base64").toString("utf-8")
  : "";

// JWT标准字段：issuer(签发者)和audience(受众)用于防止token被其他系统使用
const ISSUER = process.env.JWT_ISSUER ?? "campushub";
const AUDIENCE = process.env.JWT_AUDIENCE ?? "campushub-users";
const ACCESS_EXPIRES = Number(process.env.JWT_EXPIRES_IN ?? 7200);      // accessToken有效期：2小时
const REFRESH_EXPIRES = Number(process.env.JWT_REFRESH_EXPIRES_IN ?? 2592000); // refreshToken有效期：30天

export interface JwtPayload {
  userId: string;
  role: number;
}

/** 获取签名密钥：优先使用RSA私钥，回退到对称密钥 */
function getSecret(): string {
  if (PRIVATE_KEY) return PRIVATE_KEY;
  const fallback = process.env.JWT_SECRET ?? "dev-secret-change-me";
  if (process.env.NODE_ENV === "production") {
    logger.warn("JWT_PRIVATE_KEY_BASE64 not set, using JWT_SECRET fallback");
  }
  return fallback;
}

/** 获取验证密钥：有RSA公钥时用公钥验证，否则用签名密钥（HS256场景） */
function getVerifySecret(): string {
  if (PUBLIC_KEY) return PUBLIC_KEY;
  return getSecret();
}

/** 签发短期访问令牌，用于API认证 */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: ACCESS_EXPIRES,
    algorithm: PRIVATE_KEY ? "RS256" : "HS256",
  });
}

/** 签发长期刷新令牌，用于无感续签accessToken */
export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: REFRESH_EXPIRES,
    algorithm: PRIVATE_KEY ? "RS256" : "HS256",
  });
}

/** 验证accessToken，失败返回null（不抛异常，由调用方处理） */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getVerifySecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/** 验证refreshToken，失败返回null */
export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getVerifySecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/** 获取accessToken过期时间（秒），返回给客户端用于计算token刷新时机 */
export function getTokenExpiresAt(): number {
  return ACCESS_EXPIRES;
}
