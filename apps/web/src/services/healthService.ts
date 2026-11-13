import { apiClient } from "./api";
import type { ApiResponse } from "../types/auth";

export interface DiagnosticsData {
  status: string;
  timestamp: string;
  database: {
    connected: boolean;
    latencyMs: number;
    error?: string | null;
  };
  server: {
    uptimeSeconds: number;
    nodeVersion: string;
    platform: string;
    environment: string;
    memory: {
      rss: string;
      heapTotal: string;
      heapUsed: string;
      external: string;
    };
  };
  counts: {
    users: number;
    employees: number;
    departments: number;
    designations: number;
    attendances: number;
    leaves: number;
    tasks: number;
    assets: number;
    payrolls: number;
    auditLogs: number;
  };
}

export async function getSystemDiagnostics(): Promise<ApiResponse<DiagnosticsData>> {
  return apiClient<DiagnosticsData>("/api/health/diagnostics");
}

export async function getPublicHealth(): Promise<{ status: string; timestamp: string }> {
  return apiClient<{ status: string; timestamp: string }>("/api/health", { skipAuth: true }).then(
    (res) => (res.data || { status: "unknown", timestamp: new Date().toISOString() })
  );
}
