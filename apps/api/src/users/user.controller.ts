import type { Request, Response, NextFunction } from "express";
import * as userService from "./user.service.js";
import { ROLE_PERMISSIONS } from "../permissions/permissions.js";

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const result = await userService.listUsers(companyId, req.query);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await userService.getUserById(companyId, id);
    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const user = await userService.createUser(companyId, req.body, req.user!);
    res.status(201).json({
      success: true,
      data: user,
      message: "User created successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await userService.updateUser(companyId, id, req.body, req.user!);
    res.json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;
    const user = await userService.updateUserStatus(companyId, id, status, req.user!);
    res.json({
      success: true,
      data: user,
      message: `User status changed to ${status}`,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRolesMatrix(_req: Request, res: Response) {
  res.json({
    success: true,
    data: {
      roles: ["OWNER", "HR", "MANAGER", "SUPERVISOR", "EMPLOYEE"],
      permissions: ROLE_PERMISSIONS,
    },
  });
}
