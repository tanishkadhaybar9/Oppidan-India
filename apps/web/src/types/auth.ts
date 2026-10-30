export type UserRole = "OWNER" | "HR" | "MANAGER" | "SUPERVISOR" | "EMPLOYEE";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyId: string;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPayload {
  name: string;
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponseData {
  user: SafeUser;
  accessToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}
