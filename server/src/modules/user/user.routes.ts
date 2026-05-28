import { Router } from "express";
import * as userController from "./user.controller.js";
import { requireAuth } from "../../middleware/index.js";

const router = Router();

router.get("/me", requireAuth, userController.getMe);
router.put("/me", requireAuth, userController.updateMe);
router.get("/:id", userController.getUserById);

export default router;
