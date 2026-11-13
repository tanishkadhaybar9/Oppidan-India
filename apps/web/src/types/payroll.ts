export type SalaryFrequency = "MONTHLY" | "BI_WEEKLY" | "WEEKLY";
export type PayrollStatus = "DRAFT" | "PROCESSED" | "APPROVED" | "PAID" | "CANCELLED";

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
  deductionsBreakdown: { pf: number; pt: number; tds: number; unpaidLeave: number; other: number };
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

export interface SalaryStructure {
  id: string;
  employeeId: string;
  basicSalary: number;
  hra: number;
  conveyance: number;
  medical: number;
  special: number;
  otherAllowances: number;
  grossSalary: number;
  pfEmployee: number;
  pfEmployer: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  netSalary: number;
  frequency: SalaryFrequency;
  effectiveFrom: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    name: string;
    department?: { name: string };
    designation?: { name: string };
  };
}

export interface Payroll {
  id: string;
  payrollCode: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  conveyance: number;
  medical: number;
  special: number;
  otherAllowances: number;
  grossSalary: number;
  pfEmployee: number;
  pfEmployer: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  absentDays: number;
  status: PayrollStatus;
  paymentDate: string | null;
  paymentMethod: string | null;
  notes: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    name: string;
    department?: { name: string };
    designation?: { name: string };
  };
}

export interface Payslip {
  id: string;
  payrollId: string;
  generatedAt: string;
  payroll?: Payroll;
}

export interface CreateSalaryStructurePayload {
  employeeId: string;
  basicSalary: number;
  hra?: number;
  conveyance?: number;
  medical?: number;
  special?: number;
  otherAllowances?: number;
  pfEmployee?: number;
  pfEmployer?: number;
  professionalTax?: number;
  tds?: number;
  otherDeductions?: number;
  frequency?: SalaryFrequency;
  effectiveFrom?: string;
}

export interface UpdateSalaryStructurePayload {
  basicSalary?: number;
  hra?: number;
  conveyance?: number;
  medical?: number;
  special?: number;
  otherAllowances?: number;
  pfEmployee?: number;
  pfEmployer?: number;
  professionalTax?: number;
  tds?: number;
  otherDeductions?: number;
  frequency?: SalaryFrequency;
  status?: string;
}

export interface ProcessPayrollPayload {
  month: number;
  year: number;
  departmentId?: string;
  employeeIds?: string[];
  notes?: string;
}
