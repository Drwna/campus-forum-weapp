import { Router } from "express";
import { prisma } from "../../infra/prisma/client.js";
import { requireAuth } from "../../middleware/index.js";
import { success, AppError } from "../../utils/index.js";
import { ErrorCode } from "../../shared/errors.js";
import type { CreateReportDTO } from "./report.dto.js";

const router = Router();

// 用户提交举报（需登录）
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const dto = req.body as CreateReportDTO;
    const reporterId = BigInt(req.userId!);
    const targetType = dto.targetType;
    const targetId = BigInt(dto.targetId);

    // 检查是否已举报过（防重复）
    const existing = await prisma.report.findFirst({
      where: {
        reporterId,
        targetType,
        targetId,
        status: { in: [0, 1] }, // 待处理或处理中的举报
      },
    });

    if (existing) {
      throw AppError.badRequest(ErrorCode.InternalError, "您已举报过，请等待处理");
    }

    // 验证举报目标是否存在
    if (targetType === 1) {
      const post = await prisma.post.findUnique({ where: { postId: targetId } });
      if (!post || post.deletedAt) {
        throw AppError.badRequest(ErrorCode.PostNotFound, "帖子不存在");
      }
    } else if (targetType === 2) {
      const comment = await prisma.comment.findUnique({ where: { commentId: targetId } });
      if (!comment || comment.deletedAt) {
        throw AppError.badRequest(ErrorCode.InternalError, "评论不存在");
      }
    }

    // 创建举报记录
    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType,
        targetId,
        reasonType: dto.reasonType,
        reasonText: dto.reasonText ?? null,
        status: 0,
      },
    });

    success(res, { reportId: report.reportId.toString() }, req.traceId);
  } catch (error) {
    next(error);
  }
});

export default router;
