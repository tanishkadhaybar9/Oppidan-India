import { Router } from "express";
import { DesignationController } from "./designation.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(Permission.DESIGNATION_READ), DesignationController.list);
router.get("/:id", requirePermission(Permission.DESIGNATION_READ), DesignationController.getById);
router.post("/", requirePermission(Permission.DESIGNATION_CREATE), DesignationController.create);
router.patch("/:id", requirePermission(Permission.DESIGNATION_UPDATE), DesignationController.update);

export default router;
