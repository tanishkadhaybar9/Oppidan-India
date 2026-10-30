import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./auth/auth.routes.js";
import departmentRoutes from "./departments/department.routes.js";
import designationRoutes from "./designations/designation.routes.js";
import employeeRoutes from "./employees/employee.routes.js";
import shiftRoutes from "./shifts/shift.routes.js";
import shiftAssignmentRoutes from "./shiftAssignments/shiftAssignment.routes.js";
import attendanceRoutes from "./attendance/attendance.routes.js";
import leaveRoutes from "./leave/leave.routes.js";
import assetRoutes from "./assets/asset.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { generalRateLimiter } from "./middleware/rateLimiter.js";

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Security headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS with credentials support (Supports dynamic localhost ports & configured frontend URL)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, Postman, mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        origin === FRONTEND_URL ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// General request rate limiter
app.use(generalRateLimiter);

// Body and Cookie Parsers
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// Health check endpoint (Preserved)
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "ERMS API is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// Resource Routes
app.use("/api/departments", departmentRoutes);
app.use("/api/designations", designationRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/shift-assignments", shiftAssignmentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/assets", assetRoutes);

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`ERMS API running on http://localhost:${PORT}`);
  });
}

export default app;