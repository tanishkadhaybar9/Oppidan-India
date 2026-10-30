import { Router } from "express";
import { DepartmentController } from "./department.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(Permission.DEPARTMENT_READ), DepartmentController.list);
router.get("/:id", requirePermission(Permission.DEPARTMENT_READ), DepartmentController.getById);
router.post("/", requirePermission(Permission.DEPARTMENT_CREATE), DepartmentController.create);
router.patch("/:id", requirePermission(Permission.DEPARTMENT_UPDATE), DepartmentController.update);

export default router;
