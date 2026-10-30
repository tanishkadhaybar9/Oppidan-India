import { UserRole } from "../generated/prisma/client.js";
export var Permission;
(function (Permission) {
    // Company & Roles
    Permission["COMPANY_SETTINGS_MANAGE"] = "company:settings:manage";
    Permission["USER_ROLE_MANAGE"] = "user:role:manage";
    // Employees
    Permission["EMPLOYEE_CREATE"] = "employee:create";
    Permission["EMPLOYEE_READ"] = "employee:read";
    Permission["EMPLOYEE_UPDATE"] = "employee:update";
    Permission["EMPLOYEE_DEACTIVATE"] = "employee:deactivate";
    Permission["EMPLOYEE_HISTORY_READ"] = "employee:history:read";
    // Departments
    Permission["DEPARTMENT_CREATE"] = "department:create";
    Permission["DEPARTMENT_READ"] = "department:read";
    Permission["DEPARTMENT_UPDATE"] = "department:update";
    // Designations
    Permission["DESIGNATION_CREATE"] = "designation:create";
    Permission["DESIGNATION_READ"] = "designation:read";
    Permission["DESIGNATION_UPDATE"] = "designation:update";
    // Supervisors
    Permission["SUPERVISOR_MAP"] = "supervisor:map";
    // Shifts (Week 3)
    Permission["SHIFT_CREATE"] = "shift:create";
    Permission["SHIFT_READ"] = "shift:read";
    Permission["SHIFT_UPDATE"] = "shift:update";
    Permission["SHIFT_DEACTIVATE"] = "shift:deactivate";
    Permission["SHIFT_ASSIGN"] = "shift:assign";
    // Attendance (Week 3)
    Permission["ATTENDANCE_CLOCK"] = "attendance:clock";
    Permission["ATTENDANCE_READ_OWN"] = "attendance:read:own";
    Permission["ATTENDANCE_READ_ALL"] = "attendance:read:all";
    Permission["ATTENDANCE_CORRECT"] = "attendance:correct";
    Permission["ATTENDANCE_CORRECTION_REQUEST"] = "attendance:correction:request";
    Permission["ATTENDANCE_CORRECTION_APPROVE"] = "attendance:correction:approve";
    Permission["ATTENDANCE_REPORT"] = "attendance:report";
    Permission["ATTENDANCE_EXPORT"] = "attendance:export";
    // Leave Management (Week 4)
    Permission["LEAVE_TYPE_MANAGE"] = "leave:type:manage";
    Permission["LEAVE_TYPE_READ"] = "leave:type:read";
    Permission["LEAVE_BALANCE_READ_OWN"] = "leave:balance:read:own";
    Permission["LEAVE_BALANCE_READ_ALL"] = "leave:balance:read:all";
    Permission["LEAVE_BALANCE_MANAGE"] = "leave:balance:manage";
    Permission["LEAVE_REQUEST_CREATE"] = "leave:request:create";
    Permission["LEAVE_REQUEST_READ_OWN"] = "leave:request:read:own";
    Permission["LEAVE_REQUEST_READ_ALL"] = "leave:request:read:all";
    Permission["LEAVE_REQUEST_CANCEL_OWN"] = "leave:request:cancel:own";
    Permission["LEAVE_APPROVE_SUPERVISOR"] = "leave:approve:supervisor";
    Permission["LEAVE_APPROVE_MANAGER"] = "leave:approve:manager";
    Permission["LEAVE_APPROVE_HR"] = "leave:approve:hr";
    Permission["HOLIDAY_MANAGE"] = "holiday:manage";
    Permission["HOLIDAY_READ"] = "holiday:read";
    Permission["NOTIFICATION_READ"] = "notification:read";
    // Assets & Inventory (Week 5)
    Permission["ASSET_CREATE"] = "asset:create";
    Permission["ASSET_READ"] = "asset:read";
    Permission["ASSET_READ_OWN"] = "asset:read:own";
    Permission["ASSET_UPDATE"] = "asset:update";
    Permission["ASSET_DELETE"] = "asset:delete";
    Permission["ASSET_ASSIGN"] = "asset:assign";
    Permission["ASSET_MAINTENANCE_MANAGE"] = "asset:maintenance:manage";
    Permission["ASSET_MAINTENANCE_READ"] = "asset:maintenance:read";
})(Permission || (Permission = {}));
export const ROLE_PERMISSIONS = {
    [UserRole.OWNER]: [
        Permission.COMPANY_SETTINGS_MANAGE,
        Permission.USER_ROLE_MANAGE,
        Permission.EMPLOYEE_CREATE,
        Permission.EMPLOYEE_READ,
        Permission.EMPLOYEE_UPDATE,
        Permission.EMPLOYEE_DEACTIVATE,
        Permission.EMPLOYEE_HISTORY_READ,
        Permission.DEPARTMENT_CREATE,
        Permission.DEPARTMENT_READ,
        Permission.DEPARTMENT_UPDATE,
        Permission.DESIGNATION_CREATE,
        Permission.DESIGNATION_READ,
        Permission.DESIGNATION_UPDATE,
        Permission.SUPERVISOR_MAP,
        Permission.SHIFT_CREATE,
        Permission.SHIFT_READ,
        Permission.SHIFT_UPDATE,
        Permission.SHIFT_DEACTIVATE,
        Permission.SHIFT_ASSIGN,
        Permission.ATTENDANCE_CLOCK,
        Permission.ATTENDANCE_READ_OWN,
        Permission.ATTENDANCE_READ_ALL,
        Permission.ATTENDANCE_CORRECT,
        Permission.ATTENDANCE_CORRECTION_REQUEST,
        Permission.ATTENDANCE_CORRECTION_APPROVE,
        Permission.ATTENDANCE_REPORT,
        Permission.ATTENDANCE_EXPORT,
        Permission.LEAVE_TYPE_MANAGE,
        Permission.LEAVE_TYPE_READ,
        Permission.LEAVE_BALANCE_READ_OWN,
        Permission.LEAVE_BALANCE_READ_ALL,
        Permission.LEAVE_BALANCE_MANAGE,
        Permission.LEAVE_REQUEST_CREATE,
        Permission.LEAVE_REQUEST_READ_OWN,
        Permission.LEAVE_REQUEST_READ_ALL,
        Permission.LEAVE_REQUEST_CANCEL_OWN,
        Permission.LEAVE_APPROVE_SUPERVISOR,
        Permission.LEAVE_APPROVE_MANAGER,
        Permission.LEAVE_APPROVE_HR,
        Permission.HOLIDAY_MANAGE,
        Permission.HOLIDAY_READ,
        Permission.NOTIFICATION_READ,
        Permission.ASSET_CREATE,
        Permission.ASSET_READ,
        Permission.ASSET_READ_OWN,
        Permission.ASSET_UPDATE,
        Permission.ASSET_DELETE,
        Permission.ASSET_ASSIGN,
        Permission.ASSET_MAINTENANCE_MANAGE,
        Permission.ASSET_MAINTENANCE_READ,
    ],
    [UserRole.HR]: [
        Permission.EMPLOYEE_CREATE,
        Permission.EMPLOYEE_READ,
        Permission.EMPLOYEE_UPDATE,
        Permission.EMPLOYEE_DEACTIVATE,
        Permission.EMPLOYEE_HISTORY_READ,
        Permission.DEPARTMENT_CREATE,
        Permission.DEPARTMENT_READ,
        Permission.DEPARTMENT_UPDATE,
        Permission.DESIGNATION_CREATE,
        Permission.DESIGNATION_READ,
        Permission.DESIGNATION_UPDATE,
        Permission.SUPERVISOR_MAP,
        Permission.SHIFT_CREATE,
        Permission.SHIFT_READ,
        Permission.SHIFT_UPDATE,
        Permission.SHIFT_DEACTIVATE,
        Permission.SHIFT_ASSIGN,
        Permission.ATTENDANCE_CLOCK,
        Permission.ATTENDANCE_READ_OWN,
        Permission.ATTENDANCE_READ_ALL,
        Permission.ATTENDANCE_CORRECT,
        Permission.ATTENDANCE_CORRECTION_REQUEST,
        Permission.ATTENDANCE_CORRECTION_APPROVE,
        Permission.ATTENDANCE_REPORT,
        Permission.ATTENDANCE_EXPORT,
        Permission.LEAVE_TYPE_MANAGE,
        Permission.LEAVE_TYPE_READ,
        Permission.LEAVE_BALANCE_READ_OWN,
        Permission.LEAVE_BALANCE_READ_ALL,
        Permission.LEAVE_BALANCE_MANAGE,
        Permission.LEAVE_REQUEST_CREATE,
        Permission.LEAVE_REQUEST_READ_OWN,
        Permission.LEAVE_REQUEST_READ_ALL,
        Permission.LEAVE_REQUEST_CANCEL_OWN,
        Permission.LEAVE_APPROVE_SUPERVISOR,
        Permission.LEAVE_APPROVE_MANAGER,
        Permission.LEAVE_APPROVE_HR,
        Permission.HOLIDAY_MANAGE,
        Permission.HOLIDAY_READ,
        Permission.NOTIFICATION_READ,
        Permission.ASSET_CREATE,
        Permission.ASSET_READ,
        Permission.ASSET_READ_OWN,
        Permission.ASSET_UPDATE,
        Permission.ASSET_DELETE,
        Permission.ASSET_ASSIGN,
        Permission.ASSET_MAINTENANCE_MANAGE,
        Permission.ASSET_MAINTENANCE_READ,
    ],
    [UserRole.MANAGER]: [
        Permission.EMPLOYEE_READ,
        Permission.EMPLOYEE_UPDATE,
        Permission.EMPLOYEE_HISTORY_READ,
        Permission.DEPARTMENT_READ,
        Permission.SHIFT_READ,
        Permission.SHIFT_ASSIGN,
        Permission.ATTENDANCE_CLOCK,
        Permission.ATTENDANCE_READ_OWN,
        Permission.ATTENDANCE_READ_ALL,
        Permission.ATTENDANCE_CORRECTION_REQUEST,
        Permission.ATTENDANCE_REPORT,
        Permission.LEAVE_TYPE_READ,
        Permission.LEAVE_BALANCE_READ_OWN,
        Permission.LEAVE_BALANCE_READ_ALL,
        Permission.LEAVE_REQUEST_CREATE,
        Permission.LEAVE_REQUEST_READ_OWN,
        Permission.LEAVE_REQUEST_READ_ALL,
        Permission.LEAVE_REQUEST_CANCEL_OWN,
        Permission.LEAVE_APPROVE_SUPERVISOR,
        Permission.LEAVE_APPROVE_MANAGER,
        Permission.HOLIDAY_READ,
        Permission.NOTIFICATION_READ,
        Permission.ASSET_READ,
        Permission.ASSET_READ_OWN,
        Permission.ASSET_MAINTENANCE_READ,
        Permission.ASSET_MAINTENANCE_MANAGE,
    ],
    [UserRole.SUPERVISOR]: [
        Permission.EMPLOYEE_READ,
        Permission.SHIFT_READ,
        Permission.ATTENDANCE_CLOCK,
        Permission.ATTENDANCE_READ_OWN,
        Permission.ATTENDANCE_READ_ALL,
        Permission.ATTENDANCE_CORRECTION_REQUEST,
        Permission.ATTENDANCE_REPORT,
        Permission.LEAVE_TYPE_READ,
        Permission.LEAVE_BALANCE_READ_OWN,
        Permission.LEAVE_REQUEST_CREATE,
        Permission.LEAVE_REQUEST_READ_OWN,
        Permission.LEAVE_REQUEST_READ_ALL,
        Permission.LEAVE_REQUEST_CANCEL_OWN,
        Permission.LEAVE_APPROVE_SUPERVISOR,
        Permission.HOLIDAY_READ,
        Permission.NOTIFICATION_READ,
        Permission.ASSET_READ,
        Permission.ASSET_READ_OWN,
        Permission.ASSET_MAINTENANCE_READ,
    ],
    [UserRole.EMPLOYEE]: [
        Permission.EMPLOYEE_READ,
        Permission.EMPLOYEE_UPDATE,
        Permission.EMPLOYEE_HISTORY_READ,
        Permission.SHIFT_READ,
        Permission.ATTENDANCE_CLOCK,
        Permission.ATTENDANCE_READ_OWN,
        Permission.ATTENDANCE_CORRECTION_REQUEST,
        Permission.ATTENDANCE_REPORT,
        Permission.LEAVE_TYPE_READ,
        Permission.LEAVE_BALANCE_READ_OWN,
        Permission.LEAVE_REQUEST_CREATE,
        Permission.LEAVE_REQUEST_READ_OWN,
        Permission.LEAVE_REQUEST_CANCEL_OWN,
        Permission.HOLIDAY_READ,
        Permission.NOTIFICATION_READ,
        Permission.ASSET_READ_OWN,
    ],
};
export const ROLE_SCOPES = {
    [UserRole.OWNER]: "COMPANY",
    [UserRole.HR]: "COMPANY",
    [UserRole.MANAGER]: "DEPARTMENT",
    [UserRole.SUPERVISOR]: "SUPERVISED",
    [UserRole.EMPLOYEE]: "OWN",
};
/**
 * Check if a role possesses a specific permission.
 */
export function hasPermission(role, permission) {
    const permissions = ROLE_PERMISSIONS[role];
    return !!permissions && permissions.includes(permission);
}
/**
 * Determine the resource scope for a user role.
 */
export function getRoleScope(role) {
    return ROLE_SCOPES[role] || "OWN";
}
//# sourceMappingURL=permissions.js.map