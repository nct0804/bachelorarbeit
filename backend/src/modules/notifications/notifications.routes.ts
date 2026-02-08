import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as notificationsController from "./notifications.controller";

const router = Router();

router.get("/", authenticate, notificationsController.getNotifications);
router.post("/", authenticate, notificationsController.createNotification);
router.patch("/:id/read", authenticate, notificationsController.markRead);

export default router;
