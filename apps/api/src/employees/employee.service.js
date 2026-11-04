import prisma from "../lib/prisma.js";
import { EmploymentStatus } from "../generated/prisma/client.js";
export class EmployeeService {
    /**
     * List employees for a company with optional filters and pagination.
     */
    static async listEmployees(companyId, query) {
        const { status, departmentId, designationId, search, page, limit } = query;
        const skip = (page - 1) * limit;
        const where = { companyId };
        if (status)
            where.status = status;
        if (departmentId)
            where.departmentId = departmentId;
        if (designationId)
            where.designationId = designationId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { employeeCode: { contains: search, mode: "insensitive" } },
            ];
        }
        const [employees, total] = await Promise.all([
            prisma.employee.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    employeeCode: true,
                    name: true,
                    email: true,
                    status: true,
                    joiningDate: true,
                    deactivatedAt: true,
                    createdAt: true,
                    department: { select: { id: true, name: true } },
                    designation: { select: { id: true, name: true } },
                    supervisor: { select: { id: true, name: true, employeeCode: true } },
                },
            }),
            prisma.employee.count({ where }),
        ]);
        return {
            employees,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get a single employee by ID, scoped to the company.
     */
    static async getEmployeeById(companyId, employeeId) {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, companyId },
            include: {
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, name: true } },
                supervisor: { select: { id: true, name: true, employeeCode: true } },
                subordinates: { select: { id: true, name: true, employeeCode: true } },
                history: {
                    orderBy: { effectiveDate: "desc" },
                    take: 20,
                    select: {
                        id: true,
                        eventType: true,
                        previousValue: true,
                        newValue: true,
                        effectiveDate: true,
                        reason: true,
                        changedBy: { select: { id: true, name: true } },
                    },
                },
            },
        });
        if (!employee) {
            const err = new Error("Employee not found.");
            err.statusCode = 404;
            err.code = "NOT_FOUND";
            throw err;
        }
        return employee;
    }
    /**
     * Create a new employee under a company.
     */
    static async createEmployee(companyId, input, createdByUserId) {
        // Check duplicate employeeCode or email within the company
        const existing = await prisma.employee.findFirst({
            where: {
                companyId,
                OR: [{ employeeCode: input.employeeCode }, { email: input.email }],
            },
        });
        if (existing) {
            const field = existing.employeeCode === input.employeeCode ? "Employee code" : "Email";
            const err = new Error(`${field} already exists in this company.`);
            err.statusCode = 409;
            err.code = "CONFLICT";
            throw err;
        }
        // Check if an active user exists with this email to link them
        const linkedUser = await prisma.user.findFirst({
            where: { email: input.email.trim().toLowerCase(), companyId },
            select: { id: true, role: true },
        });
        const employee = await prisma.employee.create({
            data: {
                companyId,
                userId: linkedUser?.id ?? null,
                role: linkedUser?.role ? String(linkedUser.role) : "EMPLOYEE",
                name: input.name,
                email: input.email,
                employeeCode: input.employeeCode,
                departmentId: input.departmentId ?? null,
                designationId: input.designationId ?? null,
                supervisorId: input.supervisorId ?? null,
                joiningDate: input.joiningDate ? new Date(input.joiningDate) : new Date(),
                status: EmploymentStatus.ACTIVE,
                history: {
                    create: {
                        companyId,
                        eventType: "CREATED",
                        newValue: input.name,
                        changedById: createdByUserId,
                    },
                },
            },
            include: {
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, name: true } },
                supervisor: { select: { id: true, name: true, employeeCode: true } },
            },
        });
        return employee;
    }
    /**
     * Update an existing employee's details.
     */
    static async updateEmployee(companyId, employeeId, input, changedByUserId) {
        const current = await prisma.employee.findFirst({
            where: { id: employeeId, companyId },
        });
        if (!current) {
            const err = new Error("Employee not found.");
            err.statusCode = 404;
            err.code = "NOT_FOUND";
            throw err;
        }
        if (input.supervisorId) {
            if (input.supervisorId === employeeId) {
                const err = new Error("An employee cannot be assigned as their own supervisor.");
                err.statusCode = 400;
                throw err;
            }
            const sup = await prisma.employee.findFirst({
                where: { id: input.supervisorId, companyId, status: EmploymentStatus.ACTIVE },
            });
            if (!sup) {
                const err = new Error("Selected supervisor was not found or is inactive.");
                err.statusCode = 400;
                throw err;
            }
            // Check for circular dependency: walk up the supervisor chain
            let currentCheckId = input.supervisorId;
            const visited = new Set([employeeId]);
            while (currentCheckId) {
                if (visited.has(currentCheckId)) {
                    const err = new Error("Circular reporting hierarchy detected. An employee cannot report to their own direct or indirect subordinate.");
                    err.statusCode = 400;
                    throw err;
                }
                visited.add(currentCheckId);
                const nextSup = await prisma.employee.findUnique({
                    where: { id: currentCheckId },
                    select: { supervisorId: true },
                });
                currentCheckId = nextSup?.supervisorId ?? null;
            }
        }
        // Build history events for each changed field
        const historyEvents = [];
        if (input.departmentId !== undefined && input.departmentId !== current.departmentId) {
            historyEvents.push({
                companyId,
                eventType: "DEPARTMENT_CHANGE",
                previousValue: current.departmentId ?? undefined,
                newValue: input.departmentId ?? undefined,
                changedById: changedByUserId,
            });
        }
        if (input.designationId !== undefined && input.designationId !== current.designationId) {
            historyEvents.push({
                companyId,
                eventType: "DESIGNATION_CHANGE",
                previousValue: current.designationId ?? undefined,
                newValue: input.designationId ?? undefined,
                changedById: changedByUserId,
            });
        }
        if (input.supervisorId !== undefined && input.supervisorId !== current.supervisorId) {
            historyEvents.push({
                companyId,
                eventType: "SUPERVISOR_CHANGE",
                previousValue: current.supervisorId ?? undefined,
                newValue: input.supervisorId ?? undefined,
                changedById: changedByUserId,
            });
        }
        const updated = await prisma.employee.update({
            where: { id: employeeId },
            data: {
                ...(input.name && { name: input.name }),
                ...(input.email && { email: input.email }),
                ...(input.departmentId !== undefined && { departmentId: input.departmentId }),
                ...(input.designationId !== undefined && { designationId: input.designationId }),
                ...(input.supervisorId !== undefined && { supervisorId: input.supervisorId }),
                ...(historyEvents.length > 0 && {
                    history: { createMany: { data: historyEvents } },
                }),
            },
            include: {
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, name: true } },
                supervisor: { select: { id: true, name: true, employeeCode: true } },
            },
        });
        return updated;
    }
    /**
     * Deactivate an employee.
     */
    static async deactivateEmployee(companyId, employeeId, reason, changedByUserId) {
        const current = await prisma.employee.findFirst({
            where: { id: employeeId, companyId },
        });
        if (!current) {
            const err = new Error("Employee not found.");
            err.statusCode = 404;
            err.code = "NOT_FOUND";
            throw err;
        }
        if (current.status === EmploymentStatus.INACTIVE) {
            const err = new Error("Employee is already inactive.");
            err.statusCode = 409;
            err.code = "CONFLICT";
            throw err;
        }
        const updated = await prisma.employee.update({
            where: { id: employeeId },
            data: {
                status: EmploymentStatus.INACTIVE,
                deactivatedAt: new Date(),
                history: {
                    create: {
                        companyId,
                        eventType: "DEACTIVATED",
                        previousValue: current.status,
                        newValue: EmploymentStatus.INACTIVE,
                        reason,
                        changedById: changedByUserId,
                    },
                },
            },
        });
        return updated;
    }
    /**
     * Get the employment history for an employee.
     */
    static async getEmployeeHistory(companyId, employeeId) {
        const exists = await prisma.employee.findFirst({
            where: { id: employeeId, companyId },
            select: { id: true },
        });
        if (!exists) {
            const err = new Error("Employee not found.");
            err.statusCode = 404;
            err.code = "NOT_FOUND";
            throw err;
        }
        const history = await prisma.employmentHistory.findMany({
            where: { employeeId, companyId },
            orderBy: { effectiveDate: "desc" },
            include: {
                changedBy: { select: { id: true, name: true } },
            },
        });
        return history;
    }
    /**
     * Get supervisory hierarchy mapping for the company.
     */
    static async getSupervisorsHierarchy(companyId) {
        const employees = await prisma.employee.findMany({
            where: { companyId, status: EmploymentStatus.ACTIVE },
            select: {
                id: true,
                employeeCode: true,
                name: true,
                email: true,
                status: true,
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, name: true } },
                supervisorId: true,
                supervisor: { select: { id: true, name: true, employeeCode: true } },
                subordinates: {
                    where: { status: EmploymentStatus.ACTIVE },
                    select: {
                        id: true,
                        name: true,
                        employeeCode: true,
                        email: true,
                        department: { select: { id: true, name: true } },
                        designation: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { name: "asc" },
        });
        const supervisors = employees.filter((e) => e.subordinates && e.subordinates.length > 0);
        const unassigned = employees.filter((e) => !e.supervisorId);
        return {
            supervisors,
            allEmployees: employees,
            totalSupervisors: supervisors.length,
            totalEmployees: employees.length,
            unassignedCount: unassigned.length,
        };
    }
}
//# sourceMappingURL=employee.service.js.map