import type { Request, Response, NextFunction } from "express";
import { TaskService } from "./task.service.js";
import {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  updateTaskProgressSchema,
  submitReviewSchema,
  reviewTaskSchema,
  addTaskCommentSchema,
  listTasksQuerySchema,
} from "./task.validation.js";

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
}

export class TaskController {
  /**
   * Create task
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const userName = req.user!.name || "User";
      const input = createTaskSchema.parse(req.body);

      const task = await TaskService.createTask(companyId, userId, userName, input);

      res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List tasks with filters & pagination
   */
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = listTasksQuerySchema.parse(req.query);

      const result = await TaskService.listTasks(companyId, query, {
        id: req.user!.id,
        role: req.user!.role,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get employee's assigned tasks
   */
  static async getMyTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = listTasksQuerySchema.parse(req.query);

      const myEmp = await TaskService.getEmployeeForUser(companyId, req.user!.id);
      if (!myEmp) {
        res.status(200).json({
          success: true,
          data: { tasks: [], total: 0, page: 1, limit: query.limit, totalPages: 0 },
        });
        return;
      }

      query.assignedEmployeeId = myEmp.id;

      const result = await TaskService.listTasks(companyId, query, {
        id: req.user!.id,
        role: req.user!.role,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single task
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const taskId = getParam(req.params.id);

      const task = await TaskService.getTaskById(companyId, taskId, {
        id: req.user!.id,
        role: req.user!.role,
      });

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update task
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const taskId = getParam(req.params.id);
      const userId = req.user!.id;
      const userName = req.user!.name || "User";
      const input = updateTaskSchema.parse(req.body);

      const task = await TaskService.updateTask(companyId, taskId, userId, userName, input);

      res.status(200).json({
        success: true,
        message: "Task updated successfully",
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete task
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const taskId = getParam(req.params.id);

      const result = await TaskService.deleteTask(companyId, taskId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign or reassign task
   */
  static async assign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const taskId = getParam(req.params.id);
      const userId = req.user!.id;
      const userName = req.user!.name || "User";
      const input = assignTaskSchema.parse(req.body);

      const task = await TaskService.assignTask(companyId, taskId, userId, userName, input);

      res.status(200).json({
        success: true,
        message: "Task assigned successfully",
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update task progress (employee action)
   */
  static async updateProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const taskId = getParam(req.params.id);
      const userId = req.user!.id;
      const userName = req.user!.name || "User";
      const input = updateTaskProgressSchema.parse(req.body);

      const task = await TaskService.updateProgress(companyId, taskId, userId, userName, input);

      res.status(200).json({
        success: true,
        message: "Task progress updated successfully",
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit task for review
   */
  static async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const taskId = getParam(req.params.id);
      const userId = req.user!.id;
      const userName = req.user!.name || "User";
      const input = submitReviewSchema.parse(req.body);

      const task = await TaskService.submitForReview(companyId, taskId, userId, userName, input);

      res.status(200).json({
        success: true,
        message: "Task submitted for supervisor review",
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supervisor/Manager reviews task (approve or return)
   */
  static async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const taskId = getParam(req.params.id);
      const userId = req.user!.id;
      const userName = req.user!.name || "Supervisor";
      const input = reviewTaskSchema.parse(req.body);

      const task = await TaskService.reviewTask(companyId, taskId, userId, userName, input);

      res.status(200).json({
        success: true,
        message: input.action === "APPROVE" ? "Task approved and completed" : "Task returned for changes",
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add comment to task
   */
  static async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const taskId = getParam(req.params.id);
      const userId = req.user!.id;
      const userName = req.user!.name || "User";
      const input = addTaskCommentSchema.parse(req.body);

      const comment = await TaskService.addComment(companyId, taskId, userId, userName, input);

      res.status(201).json({
        success: true,
        message: "Comment added successfully",
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Task Summary Statistics for Dashboard
   */
  static async getSummaryStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const departmentId = req.query.departmentId as string | undefined;
      const employeeId = req.query.employeeId as string | undefined;

      const stats = await TaskService.getSummaryStats(
        companyId,
        { id: req.user!.id, role: req.user!.role },
        { departmentId, employeeId }
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Task Analytics
   */
  static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const departmentId = req.query.departmentId as string | undefined;
      const employeeId = req.query.employeeId as string | undefined;

      const analytics = await TaskService.getAnalytics(
        companyId,
        { id: req.user!.id, role: req.user!.role },
        { departmentId, employeeId }
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}

