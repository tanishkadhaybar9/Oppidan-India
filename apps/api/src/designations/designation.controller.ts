import type { Request, Response, NextFunction } from "express";
import { DesignationService } from "./designation.service.js";
import { createDesignationSchema, updateDesignationSchema } from "./designation.validation.js";
import { UserStatus } from "../generated/prisma/client.js";

export class DesignationController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const statusParam = req.query.status as string | undefined;
      const status = statusParam === "ACTIVE" || statusParam === "INACTIVE" ? (statusParam as UserStatus) : undefined;

      const designations = await DesignationService.listDesignations(companyId, status);

      res.status(200).json({
        success: true,
        message: "Designations retrieved successfully",
        data: { designations },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const designationId = req.params.id as string;

      const designation = await DesignationService.getDesignationById(companyId, designationId);

      res.status(200).json({
        success: true,
        message: "Designation retrieved successfully",
        data: { designation },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const validatedInput = createDesignationSchema.parse(req.body);

      const designation = await DesignationService.createDesignation(companyId, validatedInput);

      res.status(201).json({
        success: true,
        message: "Designation created successfully",
        data: { designation },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const designationId = req.params.id as string;
      const validatedInput = updateDesignationSchema.parse(req.body);

      const designation = await DesignationService.updateDesignation(companyId, designationId, validatedInput);

      res.status(200).json({
        success: true,
        message: "Designation updated successfully",
        data: { designation },
      });
    } catch (error) {
      next(error);
    }
  }
}
