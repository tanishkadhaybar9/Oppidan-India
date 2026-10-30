import type { Request, Response, NextFunction } from "express";
import { DepartmentService } from "./department.service.js";
import { createDepartmentSchema, updateDepartmentSchema } from "./department.validation.js";
import { UserStatus } from "../generated/prisma/client.js";

export class DepartmentController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const statusParam = req.query.status as string | undefined;
      const status = statusParam === "ACTIVE" || statusParam === "INACTIVE" ? (statusParam as UserStatus) : undefined;

      const departments = await DepartmentService.listDepartments(companyId, status);

      res.status(200).json({
        success: true,
        message: "Departments retrieved successfully",
        data: { departments },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const departmentId = req.params.id as string;

      const department = await DepartmentService.getDepartmentById(companyId, departmentId);

      res.status(200).json({
        success: true,
        message: "Department retrieved successfully",
        data: { department },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const validatedInput = createDepartmentSchema.parse(req.body);

      const department = await DepartmentService.createDepartment(companyId, validatedInput);

      res.status(201).json({
        success: true,
        message: "Department created successfully",
        data: { department },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const departmentId = req.params.id as string;
      const validatedInput = updateDepartmentSchema.parse(req.body);

      const department = await DepartmentService.updateDepartment(companyId, departmentId, validatedInput);

      res.status(200).json({
        success: true,
        message: "Department updated successfully",
        data: { department },
      });
    } catch (error) {
      next(error);
    }
  }
}
