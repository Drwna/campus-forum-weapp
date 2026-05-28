import { Router } from "express";
import { prisma } from "../../infra/prisma/client.js";
import { requireAuth, requireRole } from "../../middleware/index.js";
import { UserRole } from "../../shared/enums.js";
import { success, AppError } from "../../utils/index.js";
import { ErrorCode } from "../../shared/errors.js";
import { refreshCache } from "../../infra/moderation/filter.js";
import { notifyReportResult } from "../../utils/notify.js";
import * as postController from "../post/post.controller.js";
import * as commentController from "../comment/comment.controller.js";
import * as profileController from "../profile/profile.controller.js";

const router = Router();

// All admin routes require admin role
router.use(requireAuth, requireRole(UserRole.Admin));

// ── Post moderation ──
router.get("/posts", postController.adminGetList);
router.put("/posts/:id/status", postController.adminUpdateStatus);
router.delete("/posts/:id", postController.adminRemove);

// ── Comment moderation ──
router.get("/comments", commentController.adminGetList);
router.delete("/comments/:id", commentController.adminRemove);

// ── Profile review ──
router.get("/profile-reviews", profileController.getReviewList);
router.put("/profile-reviews/:id/approve", profileController.approveReview);
router.put("/profile-reviews/:id/reject", profileController.rejectReview);

// ── Dashboard stats ──
router.get("/stats", async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayPosts,
      totalUsers,
      todayComments,
      pendingPosts,
      pendingProfileReviews,
      pendingReports,
    ] = await Promise.all([
      prisma.post.count({ where: { createTime: { gte: today }, deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.comment.count({ where: { createTime: { gte: today }, deletedAt: null } }),
      prisma.post.count({ where: { status: 0, deletedAt: null } }),
      prisma.profileReview.count({ where: { status: 0 } }),
      prisma.report.count({ where: { status: 0 } }),
    ]);

    success(res, {
      todayPosts,
      totalUsers,
      todayComments,
      pendingPosts,
      pendingProfileReviews,
      pendingReports,
      pendingTotal: pendingPosts + pendingProfileReviews + pendingReports,
    }, req.traceId);
  } catch (error) {
    next(error);
  }
});

// ── User management ──
router.get("/users", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 20);
    const role = req.query.role !== undefined ? Number(req.query.role) : undefined;
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const keyword = req.query.keyword as string | undefined;

    const where: { role?: number; status?: number; OR?: object[]; deletedAt: null } = { deletedAt: null };
    if (role !== undefined) where.role = role;
    if (status !== undefined) where.status = status;
    if (keyword) {
      where.OR = [{ nickname: { contains: keyword } }, { adminAccount: { contains: keyword } }];
    }

    const [list, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createTime: "desc" },
        skip: (page - 1) * size,
        take: size,
        select: {
          userId: true,
          nickname: true,
          avatar: true,
          role: true,
          status: true,
          createTime: true,
          lastLoginAt: true,
          _count: { select: { posts: true, comments: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    success(res, {
      list: list.map((u) => ({
        userId: u.userId.toString(),
        nickname: u.nickname,
        avatar: u.avatar,
        role: u.role,
        status: u.status,
        postCount: u._count.posts,
        commentCount: u._count.comments,
        createTime: u.createTime.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
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

router.put("/users/:id/status", async (req, res, next) => {
  try {
    const userId = BigInt(req.params.id!);
    const { status } = req.body as { status: number };

    await prisma.user.update({
      where: { userId },
      data: { status },
    });

    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
});

// ── Category CRUD ──
router.post("/categories", async (req, res, next) => {
  try {
    const { categoryName, categoryDesc, sortOrder, allowUserPost } = req.body as {
      categoryName: string;
      categoryDesc?: string;
      sortOrder?: number;
      allowUserPost?: number;
    };

    const category = await prisma.category.create({
      data: {
        categoryName,
        categoryDesc: categoryDesc ?? null,
        sortOrder: sortOrder ?? 0,
        allowUserPost: allowUserPost ?? 1,
      },
    });

    success(res, { categoryId: category.categoryId.toString() }, req.traceId);
  } catch (error) {
    next(error);
  }
});

router.put("/categories/:id", async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);
    const { categoryName, categoryDesc, sortOrder, status, allowUserPost } = req.body as {
      categoryName?: string;
      categoryDesc?: string;
      sortOrder?: number;
      status?: number;
      allowUserPost?: number;
    };

    await prisma.category.update({
      where: { categoryId },
      data: {
        ...(categoryName !== undefined ? { categoryName } : {}),
        ...(categoryDesc !== undefined ? { categoryDesc } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(allowUserPost !== undefined ? { allowUserPost } : {}),
      },
    });

    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
});

router.delete("/categories/:id", async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);

    const postCount = await prisma.post.count({ where: { categoryId, deletedAt: null } });
    if (postCount > 0) {
      throw AppError.badRequest(ErrorCode.CategoryNotEmpty, `该分类下还有 ${postCount} 个帖子，无法删除`);
    }

    await prisma.category.delete({ where: { categoryId } });
    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
});

// ── Report management ──
router.get("/reports", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 20);
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;

    const where: { status?: number } = {};
    if (status !== undefined) where.status = status;

    const [list, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createTime: "desc" },
        skip: (page - 1) * size,
        take: size,
        include: { reporter: { select: { userId: true, nickname: true } } },
      }),
      prisma.report.count({ where }),
    ]);

    // 批量查询被举报的内容
    const reportList = await Promise.all(
      list.map(async (r) => {
        let targetContent: string | null = null;
        let targetAuthor: string | null = null;

        if (r.targetType === 1) {
          // 帖子
          const post = await prisma.post.findUnique({
            where: { postId: r.targetId },
            select: { title: true, content: true, author: { select: { nickname: true } } },
          });
          if (post) {
            targetContent = `【${post.title}】${post.content.slice(0, 100)}`;
            targetAuthor = post.author.nickname;
          }
        } else if (r.targetType === 2) {
          // 评论
          const comment = await prisma.comment.findUnique({
            where: { commentId: r.targetId },
            select: { content: true, author: { select: { nickname: true } } },
          });
          if (comment) {
            targetContent = comment.content;
            targetAuthor = comment.author.nickname;
          }
        }

        return {
          reportId: r.reportId.toString(),
          reporterId: r.reporterId.toString(),
          reporterName: r.reporter.nickname,
          targetType: r.targetType,
          targetId: r.targetId.toString(),
          targetContent,
          targetAuthor,
          reasonType: r.reasonType,
          reasonText: r.reasonText,
          status: r.status,
          createTime: r.createTime.toISOString(),
        };
      }),
    );

    success(res, {
      list: reportList,
      total,
      page,
      size,
      hasMore: page * size < total,
    }, req.traceId);
  } catch (error) {
    next(error);
  }
});

router.put("/reports/:id/status", async (req, res, next) => {
  try {
    const reportId = BigInt(req.params.id!);
    const { status, handleResult } = req.body as { status: number; handleResult?: string };

    // 先查询举报记录，获取举报人ID
    const report = await prisma.report.findUnique({
      where: { reportId },
      select: { reporterId: true },
    });

    if (!report) {
      throw AppError.badRequest(ErrorCode.InternalError, "举报记录不存在");
    }

    await prisma.report.update({
      where: { reportId },
      data: {
        status,
        handlerId: BigInt(req.userId!),
        handleResult: handleResult ?? null,
        handleTime: new Date(),
      },
    });

    // 通知举报人处理结果
    const isResolved = status === 2; // 2=已解决
    await notifyReportResult(report.reporterId, reportId, isResolved, handleResult);

    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
});

// ── Notice management ──
router.get("/notices", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 20);
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;

    const where: { status?: number } = {};
    if (status !== undefined) where.status = status;

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
        status: n.status,
        isTop: n.isTop === 1,
        startTime: n.startTime?.toISOString() ?? null,
        endTime: n.endTime?.toISOString() ?? null,
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

router.post("/notices", async (req, res, next) => {
  try {
    const { title, content, type, isTop } = req.body as {
      title: string;
      content: string;
      type?: number;
      isTop?: boolean;
    };

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        type: type ?? 0,
        status: 1,
        isTop: isTop ? 1 : 0,
        operatorId: BigInt(req.userId!),
      },
    });

    success(res, { noticeId: notice.noticeId.toString() }, req.traceId);
  } catch (error) {
    next(error);
  }
});

router.put("/notices/:id", async (req, res, next) => {
  try {
    const noticeId = BigInt(req.params.id!);
    const { title, content, status, isTop } = req.body as {
      title?: string;
      content?: string;
      status?: number;
      isTop?: boolean;
    };

    await prisma.notice.update({
      where: { noticeId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(isTop !== undefined ? { isTop: isTop ? 1 : 0 } : {}),
      },
    });

    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
});

router.delete("/notices/:id", async (req, res, next) => {
  try {
    const noticeId = BigInt(req.params.id!);
    await prisma.notice.delete({ where: { noticeId } });
    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
});

// ── Sensitive words ──
router.get("/sensitive-words", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 50);
    const keyword = req.query.keyword as string | undefined;
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;

    const where: { word?: { contains: string }; status?: number } = {};
    if (keyword) where.word = { contains: keyword };
    if (status !== undefined) where.status = status;

    const [list, total] = await Promise.all([
      prisma.sensitiveWord.findMany({
        where,
        orderBy: { createTime: "desc" },
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.sensitiveWord.count({ where }),
    ]);

    success(res, {
      list: list.map((w) => ({
        wordId: w.wordId.toString(),
        word: w.word,
        level: w.level,
        category: w.category,
        status: w.status,
        createTime: w.createTime.toISOString(),
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

router.post("/sensitive-words", async (req, res, next) => {
  try {
    const { word, level, category } = req.body as { word: string; level?: number; category?: string };

    const existing = await prisma.sensitiveWord.findUnique({ where: { word } });
    if (existing) {
      throw AppError.badRequest(ErrorCode.InternalError, "敏感词已存在");
    }

    const record = await prisma.sensitiveWord.create({
      data: { word, level: level ?? 1, category: category ?? null, operatorId: BigInt(req.userId!) },
    });

    // 添加敏感词后刷新缓存
    refreshCache();

    success(res, { wordId: record.wordId.toString() }, req.traceId);
  } catch (error) {
    next(error);
  }
});

router.delete("/sensitive-words/:id", async (req, res, next) => {
  try {
    const wordId = BigInt(req.params.id!);
    await prisma.sensitiveWord.delete({ where: { wordId } });
    // 删除敏感词后刷新缓存
    refreshCache();
    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
});

// ── Admin logs ──
router.get("/logs", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 20);

    const [list, total] = await Promise.all([
      prisma.adminLog.findMany({
        orderBy: { createTime: "desc" },
        skip: (page - 1) * size,
        take: size,
        include: { admin: { select: { userId: true, nickname: true } } },
      }),
      prisma.adminLog.count(),
    ]);

    success(res, {
      list: list.map((l) => ({
        logId: l.logId.toString(),
        adminId: l.adminId.toString(),
        adminName: l.admin.nickname,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId?.toString() ?? null,
        ip: l.ip,
        createTime: l.createTime.toISOString(),
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

// ── Config management ──
router.get("/configs", async (req, res, next) => {
  try {
    const configs = await prisma.appConfig.findMany({
      orderBy: { configKey: "asc" },
    });

    success(res, configs.map((c) => ({
      configKey: c.configKey,
      configValue: c.configValue,
      valueType: c.valueType,
      description: c.description,
      isPublic: c.isPublic,
      updateTime: c.updateTime.toISOString(),
    })), req.traceId);
  } catch (error) {
    next(error);
  }
});

router.put("/configs/:key", async (req, res, next) => {
  try {
    const key = req.params.key!;
    const { configValue } = req.body as { configValue: string };

    if (configValue === undefined || configValue === null) {
      throw AppError.badRequest(ErrorCode.InternalError, "配置值不能为空");
    }

    await prisma.appConfig.update({
      where: { configKey: key },
      data: { configValue },
    });

    // 如果修改的是敏感词相关配置，刷新缓存
    if (key === "comment_filter_enabled") {
      refreshCache();
    }

    success(res, null, req.traceId);
  } catch (error) {
    next(error);
  }
});

export default router;
