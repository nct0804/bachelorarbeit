import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as auditController from "./audit.controller";

const router = Router();

router.get("/", authenticate, auditController.getAuditLogs);

export default router;
