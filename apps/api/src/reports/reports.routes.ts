import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";
import { ReportsController } from "./reports.controller.js";

const router = Router();

// All report routes require authentication
router.use(authenticate);

// ─── Reports Hub Dashboard ──────────────────────────────────────────────────
router.get(
  "/dashboard",
  requirePermission(Permission.REPORTS_DASHBOARD_READ),
  ReportsController.getDashboard
);

// ─── Module-Specific Reports ────────────────────────────────────────────────
router.get(
  "/employees",
  requirePermission(Permission.REPORTS_EMPLOYEE_READ),
  ReportsController.getEmployees
);

router.get(
  "/attendance",
  requirePermission(Permission.REPORTS_ATTENDANCE_READ),
  ReportsController.getAttendance
);

router.get(
  "/leaves",
  requirePermission(Permission.REPORTS_LEAVE_READ),
  ReportsController.getLeaves
);

router.get(
  "/assets",
  requirePermission(Permission.REPORTS_ASSET_READ),
  ReportsController.getAssets
);

router.get(
  "/payroll",
  requirePermission(Permission.REPORTS_PAYROLL_READ),
  ReportsController.getPayroll
);

router.get(
  "/tasks",
  requirePermission(Permission.REPORTS_TASK_READ),
  ReportsController.getTasks
);

export default router;

