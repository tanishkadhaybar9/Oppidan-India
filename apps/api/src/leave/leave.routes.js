import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";
import * as ctrl from "./leave.controller.js";
const router = Router();
// All routes require authentication
router.use(authenticate);
// ─── Leave Types ──────────────────────────────────────────────────────────────
router.get("/types", requirePermission(Permission.LEAVE_TYPE_READ), ctrl.listLeaveTypes);
router.post("/types", requirePermission(Permission.LEAVE_TYPE_MANAGE), ctrl.createLeaveType);
router.patch("/types/:id", requirePermission(Permission.LEAVE_TYPE_MANAGE), ctrl.updateLeaveType);
// ─── Holidays ─────────────────────────────────────────────────────────────────
router.get("/holidays", requirePermission(Permission.HOLIDAY_READ), ctrl.listHolidays);
router.post("/holidays", requirePermission(Permission.HOLIDAY_MANAGE), ctrl.createHoliday);
router.patch("/holidays/:id", requirePermission(Permission.HOLIDAY_MANAGE), ctrl.updateHoliday);
router.delete("/holidays/:id", requirePermission(Permission.HOLIDAY_MANAGE), ctrl.deleteHoliday);
// ─── Leave Balances ───────────────────────────────────────────────────────────
router.get("/balances/me", requirePermission(Permission.LEAVE_BALANCE_READ_OWN), ctrl.getMyLeaveBalances);
router.get("/balances", requirePermission(Permission.LEAVE_BALANCE_READ_OWN), ctrl.listAllBalances);
router.get("/balances/:employeeId", requirePermission(Permission.LEAVE_BALANCE_READ_ALL), ctrl.getEmployeeLeaveBalances);
router.post("/balances", requirePermission(Permission.LEAVE_BALANCE_MANAGE), ctrl.allocateLeaveBalance);
// ─── Leave Requests ───────────────────────────────────────────────────────────
router.get("/requests/me", requirePermission(Permission.LEAVE_REQUEST_READ_OWN), ctrl.getMyLeaveRequests);
router.post("/requests", requirePermission(Permission.LEAVE_REQUEST_CREATE), ctrl.createLeaveRequest);
router.get("/requests", requirePermission(Permission.LEAVE_REQUEST_READ_OWN), ctrl.listLeaveRequests);
router.get("/requests/:id", requirePermission(Permission.LEAVE_REQUEST_READ_OWN), ctrl.getLeaveRequest);
router.post("/requests/:id/review", requirePermission(Permission.LEAVE_APPROVE_SUPERVISOR), ctrl.reviewLeaveRequest);
router.post("/requests/:id/cancel", requirePermission(Permission.LEAVE_REQUEST_CANCEL_OWN), ctrl.cancelLeaveRequest);
router.patch("/requests/:id/cancel", requirePermission(Permission.LEAVE_REQUEST_CANCEL_OWN), ctrl.cancelLeaveRequest);
// ─── Approval Workflow Endpoints ──────────────────────────────────────────────
router.get("/approvals", requirePermission(Permission.LEAVE_APPROVE_SUPERVISOR), ctrl.getApprovalsQueue);
router.get("/approvals/:id", requirePermission(Permission.LEAVE_APPROVE_SUPERVISOR), ctrl.getLeaveRequest);
router.patch("/approvals/:id/approve", requirePermission(Permission.LEAVE_APPROVE_SUPERVISOR), ctrl.approveLeaveRequest);
router.patch("/approvals/:id/reject", requirePermission(Permission.LEAVE_APPROVE_SUPERVISOR), ctrl.rejectLeaveRequest);
// ─── Notifications ────────────────────────────────────────────────────────────
router.get("/notifications", requirePermission(Permission.NOTIFICATION_READ), ctrl.listNotifications);
router.get("/notifications/unread-count", requirePermission(Permission.NOTIFICATION_READ), ctrl.getUnreadCount);
router.patch("/notifications/:id/read", requirePermission(Permission.NOTIFICATION_READ), ctrl.markNotificationRead);
router.patch("/notifications/mark-all-read", requirePermission(Permission.NOTIFICATION_READ), ctrl.markAllNotificationsRead);
export default router;
//# sourceMappingURL=leave.routes.js.map