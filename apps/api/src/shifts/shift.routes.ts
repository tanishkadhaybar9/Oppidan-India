import { Router } from "express";
import { ShiftController } from "./shift.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(Permission.SHIFT_READ), ShiftController.list);
router.get("/:id", requirePermission(Permission.SHIFT_READ), ShiftController.getById);
router.post("/", requirePermission(Permission.SHIFT_CREATE), ShiftController.create);
router.patch("/:id", requirePermission(Permission.SHIFT_UPDATE), ShiftController.update);
router.patch("/:id/deactivate", requirePermission(Permission.SHIFT_DEACTIVATE), ShiftController.deactivate);

export default router;
