import { prisma } from "../lib/prisma.js";
import { UserStatus } from "../generated/prisma/client.js";
export class DepartmentService {
    /**
     * List all departments for a given company.
     */
    static async listDepartments(companyId, status) {
        const where = { companyId };
        if (status) {
            where.status = status;
        }
        return prisma.department.findMany({
            where,
            include: {
                _count: {
                    select: { employees: true },
                },
            },
            orderBy: { name: "asc" },
        });
    }
    /**
     * Get a single department by ID with company scoping.
     */
    static async getDepartmentById(companyId, departmentId) {
        const department = await prisma.department.findFirst({
            where: {
                id: departmentId,
                companyId,
            },
            include: {
                employees: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        employeeCode: true,
                        status: true,
                    },
                },
            },
        });
        if (!department) {
            const error = new Error("Department not found");
            error.statusCode = 404;
            throw error;
        }
        return department;
    }
    /**
     * Create a new department with company uniqueness.
     */
    static async createDepartment(companyId, input) {
        const existing = await prisma.department.findUnique({
            where: {
                companyId_name: {
                    companyId,
                    name: input.name,
                },
            },
        });
        if (existing) {
            const error = new Error(`Department with name "${input.name}" already exists`);
            error.statusCode = 409;
            throw error;
        }
        return prisma.department.create({
            data: {
                companyId,
                name: input.name,
                status: UserStatus.ACTIVE,
            },
        });
    }
    /**
     * Update an existing department.
     */
    static async updateDepartment(companyId, departmentId, input) {
        await this.getDepartmentById(companyId, departmentId);
        if (input.name) {
            const duplicate = await prisma.department.findFirst({
                where: {
                    companyId,
                    name: input.name,
                    NOT: { id: departmentId },
                },
            });
            if (duplicate) {
                const error = new Error(`Department with name "${input.name}" already exists`);
                error.statusCode = 409;
                throw error;
            }
        }
        return prisma.department.update({
            where: { id: departmentId },
            data: {
                ...(input.name && { name: input.name }),
                ...(input.status && { status: input.status }),
            },
        });
    }
}
//# sourceMappingURL=department.service.js.map