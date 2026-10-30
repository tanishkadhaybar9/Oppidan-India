import type { Request, Response, NextFunction } from "express";
import { ShiftAssignmentService } from "./shiftAssignment.service.js";
import {
  createShiftAssignmentSchema,
  updateShiftAssignmentSchema,
  listShiftAssignmentsQuerySchema,
} from "./shiftAssignment.validation.js";

export class ShiftAssignmentController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = listShiftAssignmentsQuerySchema.parse(req.query);

      const assignments = await ShiftAssignmentService.listAssignments(companyId, query);

      res.status(200).json({
        success: true,
        message: "Shift assignments retrieved successfully",
        data: { assignments },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEmployeeShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const employeeId = req.params.employeeId as string;

      const assignment = await ShiftAssignmentService.getEmployeeCurrentShift(companyId, employeeId);

      res.status(200).json({
        success: true,
        message: "Employee current shift retrieved successfully",
        data: { assignment },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const validatedInput = createShiftAssignmentSchema.parse(req.body);

      const assignment = await ShiftAssignmentService.createAssignment(
        companyId,
        validatedInput,
        userId
      );

      res.status(201).json({
        success: true,
        message: "Shift assigned successfully",
        data: { assignment },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const assignmentId = req.params.id as string;
      const validatedInput = updateShiftAssignmentSchema.parse(req.body);

      const assignment = await ShiftAssignmentService.updateAssignment(
        companyId,
        assignmentId,
        validatedInput
      );

      res.status(200).json({
        success: true,
        message: "Shift assignment updated successfully",
        data: { assignment },
      });
    } catch (error) {
      next(error);
    }
  }
}
