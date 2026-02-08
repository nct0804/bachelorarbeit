import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import * as achievementsService from "./achievements.service";
import { BadRequestError } from "../../utils/errors";

export async function getAchievements(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const items = await achievementsService.getAchievements(req.user!.id);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function evaluateAchievements(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { lessonsCompleted, streakDays, xp, minutes } = req.body;
    if (lessonsCompleted === undefined) throw new BadRequestError("lessonsCompleted required");
    const unlocked = await achievementsService.evaluateAchievements(req.user!.id, {
      lessonsCompleted: Number(lessonsCompleted),
      streakDays: Number(streakDays ?? 0),
      xp: Number(xp ?? 0),
      minutes: Number(minutes ?? 0),
    });
    res.json({ success: true, data: { unlocked } });
  } catch (err) {
    next(err);
  }
}
