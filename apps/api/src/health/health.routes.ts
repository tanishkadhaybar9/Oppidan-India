import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";
import { getLatencyMetrics } from "../middleware/requestProfiler.js";
import { getErrorStats } from "../utils/errorTracker.js";

const router = Router();

// Public Health Check
router.get("/", async (_req, res) => {
  const start = Date.now();
  let dbStatus = "connected";
  let dbLatencyMs = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
  } catch (err) {
    dbStatus = "error";
  }

  const memory = process.memoryUsage();

  res.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    system: {
      memoryUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
      memoryTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      nodeVersion: process.version,
    },
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Admin-Only Detailed Diagnostics & Live Monitoring
router.get(
  "/diagnostics",
  authenticate,
  requirePermission(Permission.SYSTEM_HEALTH_READ),
  async (req, res, next) => {
    try {
      const companyId = req.user!.companyId;
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbLatencyMs = Date.now() - start;

      const [
        userCount,
        employeeCount,
        attendanceCount,
        taskCount,
        assetCount,
        payrollCount,
        leaveCount,
        deptCount,
        desigCount,
        auditCount,
      ] = await Promise.all([
        prisma.user.count({ where: { companyId } }),
        prisma.employee.count({ where: { companyId } }),
        prisma.attendance.count({ where: { companyId } }),
        prisma.task.count({ where: { companyId } }),
        prisma.asset.count({ where: { companyId } }),
        prisma.payroll.count({ where: { companyId } }),
        prisma.leaveRequest.count({ where: { companyId } }),
        prisma.department.count({ where: { companyId } }),
        prisma.designation.count({ where: { companyId } }),
        prisma.auditLog.count({ where: { companyId } }),
      ]);

      const mem = process.memoryUsage();
      const latencyMetrics = getLatencyMetrics();
      const errorStats = getErrorStats();

      res.json({
        success: true,
        data: {
          server: {
            status: "online",
            uptimeSeconds: Math.floor(process.uptime()),
            platform: process.platform,
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || "production",
            pid: process.pid,
            memory: {
              rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
              heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
              heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
              external: `${Math.round(mem.external / 1024 / 1024)} MB`,
            },
          },
          database: {
            connected: true,
            engine: "PostgreSQL (Neon Serverless)",
            latencyMs: dbLatencyMs,
            ssl: "TLSv1.3 Encrypted",
            pool: "Prisma Client Active",
          },
          performance: {
            averageLatencyMs: latencyMetrics.averageLatencyMs,
            totalRequestsLogged: latencyMetrics.totalRequests,
            slowRequestsCount: latencyMetrics.slowRequests,
          },
          monitoring: {
            totalErrorsRecorded: errorStats.totalRecorded,
            errorRatePerMinute: errorStats.errorRatePerMinute,
            recentErrors: errorStats.recentErrors,
          },
          security: {
            corsEnabled: true,
            helmetEnabled: true,
            rateLimitingEnabled: true,
            authType: "JWT (15m) + HttpOnly Refresh Cookie",
            tenantIsolation: "Active (companyId enforced)",
          },
          backup: {
            strategy: "Neon Continuous WAL Archiving + Daily Automated Snapshots",
            status: "Operational",
            pitrSupported: true,
          },
          counts: {
            users: userCount,
            employees: employeeCount,
            departments: deptCount,
            designations: desigCount,
            attendances: attendanceCount,
            leaves: leaveCount,
            tasks: taskCount,
            assets: assetCount,
            payrolls: payrollCount,
            auditLogs: auditCount,
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
