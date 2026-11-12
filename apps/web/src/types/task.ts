export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskStatus =
  | "TO_DO"
  | "IN_PROGRESS"
  | "UNDER_REVIEW"
  | "COMPLETED"
  | "ON_HOLD"
  | "CANCELLED";

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  content: string;
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  action: string;
  details?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  actor?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
}

export interface Task {
  id: string;
  taskCode: string;
  title: string;
  description?: string | null;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  assignedEmployeeId?: string | null;
  assignedEmployee?: {
    id: string;
    name: string;
    employeeCode: string;
    email: string;
  } | null;
  createdById?: string | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  reviewerId?: string | null;
  reviewer?: {
    id: string;
    name: string;
    employeeCode: string;
  } | null;
  instructions?: string | null;
  reviewFeedback?: string | null;
  comments?: TaskComment[];
  activities?: TaskActivity[];
  _count?: {
    comments: number;
    activities: number;
  };
  createdAt: string;
  updatedAt: string;
}

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
  byDepartment: Array<{
    departmentId: string;
    departmentName: string;
    count: number;
    completedCount: number;
  }>;
  byEmployee: Array<{
    employeeId: string;
    employeeName: string;
    count: number;
    completedCount: number;
    overdueCount: number;
  }>;
  completionTrend: Array<{ date: string; count: number }>;
  workloadDistribution: Array<{ name: string; count: number; percentage: number }>;
}

export interface PaginatedTasks {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  category?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  progress?: number;
  startDate?: string | null;
  dueDate?: string | null;
  departmentId?: string | null;
  assignedEmployeeId?: string | null;
  instructions?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  category?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  progress?: number;
  startDate?: string | null;
  dueDate?: string | null;
  departmentId?: string | null;
  assignedEmployeeId?: string | null;
  instructions?: string | null;
}

export interface AssignTaskPayload {
  assignedEmployeeId: string;
  instructions?: string | null;
  dueDate?: string | null;
  priority?: TaskPriority;
}

export interface UpdateProgressPayload {
  progress: number;
  status?: TaskStatus;
  comment?: string | null;
}

export interface SubmitReviewPayload {
  notes?: string | null;
}

export interface ReviewTaskPayload {
  action: "APPROVE" | "RETURN";
  feedback: string;
}

export interface AddCommentPayload {
  content: string;
}

export interface ListTasksParams {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  departmentId?: string;
  assignedEmployeeId?: string;
  createdById?: string;
  isOverdue?: boolean;
  startDate?: string;
  dueDate?: string;
  sortBy?: "createdAt" | "dueDate" | "priority" | "status" | "title";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

