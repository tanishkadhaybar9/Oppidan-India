import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import * as notificationController from "./notification.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.listNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/mark-all-read", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

export default router;

