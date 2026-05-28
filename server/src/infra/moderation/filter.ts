import { prisma } from "../prisma/client.js";

// 敏感词缓存
let sensitiveWords: string[] = [];
let lastLoadTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟刷新一次

// 配置缓存
let commentFilterEnabled = true;
let lastConfigLoadTime = 0;

/**
 * 加载敏感词列表（带缓存）
 * 从数据库 sensitive_word 表加载 status=0 的敏感词
 * 缓存 5 分钟，避免每次评论都查库
 */
async function loadSensitiveWords(): Promise<string[]> {
  const now = Date.now();
  if (sensitiveWords.length > 0 && now - lastLoadTime < CACHE_TTL) {
    return sensitiveWords;
  }

  const words = await prisma.sensitiveWord.findMany({
    where: { status: 0 },
    select: { word: true },
  });

  sensitiveWords = words.map((w) => w.word);
  lastLoadTime = now;
  return sensitiveWords;
}

/**
 * 读取评论过滤开关配置
 * 配置项：comment_filter_enabled = "true" | "false"
 */
async function isCommentFilterEnabled(): Promise<boolean> {
  const now = Date.now();
  if (now - lastConfigLoadTime < CACHE_TTL) {
    return commentFilterEnabled;
  }

  const config = await prisma.appConfig.findUnique({
    where: { configKey: "comment_filter_enabled" },
  });

  commentFilterEnabled = config?.configValue !== "false";
  lastConfigLoadTime = now;
  return commentFilterEnabled;
}

/**
 * 检查文本是否包含敏感词
 * @param text 待检查文本
 * @returns { passed: boolean, word?: string }
 *   - passed=true 表示通过（无敏感词）
 *   - passed=false 表示命中敏感词，word 为命中的词
 */
export async function checkSensitive(text: string): Promise<{ passed: boolean; word?: string }> {
  // 先检查开关是否启用
  const enabled = await isCommentFilterEnabled();
  if (!enabled) {
    return { passed: true };
  }

  const words = await loadSensitiveWords();

  for (const word of words) {
    if (text.includes(word)) {
      return { passed: false, word };
    }
  }

  return { passed: true };
}

/**
 * 强制刷新缓存（管理员修改敏感词后调用）
 */
export function refreshCache(): void {
  sensitiveWords = [];
  lastLoadTime = 0;
  commentFilterEnabled = true;
  lastConfigLoadTime = 0;
}
