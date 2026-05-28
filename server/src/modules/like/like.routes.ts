import { Router } from "express";
import { prisma } from "../../infra/prisma/client.js";
import { redis } from "../../infra/redis/client.js";
import { requireAuth } from "../../middleware/index.js";
import { success, AppError } from "../../utils/index.js";
import { ErrorCode } from "../../shared/errors.js";
import { notifyLike, notifyFollow } from "../../utils/notify.js";

const router = Router();

// Like a post
router.post("/posts/:id/like", requireAuth, async (req, res, next) => {
  try {
    const postId = BigInt(req.params.id!);
    const userId = BigInt(req.userId!);
    const key = `like:${userId}:${postId}`;

    const existing = await redis.get(key);
    if (existing) {
      const count = await redis.get(`post:${postId}:likeCount`) ?? "0";
      success(res, { isLiked: true, likeCount: Number(count) }, req.traceId);
      return;
    }

    await redis.set(key, "1");
    await redis.incr(`post:${postId}:likeCount`);

    await prisma.postLike.upsert({
      where: { userId_postId: { userId, postId } },
      update: { status: 1 },
      create: { userId, postId, status: 1 },
    });

    await prisma.post.update({
      where: { postId },
      data: { likeCount: { increment: 1 } },
    });

    // 发送点赞通知
    const post = await prisma.post.findUnique({ where: { postId }, select: { userId: true } });
    if (post) {
      await notifyLike(post.userId, userId, postId);
    }

    const count = await redis.get(`post:${postId}:likeCount`) ?? "1";
    success(res, { isLiked: true, likeCount: Number(count) }, req.traceId);
  } catch (error) {
    next(error);
  }
});

// Unlike a post
router.delete("/posts/:id/like", requireAuth, async (req, res, next) => {
  try {
    const postId = BigInt(req.params.id!);
    const userId = BigInt(req.userId!);
    const key = `like:${userId}:${postId}`;

    const existing = await redis.get(key);
    if (!existing) {
      const count = await redis.get(`post:${postId}:likeCount`) ?? "0";
      success(res, { isLiked: false, likeCount: Number(count) }, req.traceId);
      return;
    }

    await redis.del(key);
    await redis.decr(`post:${postId}:likeCount`);

    await prisma.postLike.update({
      where: { userId_postId: { userId, postId } },
      data: { status: 0 },
    });

    await prisma.post.update({
      where: { postId },
      data: { likeCount: { decrement: 1 } },
    });

    const count = await redis.get(`post:${postId}:likeCount`) ?? "0";
    success(res, { isLiked: false, likeCount: Math.max(0, Number(count)) }, req.traceId);
  } catch (error) {
    next(error);
  }
});

// Follow a user
router.post("/users/:id/follow", requireAuth, async (req, res, next) => {
  try {
    const followerId = BigInt(req.userId!);
    const followingId = BigInt(req.params.id!);

    if (followerId === followingId) {
      throw AppError.badRequest(ErrorCode.InternalError, "不能关注自己");
    }

    await prisma.userFollow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      update: { status: 1 },
      create: { followerId, followingId, status: 1 },
    });

    // 发送关注通知
    await notifyFollow(followingId, followerId);

    success(res, { isFollowing: true }, req.traceId);
  } catch (error) {
    next(error);
  }
});

// Unfollow a user
router.delete("/users/:id/follow", requireAuth, async (req, res, next) => {
  try {
    const followerId = BigInt(req.userId!);
    const followingId = BigInt(req.params.id!);

    await prisma.userFollow.update({
      where: { followerId_followingId: { followerId, followingId } },
      data: { status: 0 },
    });

    success(res, { isFollowing: false }, req.traceId);
  } catch (error) {
    next(error);
  }
});

// Get followers
router.get("/users/:id/followers", async (req, res, next) => {
  try {
    const followingId = BigInt(req.params.id!);
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 20);

    const [list, total] = await Promise.all([
      prisma.userFollow.findMany({
        where: { followingId, status: 1 },
        skip: (page - 1) * size,
        take: size,
        include: { follower: { select: { userId: true, nickname: true, avatar: true } } },
        orderBy: { createTime: "desc" },
      }),
      prisma.userFollow.count({ where: { followingId, status: 1 } }),
    ]);

    success(res, {
      list: list.map((f) => ({
        userId: f.follower.userId.toString(),
        nickname: f.follower.nickname,
        avatar: f.follower.avatar,
      })),
      total,
      page,
      size,
      hasMore: page * size < total,
    }, req.traceId);
  } catch (error) {
    next(error);
  }
});

// Get following
router.get("/users/:id/following", async (req, res, next) => {
  try {
    const followerId = BigInt(req.params.id!);
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 20);

    const [list, total] = await Promise.all([
      prisma.userFollow.findMany({
        where: { followerId, status: 1 },
        skip: (page - 1) * size,
        take: size,
        include: { following: { select: { userId: true, nickname: true, avatar: true } } },
        orderBy: { createTime: "desc" },
      }),
      prisma.userFollow.count({ where: { followerId, status: 1 } }),
    ]);

    success(res, {
      list: list.map((f) => ({
        userId: f.following.userId.toString(),
        nickname: f.following.nickname,
        avatar: f.following.avatar,
      })),
      total,
      page,
      size,
      hasMore: page * size < total,
    }, req.traceId);
  } catch (error) {
    next(error);
  }
});

export default router;
