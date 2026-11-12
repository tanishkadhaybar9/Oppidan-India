import { UserRole, TaskPriority, TaskStatus } from "../generated/prisma/client.js";

export { UserRole, TaskPriority, TaskStatus };

export interface TaskSummaryStats {
  total: number;
  toDo: number;
  inProgress: number;
  underReview: number;
  completed: number;
  onHold: number;
  cancelled: number;
  overdue: number;
}

export interface TaskAnalytics {
  byStatus: Array<{ status: TaskStatus; count: number; percentage: number }>;
  byPriority: Array<{ priority: TaskPriority; count: number; percentage: number }>;
  byDepartment: Array<{ departmentId: string; departmentName: string; count: number; completedCount: number }>;
  byEmployee: Array<{ employeeId: string; employeeName: string; count: number; completedCount: number; overdueCount: number }>;
  completionTrend: Array<{ date: string; count: number }>;
  workloadDistribution: Array<{ name: string; count: number; percentage: number }>;
}
