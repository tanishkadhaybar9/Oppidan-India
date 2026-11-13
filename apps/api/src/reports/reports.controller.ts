import type { Request, Response, NextFunction } from "express";
import { reportsService } from "./reports.service.js";
import { reportFilterQuerySchema } from "./reports.validation.js";

export class ReportsController {
  /**
   * GET /api/reports/dashboard
   */
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const stats = await reportsService.getDashboardStats(companyId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/employees
   */
  static async getEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = reportFilterQuerySchema.parse(req.query);

      const report = await reportsService.getEmployeeReport(companyId, query);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/attendance
   */
  static async getAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = reportFilterQuerySchema.parse(req.query);

      const report = await reportsService.getAttendanceReport(companyId, query);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/leaves
   */
  static async getLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = reportFilterQuerySchema.parse(req.query);

      const report = await reportsService.getLeaveReport(companyId, query);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/assets
   */
  static async getAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = reportFilterQuerySchema.parse(req.query);

      const report = await reportsService.getAssetReport(companyId, query);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/payroll
   */
  static async getPayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = reportFilterQuerySchema.parse(req.query);

      const report = await reportsService.getPayrollReport(companyId, query);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/tasks
   */
  static async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = reportFilterQuerySchema.parse(req.query);

      const report = await reportsService.getTaskReport(companyId, query);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}

