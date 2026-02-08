import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as reviewsController from "./reviews.controller";

const router = Router();

router.get("/queue", authenticate, reviewsController.getQueue);
router.post("/", authenticate, reviewsController.createReviewItem);
router.post("/:id/complete", authenticate, reviewsController.completeReview);

export default router;
