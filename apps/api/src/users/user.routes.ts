import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/authorize.js";
import { Permission } from "../permissions/permissions.js";
import * as userController from "./user.controller.js";

const router = Router();

router.use(authenticate);

router.get("/roles/matrix", userController.getRolesMatrix);

router.get(
  "/",
  requirePermission(Permission.USER_READ),
  userController.listUsers
);

router.get(
  "/:id",
  requirePermission(Permission.USER_READ),
  userController.getUserById
);

router.post(
  "/",
  requirePermission(Permission.USER_MANAGE),
  userController.createUser
);

router.patch(
  "/:id",
  requirePermission(Permission.USER_MANAGE),
  userController.updateUser
);

router.patch(
  "/:id/status",
  requirePermission(Permission.USER_MANAGE),
  userController.updateUserStatus
);

export default router;

