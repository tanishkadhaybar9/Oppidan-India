import type { Request, Response, NextFunction } from "express";
import * as auditService from "./audit.service.js";

export async function listAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const query = req.query;
    const result = await auditService.listAuditLogs(companyId, query);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAuditStats(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const stats = await auditService.getAuditStats(companyId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
}

