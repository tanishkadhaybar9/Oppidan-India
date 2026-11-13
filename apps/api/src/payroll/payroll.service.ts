import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { UserRole, UserStatus, PayrollStatus, SalaryFrequency } from "./payroll.types.js";
import type {
  CreateSalaryStructureInput,
  UpdateSalaryStructureInput,
  PreviewPayrollQuery,
  ProcessPayrollInput,
  UpdatePayrollStatusInput,
  ListSalaryStructuresQuery,
  ListPayrollsQuery,
} from "./payroll.validation.js";
import type {
  PayrollSummaryStats,
  PayrollAnalytics,
  PayrollPreviewItem,
} from "./payroll.types.js";

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

function createError(message: string, statusCode: number, code?: string): CustomError {
  const err = new Error(message) as CustomError;
  err.statusCode = statusCode;
  if (code) err.code = code;
  return err;
}

export class PayrollService {
  /**
   * Generate sequential payroll code: PAY-YYYY-MM-XXXX
   */
  private async generatePayrollCode(companyId: string, year: number, month: number): Promise<string> {
    const padMonth = String(month).padStart(2, "0");
    const prefix = `PAY-${year}-${padMonth}-`;
    const count = await prisma.payroll.count({
      where: {
        companyId,
        payrollCode: { startsWith: prefix },
      },
    });
    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  /**
   * Generate sequential payslip number: PS-YYYY-MM-XXXX
   */
  private async generatePayslipNumber(year: number, month: number): Promise<string> {
    const padMonth = String(month).padStart(2, "0");
    const prefix = `PS-${year}-${padMonth}-`;
    const count = await prisma.payslip.count({
      where: {
        payslipNumber: { startsWith: prefix },
      },
    });
    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  /**
   * Calculate working days in a month (Monday to Friday or configured)
   */
  private getWorkingDaysInMonth(year: number, month: number): number {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));
    let workingDays = 0;
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const day = cur.getUTCDay();
      if (day !== 0 && day !== 6) {
        workingDays++;
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return Math.max(workingDays, 20); // Default to at least 20 working days
  }

  /**
   * Get Payroll Dashboard summary statistics
   */
  async getPayrollSummary(companyId: string, month?: number, year?: number): Promise<PayrollSummaryStats> {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    const [totalEmployees, activeStructures, monthPayrolls] = await Promise.all([
      prisma.employee.count({
        where: { companyId, status: "ACTIVE" },
      }),
      prisma.salaryStructure.findMany({
        where: { companyId, status: UserStatus.ACTIVE },
        select: { grossSalary: true, totalDeductions: true, netSalary: true },
      }),
      prisma.payroll.findMany({
        where: { companyId, month: currentMonth, year: currentYear },
        select: { status: true, grossSalary: true, totalDeductions: true, netSalary: true },
      }),
    ]);

    const employeesWithSalaryStructure = activeStructures.length;
    let totalMonthlyGross = 0;
    let totalMonthlyDeductions = 0;
    let totalNetPayroll = 0;

    activeStructures.forEach((s) => {
      totalMonthlyGross += Number(s.grossSalary || 0);
      totalMonthlyDeductions += Number(s.totalDeductions || 0);
      totalNetPayroll += Number(s.netSalary || 0);
    });

    const processedPayrolls = monthPayrolls.filter(
      (p) => p.status === PayrollStatus.PROCESSED || p.status === PayrollStatus.APPROVED
    ).length;
    const paidPayrolls = monthPayrolls.filter((p) => p.status === PayrollStatus.PAID).length;
    const pendingPayrolls = Math.max(0, totalEmployees - (processedPayrolls + paidPayrolls));

    return {
      totalEmployees,
      employeesWithSalaryStructure,
      totalMonthlyGross: Math.round(totalMonthlyGross * 100) / 100,
      totalMonthlyDeductions: Math.round(totalMonthlyDeductions * 100) / 100,
      totalNetPayroll: Math.round(totalNetPayroll * 100) / 100,
      processedPayrolls,
      pendingPayrolls,
      paidPayrolls,
    };
  }

  /**
   * Get Payroll Analytics & Charts data
   */
  async getPayrollAnalytics(companyId: string, year?: number): Promise<PayrollAnalytics> {
    const targetYear = year || new Date().getFullYear();

    const payrolls = await prisma.payroll.findMany({
      where: {
        companyId,
        year: targetYear,
        status: { in: [PayrollStatus.PROCESSED, PayrollStatus.APPROVED, PayrollStatus.PAID] },
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    // 1. Monthly expenditure (Jan - Dec)
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const monthlyMap = new Map<number, { gross: number; net: number; deductions: number }>();
    for (let m = 1; m <= 12; m++) {
      monthlyMap.set(m, { gross: 0, net: 0, deductions: 0 });
    }

    let pfTotal = 0;
    let ptTotal = 0;
    let tdsTotal = 0;
    let unpaidLeaveTotal = 0;
    let otherDeductionsTotal = 0;

    const deptMap = new Map<string, { id: string; name: string; total: number; count: Set<string> }>();

    payrolls.forEach((p) => {
      const cur = monthlyMap.get(p.month)!;
      cur.gross += Number(p.grossSalary);
      cur.net += Number(p.netSalary);
      cur.deductions += Number(p.totalDeductions);

      pfTotal += Number(p.pfDeduction);
      ptTotal += Number(p.ptDeduction);
      tdsTotal += Number(p.tdsDeduction);
      unpaidLeaveTotal += Number(p.unpaidLeaveDeduction);
      otherDeductionsTotal += Number(p.otherDeductions);

      const deptId = p.departmentId || "unassigned";
      const deptName = p.department?.name || "General";
      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, { id: deptId, name: deptName, total: 0, count: new Set() });
      }
      const d = deptMap.get(deptId)!;
      d.total += Number(p.netSalary);
      d.count.add(p.employeeId);
    });

    const monthlyExpenditure = Array.from(monthlyMap.entries()).map(([m, val]) => ({
      month: monthNames[m - 1],
      gross: Math.round(val.gross),
      net: Math.round(val.net),
      deductions: Math.round(val.deductions),
    }));

    const byDepartment = Array.from(deptMap.values()).map((d) => ({
      departmentId: d.id,
      departmentName: d.name,
      totalAmount: Math.round(d.total),
      employeeCount: d.count.size,
    }));

    // Status breakdown
    const statusCounts: Record<PayrollStatus, { count: number; total: number }> = {
      DRAFT: { count: 0, total: 0 },
      PROCESSED: { count: 0, total: 0 },
      APPROVED: { count: 0, total: 0 },
      PAID: { count: 0, total: 0 },
      CANCELLED: { count: 0, total: 0 },
    };

    const allPayrollsThisYear = await prisma.payroll.findMany({
      where: { companyId, year: targetYear },
      select: { status: true, netSalary: true },
    });

    allPayrollsThisYear.forEach((p) => {
      if (statusCounts[p.status]) {
        statusCounts[p.status].count++;
        statusCounts[p.status].total += Number(p.netSalary);
      }
    });

    const byStatus = Object.entries(statusCounts).map(([status, val]) => ({
      status: status as PayrollStatus,
      count: val.count,
      totalAmount: Math.round(val.total),
    }));

    // Salary ranges distribution from active salary structures
    const structures = await prisma.salaryStructure.findMany({
      where: { companyId, status: UserStatus.ACTIVE },
      select: { grossSalary: true },
    });

    const ranges = [
      { range: "< ₹25,000", min: 0, max: 25000, count: 0 },
      { range: "₹25k - ₹50k", min: 25000, max: 50000, count: 0 },
      { range: "₹50k - ₹1,00,000", min: 50000, max: 100000, count: 0 },
      { range: "₹1L - ₹2,00,000", min: 100000, max: 200000, count: 0 },
      { range: "> ₹2,00,000", min: 200000, max: Infinity, count: 0 },
    ];

    structures.forEach((s) => {
      const gross = Number(s.grossSalary);
      const matched = ranges.find((r) => gross >= r.min && gross < r.max);
      if (matched) matched.count++;
    });

    return {
      monthlyExpenditure,
      byDepartment,
      byStatus,
      deductionsBreakdown: {
        pf: Math.round(pfTotal),
        pt: Math.round(ptTotal),
        tds: Math.round(tdsTotal),
        unpaidLeave: Math.round(unpaidLeaveTotal),
        other: Math.round(otherDeductionsTotal),
      },
      salaryRanges: ranges.map((r) => ({ range: r.range, count: r.count })),
    };
  }

  /**
   * List Salary Structures with pagination, search, and department filter
   */
  async listSalaryStructures(companyId: string, query: ListSalaryStructuresQuery) {
    const { search, departmentId, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SalaryStructureWhereInput = {
      companyId,
      ...(status && { status }),
      ...(departmentId && { employee: { departmentId } }),
      ...(search && {
        employee: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { employeeCode: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      }),
    };

    const [structures, total] = await Promise.all([
      prisma.salaryStructure.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              name: true,
              email: true,
              department: { select: { id: true, name: true } },
              designation: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.salaryStructure.count({ where }),
    ]);

    return {
      structures,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get salary structure for a specific employee
   */
  async getSalaryStructureByEmployee(
    companyId: string,
    employeeId: string,
    userRole: UserRole,
    requestingEmployeeId?: string
  ) {
    if (userRole === UserRole.EMPLOYEE && requestingEmployeeId !== employeeId) {
      throw createError("You are only authorized to view your own salary structure.", 403);
    }

    const structure = await prisma.salaryStructure.findFirst({
      where: { companyId, employeeId, status: UserStatus.ACTIVE },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            email: true,
            joiningDate: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } },
          },
        },
        histories: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            changedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return structure;
  }

  /**
   * Create or update active salary structure for employee
   */
  async createSalaryStructure(companyId: string, data: CreateSalaryStructureInput, actorUserId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, companyId },
    });
    if (!employee) {
      throw createError("Employee not found in your organization", 404);
    }

    const basicSalary = data.basicSalary;
    const hra = data.hra || 0;
    const conveyance = data.conveyance || 0;
    const medical = data.medical || 0;
    const special = data.special || 0;
    const otherAllowances = data.otherAllowances || 0;

    const pfDeduction = data.pfDeduction || 0;
    const ptDeduction = data.ptDeduction || 0;
    const tdsDeduction = data.tdsDeduction || 0;
    const otherDeductions = data.otherDeductions || 0;

    const grossSalary = basicSalary + hra + conveyance + medical + special + otherAllowances;
    const totalDeductions = pfDeduction + ptDeduction + tdsDeduction + otherDeductions;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    // Run in transaction: deactivate previous active structure and create new
    return prisma.$transaction(async (tx) => {
      await tx.salaryStructure.updateMany({
        where: { companyId, employeeId: data.employeeId, status: UserStatus.ACTIVE },
        data: { status: UserStatus.INACTIVE },
      });

      const structure = await tx.salaryStructure.create({
        data: {
          companyId,
          employeeId: data.employeeId,
          basicSalary,
          hra,
          conveyance,
          medical,
          special,
          otherAllowances,
          pfDeduction,
          ptDeduction,
          tdsDeduction,
          otherDeductions,
          grossSalary,
          totalDeductions,
          netSalary,
          frequency: data.frequency || SalaryFrequency.MONTHLY,
          status: UserStatus.ACTIVE,
          effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date(),
          notes: data.notes,
        },
      });

      await tx.salaryHistory.create({
        data: {
          companyId,
          employeeId: data.employeeId,
          salaryStructureId: structure.id,
          basicSalary,
          grossSalary,
          totalDeductions,
          netSalary,
          changedById: actorUserId,
          reason: "Initial salary structure created",
          effectiveDate: structure.effectiveDate,
        },
      });

      return structure;
    });
  }

  /**
   * Update salary structure
   */
  async updateSalaryStructure(
    companyId: string,
    id: string,
    data: UpdateSalaryStructureInput,
    actorUserId: string
  ) {
    const existing = await prisma.salaryStructure.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      throw createError("Salary structure not found", 404);
    }

    const basicSalary = data.basicSalary !== undefined ? data.basicSalary : Number(existing.basicSalary);
    const hra = data.hra !== undefined ? data.hra : Number(existing.hra);
    const conveyance = data.conveyance !== undefined ? data.conveyance : Number(existing.conveyance);
    const medical = data.medical !== undefined ? data.medical : Number(existing.medical);
    const special = data.special !== undefined ? data.special : Number(existing.special);
    const otherAllowances = data.otherAllowances !== undefined ? data.otherAllowances : Number(existing.otherAllowances);

    const pfDeduction = data.pfDeduction !== undefined ? data.pfDeduction : Number(existing.pfDeduction);
    const ptDeduction = data.ptDeduction !== undefined ? data.ptDeduction : Number(existing.ptDeduction);
    const tdsDeduction = data.tdsDeduction !== undefined ? data.tdsDeduction : Number(existing.tdsDeduction);
    const otherDeductions = data.otherDeductions !== undefined ? data.otherDeductions : Number(existing.otherDeductions);

    const grossSalary = basicSalary + hra + conveyance + medical + special + otherAllowances;
    const totalDeductions = pfDeduction + ptDeduction + tdsDeduction + otherDeductions;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.salaryStructure.update({
        where: { id },
        data: {
          basicSalary,
          hra,
          conveyance,
          medical,
          special,
          otherAllowances,
          pfDeduction,
          ptDeduction,
          tdsDeduction,
          otherDeductions,
          grossSalary,
          totalDeductions,
          netSalary,
          ...(data.status && { status: data.status }),
          ...(data.frequency && { frequency: data.frequency }),
          ...(data.effectiveDate && { effectiveDate: new Date(data.effectiveDate) }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      });

      await tx.salaryHistory.create({
        data: {
          companyId,
          employeeId: existing.employeeId,
          salaryStructureId: id,
          basicSalary,
          grossSalary,
          totalDeductions,
          netSalary,
          changedById: actorUserId,
          reason: data.reason || "Salary components updated",
          effectiveDate: updated.effectiveDate,
        },
      });

      return updated;
    });
  }

  /**
   * Preview Payroll Calculation for a selected month and year
   * Integrated with actual Attendance and Approved Leave records!
   */
  async previewPayroll(companyId: string, query: PreviewPayrollQuery): Promise<PayrollPreviewItem[]> {
    const { month, year, departmentId, employeeId } = query;
    const workingDays = this.getWorkingDaysInMonth(year, month);

    const startOfMonthStr = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonthStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // Fetch active employees with active salary structures
    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        status: "ACTIVE",
        ...(departmentId && { departmentId }),
        ...(employeeId && { id: employeeId }),
        salaryStructures: {
          some: { status: UserStatus.ACTIVE },
        },
      },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        salaryStructures: {
          where: { status: UserStatus.ACTIVE },
          take: 1,
        },
        payrolls: {
          where: { month, year },
          select: { id: true, status: true },
        },
      },
    });

    const results: PayrollPreviewItem[] = [];

    for (const emp of employees) {
      const structure = emp.salaryStructures[0];
      if (!structure) continue;

      const alreadyProcessed = emp.payrolls.length > 0;

      // 1. Query attendance in period
      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          attendanceDate: { gte: startOfMonthStr, lte: endOfMonthStr },
        },
        select: { status: true },
      });

      let presentCount = 0;
      let absentCount = 0;
      attendances.forEach((a) => {
        if (a.status === "PRESENT" || a.status === "LATE") presentCount += 1;
        else if (a.status === "HALF_DAY") presentCount += 0.5;
        else if (a.status === "ABSENT") absentCount += 1;
      });

      // 2. Query approved leave requests in period
      const leaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: emp.id,
          status: "APPROVED",
          startDate: { lte: endOfMonthStr },
          endDate: { gte: startOfMonthStr },
        },
        include: {
          leaveType: { select: { paid: true } },
        },
      });

      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;

      leaves.forEach((l) => {
        const days = Number(l.days || 1);
        if (l.leaveType?.paid) {
          paidLeaveDays += days;
        } else {
          unpaidLeaveDays += days;
        }
      });

      // Compute salary components
      const basic = Number(structure.basicSalary);
      const hra = Number(structure.hra);
      const conveyance = Number(structure.conveyance);
      const medical = Number(structure.medical);
      const special = Number(structure.special);
      const otherAllowances = Number(structure.otherAllowances);
      const grossSalary = Number(structure.grossSalary);

      const pf = Number(structure.pfDeduction);
      const pt = Number(structure.ptDeduction);
      const tds = Number(structure.tdsDeduction);
      const otherDed = Number(structure.otherDeductions);

      // Unpaid leave deduction rule: (Gross / workingDays) * unpaidLeaveDays
      const perDayGross = workingDays > 0 ? grossSalary / workingDays : 0;
      const unpaidLeaveDeduction = Math.round(perDayGross * unpaidLeaveDays * 100) / 100;

      const totalDeductions = Math.round((pf + pt + tds + otherDed + unpaidLeaveDeduction) * 100) / 100;
      const netSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);

      results.push({
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.name,
        departmentName: emp.department?.name || "General",
        designationName: emp.designation?.name || "Team Member",
        basicSalary: basic,
        hra,
        conveyance,
        medical,
        special,
        otherAllowances,
        grossSalary,
        pfDeduction: pf,
        ptDeduction: pt,
        tdsDeduction: tds,
        unpaidLeaveDays,
        unpaidLeaveDeduction,
        otherDeductions: otherDed,
        totalDeductions,
        netSalary,
        workingDays,
        presentDays: presentCount,
        paidLeaveDays,
        absentDays: absentCount,
        alreadyProcessed,
      });
    }

    return results;
  }

  /**
   * Process Payroll for a month and year (Repeat-safe, transactional)
   */
  async processPayroll(companyId: string, data: ProcessPayrollInput, actorUserId: string) {
    const { month, year, departmentId, employeeIds, paymentMethod, remarks } = data;

    // Get preview items
    const previewItems = await this.previewPayroll(companyId, {
      month,
      year,
      departmentId,
    });

    // Filter to selected employee IDs if provided, and exclude already processed
    const eligible = previewItems.filter((item) => {
      if (item.alreadyProcessed) return false;
      if (employeeIds && employeeIds.length > 0) {
        return employeeIds.includes(item.employeeId);
      }
      return true;
    });

    if (eligible.length === 0) {
      throw createError("No eligible unprocessed employees found for this payroll period.", 400);
    }

    const processedPayrolls: any[] = [];

    // Run batch creation in transaction
    await prisma.$transaction(async (tx) => {
      for (const item of eligible) {
        const payrollCode = await this.generatePayrollCode(companyId, year, month);
        const payslipNumber = await this.generatePayslipNumber(year, month);

        const empRecord = await tx.employee.findUnique({
          where: { id: item.employeeId },
          select: { departmentId: true },
        });

        const payroll = await tx.payroll.create({
          data: {
            companyId,
            payrollCode,
            employeeId: item.employeeId,
            departmentId: empRecord?.departmentId || null,
            month,
            year,
            status: PayrollStatus.PROCESSED,
            basicSalary: item.basicSalary,
            hra: item.hra,
            conveyance: item.conveyance,
            medical: item.medical,
            special: item.special,
            otherAllowances: item.otherAllowances,
            grossSalary: item.grossSalary,
            pfDeduction: item.pfDeduction,
            ptDeduction: item.ptDeduction,
            tdsDeduction: item.tdsDeduction,
            unpaidLeaveDeduction: item.unpaidLeaveDeduction,
            otherDeductions: item.otherDeductions,
            totalDeductions: item.totalDeductions,
            netSalary: item.netSalary,
            totalWorkingDays: item.workingDays,
            presentDays: item.presentDays,
            paidLeaveDays: item.paidLeaveDays,
            unpaidLeaveDays: item.unpaidLeaveDays,
            absentDays: item.absentDays,
            processedById: actorUserId,
            processedAt: new Date(),
            paymentMethod: paymentMethod || "BANK_TRANSFER",
            remarks,
          },
        });

        // Generate payslip record
        await tx.payslip.create({
          data: {
            payrollId: payroll.id,
            payslipNumber,
            generatedAt: new Date(),
          },
        });

        processedPayrolls.push(payroll);
      }
    });

    return {
      message: `Successfully processed payroll for ${processedPayrolls.length} employee(s).`,
      count: processedPayrolls.length,
      payrolls: processedPayrolls,
    };
  }

  /**
   * List Payroll records with filters and role scope
   */
  async listPayrolls(
    companyId: string,
    query: ListPayrollsQuery,
    userRole: UserRole,
    requestingEmployeeId?: string
  ) {
    const { search, month, year, departmentId, employeeId, status, page, limit } = query;
    const skip = (page - 1) * limit;

    // Role scope: Employees can only view own payroll
    let targetEmployeeId = employeeId;
    if (userRole === UserRole.EMPLOYEE) {
      if (!requestingEmployeeId) {
        throw createError("Employee profile not linked to user account.", 403);
      }
      targetEmployeeId = requestingEmployeeId;
    }

    const where: Prisma.PayrollWhereInput = {
      companyId,
      ...(month && { month }),
      ...(year && { year }),
      ...(status && { status }),
      ...(departmentId && { departmentId }),
      ...(targetEmployeeId && { employeeId: targetEmployeeId }),
      ...(search && {
        OR: [
          { payrollCode: { contains: search, mode: "insensitive" } },
          { employee: { name: { contains: search, mode: "insensitive" } } },
          { employee: { employeeCode: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              name: true,
              email: true,
              designation: { select: { id: true, name: true } },
            },
          },
          department: { select: { id: true, name: true } },
          payslip: { select: { id: true, payslipNumber: true } },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.payroll.count({ where }),
    ]);

    return {
      payrolls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single payroll detail
   */
  async getPayrollById(
    companyId: string,
    id: string,
    userRole: UserRole,
    requestingEmployeeId?: string
  ) {
    const payroll = await prisma.payroll.findFirst({
      where: { id, companyId },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            email: true,
            joiningDate: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } },
          },
        },
        department: { select: { id: true, name: true } },
        processedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
        payslip: true,
      },
    });

    if (!payroll) {
      throw createError("Payroll record not found", 404);
    }

    if (userRole === UserRole.EMPLOYEE && requestingEmployeeId !== payroll.employeeId) {
      throw createError("You are only authorized to view your own payroll record.", 403);
    }

    return payroll;
  }

  /**
   * Update Payroll status (e.g. approve or mark as paid)
   */
  async updatePayrollStatus(
    companyId: string,
    id: string,
    data: UpdatePayrollStatusInput,
    actorUserId: string
  ) {
    const payroll = await prisma.payroll.findFirst({
      where: { id, companyId },
    });
    if (!payroll) {
      throw createError("Payroll record not found", 404);
    }

    const updateData: Prisma.PayrollUpdateInput = {
      status: data.status,
      ...(data.status === PayrollStatus.APPROVED && {
        approvedById: actorUserId,
        approvedAt: new Date(),
      }),
      ...(data.status === PayrollStatus.PAID && {
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        paymentMethod: data.paymentMethod || payroll.paymentMethod,
        paymentReference: data.paymentReference || payroll.paymentReference,
      }),
      ...(data.remarks && { remarks: data.remarks }),
    };

    return prisma.payroll.update({
      where: { id },
      data: updateData,
      include: {
        employee: { select: { id: true, name: true, employeeCode: true } },
        payslip: true,
      },
    });
  }

  /**
   * Get employee payslips
   */
  async getEmployeePayslips(companyId: string, employeeId: string) {
    const payslips = await prisma.payslip.findMany({
      where: {
        payroll: {
          companyId,
          employeeId,
          status: { in: [PayrollStatus.PROCESSED, PayrollStatus.APPROVED, PayrollStatus.PAID] },
        },
      },
      include: {
        payroll: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                employeeCode: true,
                department: { select: { name: true } },
                designation: { select: { name: true } },
              },
            },
            department: { select: { name: true } },
            company: { select: { name: true } },
          },
        },
      },
      orderBy: {
        payroll: {
          year: "desc",
        },
      },
    });

    return payslips;
  }
}

export const payrollService = new PayrollService();
