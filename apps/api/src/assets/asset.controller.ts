import type { Request, Response, NextFunction } from "express";
import { AssetService } from "./asset.service.js";
import {
  createAssetSchema,
  updateAssetSchema,
  listAssetsQuerySchema,
  assignAssetSchema,
  returnAssetSchema,
  transferAssetSchema,
  createMaintenanceSchema,
  updateMaintenanceSchema,
  listMaintenanceQuerySchema,
} from "./asset.validation.js";
import { prisma } from "../lib/prisma.js";

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
}

async function getLinkedEmployeeId(userId: string, companyId: string): Promise<string | null> {
  const employee = await prisma.employee.findFirst({
    where: { userId, companyId },
    select: { id: true },
  });
  return employee ? employee.id : null;
}

export class AssetController {
  /**
   * Create a new asset.
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const input = createAssetSchema.parse(req.body);
      const asset = await AssetService.createAsset(companyId, input);

      res.status(201).json({
        success: true,
        message: "Asset created successfully",
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List assets with filtering, search, and pagination.
   */
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = listAssetsQuerySchema.parse(req.query);

      let employeeId: string | null = null;
      if (req.user!.role === "EMPLOYEE") {
        employeeId = await getLinkedEmployeeId(req.user!.id, companyId);
      }

      const result = await AssetService.listAssets(companyId, query, {
        role: req.user!.role,
        employeeId,
      });

      res.status(200).json({
        success: true,
        message: "Assets retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get summary dashboard statistics for assets.
   */
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      let employeeId: string | null = null;
      if (req.user!.role === "EMPLOYEE") {
        employeeId = await getLinkedEmployeeId(req.user!.id, companyId);
      }

      const summary = await AssetService.getSummaryStats(companyId, {
        role: req.user!.role,
        employeeId,
      });

      res.status(200).json({
        success: true,
        message: "Asset summary retrieved successfully",
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's allocated assets and assignment history.
   */
  static async getMyAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const employeeId = await getLinkedEmployeeId(req.user!.id, companyId);

      if (!employeeId) {
        res.status(200).json({
          success: true,
          message: "No linked employee record found for your user account",
          data: { currentAssets: [], history: [] },
        });
        return;
      }

      const result = await AssetService.getMyAssets(companyId, employeeId);

      res.status(200).json({
        success: true,
        message: "Your assets retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get asset details by ID.
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const assetId = getParam(req.params.id);

      let employeeId: string | null = null;
      if (req.user!.role === "EMPLOYEE") {
        employeeId = await getLinkedEmployeeId(req.user!.id, companyId);
      }

      const asset = await AssetService.getAssetById(companyId, assetId, {
        role: req.user!.role,
        employeeId,
      });

      res.status(200).json({
        success: true,
        message: "Asset retrieved successfully",
        data: { asset },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update asset information.
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const assetId = getParam(req.params.id);
      const input = updateAssetSchema.parse(req.body);

      const asset = await AssetService.updateAsset(companyId, assetId, input);

      res.status(200).json({
        success: true,
        message: "Asset updated successfully",
        data: { asset },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an asset.
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const assetId = getParam(req.params.id);

      const result = await AssetService.deleteAsset(companyId, assetId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign asset to an employee.
   */
  static async assign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const assetId = getParam(req.params.id);
      const input = assignAssetSchema.parse(req.body);

      const result = await AssetService.assignAsset(
        companyId,
        assetId,
        input,
        req.user!.id
      );

      res.status(200).json({
        success: true,
        message: "Asset assigned successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Return an assigned asset to inventory.
   */
  static async returnAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const assetId = getParam(req.params.id);
      const input = returnAssetSchema.parse(req.body);

      const result = await AssetService.returnAsset(
        companyId,
        assetId,
        input,
        req.user!.id
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.asset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transfer an asset to another employee.
   */
  static async transfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const assetId = getParam(req.params.id);
      const input = transferAssetSchema.parse(req.body);

      const result = await AssetService.transferAsset(
        companyId,
        assetId,
        input,
        req.user!.id
      );

      res.status(200).json({
        success: true,
        message: "Asset transferred successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ─── Maintenance Endpoints ───────────────────────────────────────────────

  /**
   * Create a maintenance ticket.
   */
  static async createMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      // Allow assetId from URL params or body
      const body = {
        ...req.body,
        assetId: req.params.id || req.body.assetId,
      };
      const input = createMaintenanceSchema.parse(body);

      const ticket = await AssetService.createMaintenanceTicket(
        companyId,
        input,
        req.user!.id
      );

      res.status(201).json({
        success: true,
        message: "Maintenance ticket created successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a maintenance ticket.
   */
  static async updateMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const ticketId = getParam(req.params.ticketId || req.params.id);
      const input = updateMaintenanceSchema.parse(req.body);

      const ticket = await AssetService.updateMaintenanceTicket(
        companyId,
        ticketId,
        input
      );

      res.status(200).json({
        success: true,
        message: "Maintenance ticket updated successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all maintenance tickets in the company.
   */
  static async listMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = listMaintenanceQuerySchema.parse(req.query);

      const result = await AssetService.listMaintenanceTickets(companyId, query);

      res.status(200).json({
        success: true,
        message: "Maintenance tickets retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single maintenance ticket by ID.
   */
  static async getMaintenanceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const ticketId = getParam(req.params.ticketId || req.params.id);

      const ticket = await AssetService.getMaintenanceTicket(companyId, ticketId);

      res.status(200).json({
        success: true,
        message: "Maintenance ticket retrieved successfully",
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }
}
