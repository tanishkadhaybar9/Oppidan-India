import { UserRole, UserStatus } from "../generated/prisma/client.js";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyId: string;
  companyName?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterInput {
  name: string;
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthSessionResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}
