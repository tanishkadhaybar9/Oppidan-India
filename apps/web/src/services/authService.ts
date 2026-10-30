import { apiClient, setAccessToken } from "./api";
import type {
  RegisterPayload,
  LoginPayload,
  AuthResponseData,
  SafeUser,
} from "../types/auth";

export const authService = {
  /**
   * Register a new company and initial OWNER account.
   */
  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    const response = await apiClient<AuthResponseData>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });

    if (response.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }

    if (!response.data) {
      throw new Error(response.message || "Failed to register");
    }

    return response.data;
  },

  /**
   * Log in an existing user.
   */
  async login(payload: LoginPayload): Promise<AuthResponseData> {
    const response = await apiClient<AuthResponseData>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });

    if (response.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }

    if (!response.data) {
      throw new Error(response.message || "Failed to log in");
    }

    return response.data;
  },

  /**
   * Log out active session and clear cookies.
   */
  async logout(): Promise<void> {
    try {
      await apiClient("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      setAccessToken(null);
    }
  },

  /**
   * Refresh session and retrieve new access token.
   */
  async refresh(): Promise<AuthResponseData> {
    const response = await apiClient<AuthResponseData>("/api/auth/refresh", {
      method: "POST",
      skipAuth: true,
    });

    if (response.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }

    if (!response.data) {
      throw new Error("Unable to refresh session");
    }

    return response.data;
  },

  /**
   * Fetch current authenticated user.
   */
  async getCurrentUser(): Promise<SafeUser> {
    const response = await apiClient<{ user: SafeUser }>("/api/auth/me", {
      method: "GET",
    });

    if (!response.data?.user) {
      throw new Error("User profile not found");
    }

    return response.data.user;
  },
};
