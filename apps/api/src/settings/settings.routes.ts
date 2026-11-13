import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";
import * as settingsController from "./settings.controller.js";

const router = Router();

router.use(authenticate);

// Read settings (accessible by all authenticated members for company timezone/preferences, or OWNER/HR)
router.get("/", settingsController.getAllSettings);

// Update settings (requires OWNER or HR with COMPANY_SETTINGS_MANAGE permission)
router.patch(
  "/organization",
  requirePermission(Permission.COMPANY_SETTINGS_MANAGE),
  settingsController.updateOrganizationProfile
);

router.patch(
  "/working-hours",
  requirePermission(Permission.COMPANY_SETTINGS_MANAGE),
  settingsController.updateWorkingHours
);

router.patch(
  "/attendance",
  requirePermission(Permission.COMPANY_SETTINGS_MANAGE),
  settingsController.updateAttendanceSettings
);

router.patch(
  "/leave",
  requirePermission(Permission.COMPANY_SETTINGS_MANAGE),
  settingsController.updateLeaveSettings
);

router.patch(
  "/preferences",
  requirePermission(Permission.COMPANY_SETTINGS_MANAGE),
  settingsController.updateSystemPreferences
);

export default router;

