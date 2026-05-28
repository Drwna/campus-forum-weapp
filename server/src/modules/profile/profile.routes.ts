import { Router } from "express";
import * as profileController from "./profile.controller.js";
import { requireAuth } from "../../middleware/index.js";

const router = Router();

// 用户提交资料变更
router.post("/submit", requireAuth, profileController.submitReview);

// 用户查看自己的审核状态
router.get("/mine", requireAuth, profileController.getMyReview);

export default router;
