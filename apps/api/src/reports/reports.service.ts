import { prisma } from "../lib/prisma.js";
import type { ReportFilterQuery } from "./reports.validation.js";
import type {
  ReportsDashboardStats,
  EmployeeReportData,
  AttendanceReportData,
  LeaveReportData,
  AssetReportData,
  PayrollReportData,
  TaskReportData,
} from "./reports.types.js";

export class ReportsService {
  /**
   * Reports Dashboard Summary Overview
   */
  async getDashboardStats(companyId: string): Promise<ReportsDashboardStats> {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const currentMonth = today.getUTCMonth() + 1;
    const currentYear = today.getUTCFullYear();

    const [
      totalEmployees,
      totalDepartments,
      activeToday,
      pendingLeaves,
      approvedLeaves,
      totalAssets,
      assignedAssets,
      monthPayrolls,
      totalTasks,
      completedTasks,
    ] = await Promise.all([
      prisma.employee.count({ where: { companyId, status: "ACTIVE" } }),
      prisma.department.count({ where: { companyId, status: "ACTIVE" } }),
      prisma.attendance.count({
        where: {
          companyId,
          attendanceDate: todayStr,
          status: { in: ["PRESENT", "LATE", "HALF_DAY"] },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          companyId,
          status: { in: ["PENDING_SUPERVISOR", "PENDING_MANAGER", "PENDING_HR"] },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          companyId,
          status: "APPROVED",
        },
      }),
      prisma.asset.count({ where: { companyId } }),
      prisma.asset.count({ where: { companyId, status: "ASSIGNED" } }),
      prisma.payroll.findMany({
        where: { companyId, month: currentMonth, year: currentYear },
        select: { netSalary: true },
      }),
      prisma.task.count({ where: { companyId } }),
      prisma.task.count({ where: { companyId, status: "COMPLETED" } }),
    ]);

    const monthlyPayrollExpenditure = monthPayrolls.reduce(
      (acc, p) => acc + Number(p.netSalary || 0),
      0
    );

    return {
      totalEmployees,
      totalDepartments,
      activeToday,
      pendingLeaves,
      approvedLeaves,
      totalAssets,
      assignedAssets,
      monthlyPayrollExpenditure: Math.round(monthlyPayrollExpenditure),
      totalTasks,
      completedTasks,
    };
  }

  /**
   * Employee Reports
   */
  async getEmployeeReport(companyId: string, query: ReportFilterQuery): Promise<EmployeeReportData> {
    const { departmentId, status, limit } = query;

    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        ...(departmentId && { departmentId }),
        ...(status && { status: status as any }),
      },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
        supervisor: { select: { name: true } },
      },
      orderBy: { employeeCode: "asc" },
      take: limit || 500,
    });

    const deptMap = new Map<string, number>();
    const desigMap = new Map<string, number>();
    let active = 0;
    let inactive = 0;
    let probation = 0;

    const records = employees.map((emp) => {
      if (emp.status === "ACTIVE") active++;
      else if (emp.status === "INACTIVE") inactive++;
      else if (emp.status === "PROBATION") probation++;

      const deptName = emp.department?.name || "General";
      const desigName = emp.designation?.name || "Not Assigned";

      deptMap.set(deptName, (deptMap.get(deptName) || 0) + 1);
      desigMap.set(desigName, (desigMap.get(desigName) || 0) + 1);

      return {
        id: emp.id,
        employeeCode: emp.employeeCode,
        name: emp.name,
        email: emp.email,
        department: deptName,
        designation: desigName,
        joiningDate: emp.joiningDate ? emp.joiningDate.toISOString().split("T")[0] : "-",
        status: emp.status,
        supervisorName: emp.supervisor?.name || "-",
      };
    });

    return {
      summary: {
        total: records.length,
        active,
        inactive,
        probation,
        byDepartment: Array.from(deptMap.entries()).map(([name, count]) => ({ name, count })),
        byDesignation: Array.from(desigMap.entries()).map(([name, count]) => ({ name, count })),
      },
      employees: records,
    };
  }

  /**
   * Attendance Reports
   */
  async getAttendanceReport(companyId: string, query: ReportFilterQuery): Promise<AttendanceReportData> {
    const { startDate, endDate, departmentId, employeeId, status, limit } = query;

    const attendances = await prisma.attendance.findMany({
      where: {
        companyId,
        ...(departmentId && { employee: { departmentId } }),
        ...(employeeId && { employeeId }),
        ...(status && { status: status as any }),
        ...(startDate && endDate && {
          attendanceDate: {
            gte: startDate,
            lte: endDate,
          },
        }),
      },
      include: {
        employee: {
          select: {
            employeeCode: true,
            name: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { attendanceDate: "desc" },
      take: limit || 500,
    });

    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;
    let totalWorkHours = 0;

    const records = attendances.map((att) => {
      const hours = Number(att.workedMinutes || 0) / 60;
      totalWorkHours += hours;

      if (att.status === "PRESENT") present++;
      else if (att.status === "ABSENT") absent++;
      else if (att.status === "LATE") late++;
      else if (att.status === "HALF_DAY") halfDay++;

      return {
        id: att.id,
        employeeCode: att.employee.employeeCode,
        employeeName: att.employee.name,
        department: att.employee.department?.name || "General",
        date: att.attendanceDate,
        checkInTime: att.clockIn ? att.clockIn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
        checkOutTime: att.clockOut ? att.clockOut.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
        workingHours: Math.round(hours * 10) / 10,
        status: att.status,
      };
    });

    return {
      summary: {
        totalRecords: records.length,
        present,
        absent,
        late,
        halfDay,
        averageWorkingHours: records.length > 0 ? Math.round((totalWorkHours / records.length) * 10) / 10 : 0,
      },
      records,
    };
  }

  /**
   * Leave Reports
   */
  async getLeaveReport(companyId: string, query: ReportFilterQuery): Promise<LeaveReportData> {
    const { startDate, endDate, departmentId, employeeId, status, limit } = query;

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        companyId,
        ...(departmentId && { employee: { departmentId } }),
        ...(employeeId && { employeeId }),
        ...(status && { status: status as any }),
        ...(startDate && endDate && {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        }),
      },
      include: {
        employee: {
          select: {
            employeeCode: true,
            name: true,
            department: { select: { name: true } },
          },
        },
        leaveType: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit || 500,
    });

    let pending = 0;
    let approved = 0;
    let rejected = 0;
    const typeMap = new Map<string, number>();
    const deptMap = new Map<string, number>();

    const records = leaves.map((req) => {
      if (req.status.startsWith("PENDING")) pending++;
      else if (req.status === "APPROVED") approved++;
      else if (req.status === "REJECTED") rejected++;

      const typeName = req.leaveType.name;
      const deptName = req.employee.department?.name || "General";

      typeMap.set(typeName, (typeMap.get(typeName) || 0) + 1);
      deptMap.set(deptName, (deptMap.get(deptName) || 0) + 1);

      return {
        id: req.id,
        employeeCode: req.employee.employeeCode,
        employeeName: req.employee.name,
        department: deptName,
        leaveType: typeName,
        startDate: req.startDate,
        endDate: req.endDate,
        daysCount: Number(req.days || 1),
        status: req.status,
        reason: req.reason,
        appliedAt: req.createdAt.toISOString().split("T")[0],
      };
    });

    return {
      summary: {
        totalRequests: records.length,
        pending,
        approved,
        rejected,
        byType: Array.from(typeMap.entries()).map(([name, count]) => ({ name, count })),
        byDepartment: Array.from(deptMap.entries()).map(([name, count]) => ({ name, count })),
      },
      records,
    };
  }

  /**
   * Asset Reports
   */
  async getAssetReport(companyId: string, query: ReportFilterQuery): Promise<AssetReportData> {
    const { departmentId, status, limit } = query;

    const assets = await prisma.asset.findMany({
      where: {
        companyId,
        ...(departmentId && { assignedEmployee: { departmentId } }),
        ...(status && { status: status as any }),
      },
      include: {
        assignedEmployee: {
          select: {
            name: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { assetCode: "asc" },
      take: limit || 500,
    });

    let available = 0;
    let assigned = 0;
    let maintenance = 0;
    let retired = 0;
    let totalValue = 0;
    const catMap = new Map<string, number>();

    const records = assets.map((a) => {
      const cost = Number(a.purchaseCost || 0);
      totalValue += cost;

      if (a.status === "AVAILABLE") available++;
      else if (a.status === "ASSIGNED") assigned++;
      else if (a.status === "UNDER_MAINTENANCE") maintenance++;
      else if (a.status === "RETIRED") retired++;

      catMap.set(a.category, (catMap.get(a.category) || 0) + 1);

      return {
        id: a.id,
        assetCode: a.assetCode,
        name: a.name,
        category: a.category,
        serialNumber: a.serialNumber,
        purchaseCost: cost,
        purchaseDate: a.purchaseDate ? a.purchaseDate.toISOString().split("T")[0] : null,
        status: a.status,
        assignedTo: a.assignedEmployee?.name || null,
        department: a.assignedEmployee?.department?.name || null,
      };
    });

    return {
      summary: {
        total: records.length,
        available,
        assigned,
        maintenance,
        retired,
        totalValue: Math.round(totalValue),
        byCategory: Array.from(catMap.entries()).map(([category, count]) => ({ category, count })),
      },
      records,
    };
  }

  /**
   * Payroll Reports
   */
  async getPayrollReport(companyId: string, query: ReportFilterQuery): Promise<PayrollReportData> {
    const { month, year, departmentId, status, limit } = query;

    const payrolls = await prisma.payroll.findMany({
      where: {
        companyId,
        ...(month && { month }),
        ...(year && { year }),
        ...(departmentId && { departmentId }),
        ...(status && { status: status as any }),
      },
      include: {
        employee: {
          select: {
            employeeCode: true,
            name: true,
          },
        },
        department: { select: { name: true } },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: limit || 500,
    });

    let totalPayrollAmount = 0;
    let totalGrossAmount = 0;
    let totalDeductions = 0;
    let paidCount = 0;
    let processedCount = 0;
    let draftCount = 0;
    const deptMap = new Map<string, number>();

    const records = payrolls.map((p) => {
      const net = Number(p.netSalary);
      const gross = Number(p.grossSalary);
      const ded = Number(p.totalDeductions);

      totalPayrollAmount += net;
      totalGrossAmount += gross;
      totalDeductions += ded;

      if (p.status === "PAID") paidCount++;
      else if (p.status === "PROCESSED" || p.status === "APPROVED") processedCount++;
      else if (p.status === "DRAFT") draftCount++;

      const deptName = p.department?.name || "General";
      deptMap.set(deptName, (deptMap.get(deptName) || 0) + net);

      return {
        id: p.id,
        payrollCode: p.payrollCode,
        employeeCode: p.employee.employeeCode,
        employeeName: p.employee.name,
        department: deptName,
        month: p.month,
        year: p.year,
        basicSalary: Number(p.basicSalary),
        grossSalary: gross,
        totalDeductions: ded,
        netSalary: net,
        status: p.status,
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate ? p.paymentDate.toISOString().split("T")[0] : null,
      };
    });

    return {
      summary: {
        totalPayrollAmount: Math.round(totalPayrollAmount),
        totalGrossAmount: Math.round(totalGrossAmount),
        totalDeductions: Math.round(totalDeductions),
        paidCount,
        processedCount,
        draftCount,
        byDepartment: Array.from(deptMap.entries()).map(([name, amount]) => ({
          name,
          amount: Math.round(amount),
        })),
      },
      records,
    };
  }

  /**
   * Task Reports (Integrated with Week 6 Task Management)
   */
  async getTaskReport(companyId: string, query: ReportFilterQuery): Promise<TaskReportData> {
    const { departmentId, employeeId, status, limit } = query;

    const tasks = await prisma.task.findMany({
      where: {
        companyId,
        ...(departmentId && { departmentId }),
        ...(employeeId && { assignedEmployeeId: employeeId }),
        ...(status && { status: status as any }),
      },
      include: {
        assignedEmployee: { select: { name: true } },
        department: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit || 500,
    });

    let completed = 0;
    let inProgress = 0;
    let underReview = 0;
    let overdue = 0;
    const prioMap = new Map<string, number>();
    const deptMap = new Map<string, number>();

    const now = new Date();

    const records = tasks.map((t) => {
      if (t.status === "COMPLETED") completed++;
      else if (t.status === "IN_PROGRESS") inProgress++;
      else if (t.status === "UNDER_REVIEW") underReview++;

      const isOverdue = t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED" && t.status !== "CANCELLED";
      if (isOverdue) overdue++;

      prioMap.set(t.priority, (prioMap.get(t.priority) || 0) + 1);
      const deptName = t.department?.name || "General";
      deptMap.set(deptName, (deptMap.get(deptName) || 0) + 1);

      return {
        id: t.id,
        taskCode: t.taskCode,
        title: t.title,
        category: t.category,
        priority: t.priority,
        status: t.status,
        progress: t.progress,
        assignedTo: t.assignedEmployee?.name || "Unassigned",
        department: deptName,
        dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
        completedAt: t.completedAt ? t.completedAt.toISOString().split("T")[0] : null,
      };
    });

    const completionRate = records.length > 0 ? Math.round((completed / records.length) * 100) : 0;

    return {
      summary: {
        total: records.length,
        completed,
        inProgress,
        underReview,
        overdue,
        completionRate,
        byPriority: Array.from(prioMap.entries()).map(([priority, count]) => ({ priority, count })),
        byDepartment: Array.from(deptMap.entries()).map(([name, count]) => ({ name, count })),
      },
      records,
    };
  }
}

export const reportsService = new ReportsService();
