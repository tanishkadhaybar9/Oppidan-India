import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { payrollService } from "./payroll.service.js";
import {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  previewPayrollQuerySchema,
  processPayrollSchema,
  updatePayrollStatusSchema,
  listSalaryStructuresQuerySchema,
  listPayrollsQuerySchema,
} from "./payroll.validation.js";

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
}

async function getRequestingEmployeeId(userId: string): Promise<string | undefined> {
  const emp = await prisma.employee.findUnique({
    where: { userId },
    select: { id: true },
  });
  return emp?.id;
}

export class PayrollController {
  /**
   * GET /api/payroll/summary
   */
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const month = req.query.month ? Number(req.query.month) : undefined;
      const year = req.query.year ? Number(req.query.year) : undefined;

      const summary = await payrollService.getPayrollSummary(companyId, month, year);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payroll/analytics
   */
  static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const year = req.query.year ? Number(req.query.year) : undefined;

      const analytics = await payrollService.getPayrollAnalytics(companyId, year);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payroll/salary-structures
   */
  static async listSalaryStructures(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = listSalaryStructuresQuerySchema.parse(req.query);

      const result = await payrollService.listSalaryStructures(companyId, query);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payroll/salary-structures/employee/:employeeId
   */
  static async getSalaryStructureByEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const employeeId = getParam(req.params.employeeId);
      const userRole = req.user!.role;
      const requestingEmployeeId = await getRequestingEmployeeId(req.user!.id);

      const structure = await payrollService.getSalaryStructureByEmployee(
        companyId,
        employeeId,
        userRole,
        requestingEmployeeId
      );

      res.json({
        success: true,
        data: structure,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payroll/salary-structures
   */
  static async createSalaryStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const actorUserId = req.user!.id;
      const data = createSalaryStructureSchema.parse(req.body);

      const structure = await payrollService.createSalaryStructure(companyId, data, actorUserId);

      res.status(201).json({
        success: true,
        message: "Salary structure created successfully",
        data: structure,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/payroll/salary-structures/:id
   */
  static async updateSalaryStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const id = getParam(req.params.id);
      const actorUserId = req.user!.id;
      const data = updateSalaryStructureSchema.parse(req.body);

      const updated = await payrollService.updateSalaryStructure(companyId, id, data, actorUserId);

      res.json({
        success: true,
        message: "Salary structure updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payroll/preview
   */
  static async previewPayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = previewPayrollQuerySchema.parse(req.query);

      const preview = await payrollService.previewPayroll(companyId, query);

      res.json({
        success: true,
        data: preview,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payroll/process
   */
  static async processPayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const actorUserId = req.user!.id;
      const data = processPayrollSchema.parse(req.body);

      const result = await payrollService.processPayroll(companyId, data, actorUserId);

      res.status(201).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payroll
   */
  static async listPayrolls(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = listPayrollsQuerySchema.parse(req.query);
      const userRole = req.user!.role;
      const requestingEmployeeId = await getRequestingEmployeeId(req.user!.id);

      const result = await payrollService.listPayrolls(companyId, query, userRole, requestingEmployeeId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payroll/my
   */
  static async getMyPayrolls(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const employeeId = await getRequestingEmployeeId(req.user!.id);
      if (!employeeId) {
        res.status(403).json({ success: false, message: "Employee profile not found" });
        return;
      }

      const query = listPayrollsQuerySchema.parse(req.query);
      const result = await payrollService.listPayrolls(
        companyId,
        { ...query, employeeId },
        req.user!.role,
        employeeId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payroll/payslips/my
   */
  static async getMyPayslips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const employeeId = await getRequestingEmployeeId(req.user!.id);
      if (!employeeId) {
        res.status(403).json({ success: false, message: "Employee profile not found" });
        return;
      }

      const payslips = await payrollService.getEmployeePayslips(companyId, employeeId);

      res.json({
        success: true,
        data: payslips,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payroll/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const id = getParam(req.params.id);
      const userRole = req.user!.role;
      const requestingEmployeeId = await getRequestingEmployeeId(req.user!.id);

      const payroll = await payrollService.getPayrollById(companyId, id, userRole, requestingEmployeeId);

      res.json({
        success: true,
        data: payroll,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/payroll/:id/status
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const id = getParam(req.params.id);
      const actorUserId = req.user!.id;
      const data = updatePayrollStatusSchema.parse(req.body);

      const updated = await payrollService.updatePayrollStatus(companyId, id, data, actorUserId);

      res.json({
        success: true,
        message: "Payroll status updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
