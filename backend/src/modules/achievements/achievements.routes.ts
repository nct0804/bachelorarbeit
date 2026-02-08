import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as achievementsController from "./achievements.controller";

const router = Router();

router.get("/", authenticate, achievementsController.getAchievements);
router.post("/evaluate", authenticate, achievementsController.evaluateAchievements);

export default router;
