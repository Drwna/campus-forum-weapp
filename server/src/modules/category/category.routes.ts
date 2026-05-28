import { Router } from "express";
import { prisma } from "../../infra/prisma/client.js";
import { success } from "../../utils/index.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { status: 0 },
      orderBy: { sortOrder: "asc" },
      select: {
        categoryId: true,
        categoryName: true,
        categoryDesc: true,
        sortOrder: true,
        status: true,
        allowUserPost: true,
      },
    });

    const data = categories.map((c) => ({
      categoryId: c.categoryId.toString(),
      categoryName: c.categoryName,
      categoryDesc: c.categoryDesc,
      sortOrder: c.sortOrder,
      status: c.status,
      allowUserPost: c.allowUserPost,
    }));

    success(res, data, req.traceId);
  } catch (error) {
    next(error);
  }
});

export default router;
