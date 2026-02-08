import { Router } from "express";
import * as userController from "./user.controller";
import * as clerkController from "../../social-auth/clerk-user.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { verifyClerkToken } from "../../middleware/clerk.middleware";
import {
  registerValidation,
  loginValidation,
} from "../../middleware/validation";

const router = Router();

router.post("/register", registerValidation, userController.register);
router.post("/login", loginValidation, userController.login);
router.post("/refresh-token", userController.refreshToken);
router.post("/logout", userController.logout);

router.post("/sync-clerk", verifyClerkToken, clerkController.syncClerkUser);

router.get("/me", authenticate, userController.getCurrentUser);
router.get("/leaderboard", userController.getLeaderboard);

export default router;
