import {
  UserRole,
  UserStatus,
  SalaryFrequency,
  PayrollStatus,
} from "../generated/prisma/client.js";

export { UserRole, UserStatus, SalaryFrequency, PayrollStatus };

export interface PayrollSummaryStats {
  totalEmployees: number;
  employeesWithSalaryStructure: number;
  totalMonthlyGross: number;
  totalMonthlyDeductions: number;
  totalNetPayroll: number;
  processedPayrolls: number;
  pendingPayrolls: number;
  paidPayrolls: number;
}

export interface PayrollAnalytics {
  monthlyExpenditure: Array<{ month: string; gross: number; net: number; deductions: number }>;
  byDepartment: Array<{ departmentId: string; departmentName: string; totalAmount: number; employeeCount: number }>;
  byStatus: Array<{ status: PayrollStatus; count: number; totalAmount: number }>;
  deductionsBreakdown: {
    pf: number;
    pt: number;
    tds: number;
    unpaidLeave: number;
    other: number;
  };
  salaryRanges: Array<{ range: string; count: number }>;
}

export interface PayrollPreviewItem {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  designationName: string;
  basicSalary: number;
  hra: number;
  conveyance: number;
  medical: number;
  special: number;
  otherAllowances: number;
  grossSalary: number;
  pfDeduction: number;
  ptDeduction: number;
  tdsDeduction: number;
  unpaidLeaveDays: number;
  unpaidLeaveDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  absentDays: number;
  alreadyProcessed: boolean;
}

