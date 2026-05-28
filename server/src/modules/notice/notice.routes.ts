import { Router } from "express";
import { prisma } from "../../infra/prisma/client.js";
import { success } from "../../utils/index.js";

const router = Router();

// 公开接口：获取已发布的公告列表
router.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 20);

    const where = { status: 1 };

    const [list, total] = await Promise.all([
      prisma.notice.findMany({
        where,
        orderBy: [{ isTop: "desc" }, { createTime: "desc" }],
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.notice.count({ where }),
    ]);

    success(res, {
      list: list.map((n) => ({
        noticeId: n.noticeId.toString(),
        title: n.title,
        content: n.content,
        type: n.type,
        isTop: n.isTop === 1,
        createTime: n.createTime.toISOString(),
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

// 公开接口：获取公告详情
router.get("/:id", async (req, res, next) => {
  try {
    const noticeId = BigInt(req.params.id!);
    const notice = await prisma.notice.findUnique({ where: { noticeId } });

    if (!notice || notice.status !== 1) {
      res.status(404).json({ code: 404, message: "公告不存在", data: null });
      return;
    }

    success(res, {
      noticeId: notice.noticeId.toString(),
      title: notice.title,
      content: notice.content,
      type: notice.type,
      isTop: notice.isTop === 1,
      createTime: notice.createTime.toISOString(),
    }, req.traceId);
  } catch (error) {
    next(error);
  }
});

export default router;
