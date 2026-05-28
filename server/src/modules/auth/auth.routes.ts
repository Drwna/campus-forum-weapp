import { Router } from "express";
import * as authController from "./auth.controller.js";

const router = Router();

router.post("/wechat-login", authController.wechatLogin);
router.post("/admin-login", authController.adminLogin);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

export default router;
