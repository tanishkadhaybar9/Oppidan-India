import type { Request, Response, NextFunction } from "express";
import * as svc from "./leave.service.js";
import { prisma } from "../lib/prisma.js";
import { resolveEmployeeForUser } from "../utils/resolveEmployee.js";
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  createHolidaySchema,
  updateHolidaySchema,
  allocateBalanceSchema,
  createLeaveRequestSchema,
  reviewLeaveRequestSchema,
  cancelLeaveRequestSchema,
} from "./leave.validation.js";

function paramStr(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
}

// ─── Leave Types ──────────────────────────────────────────────────────────────

export async function listLeaveTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const data = await svc.listLeaveTypes(req.user!.companyId, includeInactive);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function createLeaveType(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createLeaveTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await svc.createLeaveType(req.user!.companyId, parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
}

export async function updateLeaveType(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramStr(req.params.id);
    const parsed = updateLeaveTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await svc.updateLeaveType(req.user!.companyId, id, parsed.data);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

// ─── Holidays ─────────────────────────────────────────────────────────────────

export async function listHolidays(req: Request, res: Response, next: NextFunction) {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const data = await svc.listHolidays(req.user!.companyId, year);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function createHoliday(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createHolidaySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await svc.createHoliday(req.user!.companyId, req.user!.id, parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
}

export async function updateHoliday(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramStr(req.params.id);
    const parsed = updateHolidaySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const data = await svc.updateHoliday(req.user!.companyId, id, parsed.data);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function deleteHoliday(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramStr(req.params.id);
    await svc.deleteHoliday(req.user!.companyId, id);
    res.json({ success: true, message: "Holiday deleted successfully" });
  } catch (e) { next(e); }
}

// ─── Leave Balances ───────────────────────────────────────────────────────────

export async function allocateLeaveBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = allocateBalanceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const { periodStart, periodEnd, ...rest } = parsed.data;
    const data = await svc.allocateLeaveBalance(req.user!.companyId, {
      ...rest,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
    });
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
}

export async function getMyLeaveBalances(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const employee = await resolveEmployeeForUser(user.companyId, user.id, user);
    const data = await svc.listLeaveBalances(user.companyId, employee.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function getEmployeeLeaveBalances(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const targetEmployeeId = paramStr(req.params.employeeId);

    // Permission and scope checks
    if (user.role === "EMPLOYEE") {
      const myEmp = await resolveEmployeeForUser(user.companyId, user.id, user);
      if (!myEmp || myEmp.id !== targetEmployeeId) {
        res.status(403).json({ success: false, message: "Forbidden: You can only view your own leave balances" });
        return;
      }
    } else if (user.role === "SUPERVISOR") {
      const myEmp = await resolveEmployeeForUser(user.companyId, user.id, user);
      if (myEmp && myEmp.id !== targetEmployeeId) {
        const targetEmp = await prisma.employee.findFirst({
          where: { id: targetEmployeeId, companyId: user.companyId },
          select: { supervisorId: true },
        });
        if (!targetEmp || targetEmp.supervisorId !== myEmp.id) {
          res.status(403).json({ success: false, message: "Forbidden: You can only view balances for your assigned subordinates" });
          return;
        }
      }
    } else if (user.role === "MANAGER") {
      const myEmp = await resolveEmployeeForUser(user.companyId, user.id, user);
      if (myEmp && myEmp.id !== targetEmployeeId) {
        const targetEmp = await prisma.employee.findFirst({
          where: { id: targetEmployeeId, companyId: user.companyId },
          select: { departmentId: true },
        });
        if (!targetEmp || targetEmp.departmentId !== myEmp.departmentId) {
          res.status(403).json({ success: false, message: "Forbidden: You can only view balances within your authorized department" });
          return;
        }
      }
    }

    const data = await svc.listLeaveBalances(user.companyId, targetEmployeeId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function listAllBalances(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { departmentId, leaveTypeId } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { companyId: user.companyId };
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;

    if (user.role === "EMPLOYEE") {
      const myEmp = await resolveEmployeeForUser(user.companyId, user.id, user);
      where.employeeId = myEmp?.id || "none";
    } else if (user.role === "SUPERVISOR") {
      const myEmp = await resolveEmployeeForUser(user.companyId, user.id, user);
      const subEmps = await prisma.employee.findMany({
        where: { companyId: user.companyId, supervisorId: myEmp?.id },
        select: { id: true },
      });
      const allowedIds = [myEmp?.id || "", ...subEmps.map((s) => s.id)].filter(Boolean);
      where.employeeId = { in: allowedIds };
    } else if (user.role === "MANAGER") {
      const myEmp = await resolveEmployeeForUser(user.companyId, user.id, user);
      where.employee = { departmentId: myEmp?.departmentId || departmentId || "none" };
    } else if (departmentId) {
      where.employee = { departmentId };
    }

    const balances = await prisma.leaveBalance.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, employeeCode: true, department: { select: { id: true, name: true } } } },
        leaveType: { select: { id: true, name: true, code: true, paid: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: balances });
  } catch (e) { next(e); }
}

// ─── Leave Requests ───────────────────────────────────────────────────────────

export async function createLeaveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createLeaveRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const user = req.user!;
    const employee = await resolveEmployeeForUser(user.companyId, user.id, user);
    const data = await svc.createLeaveRequest(user.companyId, employee.id, user.id, parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
}

export async function getMyLeaveRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const emp = await resolveEmployeeForUser(user.companyId, user.id, user);
    const { status, startDate, endDate, leaveTypeId, page = "1", limit = "20" } = req.query as Record<string, string>;
    const data = await svc.listLeaveRequests(user.companyId, {
      employeeId: emp.id,
      status,
      startDate,
      endDate,
      leaveTypeId,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.json({ success: true, ...data });
  } catch (e) { next(e); }
}

export async function listLeaveRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { status, currentStage, startDate, endDate, leaveTypeId, departmentId, page = "1", limit = "20" } = req.query as Record<string, string>;

    let employeeId: string | undefined;
    let employeeIds: string[] | undefined;
    let deptIdFilter = departmentId;

    if (user.role === "EMPLOYEE") {
      const emp = await resolveEmployeeForUser(user.companyId, user.id, user);
      employeeId = emp?.id || "none";
    } else if (user.role === "SUPERVISOR") {
      const myEmp = await resolveEmployeeForUser(user.companyId, user.id, user);
      const subEmps = await prisma.employee.findMany({
        where: { companyId: user.companyId, supervisorId: myEmp?.id },
        select: { id: true },
      });
      employeeIds = [myEmp?.id || "", ...subEmps.map((s) => s.id)].filter(Boolean);
    } else if (user.role === "MANAGER") {
      const myEmp = await resolveEmployeeForUser(user.companyId, user.id, user);
      deptIdFilter = myEmp?.departmentId || "none";
    }

    const data = await svc.listLeaveRequests(user.companyId, {
      employeeId,
      employeeIds,
      departmentId: deptIdFilter,
      status,
      currentStage,
      startDate,
      endDate,
      leaveTypeId,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.json({ success: true, ...data });
  } catch (e) { next(e); }
}

export async function getLeaveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const requestId = paramStr(req.params.id);
    const data = await svc.getLeaveRequest(user.companyId, requestId);

    // Enforce role-based access to the individual leave record
    if (user.role === "EMPLOYEE") {
      const myEmp = await resolveEmployeeForUser(user.companyId, user.id, user);
      if (!myEmp || data.employee.id !== myEmp.id) {
        res.status(403).json({ success: false, message: "Forbidden: You are not authorized to view another employee's leave request" });
        return;
      }
    } else if (user.role === "SUPERVISOR") {
      const myEmp = await resolveEmployeeForUser(user.companyId, user.id, user);
      if (myEmp && data.employee.id !== myEmp.id && data.employee.supervisorId !== myEmp.id) {
        res.status(403).json({ success: false, message: "Forbidden: You are not authorized to view this leave request" });
        return;
      }
    } else if (user.role === "MANAGER") {
      const myEmp = await resolveEmployeeForUser(user.companyId, user.id, user);
      if (myEmp && data.employee.id !== myEmp.id && data.employee.departmentId !== myEmp.departmentId) {
        res.status(403).json({ success: false, message: "Forbidden: You are not authorized to view leave requests from other departments" });
        return;
      }
    }

    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function getApprovalsQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    let currentStage: string | undefined;
    let employeeIds: string[] | undefined;
    let departmentId: string | undefined;

    if (user.role === "SUPERVISOR") {
      currentStage = "SUPERVISOR";
      const myEmp = await resolveEmployeeForUser(user.companyId, user.id, user);
      const subEmps = await prisma.employee.findMany({
        where: { companyId: user.companyId, supervisorId: myEmp?.id },
        select: { id: true },
      });
      employeeIds = subEmps.map((s) => s.id);
    } else if (user.role === "MANAGER") {
      currentStage = "MANAGER";
      const myEmp = await resolveEmployeeForUser(user.companyId, user.id, user);
      departmentId = myEmp?.departmentId || undefined;
    } else if (user.role === "HR" || user.role === "OWNER") {
      // HR / OWNER can see pending requests
      currentStage = undefined;
    } else {
      res.status(403).json({ success: false, message: "Forbidden: You do not have approval permissions" });
      return;
    }

    const { status, page = "1", limit = "50" } = req.query as Record<string, string>;
    const data = await svc.listLeaveRequests(user.companyId, {
      status: status || undefined,
      currentStage,
      employeeIds,
      departmentId,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({ success: true, ...data });
  } catch (e) { next(e); }
}

export async function approveLeaveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const requestId = paramStr(req.params.id);
    const data = await svc.reviewLeaveRequest(
      user.companyId,
      requestId,
      user.id,
      user.role,
      "APPROVE",
      req.body.comments
    );
    res.json({ success: true, message: "Leave request approved successfully", data });
  } catch (e) { next(e); }
}

export async function rejectLeaveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const requestId = paramStr(req.params.id);
    const rejectionReason = req.body.rejectionReason || req.body.reason;
    if (!rejectionReason) {
      res.status(400).json({ success: false, message: "Rejection reason is required" });
      return;
    }
    const data = await svc.reviewLeaveRequest(
      user.companyId,
      requestId,
      user.id,
      user.role,
      "REJECT",
      req.body.comments,
      rejectionReason
    );
    res.json({ success: true, message: "Leave request rejected", data });
  } catch (e) { next(e); }
}

export async function reviewLeaveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = reviewLeaveRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const user = req.user!;
    const requestId = paramStr(req.params.id);
    const data = await svc.reviewLeaveRequest(
      user.companyId,
      requestId,
      user.id,
      user.role,
      parsed.data.action,
      parsed.data.comments,
      parsed.data.rejectionReason
    );
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function cancelLeaveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = cancelLeaveRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const user = req.user!;
    const employee = await prisma.employee.findFirst({
      where: { userId: user.id, companyId: user.companyId },
      select: { id: true },
    });
    const requestId = paramStr(req.params.id);
    const data = await svc.cancelLeaveRequest(
      user.companyId,
      requestId,
      employee?.id ?? "",
      user.id,
      user.role,
      parsed.data.cancellationReason
    );
    res.json({ success: true, ...data });
  } catch (e) { next(e); }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const unreadOnly = req.query.unreadOnly === "true";
    const data = await svc.listNotifications(req.user!.companyId, req.user!.id, unreadOnly);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await svc.getUnreadNotificationCount(req.user!.companyId, req.user!.id);
    res.json({ success: true, count });
  } catch (e) { next(e); }
}

export async function markNotificationRead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramStr(req.params.id);
    const data = await svc.markNotificationRead(req.user!.companyId, req.user!.id, id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.markAllNotificationsRead(req.user!.companyId, req.user!.id);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (e) { next(e); }
}
