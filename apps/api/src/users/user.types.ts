import type { UserRole, UserStatus } from "../generated/prisma/client.js";

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  employeeId?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  employeeId?: string;
}

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

