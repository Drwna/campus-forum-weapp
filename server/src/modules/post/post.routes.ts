import { Router } from "express";
import * as postController from "./post.controller.js";
import { requireAuth } from "../../middleware/index.js";

const router = Router();

// Public / user routes
router.get("/", postController.getList);
router.get("/mine", requireAuth, postController.getMyList);
router.get("/:id", postController.getDetail);
router.post("/", requireAuth, postController.create);
router.put("/:id", requireAuth, postController.update);
router.delete("/:id", requireAuth, postController.remove);

export default router;
