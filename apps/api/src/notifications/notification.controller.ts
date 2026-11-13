import type { Request, Response, NextFunction } from "express";
import * as notificationService from "./notification.service.js";

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { page, limit, unreadOnly, type } = req.query;

    const result = await notificationService.listNotifications(companyId, userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      unreadOnly: unreadOnly === "true",
      type: type ? String(type) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const result = await notificationService.getUnreadCount(companyId, userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const updated = await notificationService.markAsRead(companyId, userId, id);
    res.json({
      success: true,
      data: updated,
      message: "Notification marked as read",
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;

    await notificationService.markAllAsRead(companyId, userId);
    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    await notificationService.deleteNotification(companyId, userId, id);
    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}
