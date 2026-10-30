import prisma from "../lib/prisma.js";
import { AttendanceStatus, CorrectionStatus, EmploymentStatus } from "../generated/prisma/client.js";
import { AttendanceCalculationService } from "./attendanceCalculation.service.js";
export class AttendanceService {
    /**
     * Helper: Resolve Employee profile linked to a User.
     */
    static async resolveEmployeeForUser(companyId, userId) {
        const user = await prisma.user.findFirst({
            where: { id: userId, companyId },
            include: { employee: true },
        });
        if (!user) {
            const err = new Error("User account not found.");
            err.statusCode = 404;
            err.code = "NOT_FOUND";
            throw err;
        }
        if (user.employee) {
            return user.employee;
        }
        // Fallback: match by email within same company
        const employee = await prisma.employee.findFirst({
            where: { email: user.email, companyId },
        });
        if (!employee) {
            const err = new Error("No employee profile found linked to this user account.");
            err.statusCode = 404;
            err.code = "NOT_FOUND";
            throw err;
        }
        return employee;
    }
    /**
     * Helper: Get company attendance settings or default.
     */
    static async getCompanySettings(companyId) {
        const setting = await prisma.companyAttendanceSetting.findUnique({
            where: { companyId },
        });
        return (setting || {
            timezone: "Asia/Kolkata",
            gracePeriodMinutes: 10,
            defaultBreakMinutes: 60,
            isBreakPaid: false,
            workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
            weeklyOvertimeThresholdHours: 40.0,
            halfDayThresholdMinutes: 240,
            fullDayThresholdMinutes: 480,
        });
    }
    /**
     * Clock-In with duplicate prevention and shift late calculation.
     */
    static async clockIn(companyId, userId, notes) {
        const employee = await this.resolveEmployeeForUser(companyId, userId);
        if (employee.status !== EmploymentStatus.ACTIVE) {
            const err = new Error("Inactive employee cannot clock in.");
            err.statusCode = 409;
            err.code = "CONFLICT";
            throw err;
        }
        const settings = await this.getCompanySettings(companyId);
        const now = new Date();
        const localDateStr = AttendanceCalculationService.getLocalDateString(now, settings.timezone);
        // 1. Check if an active open attendance already exists for this employee
        const openRecord = await prisma.attendance.findFirst({
            where: {
                companyId,
                employeeId: employee.id,
                clockIn: { not: null },
                clockOut: null,
            },
        });
        if (openRecord) {
            const err = new Error("An active attendance session is already open. Please clock out first.");
            err.statusCode = 409;
            err.code = "CONFLICT";
            throw err;
        }
        // 2. Check if attendance for today already has a closed clockIn
        const existingToday = await prisma.attendance.findUnique({
            where: {
                companyId_employeeId_attendanceDate: {
                    companyId,
                    employeeId: employee.id,
                    attendanceDate: localDateStr,
                },
            },
        });
        if (existingToday && existingToday.clockIn) {
            const err = new Error("Duplicate clock-in: Attendance for today has already been recorded.");
            err.statusCode = 409;
            err.code = "CONFLICT";
            throw err;
        }
        // 3. Resolve active shift assignment for today
        const assignment = await prisma.shiftAssignment.findFirst({
            where: {
                companyId,
                employeeId: employee.id,
                effectiveFrom: { lte: now },
                OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
            },
            include: { shift: true },
            orderBy: { effectiveFrom: "desc" },
        });
        const shift = assignment?.shift;
        const initialCalc = AttendanceCalculationService.calculateAttendance(now, null, shift ?? undefined, settings);
        // 4. Create Attendance record and Audit log inside transaction
        const attendance = await prisma.$transaction(async (tx) => {
            const created = await tx.attendance.upsert({
                where: {
                    companyId_employeeId_attendanceDate: {
                        companyId,
                        employeeId: employee.id,
                        attendanceDate: localDateStr,
                    },
                },
                create: {
                    companyId,
                    employeeId: employee.id,
                    shiftId: shift?.id ?? null,
                    shiftAssignmentId: assignment?.id ?? null,
                    attendanceDate: localDateStr,
                    clockIn: now,
                    status: initialCalc.status,
                    lateMinutes: initialCalc.lateMinutes,
                },
                update: {
                    clockIn: now,
                    status: initialCalc.status,
                    lateMinutes: initialCalc.lateMinutes,
                },
                include: {
                    shift: true,
                    employee: {
                        select: { id: true, name: true, employeeCode: true },
                    },
                },
            });
            await tx.attendanceAudit.create({
                data: {
                    companyId,
                    employeeId: employee.id,
                    attendanceId: created.id,
                    action: "CLOCK_IN",
                    newValues: { clockIn: now.toISOString(), status: initialCalc.status, notes },
                    changedById: userId,
                    reason: notes ?? "Employee clock-in",
                },
            });
            return created;
        });
        return attendance;
    }
    /**
     * Clock-Out with worked hours, break, and overtime calculation.
     */
    static async clockOut(companyId, userId, notes) {
        const employee = await this.resolveEmployeeForUser(companyId, userId);
        const settings = await this.getCompanySettings(companyId);
        const now = new Date();
        // Find the latest open attendance record where clockIn != null and clockOut == null
        const attendance = await prisma.attendance.findFirst({
            where: {
                companyId,
                employeeId: employee.id,
                clockIn: { not: null },
                clockOut: null,
            },
            include: { shift: true },
            orderBy: { clockIn: "desc" },
        });
        if (!attendance || !attendance.clockIn) {
            const err = new Error("No active clock-in session found to clock out from.");
            err.statusCode = 404;
            err.code = "NOT_FOUND";
            throw err;
        }
        // Run Calculations
        const calc = AttendanceCalculationService.calculateAttendance(attendance.clockIn, now, attendance.shift ?? undefined, settings);
        // Update Attendance and write audit log inside transaction
        const updated = await prisma.$transaction(async (tx) => {
            const saved = await tx.attendance.update({
                where: { id: attendance.id },
                data: {
                    clockOut: now,
                    status: calc.status,
                    lateMinutes: calc.lateMinutes,
                    earlyDepartureMinutes: calc.earlyDepartureMinutes,
                    workedMinutes: calc.workedMinutes,
                    breakMinutes: calc.breakMinutes,
                    overtimeMinutes: calc.overtimeMinutes,
                },
                include: {
                    shift: true,
                    employee: {
                        select: { id: true, name: true, employeeCode: true },
                    },
                },
            });
            await tx.attendanceAudit.create({
                data: {
                    companyId,
                    employeeId: employee.id,
                    attendanceId: saved.id,
                    action: "CLOCK_OUT",
                    previousValues: { clockIn: attendance.clockIn?.toISOString() },
                    newValues: {
                        clockOut: now.toISOString(),
                        status: calc.status,
                        workedMinutes: calc.workedMinutes,
                        overtimeMinutes: calc.overtimeMinutes,
                        notes,
                    },
                    changedById: userId,
                    reason: notes ?? "Employee clock-out",
                },
            });
            return saved;
        });
        return updated;
    }
    /**
     * Get employee's attendance status for today.
     */
    static async getTodayAttendance(companyId, userId) {
        const employee = await this.resolveEmployeeForUser(companyId, userId);
        const settings = await this.getCompanySettings(companyId);
        const now = new Date();
        const localDateStr = AttendanceCalculationService.getLocalDateString(now, settings.timezone);
        // Look for active open record first (e.g. overnight), then today's record
        const openRecord = await prisma.attendance.findFirst({
            where: {
                companyId,
                employeeId: employee.id,
                clockIn: { not: null },
                clockOut: null,
            },
            include: { shift: true },
        });
        if (openRecord) {
            return openRecord;
        }
        return prisma.attendance.findUnique({
            where: {
                companyId_employeeId_attendanceDate: {
                    companyId,
                    employeeId: employee.id,
                    attendanceDate: localDateStr,
                },
            },
            include: { shift: true },
        });
    }
    /**
     * Get employee's personal attendance history.
     */
    static async getMyAttendanceHistory(companyId, userId, query) {
        const employee = await this.resolveEmployeeForUser(companyId, userId);
        const { page, limit, month } = query;
        const skip = (page - 1) * limit;
        const where = {
            companyId,
            employeeId: employee.id,
        };
        if (month) {
            where.attendanceDate = { startsWith: month };
        }
        const [attendances, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                skip,
                take: limit,
                orderBy: { attendanceDate: "desc" },
                include: {
                    shift: true,
                    corrections: { orderBy: { createdAt: "desc" } },
                },
            }),
            prisma.attendance.count({ where }),
        ]);
        return {
            attendances,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Daily Attendance Log for HR/Admin with filters, pagination and summary metrics.
     */
    static async getDailyAttendance(companyId, query) {
        const settings = await this.getCompanySettings(companyId);
        const targetDate = query.date || AttendanceCalculationService.getLocalDateString(new Date(), settings.timezone);
        const { page, limit, departmentId, shiftId, status, search } = query;
        const skip = (page - 1) * limit;
        // Check and populate approved leaves for targetDate so employees on leave are never penalized as absent
        const approvedLeavesToday = await prisma.leaveRequest.findMany({
            where: {
                companyId,
                status: "APPROVED",
                startDate: { lte: targetDate },
                endDate: { gte: targetDate },
            },
        });
        for (const lv of approvedLeavesToday) {
            const existing = await prisma.attendance.findUnique({
                where: {
                    companyId_employeeId_attendanceDate: {
                        companyId,
                        employeeId: lv.employeeId,
                        attendanceDate: targetDate,
                    },
                },
            });
            if (!existing) {
                await prisma.attendance.create({
                    data: {
                        companyId,
                        employeeId: lv.employeeId,
                        attendanceDate: targetDate,
                        status: AttendanceStatus.ON_LEAVE,
                        workedMinutes: 0,
                        lateMinutes: 0,
                        earlyDepartureMinutes: 0,
                        overtimeMinutes: 0,
                    },
                });
            }
            else if (!existing.clockIn && existing.status !== AttendanceStatus.ON_LEAVE) {
                await prisma.attendance.update({
                    where: { id: existing.id },
                    data: { status: AttendanceStatus.ON_LEAVE },
                });
            }
        }
        const where = {
            companyId,
            attendanceDate: targetDate,
        };
        if (shiftId)
            where.shiftId = shiftId;
        if (status)
            where.status = status;
        if (departmentId || search) {
            where.employee = {
                ...(departmentId && { departmentId }),
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                        { employeeCode: { contains: search, mode: "insensitive" } },
                    ],
                }),
            };
        }
        const [attendances, total, summaryCounts] = await Promise.all([
            prisma.attendance.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    employee: {
                        select: {
                            id: true,
                            name: true,
                            employeeCode: true,
                            department: { select: { id: true, name: true } },
                            designation: { select: { id: true, name: true } },
                        },
                    },
                    shift: true,
                    corrections: {
                        where: { status: CorrectionStatus.PENDING },
                        select: { id: true, status: true, reason: true },
                    },
                },
            }),
            prisma.attendance.count({ where }),
            prisma.attendance.groupBy({
                by: ["status"],
                where: { companyId, attendanceDate: targetDate },
                _count: { status: true },
            }),
        ]);
        const metrics = {
            present: 0,
            late: 0,
            halfDay: 0,
            absent: 0,
            onLeave: 0,
            notClockedOut: 0,
        };
        for (const item of summaryCounts) {
            if (item.status === AttendanceStatus.PRESENT)
                metrics.present = item._count.status;
            else if (item.status === AttendanceStatus.LATE)
                metrics.late = item._count.status;
            else if (item.status === AttendanceStatus.HALF_DAY)
                metrics.halfDay = item._count.status;
            else if (item.status === AttendanceStatus.ABSENT)
                metrics.absent = item._count.status;
            else if (item.status === AttendanceStatus.ON_LEAVE)
                metrics.onLeave = item._count.status;
            else if (item.status === AttendanceStatus.NOT_CLOCKED_OUT)
                metrics.notClockedOut = item._count.status;
        }
        return {
            date: targetDate,
            summary: metrics,
            attendances,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Request attendance correction (Employee).
     */
    static async requestCorrection(companyId, userId, attendanceId, input) {
        const employee = await this.resolveEmployeeForUser(companyId, userId);
        const attendance = await prisma.attendance.findFirst({
            where: { id: attendanceId, companyId, employeeId: employee.id },
        });
        if (!attendance) {
            const err = new Error("Attendance record not found for this employee.");
            err.statusCode = 404;
            err.code = "NOT_FOUND";
            throw err;
        }
        // Check if an existing PENDING request already exists
        const pending = await prisma.attendanceCorrection.findFirst({
            where: { attendanceId, status: CorrectionStatus.PENDING },
        });
        if (pending) {
            const err = new Error("A pending correction request already exists for this attendance record.");
            err.statusCode = 409;
            err.code = "CONFLICT";
            throw err;
        }
        return prisma.attendanceCorrection.create({
            data: {
                companyId,
                attendanceId,
                requestedById: userId,
                previousClockIn: attendance.clockIn,
                previousClockOut: attendance.clockOut,
                correctedClockIn: new Date(input.correctedClockIn),
                correctedClockOut: input.correctedClockOut ? new Date(input.correctedClockOut) : null,
                reason: input.reason,
                status: CorrectionStatus.PENDING,
            },
            include: {
                attendance: true,
            },
        });
    }
    /**
     * List correction requests for HR/Owner review.
     */
    static async listCorrectionRequests(companyId, status) {
        const where = { companyId };
        if (status)
            where.status = status;
        return prisma.attendanceCorrection.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                requestedBy: { select: { id: true, name: true, email: true } },
                approvedBy: { select: { id: true, name: true } },
                attendance: {
                    include: {
                        employee: { select: { id: true, name: true, employeeCode: true } },
                        shift: true,
                    },
                },
            },
        });
    }
    /**
     * Approve or reject a correction request (HR / Owner).
     */
    static async reviewCorrection(companyId, reviewerUserId, correctionId, newStatus, reviewNotes) {
        const correction = await prisma.attendanceCorrection.findFirst({
            where: { id: correctionId, companyId },
            include: {
                attendance: { include: { shift: true } },
            },
        });
        if (!correction) {
            const err = new Error("Correction request not found.");
            err.statusCode = 404;
            err.code = "NOT_FOUND";
            throw err;
        }
        if (correction.status !== CorrectionStatus.PENDING) {
            const err = new Error(`Correction request is already ${correction.status.toLowerCase()}.`);
            err.statusCode = 409;
            err.code = "CONFLICT";
            throw err;
        }
        const settings = await this.getCompanySettings(companyId);
        return prisma.$transaction(async (tx) => {
            // Update correction status
            const updatedCorrection = await tx.attendanceCorrection.update({
                where: { id: correctionId },
                data: {
                    status: newStatus,
                    approvedById: reviewerUserId,
                    reviewedAt: new Date(),
                },
            });
            // If approved, update Attendance and recalculate
            if (newStatus === "APPROVED" && correction.correctedClockIn) {
                const calc = AttendanceCalculationService.calculateAttendance(correction.correctedClockIn, correction.correctedClockOut, correction.attendance.shift ?? undefined, settings);
                await tx.attendance.update({
                    where: { id: correction.attendanceId },
                    data: {
                        clockIn: correction.correctedClockIn,
                        clockOut: correction.correctedClockOut,
                        status: calc.status,
                        lateMinutes: calc.lateMinutes,
                        earlyDepartureMinutes: calc.earlyDepartureMinutes,
                        workedMinutes: calc.workedMinutes,
                        breakMinutes: calc.breakMinutes,
                        overtimeMinutes: calc.overtimeMinutes,
                    },
                });
                await tx.attendanceAudit.create({
                    data: {
                        companyId,
                        employeeId: correction.attendance.employeeId,
                        attendanceId: correction.attendanceId,
                        action: "HR_CORRECTION_APPROVED",
                        previousValues: {
                            clockIn: correction.previousClockIn?.toISOString(),
                            clockOut: correction.previousClockOut?.toISOString(),
                        },
                        newValues: {
                            clockIn: correction.correctedClockIn.toISOString(),
                            clockOut: correction.correctedClockOut?.toISOString(),
                            status: calc.status,
                            workedMinutes: calc.workedMinutes,
                        },
                        changedById: reviewerUserId,
                        reason: `Correction approved: ${correction.reason}. Notes: ${reviewNotes || "None"}`,
                    },
                });
            }
            return updatedCorrection;
        });
    }
    /**
     * Direct HR Correction on an attendance record.
     */
    static async hrDirectCorrection(companyId, hrUserId, attendanceId, input) {
        const attendance = await prisma.attendance.findFirst({
            where: { id: attendanceId, companyId },
            include: { shift: true },
        });
        if (!attendance) {
            const err = new Error("Attendance record not found.");
            err.statusCode = 404;
            err.code = "NOT_FOUND";
            throw err;
        }
        const settings = await this.getCompanySettings(companyId);
        const newClockIn = new Date(input.correctedClockIn);
        const newClockOut = input.correctedClockOut ? new Date(input.correctedClockOut) : null;
        const calc = AttendanceCalculationService.calculateAttendance(newClockIn, newClockOut, attendance.shift ?? undefined, settings);
        return prisma.$transaction(async (tx) => {
            const updated = await tx.attendance.update({
                where: { id: attendanceId },
                data: {
                    clockIn: newClockIn,
                    clockOut: newClockOut,
                    status: calc.status,
                    lateMinutes: calc.lateMinutes,
                    earlyDepartureMinutes: calc.earlyDepartureMinutes,
                    workedMinutes: calc.workedMinutes,
                    breakMinutes: calc.breakMinutes,
                    overtimeMinutes: calc.overtimeMinutes,
                },
                include: {
                    shift: true,
                    employee: {
                        select: { id: true, name: true, employeeCode: true },
                    },
                },
            });
            await tx.attendanceAudit.create({
                data: {
                    companyId,
                    employeeId: attendance.employeeId,
                    attendanceId,
                    action: "HR_DIRECT_CORRECTION",
                    previousValues: {
                        clockIn: attendance.clockIn?.toISOString(),
                        clockOut: attendance.clockOut?.toISOString(),
                        status: attendance.status,
                    },
                    newValues: {
                        clockIn: newClockIn.toISOString(),
                        clockOut: newClockOut?.toISOString(),
                        status: calc.status,
                        workedMinutes: calc.workedMinutes,
                    },
                    changedById: hrUserId,
                    reason: input.reason,
                },
            });
            return updated;
        });
    }
    /**
     * Weekly Attendance Report.
     */
    static async getWeeklyReport(companyId, query) {
        const { startDate, endDate, departmentId, shiftId, employeeId } = query;
        const where = {
            companyId,
            attendanceDate: { gte: startDate, lte: endDate },
        };
        if (shiftId)
            where.shiftId = shiftId;
        if (employeeId)
            where.employeeId = employeeId;
        if (departmentId) {
            where.employee = { departmentId };
        }
        const attendances = await prisma.attendance.findMany({
            where,
            orderBy: [{ employeeId: "asc" }, { attendanceDate: "asc" }],
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        employeeCode: true,
                        department: { select: { id: true, name: true } },
                    },
                },
                shift: true,
            },
        });
        // Group aggregates by employee
        const employeeMap = new Map();
        for (const record of attendances) {
            const empId = record.employeeId;
            if (!employeeMap.has(empId)) {
                employeeMap.set(empId, {
                    employee: {
                        id: record.employee.id,
                        name: record.employee.name,
                        employeeCode: record.employee.employeeCode,
                        departmentName: record.employee.department?.name || "Unassigned",
                    },
                    totalDays: 0,
                    presentDays: 0,
                    lateDays: 0,
                    absentDays: 0,
                    halfDays: 0,
                    totalWorkedMinutes: 0,
                    totalOvertimeMinutes: 0,
                    totalEarlyDepartureMinutes: 0,
                    attendances: [],
                });
            }
            const item = employeeMap.get(empId);
            item.totalDays += 1;
            if (record.status === AttendanceStatus.PRESENT)
                item.presentDays += 1;
            else if (record.status === AttendanceStatus.LATE)
                item.lateDays += 1;
            else if (record.status === AttendanceStatus.HALF_DAY)
                item.halfDays += 1;
            else if (record.status === AttendanceStatus.ABSENT)
                item.absentDays += 1;
            item.totalWorkedMinutes += record.workedMinutes;
            item.totalOvertimeMinutes += record.overtimeMinutes;
            item.totalEarlyDepartureMinutes += record.earlyDepartureMinutes;
            item.attendances.push(record);
        }
        return {
            startDate,
            endDate,
            report: Array.from(employeeMap.values()),
        };
    }
    /**
     * Export Weekly Attendance Report as CSV.
     * Sanitizes values against formula injection (=, +, -, @).
     */
    static async exportWeeklyReportCsv(companyId, query) {
        const { startDate, endDate, departmentId, shiftId, employeeId } = query;
        const where = {
            companyId,
            attendanceDate: { gte: startDate, lte: endDate },
        };
        if (shiftId)
            where.shiftId = shiftId;
        if (employeeId)
            where.employeeId = employeeId;
        if (departmentId) {
            where.employee = { departmentId };
        }
        const records = await prisma.attendance.findMany({
            where,
            orderBy: [{ employeeId: "asc" }, { attendanceDate: "asc" }],
            include: {
                employee: {
                    select: {
                        name: true,
                        employeeCode: true,
                        department: { select: { name: true } },
                    },
                },
                shift: { select: { name: true, code: true } },
            },
        });
        const escapeCsv = (val) => {
            if (val === null || val === undefined)
                return '""';
            let str = String(val).trim();
            // Formula injection prevention
            if (/^[=+\-@]/.test(str)) {
                str = "'" + str;
            }
            return `"${str.replace(/"/g, '""')}"`;
        };
        const headers = [
            "Employee Code",
            "Employee Name",
            "Department",
            "Shift",
            "Attendance Date",
            "Clock In",
            "Clock Out",
            "Status",
            "Worked Hours",
            "Late (mins)",
            "Early Departure (mins)",
            "Overtime (hours)",
        ];
        const rows = records.map((r) => [
            escapeCsv(r.employee.employeeCode),
            escapeCsv(r.employee.name),
            escapeCsv(r.employee.department?.name || "N/A"),
            escapeCsv(r.shift?.name || "N/A"),
            escapeCsv(r.attendanceDate),
            escapeCsv(r.clockIn ? r.clockIn.toISOString() : ""),
            escapeCsv(r.clockOut ? r.clockOut.toISOString() : ""),
            escapeCsv(r.status),
            escapeCsv((r.workedMinutes / 60).toFixed(2)),
            escapeCsv(r.lateMinutes),
            escapeCsv(r.earlyDepartureMinutes),
            escapeCsv((r.overtimeMinutes / 60).toFixed(2)),
        ]);
        return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
    }
}
//# sourceMappingURL=attendance.service.js.map