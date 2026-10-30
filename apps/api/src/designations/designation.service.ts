import { prisma } from "../lib/prisma.js";
import { UserStatus } from "../generated/prisma/client.js";
import type { CreateDesignationInput, UpdateDesignationInput } from "./designation.validation.js";

export class DesignationService {
  /**
   * List all designations for a given company.
   */
  static async listDesignations(companyId: string, status?: UserStatus) {
    const where: { companyId: string; status?: UserStatus } = { companyId };
    if (status) {
      where.status = status;
    }

    return prisma.designation.findMany({
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
   * Get single designation by ID.
   */
  static async getDesignationById(companyId: string, designationId: string) {
    const designation = await prisma.designation.findFirst({
      where: {
        id: designationId,
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

    if (!designation) {
      const error = new Error("Designation not found");
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    return designation;
  }

  /**
   * Create new designation scoped to company.
   */
  static async createDesignation(companyId: string, input: CreateDesignationInput) {
    const existing = await prisma.designation.findUnique({
      where: {
        companyId_name: {
          companyId,
          name: input.name,
        },
      },
    });

    if (existing) {
      const error = new Error(`Designation "${input.name}" already exists in this company`);
      (error as unknown as { statusCode: number }).statusCode = 409;
      throw error;
    }

    return prisma.designation.create({
      data: {
        companyId,
        name: input.name,
        ...(input.description && { description: input.description }),
        status: UserStatus.ACTIVE,
      },
    });
  }

  /**
   * Update existing designation.
   */
  static async updateDesignation(companyId: string, designationId: string, input: UpdateDesignationInput) {
    await this.getDesignationById(companyId, designationId);

    if (input.name) {
      const duplicate = await prisma.designation.findFirst({
        where: {
          companyId,
          name: input.name,
          NOT: { id: designationId },
        },
      });

      if (duplicate) {
        const error = new Error(`Designation "${input.name}" already exists in this company`);
        (error as unknown as { statusCode: number }).statusCode = 409;
        throw error;
      }
    }

    return prisma.designation.update({
      where: { id: designationId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status && { status: input.status }),
      },
    });
  }
}
