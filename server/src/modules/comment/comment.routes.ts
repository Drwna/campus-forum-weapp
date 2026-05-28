import { Router } from "express";
import * as commentController from "./comment.controller.js";
import { requireAuth } from "../../middleware/index.js";

const router = Router();

// My comments
router.get("/comments/mine", requireAuth, commentController.getMyList);

// Comments under a post
router.get("/posts/:postId/comments", commentController.getList);
router.post("/posts/:postId/comments", requireAuth, commentController.create);

// Comment replies
router.get("/comments/:id/replies", commentController.getReplies);

// Delete own comment
router.delete("/comments/:id", requireAuth, commentController.remove);

export default router;
