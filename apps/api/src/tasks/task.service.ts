import { prisma } from "../lib/prisma.js";
import { UserRole, TaskPriority, TaskStatus } from "./task.types.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  AssignTaskInput,
  UpdateTaskProgressInput,
  SubmitReviewInput,
  ReviewTaskInput,
  AddTaskCommentInput,
  ListTasksQuery,
} from "./task.validation.js";
import type { TaskSummaryStats, TaskAnalytics } from "./task.types.js";

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

export class TaskService {
  /**
   * Auto-generate sequential task code per company: e.g. TSK-2026-0001
   */
  static async generateTaskCode(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TSK-${year}-`;
    const lastTask = await prisma.task.findFirst({
      where: {
        companyId,
        taskCode: { startsWith: prefix },
      },
      orderBy: { taskCode: "desc" },
      select: { taskCode: true },
    });

    let nextNum = 1;
    if (lastTask && lastTask.taskCode) {
      const match = lastTask.taskCode.replace(prefix, "");
      const parsed = parseInt(match, 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }

    return `${prefix}${nextNum.toString().padStart(4, "0")}`;
  }

  /**
   * Helper to resolve linked employee record for a user
   */
  static async getEmployeeForUser(companyId: string, userId: string) {
    return prisma.employee.findFirst({
      where: { companyId, userId },
      select: { id: true, name: true, role: true, departmentId: true, supervisorId: true },
    });
  }

  /**
   * Helper to send database-backed notification
   */
  static async notifyUser(
    companyId: string,
    userId: string,
    title: string,
    message: string,
    link?: string,
    type = "SYSTEM"
  ) {
    try {
      await prisma.notification.create({
        data: {
          companyId,
          userId,
          title,
          message,
          link: link || "/tasks/my",
          type,
        },
      });
    } catch (err) {
      console.warn("Failed to create notification:", err);
    }
  }

  /**
   * Create a new task
   */
  static async createTask(
    companyId: string,
    userId: string,
    userName: string,
    input: CreateTaskInput
  ) {
    const taskCode = await this.generateTaskCode(companyId);

    // Validate department if supplied
    if (input.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: input.departmentId, companyId },
      });
      if (!dept) {
        throw createError("Department not found in this company", 404, "NOT_FOUND");
      }
    }

    // Validate assigned employee if supplied
    let assignedEmpUser: { userId: string | null } | null = null;
    if (input.assignedEmployeeId) {
      const emp = await prisma.employee.findFirst({
        where: { id: input.assignedEmployeeId, companyId },
        select: { id: true, name: true, userId: true, departmentId: true },
      });
      if (!emp) {
        throw createError("Assigned employee not found in this company", 404, "NOT_FOUND");
      }
      assignedEmpUser = emp;
    }

    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          companyId,
          taskCode,
          title: input.title,
          description: input.description,
          category: input.category || "GENERAL",
          priority: input.priority || TaskPriority.MEDIUM,
          status: input.status || TaskStatus.TO_DO,
          progress: input.progress ?? 0,
          startDate: input.startDate ? new Date(input.startDate) : null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          departmentId: input.departmentId || null,
          assignedEmployeeId: input.assignedEmployeeId || null,
          createdById: userId,
          instructions: input.instructions || null,
        },
        include: {
          assignedEmployee: { select: { id: true, name: true, employeeCode: true, email: true } },
          department: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      // Record Activity
      await tx.taskActivity.create({
        data: {
          companyId,
          taskId: newTask.id,
          action: "CREATED",
          details: `Task ${taskCode} created by ${userName}`,
          actorId: userId,
          actorName: userName,
        },
      });

      if (input.assignedEmployeeId && newTask.assignedEmployee) {
        await tx.taskActivity.create({
          data: {
            companyId,
            taskId: newTask.id,
            action: "ASSIGNED",
            details: `Task assigned to ${newTask.assignedEmployee.name}`,
            actorId: userId,
            actorName: userName,
          },
        });
      }

      return newTask;
    });

    // Notify assigned employee if linked user exists
    if (assignedEmpUser?.userId && assignedEmpUser.userId !== userId) {
      await this.notifyUser(
        companyId,
        assignedEmpUser.userId,
        "New Task Assigned",
        `You have been assigned to task "${task.title}" (${task.taskCode})`,
        `/tasks/${task.id}`,
        "TASK_ASSIGNED"
      );
    }

    return task;
  }

  /**
   * List authorized tasks with filtering, search, pagination, and sorting
   */
  static async listTasks(
    companyId: string,
    query: ListTasksQuery,
    user: { id: string; role: UserRole }
  ) {
    const where: any = { companyId };

    // Scope restrictions based on role
    if (user.role === UserRole.EMPLOYEE) {
      const myEmp = await this.getEmployeeForUser(companyId, user.id);
      if (!myEmp) {
        return { tasks: [], total: 0, page: query.page, limit: query.limit, totalPages: 0 };
      }
      where.assignedEmployeeId = myEmp.id;
    } else if (user.role === UserRole.SUPERVISOR) {
      const myEmp = await this.getEmployeeForUser(companyId, user.id);
      if (myEmp) {
        // Can see tasks assigned to self or supervised employees
        const subordinates = await prisma.employee.findMany({
          where: { companyId, supervisorId: myEmp.id },
          select: { id: true },
        });
        const allowedEmpIds = [myEmp.id, ...subordinates.map((s) => s.id)];
        where.OR = [
          { assignedEmployeeId: { in: allowedEmpIds } },
          { createdById: user.id },
        ];
      }
    } else if (user.role === UserRole.MANAGER) {
      const myEmp = await this.getEmployeeForUser(companyId, user.id);
      if (myEmp && myEmp.departmentId) {
        where.OR = [
          { departmentId: myEmp.departmentId },
          { createdById: user.id },
        ];
      }
    }

    // Apply Filters
    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.category) {
      where.category = { contains: query.category, mode: "insensitive" };
    }
    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }
    if (query.assignedEmployeeId) {
      where.assignedEmployeeId = query.assignedEmployeeId;
    }
    if (query.createdById) {
      where.createdById = query.createdById;
    }

    const now = new Date();
    if (query.isOverdue) {
      where.dueDate = { lt: now };
      where.status = { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] };
    }

    if (query.startDate) {
      where.startDate = { gte: new Date(query.startDate) };
    }
    if (query.dueDate) {
      where.dueDate = { lte: new Date(query.dueDate) };
    }

    if (query.search) {
      const s = query.search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: s, mode: "insensitive" } },
            { taskCode: { contains: s, mode: "insensitive" } },
            { description: { contains: s, mode: "insensitive" } },
            { assignedEmployee: { name: { contains: s, mode: "insensitive" } } },
            { department: { name: { contains: s, mode: "insensitive" } } },
          ],
        },
      ];
    }

    const orderBy: any = {};
    if (query.sortBy === "dueDate") {
      orderBy.dueDate = query.sortOrder;
    } else if (query.sortBy === "priority") {
      orderBy.priority = query.sortOrder;
    } else if (query.sortBy === "status") {
      orderBy.status = query.sortOrder;
    } else if (query.sortBy === "title") {
      orderBy.title = query.sortOrder;
    } else {
      orderBy.createdAt = query.sortOrder;
    }

    const skip = (query.page - 1) * query.limit;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignedEmployee: {
            select: { id: true, name: true, employeeCode: true, email: true },
          },
          department: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, employeeCode: true } },
          _count: { select: { comments: true, activities: true } },
        },
        orderBy,
        skip,
        take: query.limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  /**
   * Get single task by ID or taskCode
   */
  static async getTaskById(
    companyId: string,
    taskIdOrCode: string,
    user: { id: string; role: UserRole }
  ) {
    const task = await prisma.task.findFirst({
      where: {
        companyId,
        OR: [{ id: taskIdOrCode }, { taskCode: taskIdOrCode }],
      },
      include: {
        assignedEmployee: {
          select: { id: true, name: true, employeeCode: true, email: true, departmentId: true, supervisorId: true },
        },
        department: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, employeeCode: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        activities: {
          include: {
            actor: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!task) {
      throw createError("Task not found", 404, "NOT_FOUND");
    }

    // Role-based authorization check
    if (user.role === UserRole.EMPLOYEE) {
      const myEmp = await this.getEmployeeForUser(companyId, user.id);
      if (!myEmp || task.assignedEmployeeId !== myEmp.id) {
        throw createError("Forbidden: You are only authorized to view your own assigned tasks", 403, "FORBIDDEN");
      }
    }

    return task;
  }

  /**
   * Update task fields (Title, Description, Category, Priority, Dates, Dept, Instructions)
   */
  static async updateTask(
    companyId: string,
    taskId: string,
    userId: string,
    userName: string,
    input: UpdateTaskInput
  ) {
    const existing = await prisma.task.findFirst({
      where: {
        companyId,
        OR: [{ id: taskId }, { taskCode: taskId }],
      },
      include: { assignedEmployee: true },
    });

    if (!existing) {
      throw createError("Task not found", 404, "NOT_FOUND");
    }

    const activityLogs: string[] = [];
    if (input.priority && input.priority !== existing.priority) {
      activityLogs.push(`Priority changed from ${existing.priority} to ${input.priority}`);
    }
    if (input.status && input.status !== existing.status) {
      activityLogs.push(`Status changed from ${existing.status} to ${input.status}`);
    }
    if (input.progress !== undefined && input.progress !== existing.progress) {
      activityLogs.push(`Progress updated to ${input.progress}%`);
    }
    if (input.dueDate !== undefined) {
      const newDue = input.dueDate ? new Date(input.dueDate).toLocaleDateString() : "none";
      const oldDue = existing.dueDate ? existing.dueDate.toLocaleDateString() : "none";
      if (newDue !== oldDue) {
        activityLogs.push(`Due date updated to ${newDue}`);
      }
    }
    if (input.assignedEmployeeId !== undefined && input.assignedEmployeeId !== existing.assignedEmployeeId) {
      if (input.assignedEmployeeId) {
        const newEmp = await prisma.employee.findFirst({
          where: { id: input.assignedEmployeeId, companyId },
          select: { name: true, userId: true },
        });
        activityLogs.push(`Task reassigned to ${newEmp?.name || "new employee"}`);
      } else {
        activityLogs.push(`Task unassigned`);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.task.update({
        where: { id: existing.id },
        data: {
          ...(input.title && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.category && { category: input.category }),
          ...(input.priority && { priority: input.priority }),
          ...(input.status && { status: input.status }),
          ...(input.progress !== undefined && { progress: input.progress }),
          ...(input.startDate !== undefined && {
            startDate: input.startDate ? new Date(input.startDate) : null,
          }),
          ...(input.dueDate !== undefined && {
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
          }),
          ...(input.departmentId !== undefined && { departmentId: input.departmentId }),
          ...(input.assignedEmployeeId !== undefined && {
            assignedEmployeeId: input.assignedEmployeeId,
          }),
          ...(input.instructions !== undefined && { instructions: input.instructions }),
          ...(input.status === TaskStatus.COMPLETED && { completedAt: new Date() }),
        },
        include: {
          assignedEmployee: { select: { id: true, name: true, employeeCode: true, email: true } },
          department: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, employeeCode: true } },
        },
      });

      for (const log of activityLogs) {
        await tx.taskActivity.create({
          data: {
            companyId,
            taskId: existing.id,
            action: "UPDATED",
            details: log,
            actorId: userId,
            actorName: userName,
          },
        });
      }

      return res;
    });

    // Notify newly assigned employee if reassigned
    if (
      input.assignedEmployeeId &&
      input.assignedEmployeeId !== existing.assignedEmployeeId
    ) {
      const emp = await prisma.employee.findUnique({
        where: { id: input.assignedEmployeeId },
        select: { userId: true },
      });
      if (emp?.userId && emp.userId !== userId) {
        await this.notifyUser(
          companyId,
          emp.userId,
          "Task Assigned to You",
          `You have been assigned task "${updated.title}" (${updated.taskCode})`,
          `/tasks/${updated.id}`,
          "TASK_ASSIGNED"
        );
      }
    }

    return updated;
  }

  /**
   * Assign or reassign a task
   */
  static async assignTask(
    companyId: string,
    taskId: string,
    userId: string,
    userName: string,
    input: AssignTaskInput
  ) {
    const task = await prisma.task.findFirst({
      where: { companyId, OR: [{ id: taskId }, { taskCode: taskId }] },
      include: { assignedEmployee: true },
    });
    if (!task) {
      throw createError("Task not found", 404, "NOT_FOUND");
    }

    const employee = await prisma.employee.findFirst({
      where: { id: input.assignedEmployeeId, companyId },
      select: { id: true, name: true, userId: true },
    });
    if (!employee) {
      throw createError("Target employee not found in this company", 404, "NOT_FOUND");
    }

    const isReassign = Boolean(task.assignedEmployeeId);

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.task.update({
        where: { id: task.id },
        data: {
          assignedEmployeeId: employee.id,
          ...(input.instructions !== undefined && { instructions: input.instructions }),
          ...(input.dueDate !== undefined && {
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
          }),
          ...(input.priority && { priority: input.priority }),
          status: task.status === TaskStatus.TO_DO ? TaskStatus.TO_DO : task.status,
        },
        include: {
          assignedEmployee: { select: { id: true, name: true, employeeCode: true, email: true } },
          department: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.taskActivity.create({
        data: {
          companyId,
          taskId: task.id,
          action: isReassign ? "REASSIGNED" : "ASSIGNED",
          details: isReassign
            ? `Task reassigned to ${employee.name} by ${userName}`
            : `Task assigned to ${employee.name} by ${userName}`,
          actorId: userId,
          actorName: userName,
        },
      });

      return res;
    });

    if (employee.userId && employee.userId !== userId) {
      await this.notifyUser(
        companyId,
        employee.userId,
        isReassign ? "Task Reassigned to You" : "New Task Assigned",
        `Task "${updated.title}" (${updated.taskCode}) has been assigned to you.`,
        `/tasks/${updated.id}`,
        "TASK_ASSIGNED"
      );
    }

    return updated;
  }

  /**
   * Delete a task
   */
  static async deleteTask(companyId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { companyId, OR: [{ id: taskId }, { taskCode: taskId }] },
    });
    if (!task) {
      throw createError("Task not found", 404, "NOT_FOUND");
    }

    await prisma.task.delete({
      where: { id: task.id },
    });

    return { message: `Task ${task.taskCode} deleted successfully` };
  }

  /**
   * Employee updates task progress and status
   */
  static async updateProgress(
    companyId: string,
    taskId: string,
    userId: string,
    userName: string,
    input: UpdateTaskProgressInput
  ) {
    const task = await prisma.task.findFirst({
      where: { companyId, OR: [{ id: taskId }, { taskCode: taskId }] },
      include: { assignedEmployee: true },
    });
    if (!task) {
      throw createError("Task not found", 404, "NOT_FOUND");
    }

    // Determine automatic status progression
    let newStatus = input.status || task.status;
    if (!input.status) {
      if (input.progress > 0 && task.status === TaskStatus.TO_DO) {
        newStatus = TaskStatus.IN_PROGRESS;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.task.update({
        where: { id: task.id },
        data: {
          progress: input.progress,
          status: newStatus,
        },
        include: {
          assignedEmployee: { select: { id: true, name: true, employeeCode: true, email: true } },
          department: { select: { id: true, name: true } },
        },
      });

      await tx.taskActivity.create({
        data: {
          companyId,
          taskId: task.id,
          action: "PROGRESS_UPDATED",
          details: `Progress set to ${input.progress}% (Status: ${newStatus}) by ${userName}`,
          actorId: userId,
          actorName: userName,
        },
      });

      if (input.comment && input.comment.trim()) {
        await tx.taskComment.create({
          data: {
            companyId,
            taskId: task.id,
            userId,
            content: input.comment.trim(),
          },
        });
      }

      return res;
    });

    return updated;
  }

  /**
   * Submit task for review (enters UNDER_REVIEW)
   */
  static async submitForReview(
    companyId: string,
    taskId: string,
    userId: string,
    userName: string,
    input: SubmitReviewInput
  ) {
    const task = await prisma.task.findFirst({
      where: { companyId, OR: [{ id: taskId }, { taskCode: taskId }] },
      include: {
        assignedEmployee: { select: { id: true, name: true, supervisorId: true, supervisor: { select: { userId: true } } } },
        createdBy: { select: { id: true } },
      },
    });
    if (!task) {
      throw createError("Task not found", 404, "NOT_FOUND");
    }

    if (task.status === TaskStatus.COMPLETED) {
      throw createError("Task is already completed", 400, "BAD_REQUEST");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.task.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.UNDER_REVIEW,
          progress: 100,
        },
        include: {
          assignedEmployee: { select: { id: true, name: true, employeeCode: true } },
          department: { select: { id: true, name: true } },
        },
      });

      await tx.taskActivity.create({
        data: {
          companyId,
          taskId: task.id,
          action: "SUBMITTED_FOR_REVIEW",
          details: input.notes
            ? `Submitted for review with notes: "${input.notes}"`
            : `Submitted for review by ${userName}`,
          actorId: userId,
          actorName: userName,
        },
      });

      if (input.notes && input.notes.trim()) {
        await tx.taskComment.create({
          data: {
            companyId,
            taskId: task.id,
            userId,
            content: `Submitted for review: ${input.notes.trim()}`,
          },
        });
      }

      return res;
    });

    // Notify supervisor or task creator
    const targetUserId = task.assignedEmployee?.supervisor?.userId || task.createdById;
    if (targetUserId && targetUserId !== userId) {
      await this.notifyUser(
        companyId,
        targetUserId,
        "Task Submitted for Review",
        `Task "${task.title}" (${task.taskCode}) has been submitted for review by ${userName}.`,
        `/tasks/${task.id}`,
        "TASK_REVIEW"
      );
    }

    return updated;
  }

  /**
   * Supervisor/Manager reviews task: APPROVE or RETURN
   */
  static async reviewTask(
    companyId: string,
    taskId: string,
    userId: string,
    userName: string,
    input: ReviewTaskInput
  ) {
    const task = await prisma.task.findFirst({
      where: { companyId, OR: [{ id: taskId }, { taskCode: taskId }] },
      include: {
        assignedEmployee: { select: { id: true, name: true, userId: true } },
      },
    });
    if (!task) {
      throw createError("Task not found", 404, "NOT_FOUND");
    }

    const reviewerEmp = await this.getEmployeeForUser(companyId, userId);

    const isApprove = input.action === "APPROVE";
    const newStatus = isApprove ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS;

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.task.update({
        where: { id: task.id },
        data: {
          status: newStatus,
          reviewerId: reviewerEmp?.id || null,
          reviewFeedback: input.feedback,
          ...(isApprove && { completedAt: new Date(), progress: 100 }),
          ...(!isApprove && { progress: Math.min(task.progress, 90) }),
        },
        include: {
          assignedEmployee: { select: { id: true, name: true, employeeCode: true, email: true } },
          department: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true, employeeCode: true } },
        },
      });

      await tx.taskActivity.create({
        data: {
          companyId,
          taskId: task.id,
          action: isApprove ? "APPROVED" : "RETURNED_FOR_CHANGES",
          details: isApprove
            ? `Approved completion by ${userName}: "${input.feedback}"`
            : `Returned for changes by ${userName}: "${input.feedback}"`,
          actorId: userId,
          actorName: userName,
        },
      });

      // Add feedback as a comment as well
      await tx.taskComment.create({
        data: {
          companyId,
          taskId: task.id,
          userId,
          content: `${isApprove ? "✅ Approved" : "↩️ Returned for changes"}: ${input.feedback}`,
        },
      });

      return res;
    });

    // Notify employee of review outcome
    if (task.assignedEmployee?.userId && task.assignedEmployee.userId !== userId) {
      await this.notifyUser(
        companyId,
        task.assignedEmployee.userId,
        isApprove ? "Task Approved & Completed!" : "Task Returned for Changes",
        `Review outcome for "${task.title}": ${input.feedback}`,
        `/tasks/${task.id}`,
        "TASK_REVIEW"
      );
    }

    return updated;
  }

  /**
   * Add a comment to a task
   */
  static async addComment(
    companyId: string,
    taskId: string,
    userId: string,
    userName: string,
    input: AddTaskCommentInput
  ) {
    const task = await prisma.task.findFirst({
      where: { companyId, OR: [{ id: taskId }, { taskCode: taskId }] },
    });
    if (!task) {
      throw createError("Task not found", 404, "NOT_FOUND");
    }

    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.taskComment.create({
        data: {
          companyId,
          taskId: task.id,
          userId,
          content: input.content,
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      await tx.taskActivity.create({
        data: {
          companyId,
          taskId: task.id,
          action: "COMMENT_ADDED",
          details: `Comment added by ${userName}`,
          actorId: userId,
          actorName: userName,
        },
      });

      return c;
    });

    return comment;
  }

  /**
   * Get Task Summary Statistics for Dashboard
   */
  static async getSummaryStats(
    companyId: string,
    user: { id: string; role: UserRole },
    filterScope?: { departmentId?: string; employeeId?: string }
  ): Promise<TaskSummaryStats> {
    const baseWhere: any = { companyId };

    if (user.role === UserRole.EMPLOYEE) {
      const myEmp = await this.getEmployeeForUser(companyId, user.id);
      baseWhere.assignedEmployeeId = myEmp?.id || "";
    } else if (user.role === UserRole.SUPERVISOR) {
      const myEmp = await this.getEmployeeForUser(companyId, user.id);
      if (myEmp) {
        const subordinates = await prisma.employee.findMany({
          where: { companyId, supervisorId: myEmp.id },
          select: { id: true },
        });
        const allowedEmpIds = [myEmp.id, ...subordinates.map((s) => s.id)];
        baseWhere.OR = [
          { assignedEmployeeId: { in: allowedEmpIds } },
          { createdById: user.id },
        ];
      }
    } else if (user.role === UserRole.MANAGER) {
      const myEmp = await this.getEmployeeForUser(companyId, user.id);
      if (myEmp && myEmp.departmentId) {
        baseWhere.departmentId = myEmp.departmentId;
      }
    }

    if (filterScope?.departmentId) {
      baseWhere.departmentId = filterScope.departmentId;
    }
    if (filterScope?.employeeId) {
      baseWhere.assignedEmployeeId = filterScope.employeeId;
    }

    const now = new Date();

    const [
      total,
      toDo,
      inProgress,
      underReview,
      completed,
      onHold,
      cancelled,
      overdue,
    ] = await Promise.all([
      prisma.task.count({ where: baseWhere }),
      prisma.task.count({ where: { ...baseWhere, status: TaskStatus.TO_DO } }),
      prisma.task.count({ where: { ...baseWhere, status: TaskStatus.IN_PROGRESS } }),
      prisma.task.count({ where: { ...baseWhere, status: TaskStatus.UNDER_REVIEW } }),
      prisma.task.count({ where: { ...baseWhere, status: TaskStatus.COMPLETED } }),
      prisma.task.count({ where: { ...baseWhere, status: TaskStatus.ON_HOLD } }),
      prisma.task.count({ where: { ...baseWhere, status: TaskStatus.CANCELLED } }),
      prisma.task.count({
        where: {
          ...baseWhere,
          dueDate: { lt: now },
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        },
      }),
    ]);

    return {
      total,
      toDo,
      inProgress,
      underReview,
      completed,
      onHold,
      cancelled,
      overdue,
    };
  }

  /**
   * Get Task Analytics and Charts data
   */
  static async getAnalytics(
    companyId: string,
    user: { id: string; role: UserRole },
    filterScope?: { departmentId?: string; employeeId?: string }
  ): Promise<TaskAnalytics> {
    const stats = await this.getSummaryStats(companyId, user, filterScope);
    const total = stats.total || 1;

    const baseWhere: any = { companyId };
    if (user.role === UserRole.EMPLOYEE) {
      const myEmp = await this.getEmployeeForUser(companyId, user.id);
      baseWhere.assignedEmployeeId = myEmp?.id || "";
    } else if (user.role === UserRole.SUPERVISOR) {
      const myEmp = await this.getEmployeeForUser(companyId, user.id);
      if (myEmp) {
        const subordinates = await prisma.employee.findMany({
          where: { companyId, supervisorId: myEmp.id },
          select: { id: true },
        });
        const allowedEmpIds = [myEmp.id, ...subordinates.map((s) => s.id)];
        baseWhere.OR = [
          { assignedEmployeeId: { in: allowedEmpIds } },
          { createdById: user.id },
        ];
      }
    } else if (user.role === UserRole.MANAGER) {
      const myEmp = await this.getEmployeeForUser(companyId, user.id);
      if (myEmp && myEmp.departmentId) {
        baseWhere.departmentId = myEmp.departmentId;
      }
    }

    if (filterScope?.departmentId) {
      baseWhere.departmentId = filterScope.departmentId;
    }
    if (filterScope?.employeeId) {
      baseWhere.assignedEmployeeId = filterScope.employeeId;
    }

    // 1. By Status
    const byStatus = [
      { status: TaskStatus.TO_DO, count: stats.toDo, percentage: Math.round((stats.toDo / total) * 100) },
      { status: TaskStatus.IN_PROGRESS, count: stats.inProgress, percentage: Math.round((stats.inProgress / total) * 100) },
      { status: TaskStatus.UNDER_REVIEW, count: stats.underReview, percentage: Math.round((stats.underReview / total) * 100) },
      { status: TaskStatus.COMPLETED, count: stats.completed, percentage: Math.round((stats.completed / total) * 100) },
      { status: TaskStatus.ON_HOLD, count: stats.onHold, percentage: Math.round((stats.onHold / total) * 100) },
      { status: TaskStatus.CANCELLED, count: stats.cancelled, percentage: Math.round((stats.cancelled / total) * 100) },
    ];

    // 2. By Priority
    const [lowCount, medCount, highCount, urgentCount] = await Promise.all([
      prisma.task.count({ where: { ...baseWhere, priority: TaskPriority.LOW } }),
      prisma.task.count({ where: { ...baseWhere, priority: TaskPriority.MEDIUM } }),
      prisma.task.count({ where: { ...baseWhere, priority: TaskPriority.HIGH } }),
      prisma.task.count({ where: { ...baseWhere, priority: TaskPriority.URGENT } }),
    ]);

    const byPriority = [
      { priority: TaskPriority.LOW, count: lowCount, percentage: Math.round((lowCount / total) * 100) },
      { priority: TaskPriority.MEDIUM, count: medCount, percentage: Math.round((medCount / total) * 100) },
      { priority: TaskPriority.HIGH, count: highCount, percentage: Math.round((highCount / total) * 100) },
      { priority: TaskPriority.URGENT, count: urgentCount, percentage: Math.round((urgentCount / total) * 100) },
    ];

    // 3. Department distribution
    const departments = await prisma.department.findMany({
      where: { companyId },
      select: { id: true, name: true },
    });

    const byDepartment = await Promise.all(
      departments.map(async (d) => {
        const [count, completedCount] = await Promise.all([
          prisma.task.count({ where: { ...baseWhere, departmentId: d.id } }),
          prisma.task.count({ where: { ...baseWhere, departmentId: d.id, status: TaskStatus.COMPLETED } }),
        ]);
        return {
          departmentId: d.id,
          departmentName: d.name,
          count,
          completedCount,
        };
      })
    );

    // 4. Employee distribution
    const employees = await prisma.employee.findMany({
      where: { companyId, status: "ACTIVE" },
      select: { id: true, name: true },
      take: 20,
    });

    const now = new Date();
    const byEmployee = await Promise.all(
      employees.map(async (e) => {
        const [count, completedCount, overdueCount] = await Promise.all([
          prisma.task.count({ where: { ...baseWhere, assignedEmployeeId: e.id } }),
          prisma.task.count({ where: { ...baseWhere, assignedEmployeeId: e.id, status: TaskStatus.COMPLETED } }),
          prisma.task.count({
            where: {
              ...baseWhere,
              assignedEmployeeId: e.id,
              dueDate: { lt: now },
              status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
            },
          }),
        ]);
        return {
          employeeId: e.id,
          employeeName: e.name,
          count,
          completedCount,
          overdueCount,
        };
      })
    );

    // 5. Completion trend (last 14 days)
    const completionTrend: Array<{ date: string; count: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      const count = await prisma.task.count({
        where: {
          ...baseWhere,
          status: TaskStatus.COMPLETED,
          completedAt: { gte: startOfDay, lte: endOfDay },
        },
      });
      const dateStr = startOfDay.toISOString().split("T")[0]!;
      completionTrend.push({ date: dateStr, count });
    }

    // 6. Workload distribution (active departments/employees)
    const workloadDistribution = byDepartment
      .filter((d) => d.count > 0)
      .map((d) => ({
        name: d.departmentName,
        count: d.count,
        percentage: Math.round((d.count / total) * 100),
      }));

    return {
      byStatus,
      byPriority,
      byDepartment,
      byEmployee,
      completionTrend,
      workloadDistribution,
    };
  }
}

