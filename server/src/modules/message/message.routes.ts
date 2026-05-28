import { Router } from "express";
import { prisma } from "../../infra/prisma/client.js";
import { requireAuth } from "../../middleware/index.js";
import { success } from "../../utils/index.js";

const router = Router();

// Get message list
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = BigInt(req.userId!);
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 20);
    const isRead = req.query.isRead !== undefined ? Number(req.query.isRead) : undefined;
    const type = req.query.type !== undefined ? Number(req.query.type) : undefined;

    const where: { toUserId: bigint; isRead?: number; type?: number } = { toUserId: userId };
    if (isRead !== undefined) where.isRead = isRead;
    if (type !== undefined) where.type = type;

    const [list, total] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { createTime: "desc" },
        skip: (page - 1) * size,
        take: size,
        include: { fromUser: { select: { userId: true, nickname: true, avatar: true } } },
      }),
      prisma.message.count({ where }),
    ]);

    success(res, {
      list: list.map((m) => ({
        messageId: m.messageId.toString(),
        fromUser: m.fromUser
          ? { userId: m.fromUser.userId.toString(), nickname: m.fromUser.nickname, avatar: m.fromUser.avatar }
          : null,
        type: m.type,
        targetType: m.targetType,
        targetId: m.targetId.toString(),
        content: m.content,
        isRead: m.isRead === 1,
        createTime: m.createTime.toISOString(),
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

// Get unread count
router.get("/unread-count", requireAuth, async (req, res, next) => {
  try {
    const userId = BigInt(req.userId!);
    const count = await prisma.message.count({
      where: { toUserId: userId, isRead: 0 },
    });
    success(res, { count }, req.traceId);
  } catch (error) {
    next(error);
  }
});

// Mark single message as read
router.put("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const messageId = BigInt(req.params.id!);
    await prisma.message.update({
      where: { messageId },
      data: { isRead: 1 },
    });
    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.put("/read-all", requireAuth, async (req, res, next) => {
  try {
    const userId = BigInt(req.userId!);
    await prisma.message.updateMany({
      where: { toUserId: userId, isRead: 0 },
      data: { isRead: 1 },
    });
    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
});

export default router;
