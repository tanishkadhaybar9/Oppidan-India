import { Router } from "express";
import { EmployeeController } from "./employee.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";
const router = Router();
router.use(authenticate);
router.get("/", requirePermission(Permission.EMPLOYEE_READ), EmployeeController.list);
router.get("/supervisors/hierarchy", requirePermission(Permission.EMPLOYEE_READ), EmployeeController.getHierarchy);
router.get("/:id", requirePermission(Permission.EMPLOYEE_READ), EmployeeController.getById);
router.get("/:id/history", requirePermission(Permission.EMPLOYEE_HISTORY_READ), EmployeeController.getHistory);
router.post("/", requirePermission(Permission.EMPLOYEE_CREATE), EmployeeController.create);
router.patch("/:id", requirePermission(Permission.EMPLOYEE_UPDATE), EmployeeController.update);
router.patch("/:id/deactivate", requirePermission(Permission.EMPLOYEE_DEACTIVATE), EmployeeController.deactivate);
export default router;
//# sourceMappingURL=employee.routes.js.map