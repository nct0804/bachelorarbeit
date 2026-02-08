import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import * as reviewsService from "./reviews.service";
import { BadRequestError } from "../../utils/errors";

export async function getQueue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const items = await reviewsService.getQueue(req.user!.id, limit);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function createReviewItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { itemType, lessonId, wordId, intervalDays } = req.body;
    if (!itemType) throw new BadRequestError("itemType required");
    if (itemType !== "LESSON" && itemType !== "WORD") {
      throw new BadRequestError("invalid itemType");
    }
    if (itemType === "LESSON" && !lessonId) {
      throw new BadRequestError("lessonId required for LESSON reviews");
    }
    if (itemType === "WORD" && !wordId) {
      throw new BadRequestError("wordId required for WORD reviews");
    }
    if (lessonId && wordId) {
      throw new BadRequestError("provide only lessonId or wordId");
    }
    const item = await reviewsService.createReviewItem({
      userId: req.user!.id,
      itemType,
      lessonId,
      wordId,
      intervalDays,
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function completeReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const quality = req.body.quality ? Number(req.body.quality) : 3;
    const item = await reviewsService.completeReview(req.user!.id, id, quality);
    if (!item) throw new BadRequestError("Review item not found");
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}
