import type { Request, Response, NextFunction } from "express";
import * as settingsService from "./settings.service.js";

export async function getAllSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const settings = await settingsService.getCompanySettings(companyId);
    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateOrganizationProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const updated = await settingsService.updateOrganizationProfile(
      companyId,
      req.body,
      req.user!
    );
    res.json({
      success: true,
      data: updated,
      message: "Organization profile updated successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function updateWorkingHours(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const updated = await settingsService.updateWorkingHours(
      companyId,
      req.body,
      req.user!
    );
    res.json({
      success: true,
      data: updated,
      message: "Working hours updated successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAttendanceSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const updated = await settingsService.updateAttendanceSettings(
      companyId,
      req.body,
      req.user!
    );
    res.json({
      success: true,
      data: updated,
      message: "Attendance settings updated successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function updateLeaveSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const updated = await settingsService.updateLeaveSettings(
      companyId,
      req.body,
      req.user!
    );
    res.json({
      success: true,
      data: updated,
      message: "Leave settings updated successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSystemPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const updated = await settingsService.updateSystemPreferences(
      companyId,
      req.body,
      req.user!
    );
    res.json({
      success: true,
      data: updated,
      message: "System preferences updated successfully",
    });
  } catch (err) {
    next(err);
  }
}

