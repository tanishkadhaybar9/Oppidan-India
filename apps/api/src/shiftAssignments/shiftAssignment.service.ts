import prisma from "../lib/prisma.js";
import { EmploymentStatus, UserStatus } from "../generated/prisma/client.js";
import type {
  CreateShiftAssignmentInput,
  UpdateShiftAssignmentInput,
  ListShiftAssignmentsQuery,
} from "./shiftAssignment.validation.js";

export class ShiftAssignmentService {
  /**
   * List shift assignments for a company.
   */
  static async listAssignments(companyId: string, query: ListShiftAssignmentsQuery) {
    const where: Record<string, unknown> = { companyId };
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.shiftId) where.shiftId = query.shiftId;

    return prisma.shiftAssignment.findMany({
      where,
      orderBy: { effectiveFrom: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            email: true,
            department: { select: { id: true, name: true } },
          },
        },
        shift: true,
        assignedBy: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Get an employee's active shift assignment.
   */
  static async getEmployeeCurrentShift(companyId: string, employeeId: string) {
    const now = new Date();

    const assignment = await prisma.shiftAssignment.findFirst({
      where: {
        companyId,
        employeeId,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      include: {
        shift: true,
      },
      orderBy: { effectiveFrom: "desc" },
    });

    return assignment;
  }

  /**
   * Assign an employee to a shift with conflict validation and transaction safety.
   */
  static async createAssignment(
    companyId: string,
    input: CreateShiftAssignmentInput,
    assignedByUserId: string
  ) {
    // 1. Verify Employee exists in company and is ACTIVE
    const employee = await prisma.employee.findFirst({
      where: { id: input.employeeId, companyId },
    });

    if (!employee) {
      const err = new Error("Employee not found in company.");
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as NodeJS.ErrnoException).code = "NOT_FOUND";
      throw err;
    }

    if (employee.status !== EmploymentStatus.ACTIVE) {
      const err = new Error("Cannot assign shift to an inactive employee.");
      (err as unknown as { statusCode: number; code: string }).statusCode = 409;
      (err as NodeJS.ErrnoException).code = "CONFLICT";
      throw err;
    }

    // 2. Verify Shift exists in company and is ACTIVE
    const shift = await prisma.shift.findFirst({
      where: { id: input.shiftId, companyId },
    });

    if (!shift) {
      const err = new Error("Shift not found in company.");
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as NodeJS.ErrnoException).code = "NOT_FOUND";
      throw err;
    }

    if (shift.status !== UserStatus.ACTIVE) {
      const err = new Error("Cannot assign employee to an inactive shift.");
      (err as unknown as { statusCode: number; code: string }).statusCode = 409;
      (err as NodeJS.ErrnoException).code = "CONFLICT";
      throw err;
    }

    const effectiveFromDate = new Date(input.effectiveFrom);
    const effectiveToDate = input.effectiveTo ? new Date(input.effectiveTo) : null;

    if (effectiveToDate && effectiveToDate < effectiveFromDate) {
      const err = new Error("effectiveTo date cannot be earlier than effectiveFrom date.");
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      throw err;
    }

    // 3. Conflict Validation: Check for overlapping assignments for this employee
    const existingAssignments = await prisma.shiftAssignment.findMany({
      where: {
        companyId,
        employeeId: input.employeeId,
      },
    });

    for (const existing of existingAssignments) {
      const exStart = existing.effectiveFrom;
      const exEnd = existing.effectiveTo;

      // Overlap condition:
      // (exEnd is null OR exEnd >= newStart) AND (newEnd is null OR exStart <= newEnd)
      const overlaps =
        (exEnd === null || exEnd >= effectiveFromDate) &&
        (effectiveToDate === null || exStart <= effectiveToDate);

      if (overlaps) {
        const err = new Error("Employee already has an overlapping active shift assignment.");
        (err as unknown as { statusCode: number; code: string }).statusCode = 409;
        (err as NodeJS.ErrnoException).code = "CONFLICT";
        throw err;
      }
    }

    // 4. Create assignment
    return prisma.shiftAssignment.create({
      data: {
        companyId,
        employeeId: input.employeeId,
        shiftId: input.shiftId,
        effectiveFrom: effectiveFromDate,
        effectiveTo: effectiveToDate,
        assignedById: assignedByUserId,
      },
      include: {
        employee: {
          select: { id: true, name: true, employeeCode: true },
        },
        shift: true,
      },
    });
  }

  /**
   * Update shift assignment effective dates.
   */
  static async updateAssignment(
    companyId: string,
    assignmentId: string,
    input: UpdateShiftAssignmentInput
  ) {
    const existing = await prisma.shiftAssignment.findFirst({
      where: { id: assignmentId, companyId },
    });

    if (!existing) {
      const err = new Error("Shift assignment not found.");
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as NodeJS.ErrnoException).code = "NOT_FOUND";
      throw err;
    }

    const effectiveToDate =
      input.effectiveTo !== undefined
        ? input.effectiveTo
          ? new Date(input.effectiveTo)
          : null
        : existing.effectiveTo;

    if (effectiveToDate && effectiveToDate < existing.effectiveFrom) {
      const err = new Error("effectiveTo date cannot be earlier than effectiveFrom date.");
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      throw err;
    }

    return prisma.shiftAssignment.update({
      where: { id: assignmentId },
      data: { effectiveTo: effectiveToDate },
      include: { shift: true, employee: true },
    });
  }
}
