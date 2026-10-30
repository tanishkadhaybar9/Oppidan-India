import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";
import { AssetController } from "./asset.controller.js";

const router = Router();

// All asset routes require authentication
router.use(authenticate);

// ─── Dashboard & Personal Assets ───────────────────────────────────────────
router.get(
  "/summary",
  requirePermission(Permission.ASSET_READ_OWN),
  AssetController.getSummary
);

router.get(
  "/my",
  requirePermission(Permission.ASSET_READ_OWN),
  AssetController.getMyAssets
);

// ─── Maintenance Tickets Management ────────────────────────────────────────
// (Placed before /:id routes so "maintenance" is not interpreted as an assetId)
router.get(
  "/maintenance",
  requirePermission(Permission.ASSET_MAINTENANCE_READ),
  AssetController.listMaintenance
);

router.post(
  "/maintenance",
  requirePermission(Permission.ASSET_MAINTENANCE_MANAGE),
  AssetController.createMaintenance
);

router.get(
  "/maintenance/:ticketId",
  requirePermission(Permission.ASSET_MAINTENANCE_READ),
  AssetController.getMaintenanceById
);

router.patch(
  "/maintenance/:ticketId",
  requirePermission(Permission.ASSET_MAINTENANCE_MANAGE),
  AssetController.updateMaintenance
);

// ─── Asset Inventory CRUD ──────────────────────────────────────────────────
router.get(
  "/",
  requirePermission(Permission.ASSET_READ_OWN),
  AssetController.list
);

router.post(
  "/",
  requirePermission(Permission.ASSET_CREATE),
  AssetController.create
);

router.get(
  "/:id",
  requirePermission(Permission.ASSET_READ_OWN),
  AssetController.getById
);

router.patch(
  "/:id",
  requirePermission(Permission.ASSET_UPDATE),
  AssetController.update
);

router.put(
  "/:id",
  requirePermission(Permission.ASSET_UPDATE),
  AssetController.update
);

router.delete(
  "/:id",
  requirePermission(Permission.ASSET_DELETE),
  AssetController.delete
);

// ─── Asset Allocation Workflows ────────────────────────────────────────────
router.post(
  "/:id/assign",
  requirePermission(Permission.ASSET_ASSIGN),
  AssetController.assign
);

router.post(
  "/:id/return",
  requirePermission(Permission.ASSET_ASSIGN),
  AssetController.returnAsset
);

router.post(
  "/:id/transfer",
  requirePermission(Permission.ASSET_ASSIGN),
  AssetController.transfer
);

router.post(
  "/:id/maintenance",
  requirePermission(Permission.ASSET_MAINTENANCE_MANAGE),
  AssetController.createMaintenance
);

export default router;
