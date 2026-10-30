import { Router } from "express";
import { ShiftAssignmentController } from "./shiftAssignment.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(Permission.SHIFT_READ), ShiftAssignmentController.list);
router.get("/employee/:employeeId", requirePermission(Permission.SHIFT_READ), ShiftAssignmentController.getEmployeeShift);
router.post("/", requirePermission(Permission.SHIFT_ASSIGN), ShiftAssignmentController.create);
router.patch("/:id", requirePermission(Permission.SHIFT_ASSIGN), ShiftAssignmentController.update);

export default router;
