import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";
import { PayrollController } from "./payroll.controller.js";

const router = Router();

// All payroll routes require authentication
router.use(authenticate);

// ─── Dashboard & Analytics ──────────────────────────────────────────────────
router.get(
  "/summary",
  requirePermission(Permission.PAYROLL_READ),
  PayrollController.getSummary
);

router.get(
  "/analytics",
  requirePermission(Permission.PAYROLL_READ),
  PayrollController.getAnalytics
);

// ─── Salary Structures ──────────────────────────────────────────────────────
router.get(
  "/salary-structures",
  requirePermission(Permission.SALARY_STRUCTURE_READ),
  PayrollController.listSalaryStructures
);

router.get(
  "/salary-structures/employee/:employeeId",
  requirePermission(Permission.SALARY_STRUCTURE_READ_OWN),
  PayrollController.getSalaryStructureByEmployee
);

router.post(
  "/salary-structures",
  requirePermission(Permission.SALARY_STRUCTURE_MANAGE),
  PayrollController.createSalaryStructure
);

router.patch(
  "/salary-structures/:id",
  requirePermission(Permission.SALARY_STRUCTURE_MANAGE),
  PayrollController.updateSalaryStructure
);

// ─── Payroll Processing Workflows ───────────────────────────────────────────
router.get(
  "/preview",
  requirePermission(Permission.PAYROLL_PROCESS),
  PayrollController.previewPayroll
);

router.post(
  "/process",
  requirePermission(Permission.PAYROLL_PROCESS),
  PayrollController.processPayroll
);

// ─── Employee Self-Service ──────────────────────────────────────────────────
router.get(
  "/my",
  requirePermission(Permission.PAYROLL_READ_OWN),
  PayrollController.getMyPayrolls
);

router.get(
  "/payslips/my",
  requirePermission(Permission.PAYSLIP_READ_OWN),
  PayrollController.getMyPayslips
);

// ─── Payroll History & Records ──────────────────────────────────────────────
router.get(
  "/",
  requirePermission(Permission.PAYROLL_READ),
  PayrollController.listPayrolls
);

router.get(
  "/:id",
  requirePermission(Permission.PAYROLL_READ_OWN),
  PayrollController.getById
);

router.patch(
  "/:id/status",
  requirePermission(Permission.PAYROLL_MANAGE),
  PayrollController.updateStatus
);

export default router;

