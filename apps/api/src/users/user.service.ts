import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../utils/password.js";
import { logAudit } from "../audit/audit.service.js";
import { UserRole, UserStatus } from "../generated/prisma/client.js";
import type { CreateUserPayload, UpdateUserPayload, ListUsersQuery } from "./user.types.js";

export async function listUsers(companyId: string, query: ListUsersQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = { companyId };

  if (query.role) {
    where.role = query.role as UserRole;
  }
  if (query.status) {
    where.status = query.status as UserStatus;
  }
  if (query.search) {
    const q = query.search;
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        companyId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserById(companyId: string, id: string) {
  const user = await prisma.user.findFirst({
    where: { id, companyId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      companyId: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      employee: {
        select: {
          id: true,
          employeeCode: true,
          name: true,
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function createUser(
  companyId: string,
  payload: CreateUserPayload,
  adminUser?: { id: string; name: string; email: string; role: string }
) {
  const normalizedEmail = payload.email.trim().toLowerCase();

  // Check unique email
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    const error = new Error("A user with this email address already exists.");
    (error as any).statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(payload.password);

  const user = await prisma.user.create({
    data: {
      companyId,
      name: payload.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: payload.role || UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      companyId: true,
      createdAt: true,
    },
  });

  // Link to employee if requested
  if (payload.employeeId) {
    await prisma.employee.update({
      where: { id: payload.employeeId },
      data: { userId: user.id },
    }).catch(() => {});
  }

  if (adminUser) {
    await logAudit({
      companyId,
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: "CREATE",
      module: "USER",
      recordId: user.id,
      description: `Created new user account "${user.name}" (${user.email}) with role ${user.role}`,
      details: { role: user.role, email: user.email },
    });
  }

  return user;
}

export async function updateUser(
  companyId: string,
  id: string,
  payload: UpdateUserPayload,
  adminUser?: { id: string; name: string; email: string; role: string }
) {
  const targetUser = await prisma.user.findFirst({
    where: { id, companyId },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  // Safety check: Prevent changing role or status of the last active OWNER
  if (targetUser.role === UserRole.OWNER) {
    if (
      (payload.role && payload.role !== UserRole.OWNER) ||
      (payload.status && payload.status === UserStatus.INACTIVE)
    ) {
      const activeOwnerCount = await prisma.user.count({
        where: {
          companyId,
          role: UserRole.OWNER,
          status: UserStatus.ACTIVE,
        },
      });

      if (activeOwnerCount <= 1) {
        const error = new Error(
          "Operation blocked: Cannot modify or deactivate the organization's sole active OWNER account."
        );
        (error as any).statusCode = 400;
        throw error;
      }
    }
  }

  const updateData: any = {};
  if (payload.name) updateData.name = payload.name.trim();
  if (payload.email) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (normalizedEmail !== targetUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (emailTaken) {
        const error = new Error("The specified email address is already registered to another user.");
        (error as any).statusCode = 409;
        throw error;
      }
      updateData.email = normalizedEmail;
    }
  }
  if (payload.role) updateData.role = payload.role;
  if (payload.status) updateData.status = payload.status;
  if (payload.password) {
    updateData.passwordHash = await hashPassword(payload.password);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  if (adminUser) {
    await logAudit({
      companyId,
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: "UPDATE",
      module: "USER",
      recordId: updated.id,
      description: `Updated profile & access settings for user "${updated.name}" (${updated.email})`,
      details: {
        role: updated.role,
        status: updated.status,
        changedFields: Object.keys(updateData),
      },
    });
  }

  return updated;
}

export async function updateUserStatus(
  companyId: string,
  id: string,
  status: UserStatus,
  adminUser?: { id: string; name: string; email: string; role: string }
) {
  return updateUser(companyId, id, { status }, adminUser);
}
