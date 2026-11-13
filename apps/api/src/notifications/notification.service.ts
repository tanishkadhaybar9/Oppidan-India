import { prisma } from "../lib/prisma.js";

export interface CreateNotificationParams {
  companyId: string;
  userId: string;
  title: string;
  message: string;
  link?: string | null;
  type?: string; // EMPLOYEE, LEAVE, ATTENDANCE, TASK, PAYROLL, ASSET, SYSTEM
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        title: params.title,
        message: params.message,
        link: params.link || null,
        type: params.type || "SYSTEM",
        isRead: false,
      },
    });
  } catch (err) {
    console.error("[Notification Error] Failed to create notification:", err);
    return null;
  }
}

export async function listNotifications(
  companyId: string,
  userId: string,
  query: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
  }
) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = { companyId, userId };

  if (query.unreadOnly) {
    where.isRead = false;
  }
  if (query.type) {
    where.type = query.type;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { companyId, userId, isRead: false },
    }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUnreadCount(companyId: string, userId: string) {
  const count = await prisma.notification.count({
    where: { companyId, userId, isRead: false },
  });
  return { count };
}

export async function markAsRead(companyId: string, userId: string, id: string) {
  const existing = await prisma.notification.findFirst({
    where: { id, companyId, userId },
  });

  if (!existing) {
    throw new Error("Notification not found");
  }

  return prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllAsRead(companyId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { companyId, userId, isRead: false },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function deleteNotification(companyId: string, userId: string, id: string) {
  const existing = await prisma.notification.findFirst({
    where: { id, companyId, userId },
  });

  if (!existing) {
    throw new Error("Notification not found");
  }

  return prisma.notification.delete({
    where: { id },
  });
}
