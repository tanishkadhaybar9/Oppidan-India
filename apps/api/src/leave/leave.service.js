import { prisma } from "../lib/prisma.js";
import { calculateLeaveDays, getAvailableBalance, checkLeaveOverlap, } from "./leaveCalculation.service.js";
// ─── Notification helpers ─────────────────────────────────────────────────────
async function createNotification(companyId, userId, title, message, type = "LEAVE_STATUS", link) {
    await prisma.notification.create({
        data: { companyId, userId, title, message, type, link },
    });
}
// ─── Leave Types ──────────────────────────────────────────────────────────────
export async function listLeaveTypes(companyId, includeInactive = false) {
    return prisma.leaveType.findMany({
        where: {
            companyId,
            ...(includeInactive ? {} : { status: "ACTIVE" }),
        },
        orderBy: { name: "asc" },
    });
}
export async function getLeaveType(companyId, leaveTypeId) {
    const lt = await prisma.leaveType.findFirst({
        where: { id: leaveTypeId, companyId },
    });
    if (!lt)
        throw { status: 404, message: "Leave type not found" };
    return lt;
}
export async function createLeaveType(companyId, data) {
    const existing = await prisma.leaveType.findFirst({
        where: { companyId, code: data.code.toUpperCase() },
    });
    if (existing)
        throw { status: 409, message: `Leave type code "${data.code}" already exists` };
    return prisma.leaveType.create({
        data: { ...data, code: data.code.toUpperCase(), companyId },
    });
}
export async function updateLeaveType(companyId, leaveTypeId, data) {
    const lt = await prisma.leaveType.findFirst({ where: { id: leaveTypeId, companyId } });
    if (!lt)
        throw { status: 404, message: "Leave type not found" };
    if (data.code) {
        const conflict = await prisma.leaveType.findFirst({
            where: { companyId, code: data.code.toUpperCase(), NOT: { id: leaveTypeId } },
        });
        if (conflict)
            throw { status: 409, message: `Leave type code "${data.code}" already exists` };
        data.code = data.code.toUpperCase();
    }
    return prisma.leaveType.update({ where: { id: leaveTypeId }, data });
}
// ─── Holiday Calendar ─────────────────────────────────────────────────────────
export async function listHolidays(companyId, year) {
    const where = { companyId };
    if (year) {
        where.date = { gte: `${year}-01-01`, lte: `${year}-12-31` };
    }
    return prisma.holiday.findMany({ where, orderBy: { date: "asc" } });
}
export async function createHoliday(companyId, createdById, data) {
    const existing = await prisma.holiday.findFirst({ where: { companyId, date: data.date } });
    if (existing)
        throw { status: 409, message: `A holiday already exists on ${data.date}` };
    return prisma.holiday.create({ data: { ...data, companyId, createdById } });
}
export async function updateHoliday(companyId, holidayId, data) {
    const h = await prisma.holiday.findFirst({ where: { id: holidayId, companyId } });
    if (!h)
        throw { status: 404, message: "Holiday not found" };
    if (data.date && data.date !== h.date) {
        const conflict = await prisma.holiday.findFirst({
            where: { companyId, date: data.date, NOT: { id: holidayId } },
        });
        if (conflict)
            throw { status: 409, message: `A holiday already exists on ${data.date}` };
    }
    return prisma.holiday.update({ where: { id: holidayId }, data });
}
export async function deleteHoliday(companyId, holidayId) {
    const h = await prisma.holiday.findFirst({ where: { id: holidayId, companyId } });
    if (!h)
        throw { status: 404, message: "Holiday not found" };
    await prisma.holiday.delete({ where: { id: holidayId } });
}
// ─── Leave Balances ───────────────────────────────────────────────────────────
export async function allocateLeaveBalance(companyId, data) {
    const periodStart = data.periodStart instanceof Date
        ? data.periodStart
        : new Date(data.periodStart);
    const periodEnd = data.periodEnd instanceof Date
        ? data.periodEnd
        : new Date(data.periodEnd);
    return prisma.leaveBalance.upsert({
        where: {
            companyId_employeeId_leaveTypeId_periodStart: {
                companyId, employeeId: data.employeeId,
                leaveTypeId: data.leaveTypeId, periodStart,
            },
        },
        update: {
            allocatedDays: data.allocatedDays,
            carriedForwardDays: data.carriedForwardDays ?? 0,
            adjustedDays: data.adjustedDays ?? 0,
            periodEnd,
        },
        create: {
            companyId,
            employeeId: data.employeeId,
            leaveTypeId: data.leaveTypeId,
            periodStart,
            periodEnd,
            allocatedDays: data.allocatedDays,
            carriedForwardDays: data.carriedForwardDays ?? 0,
            adjustedDays: data.adjustedDays ?? 0,
        },
    });
}
export async function listLeaveBalances(companyId, employeeId, periodStart) {
    const ref = periodStart ?? new Date();
    return prisma.leaveBalance.findMany({
        where: {
            companyId,
            employeeId,
            periodStart: { lte: ref },
            periodEnd: { gte: ref },
        },
        include: { leaveType: { select: { name: true, code: true, paid: true } } },
    });
}
// ─── Leave Requests ───────────────────────────────────────────────────────────
export async function createLeaveRequest(companyId, employeeId, userId, data) {
    // 1. Validate leave type
    const leaveType = await prisma.leaveType.findFirst({
        where: { id: data.leaveTypeId, companyId, status: "ACTIVE" },
    });
    if (!leaveType)
        throw { status: 404, message: "Leave type not found or inactive" };
    // 2. Validate date ordering
    if (data.startDate > data.endDate) {
        throw { status: 400, message: "Start date must not be after end date" };
    }
    // 3. Check minimum notice
    const today = new Date().toISOString().split("T")[0];
    const startDt = new Date(data.startDate + "T00:00:00");
    const todayDt = new Date(today + "T00:00:00");
    const noticeDays = Math.floor((startDt.getTime() - todayDt.getTime()) / (1000 * 60 * 60 * 24));
    if (noticeDays < leaveType.minimumNoticeDays) {
        throw {
            status: 400,
            message: `Leave type "${leaveType.name}" requires at least ${leaveType.minimumNoticeDays} day(s) advance notice`,
        };
    }
    // 4. Check half-day eligibility
    if ((data.startHalfDay || data.endHalfDay) && !leaveType.allowHalfDay) {
        throw { status: 400, message: `Leave type "${leaveType.name}" does not allow half-day requests` };
    }
    // 5. Calculate working days
    const days = await calculateLeaveDays(companyId, data.startDate, data.endDate, data.startHalfDay, data.endHalfDay);
    if (days <= 0) {
        throw { status: 400, message: "Leave request covers no working days (all are weekends/holidays)" };
    }
    // 6. Check for overlaps
    const overlaps = await checkLeaveOverlap(companyId, employeeId, data.startDate, data.endDate);
    if (overlaps.length > 0) {
        throw { status: 409, message: "Leave request overlaps with an existing active leave request" };
    }
    // 7. Check balance (if not allowing negative)
    if (!leaveType.allowNegativeBalance && leaveType.requiresApproval) {
        const balance = await getAvailableBalance(companyId, employeeId, data.leaveTypeId, data.startDate);
        if (!balance) {
            throw {
                status: 400,
                message: `No leave balance found for "${leaveType.name}" in the relevant period. Please contact HR.`,
            };
        }
        if (balance.remainingBalance < days) {
            throw {
                status: 400,
                message: `Insufficient leave balance. Requested: ${days} day(s), Available: ${balance.remainingBalance} day(s)`,
            };
        }
    }
    // 8. Determine initial stage — if no supervisor, go straight to PENDING_HR
    const employee = await prisma.employee.findFirst({
        where: { id: employeeId, companyId },
        select: { supervisorId: true },
    });
    const initialStatus = employee?.supervisorId ? "PENDING_SUPERVISOR" : "PENDING_HR";
    const initialStage = employee?.supervisorId ? "SUPERVISOR" : "HR";
    // 9. Create request + reserve pending balance
    const [leaveRequest] = await prisma.$transaction(async (tx) => {
        const req = await tx.leaveRequest.create({
            data: {
                companyId,
                employeeId,
                leaveTypeId: data.leaveTypeId,
                startDate: data.startDate,
                endDate: data.endDate,
                startHalfDay: data.startHalfDay ?? false,
                endHalfDay: data.endHalfDay ?? false,
                days,
                reason: data.reason,
                status: initialStatus,
                currentStage: initialStage,
            },
            include: { leaveType: true },
        });
        // Approval history: SUBMITTED
        await tx.leaveApprovalHistory.create({
            data: {
                companyId,
                leaveRequestId: req.id,
                action: "SUBMITTED",
                previousStatus: null,
                newStatus: initialStatus,
                actorId: userId,
                actorRole: "EMPLOYEE",
                comments: data.reason,
            },
        });
        // Reserve pending days in balance
        if (!leaveType.allowNegativeBalance) {
            await tx.leaveBalance.updateMany({
                where: {
                    companyId,
                    employeeId,
                    leaveTypeId: data.leaveTypeId,
                    periodStart: { lte: new Date(data.startDate) },
                    periodEnd: { gte: new Date(data.startDate) },
                },
                data: { pendingDays: { increment: days } },
            });
        }
        return [req];
    });
    // 10. Notify supervisor if exists
    if (employee?.supervisorId) {
        const sup = await prisma.employee.findFirst({
            where: { id: employee.supervisorId, companyId },
            select: { userId: true, name: true },
        });
        if (sup?.userId) {
            await createNotification(companyId, sup.userId, "New Leave Request", `An employee has submitted a leave request requiring your approval.`, "LEAVE_REQUEST", `/leave/approvals`);
        }
    }
    return leaveRequest;
}
export async function listLeaveRequests(companyId, filters) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const where = { companyId };
    if (filters.employeeId) {
        where.employeeId = filters.employeeId;
    }
    else if (filters.employeeIds && filters.employeeIds.length > 0) {
        where.employeeId = { in: filters.employeeIds };
    }
    if (filters.status)
        where.status = filters.status;
    if (filters.currentStage)
        where.currentStage = filters.currentStage;
    if (filters.leaveTypeId)
        where.leaveTypeId = filters.leaveTypeId;
    if (filters.startDate || filters.endDate) {
        where.startDate = {};
        if (filters.startDate)
            where.startDate.gte = filters.startDate;
        if (filters.endDate)
            where.startDate.lte = filters.endDate;
    }
    if (filters.departmentId) {
        where.employee = { departmentId: filters.departmentId };
    }
    const [total, requests] = await prisma.$transaction([
        prisma.leaveRequest.count({ where }),
        prisma.leaveRequest.findMany({
            where,
            include: {
                employee: { select: { id: true, name: true, employeeCode: true, departmentId: true, supervisorId: true } },
                leaveType: { select: { id: true, name: true, code: true, paid: true } },
                approvalHistory: { orderBy: { createdAt: "asc" } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
    ]);
    return { requests, total, page, totalPages: Math.ceil(total / limit) };
}
export async function getLeaveRequest(companyId, requestId) {
    const req = await prisma.leaveRequest.findFirst({
        where: { id: requestId, companyId },
        include: {
            employee: { select: { id: true, name: true, employeeCode: true, departmentId: true, supervisorId: true, userId: true } },
            leaveType: { select: { id: true, name: true, code: true, paid: true } },
            approvalHistory: { orderBy: { createdAt: "asc" } },
        },
    });
    if (!req)
        throw { status: 404, message: "Leave request not found" };
    return req;
}
export async function reviewLeaveRequest(companyId, requestId, actorId, actorRole, action, comments, rejectionReason) {
    const req = await prisma.leaveRequest.findFirst({
        where: { id: requestId, companyId },
        include: {
            employee: { select: { id: true, name: true, userId: true, supervisorId: true, departmentId: true } },
            leaveType: true,
        },
    });
    if (!req)
        throw { status: 404, message: "Leave request not found" };
    if (["APPROVED", "REJECTED", "CANCELLED"].includes(req.status)) {
        throw { status: 409, message: `Leave request is already ${req.status.toLowerCase()}` };
    }
    // Find actor employee profile if one exists
    const actorEmployee = await prisma.employee.findFirst({
        where: { userId: actorId, companyId },
        select: { id: true, departmentId: true },
    });
    // 1. Employees cannot approve or reject
    if (actorRole === "EMPLOYEE") {
        throw { status: 403, message: "Employees are not authorized to approve leave requests" };
    }
    // 2. Cannot approve or reject own request
    if (req.employee.userId === actorId || (actorEmployee && actorEmployee.id === req.employee.id)) {
        throw { status: 403, message: "You cannot approve or reject your own leave request" };
    }
    // 3. Supervisor scope & stage checks
    if (actorRole === "SUPERVISOR") {
        if (req.currentStage !== "SUPERVISOR") {
            throw { status: 403, message: "Leave request is not at the supervisor approval stage" };
        }
        if (actorEmployee && req.employee.supervisorId !== actorEmployee.id) {
            throw { status: 403, message: "You can only review leave requests for your assigned subordinates" };
        }
    }
    // 4. Manager scope & stage checks
    if (actorRole === "MANAGER") {
        if (req.currentStage === "HR") {
            throw { status: 403, message: "Managers cannot bypass required HR approval stage" };
        }
        if (actorEmployee && req.employee.departmentId !== actorEmployee.departmentId) {
            throw { status: 403, message: "You can only review leave requests within your department" };
        }
    }
    let newStatus;
    let newStage = req.currentStage;
    let historyAction;
    if (action === "REJECT") {
        if (!rejectionReason)
            throw { status: 400, message: "Rejection reason is required" };
        newStatus = "REJECTED";
        historyAction = "REJECTED";
    }
    else {
        // Determine next state based on current stage and actor role
        if (req.currentStage === "SUPERVISOR") {
            // Check if department manager approval needed
            const deptManager = req.employee.departmentId
                ? await prisma.employee.findFirst({
                    where: {
                        companyId,
                        departmentId: req.employee.departmentId,
                        role: "MANAGER",
                        status: "ACTIVE",
                        NOT: { id: req.employee.supervisorId || "" },
                    },
                })
                : null;
            if (deptManager) {
                newStatus = "PENDING_MANAGER";
                newStage = "MANAGER";
                historyAction = "SUPERVISOR_APPROVED";
            }
            else {
                newStatus = "PENDING_HR";
                newStage = "HR";
                historyAction = "SUPERVISOR_APPROVED";
            }
        }
        else if (req.currentStage === "MANAGER") {
            newStatus = "PENDING_HR";
            newStage = "HR";
            historyAction = "MANAGER_APPROVED";
        }
        else if (req.currentStage === "HR") {
            newStatus = "APPROVED";
            newStage = "COMPLETED";
            historyAction = "HR_APPROVED";
        }
        else {
            throw { status: 400, message: "Invalid leave request stage" };
        }
    }
    await prisma.$transaction(async (tx) => {
        await tx.leaveRequest.update({
            where: { id: requestId },
            data: {
                status: newStatus,
                currentStage: newStage,
                rejectionReason: action === "REJECT" ? rejectionReason : undefined,
            },
        });
        await tx.leaveApprovalHistory.create({
            data: {
                companyId,
                leaveRequestId: requestId,
                action: historyAction,
                previousStatus: req.status,
                newStatus,
                actorId,
                actorRole,
                comments,
            },
        });
        // On final approval: deduct balance, reserve→used
        if (newStatus === "APPROVED") {
            if (!req.leaveType.allowNegativeBalance) {
                await tx.leaveBalance.updateMany({
                    where: {
                        companyId,
                        employeeId: req.employeeId,
                        leaveTypeId: req.leaveTypeId,
                        periodStart: { lte: new Date(req.startDate) },
                        periodEnd: { gte: new Date(req.startDate) },
                    },
                    data: {
                        pendingDays: { decrement: req.days },
                        usedDays: { increment: req.days },
                    },
                });
            }
            // Sync attendance records with ON_LEAVE status
            const cur = new Date(req.startDate + "T00:00:00");
            const end = new Date(req.endDate + "T00:00:00");
            while (cur <= end) {
                const dayOfWeek = cur.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    const dtStr = cur.toISOString().split("T")[0];
                    await tx.attendance.upsert({
                        where: {
                            companyId_employeeId_attendanceDate: {
                                companyId,
                                employeeId: req.employeeId,
                                attendanceDate: dtStr,
                            },
                        },
                        create: {
                            companyId,
                            employeeId: req.employeeId,
                            attendanceDate: dtStr,
                            status: "ON_LEAVE",
                            workedMinutes: 0,
                            lateMinutes: 0,
                            earlyDepartureMinutes: 0,
                            overtimeMinutes: 0,
                        },
                        update: {
                            status: "ON_LEAVE",
                        },
                    });
                }
                cur.setDate(cur.getDate() + 1);
            }
        }
        // On rejection: release pending reservation
        if (newStatus === "REJECTED" && !req.leaveType.allowNegativeBalance) {
            await tx.leaveBalance.updateMany({
                where: {
                    companyId,
                    employeeId: req.employeeId,
                    leaveTypeId: req.leaveTypeId,
                    periodStart: { lte: new Date(req.startDate) },
                    periodEnd: { gte: new Date(req.startDate) },
                },
                data: { pendingDays: { decrement: req.days } },
            });
        }
    });
    // Notify employee
    if (req.employee.userId) {
        const msg = newStatus === "APPROVED"
            ? `Your leave request has been approved.`
            : newStatus === "REJECTED"
                ? `Your leave request has been rejected. Reason: ${rejectionReason}`
                : `Your leave request has been forwarded for further review.`;
        await createNotification(companyId, req.employee.userId, "Leave Request Update", msg, "LEAVE_STATUS", `/leave/my-requests`);
    }
    return prisma.leaveRequest.findFirst({
        where: { id: requestId },
        include: {
            employee: { select: { id: true, name: true, employeeCode: true } },
            leaveType: { select: { id: true, name: true, code: true } },
            approvalHistory: { orderBy: { createdAt: "asc" } },
        },
    });
}
export async function cancelLeaveRequest(companyId, requestId, requestingEmployeeId, actorId, actorRole, cancellationReason) {
    const req = await prisma.leaveRequest.findFirst({
        where: { id: requestId, companyId },
        include: { leaveType: true },
    });
    if (!req)
        throw { status: 404, message: "Leave request not found" };
    // Only the employee (own request) or HR/OWNER can cancel
    if (req.employeeId !== requestingEmployeeId &&
        !["HR", "OWNER"].includes(actorRole)) {
        throw { status: 403, message: "You are not allowed to cancel this leave request" };
    }
    if (req.status === "CANCELLED") {
        throw { status: 409, message: "Leave request is already cancelled" };
    }
    if (req.status === "REJECTED") {
        throw { status: 409, message: "Cannot cancel a rejected leave request" };
    }
    const wasApproved = req.status === "APPROVED";
    await prisma.$transaction(async (tx) => {
        await tx.leaveRequest.update({
            where: { id: requestId },
            data: { status: "CANCELLED", cancellationReason, cancelledAt: new Date() },
        });
        await tx.leaveApprovalHistory.create({
            data: {
                companyId,
                leaveRequestId: requestId,
                action: "CANCELLED",
                previousStatus: req.status,
                newStatus: "CANCELLED",
                actorId,
                actorRole,
                comments: cancellationReason,
            },
        });
        if (!req.leaveType.allowNegativeBalance) {
            if (wasApproved) {
                // Restore used days
                await tx.leaveBalance.updateMany({
                    where: {
                        companyId, employeeId: req.employeeId, leaveTypeId: req.leaveTypeId,
                        periodStart: { lte: new Date(req.startDate) },
                        periodEnd: { gte: new Date(req.startDate) },
                    },
                    data: { usedDays: { decrement: req.days } },
                });
                // Revert any ON_LEAVE attendances that haven't been clocked into
                await tx.attendance.deleteMany({
                    where: {
                        companyId,
                        employeeId: req.employeeId,
                        status: "ON_LEAVE",
                        clockIn: null,
                        attendanceDate: {
                            gte: req.startDate,
                            lte: req.endDate,
                        },
                    },
                });
            }
            else {
                // Release pending reservation
                await tx.leaveBalance.updateMany({
                    where: {
                        companyId, employeeId: req.employeeId, leaveTypeId: req.leaveTypeId,
                        periodStart: { lte: new Date(req.startDate) },
                        periodEnd: { gte: new Date(req.startDate) },
                    },
                    data: { pendingDays: { decrement: req.days } },
                });
            }
        }
    });
    return { message: "Leave request cancelled successfully" };
}
// ─── Notifications ────────────────────────────────────────────────────────────
export async function listNotifications(companyId, userId, unreadOnly = false) {
    return prisma.notification.findMany({
        where: {
            companyId,
            userId,
            ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
}
export async function markNotificationRead(companyId, userId, notificationId) {
    const notif = await prisma.notification.findFirst({
        where: { id: notificationId, companyId, userId },
    });
    if (!notif)
        throw { status: 404, message: "Notification not found" };
    return prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() },
    });
}
export async function markAllNotificationsRead(companyId, userId) {
    return prisma.notification.updateMany({
        where: { companyId, userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
    });
}
export async function getUnreadNotificationCount(companyId, userId) {
    return prisma.notification.count({ where: { companyId, userId, isRead: false } });
}
//# sourceMappingURL=leave.service.js.map