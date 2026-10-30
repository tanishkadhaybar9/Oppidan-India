import type { Request, Response, NextFunction } from "express";
import { EmployeeService } from "./employee.service.js";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  deactivateEmployeeSchema,
  listEmployeesQuerySchema,
} from "./employee.validation.js";

export class EmployeeController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = listEmployeesQuerySchema.parse(req.query);

      const result = await EmployeeService.listEmployees(companyId, query);

      res.status(200).json({
        success: true,
        message: "Employees retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const employeeId = req.params.id as string;

      const employee = await EmployeeService.getEmployeeById(companyId, employeeId);

      res.status(200).json({
        success: true,
        message: "Employee retrieved successfully",
        data: { employee },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const validatedInput = createEmployeeSchema.parse(req.body);

      const employee = await EmployeeService.createEmployee(companyId, validatedInput, userId);

      res.status(201).json({
        success: true,
        message: "Employee created successfully",
        data: { employee },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const employeeId = req.params.id as string;
      const validatedInput = updateEmployeeSchema.parse(req.body);

      const employee = await EmployeeService.updateEmployee(companyId, employeeId, validatedInput, userId);

      res.status(200).json({
        success: true,
        message: "Employee updated successfully",
        data: { employee },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const employeeId = req.params.id as string;
      const { reason } = deactivateEmployeeSchema.parse(req.body);

      const employee = await EmployeeService.deactivateEmployee(companyId, employeeId, reason, userId);

      res.status(200).json({
        success: true,
        message: "Employee deactivated successfully",
        data: { employee },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const employeeId = req.params.id as string;

      const history = await EmployeeService.getEmployeeHistory(companyId, employeeId);

      res.status(200).json({
        success: true,
        message: "Employment history retrieved successfully",
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHierarchy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const result = await EmployeeService.getSupervisorsHierarchy(companyId);

      res.status(200).json({
        success: true,
        message: "Supervisor hierarchy retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

