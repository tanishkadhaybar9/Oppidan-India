import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";
import { TaskController } from "./task.controller.js";

const router = Router();

// All task routes require authentication
router.use(authenticate);

// ─── Dashboard & Analytics ──────────────────────────────────────────────────
router.get(
  "/summary",
  requirePermission(Permission.TASK_READ_OWN),
  TaskController.getSummaryStats
);

router.get(
  "/analytics",
  requirePermission(Permission.TASK_ANALYTICS_READ),
  TaskController.getAnalytics
);

// ─── Personal Workspace ─────────────────────────────────────────────────────
router.get(
  "/my",
  requirePermission(Permission.TASK_READ_OWN),
  TaskController.getMyTasks
);

// ─── Task Collection CRUD ───────────────────────────────────────────────────
router.get(
  "/",
  requirePermission(Permission.TASK_READ),
  TaskController.list
);

router.post(
  "/",
  requirePermission(Permission.TASK_CREATE),
  TaskController.create
);

// ─── Specific Task Workflows ────────────────────────────────────────────────
router.get(
  "/:id",
  requirePermission(Permission.TASK_READ_OWN),
  TaskController.getById
);

router.patch(
  "/:id",
  requirePermission(Permission.TASK_UPDATE),
  TaskController.update
);

router.delete(
  "/:id",
  requirePermission(Permission.TASK_DELETE),
  TaskController.delete
);

router.post(
  "/:id/assign",
  requirePermission(Permission.TASK_ASSIGN),
  TaskController.assign
);

router.post(
  "/:id/progress",
  requirePermission(Permission.TASK_UPDATE_OWN),
  TaskController.updateProgress
);

router.post(
  "/:id/submit-review",
  requirePermission(Permission.TASK_UPDATE_OWN),
  TaskController.submitReview
);

router.post(
  "/:id/review",
  requirePermission(Permission.TASK_REVIEW),
  TaskController.review
);

router.post(
  "/:id/comments",
  requirePermission(Permission.TASK_READ_OWN),
  TaskController.addComment
);

export default router;

