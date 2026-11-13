import { prisma } from "../lib/prisma.js";
import type { CreateAuditLogParams, ListAuditLogsQuery, AuditLogStats } from "./audit.types.js";

/**
 * Global audit logger - safely records an activity without throwing to break caller transaction.
 */
export async function logAudit(params: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId || null,
        userName: params.userName || null,
        userEmail: params.userEmail || null,
        userRole: params.userRole || null,
        action: params.action,
        module: params.module,
        recordId: params.recordId || null,
        description: params.description,
        details: params.details || undefined,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (err) {
    // Non-blocking log failure
    console.error("[AuditLog Error] Failed to write audit log:", err);
  }
}

export async function listAuditLogs(
  companyId: string,
  query: ListAuditLogsQuery
) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = { companyId };

  if (query.module) {
    where.module = query.module;
  }
  if (query.action) {
    where.action = query.action;
  }
  if (query.userId) {
    where.userId = query.userId;
  }
  if (query.startDate || query.endDate) {
    where.createdAt = {};
    if (query.startDate) {
      where.createdAt.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  if (query.search) {
    const q = query.search;
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
      { userName: { contains: q, mode: "insensitive" } },
      { userEmail: { contains: q, mode: "insensitive" } },
      { recordId: { contains: q, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAuditStats(companyId: string): Promise<AuditLogStats> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalLogs, recentCount24h, allLogs] = await Promise.all([
    prisma.auditLog.count({ where: { companyId } }),
    prisma.auditLog.count({
      where: {
        companyId,
        createdAt: { gte: oneDayAgo },
      },
    }),
    prisma.auditLog.findMany({
      where: { companyId },
      select: { module: true, action: true },
      take: 1000,
    }),
  ]);

  // Aggregate by module
  const moduleMap = new Map<string, number>();
  const actionMap = new Map<string, number>();

  for (const log of allLogs) {
    moduleMap.set(log.module, (moduleMap.get(log.module) || 0) + 1);
    actionMap.set(log.action, (actionMap.get(log.action) || 0) + 1);
  }

  const byModule = Array.from(moduleMap.entries()).map(([module, count]) => ({
    module,
    count,
  }));
  const byAction = Array.from(actionMap.entries()).map(([action, count]) => ({
    action,
    count,
  }));

  return {
    totalLogs,
    byModule,
    byAction,
    recentCount24h,
  };
}
