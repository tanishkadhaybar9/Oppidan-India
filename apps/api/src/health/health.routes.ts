import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";

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

// Admin-Only Detailed Diagnostics
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

      const [userCount, employeeCount, attendanceCount, taskCount, assetCount] =
        await Promise.all([
          prisma.user.count({ where: { companyId } }),
          prisma.employee.count({ where: { companyId } }),
          prisma.attendance.count({ where: { companyId } }),
          prisma.task.count({ where: { companyId } }),
          prisma.asset.count({ where: { companyId } }),
        ]);

      const mem = process.memoryUsage();

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
          },
          database: {
            engine: "PostgreSQL (Neon)",
            status: "connected",
            latencyMs: dbLatencyMs,
          },
          memory: {
            heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
            rssMB: Math.round(mem.rss / 1024 / 1024),
          },
          security: {
            corsEnabled: true,
            helmetEnabled: true,
            rateLimitingEnabled: true,
            authType: "JWT + HttpOnly Cookie",
          },
          statistics: {
            userCount,
            employeeCount,
            attendanceCount,
            taskCount,
            assetCount,
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
