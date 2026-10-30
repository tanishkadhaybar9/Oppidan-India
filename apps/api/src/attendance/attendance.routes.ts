import { Router } from "express";
import { AttendanceController } from "./attendance.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";

const router = Router();

router.use(authenticate);

// Personal Clock Actions
router.post("/clock-in", requirePermission(Permission.ATTENDANCE_CLOCK), AttendanceController.clockIn);
router.post("/clock-out", requirePermission(Permission.ATTENDANCE_CLOCK), AttendanceController.clockOut);
router.get("/me/today", requirePermission(Permission.ATTENDANCE_READ_OWN), AttendanceController.getToday);
router.get("/me/history", requirePermission(Permission.ATTENDANCE_READ_OWN), AttendanceController.getMyHistory);

// Daily Attendance Log (HR/Manager/Owner)
router.get("/daily", requirePermission(Permission.ATTENDANCE_READ_ALL), AttendanceController.getDaily);

// Correction Workflow
router.post("/:id/correction-request", requirePermission(Permission.ATTENDANCE_CORRECTION_REQUEST), AttendanceController.requestCorrection);
router.get("/correction-requests", requirePermission(Permission.ATTENDANCE_CORRECT), AttendanceController.listCorrectionRequests);
router.patch("/correction-requests/:id/review", requirePermission(Permission.ATTENDANCE_CORRECTION_APPROVE), AttendanceController.reviewCorrection);
router.patch("/:id/correct", requirePermission(Permission.ATTENDANCE_CORRECT), AttendanceController.hrDirectCorrection);

// Weekly Reports & CSV Export
router.get("/reports/weekly", requirePermission(Permission.ATTENDANCE_REPORT), AttendanceController.getWeeklyReport);
router.get("/reports/weekly/export", requirePermission(Permission.ATTENDANCE_EXPORT), AttendanceController.exportCsv);

export default router;
