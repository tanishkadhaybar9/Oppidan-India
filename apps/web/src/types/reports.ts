export interface ReportsDashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  activeToday: number;
  pendingLeaves: number;
  approvedLeaves: number;
  totalAssets: number;
  assignedAssets: number;
  monthlyPayrollExpenditure: number;
  totalTasks: number;
  completedTasks: number;
}

export interface EmployeeReportData {
  summary: {
    total: number;
    active: number;
    inactive: number;
    probation: number;
    byDepartment: Array<{ name: string; count: number }>;
    byDesignation: Array<{ name: string; count: number }>;
  };
  employees: Array<{
    id: string;
    employeeCode: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    joiningDate: string;
    status: string;
    supervisorName: string;
  }>;
}

export interface AttendanceReportData {
  summary: {
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    averageWorkingHours: number;
  };
  records: Array<{
    id: string;
    employeeCode: string;
    employeeName: string;
    department: string;
    date: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    workingHours: number;
    status: string;
  }>;
}

export interface LeaveReportData {
  summary: {
    totalRequests: number;
    pending: number;
    approved: number;
    rejected: number;
    byType: Array<{ name: string; count: number }>;
    byDepartment: Array<{ name: string; count: number }>;
  };
  records: Array<{
    id: string;
    employeeCode: string;
    employeeName: string;
    department: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    daysCount: number;
    status: string;
    reason: string | null;
    appliedAt: string;
  }>;
}

export interface AssetReportData {
  summary: {
    total: number;
    available: number;
    assigned: number;
    maintenance: number;
    retired: number;
    totalValue: number;
    byCategory: Array<{ category: string; count: number }>;
  };
  records: Array<{
    id: string;
    assetCode: string;
    name: string;
    category: string;
    serialNumber: string | null;
    purchaseCost: number;
    purchaseDate: string | null;
    status: string;
    assignedTo: string | null;
    department: string | null;
  }>;
}

export interface PayrollReportData {
  summary: {
    totalPayrollAmount: number;
    totalGrossAmount: number;
    totalDeductions: number;
    paidCount: number;
    processedCount: number;
    draftCount: number;
    byDepartment: Array<{ name: string; amount: number }>;
  };
  records: Array<{
    id: string;
    payrollCode: string;
    employeeCode: string;
    employeeName: string;
    department: string;
    month: number;
    year: number;
    basicSalary: number;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    status: string;
    paymentMethod: string | null;
    paymentDate: string | null;
  }>;
}

export interface TaskReportData {
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    underReview: number;
    overdue: number;
    completionRate: number;
    byPriority: Array<{ priority: string; count: number }>;
    byDepartment: Array<{ name: string; count: number }>;
  };
  records: Array<{
    id: string;
    taskCode: string;
    title: string;
    category: string;
    priority: string;
    status: string;
    progress: number;
    assignedTo: string;
    department: string;
    dueDate: string | null;
    completedAt: string | null;
  }>;
}

export interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  employeeId?: string;
  status?: string;
  month?: number;
  year?: number;
}
