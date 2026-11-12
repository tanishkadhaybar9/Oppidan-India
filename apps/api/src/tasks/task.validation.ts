import { z } from "zod";
import { uuidSchema, optionalUuid, nullableUuid } from "../utils/validation.js";
import { TaskPriority, TaskStatus } from "./task.types.js";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Task title must be at least 2 characters")
    .max(200, "Task title cannot exceed 200 characters")
    .trim(),
  description: z.string().max(3000).optional().nullable(),
  category: z.string().max(100).default("GENERAL"),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TO_DO),
  progress: z.number().int().min(0).max(100).default(0),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  departmentId: optionalUuid,
  assignedEmployeeId: optionalUuid,
  instructions: z.string().max(2000).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).max(200).trim().optional(),
  description: z.string().max(3000).optional().nullable(),
  category: z.string().max(100).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  departmentId: nullableUuid,
  assignedEmployeeId: nullableUuid,
  instructions: z.string().max(2000).optional().nullable(),
});

export const assignTaskSchema = z.object({
  assignedEmployeeId: uuidSchema("Valid employee ID required"),
  instructions: z.string().max(2000).optional().nullable(),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional(),
});

export const updateTaskProgressSchema = z.object({
  progress: z.number().int().min(0).max(100),
  status: z.nativeEnum(TaskStatus).optional(),
  comment: z.string().max(1000).optional().nullable(),
});

export const submitReviewSchema = z.object({
  notes: z.string().max(1000).optional().nullable(),
});

export const reviewTaskSchema = z.object({
  action: z.enum(["APPROVE", "RETURN"]),
  feedback: z.string().min(2, "Review feedback is required").max(1000),
});

export const addTaskCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000).trim(),
});

export const listTasksQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(TaskStatus).or(z.literal("")).optional(),
  priority: z.nativeEnum(TaskPriority).or(z.literal("")).optional(),
  category: z.string().optional(),
  departmentId: z.string().optional(),
  assignedEmployeeId: z.string().optional(),
  createdById: z.string().optional(),
  isOverdue: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority", "status", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 10)) : 10)),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
export type UpdateTaskProgressInput = z.infer<typeof updateTaskProgressSchema>;
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type ReviewTaskInput = z.infer<typeof reviewTaskSchema>;
export type AddTaskCommentInput = z.infer<typeof addTaskCommentSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

