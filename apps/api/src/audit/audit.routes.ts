import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";
import * as auditController from "./audit.controller.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requirePermission(Permission.AUDIT_LOG_READ),
  auditController.listAuditLogs
);

router.get(
  "/stats",
  requirePermission(Permission.AUDIT_LOG_READ),
  auditController.getAuditStats
);

export default router;

