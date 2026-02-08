import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import * as notificationsService from "./notifications.service";
import { BadRequestError } from "../../utils/errors";

export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
    const data = await notificationsService.getNotifications(req.user!.id, page, pageSize);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createNotification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, body, type } = req.body;
    if (!title || String(title).trim().length === 0) {
      throw new BadRequestError("title required");
    }
    const item = await notificationsService.createNotification({
      userId: req.user!.id,
      title,
      body,
      type,
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const result = await notificationsService.markRead(req.user!.id, id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
