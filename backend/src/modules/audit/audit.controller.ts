import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import * as auditService from "./audit.service";
import { AuditAction } from "@prisma/client";

export async function getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
    const action = req.query.action ? (String(req.query.action) as AuditAction) : undefined;

    const data = await auditService.getAuditLogs(req.user!.id, { page, pageSize, action });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
