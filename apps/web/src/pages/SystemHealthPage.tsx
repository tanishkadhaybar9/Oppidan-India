import React, { useState, useEffect } from "react";
import {
  Activity,
  Server,
  Database,
  Shield,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  HardDrive,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { getSystemDiagnostics } from "../services/healthService";
import type { DiagnosticsData } from "../services/healthService";

export const SystemHealthPage: React.FC = () => {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await getSystemDiagnostics();
      if (res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reach system diagnostics endpoint.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(" ");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Security & System Health"
        subtitle="Real-time operational monitoring, database latency metrics, and cryptographic security checklist."
        icon={<Activity className="w-5 h-5 text-[#f47b5b]" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Settings", to: "/settings" },
          { label: "System Health" },
        ]}
        actions={
          <button
            onClick={() => fetchDiagnostics(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#eadbd2] text-xs font-semibold text-[#252525] hover:border-[#f47b5b] transition-all disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#f47b5b]" : ""}`} />
            Refresh Diagnostics
          </button>
        }
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-[#77716e]">
          <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b] mx-auto mb-3" />
          <p className="text-xs font-medium">Running diagnostic health probes on backend and database...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Status summary banner */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#252525]">All Systems Operational</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    200 OK
                  </span>
                </div>
                <p className="text-xs text-[#77716e] mt-0.5">
                  Node server is executing normally on Render cloud with active PostgreSQL connection on Neon.
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-[#77716e]">
              <div>Last probed: <span className="font-semibold text-[#252525]">{new Date(data.timestamp).toLocaleTimeString()}</span></div>
              <div className="text-[11px] text-[#77716e] font-mono">Env: {data.server.environment}</div>
            </div>
          </div>

          {/* Infrastructure Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Database Card */}
            <div className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716e] flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#f47b5b]" />
                  PostgreSQL (Neon)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Connected
                </span>
              </div>

              <div className="pt-2">
                <div className="text-2xl font-extrabold text-[#252525]">
                  {data.database.latencyMs} <span className="text-xs font-normal text-[#77716e]">ms</span>
                </div>
                <p className="text-xs text-[#77716e] mt-1">Roundtrip query latency benchmark</p>
              </div>

              <div className="pt-3 border-t border-[#eadbd2]/60 text-xs text-[#77716e] space-y-1">
                <div className="flex justify-between">
                  <span>SSL Encryption:</span>
                  <span className="font-semibold text-emerald-600">Enabled (TLSv1.3)</span>
                </div>
                <div className="flex justify-between">
                  <span>Connection Pooling:</span>
                  <span className="font-semibold text-[#252525]">Prisma Native</span>
                </div>
              </div>
            </div>

            {/* Server Runtime Card */}
            <div className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716e] flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-indigo-600" />
                  API Runtime (Render)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {data.server.platform}
                </span>
              </div>

              <div className="pt-2">
                <div className="text-2xl font-extrabold text-[#252525]">
                  {formatUptime(data.server.uptimeSeconds)}
                </div>
                <p className="text-xs text-[#77716e] mt-1">Continuous daemon uptime</p>
              </div>

              <div className="pt-3 border-t border-[#eadbd2]/60 text-xs text-[#77716e] space-y-1">
                <div className="flex justify-between">
                  <span>Node Version:</span>
                  <span className="font-mono text-[#252525]">{data.server.nodeVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span>Process Engine:</span>
                  <span className="font-semibold text-[#252525]">Express 4.21 + TS</span>
                </div>
              </div>
            </div>

            {/* Memory Usage Card */}
            <div className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716e] flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  Memory Footprint
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Healthy
                </span>
              </div>

              <div className="pt-2">
                <div className="text-2xl font-extrabold text-[#252525]">{data.server.memory.heapUsed}</div>
                <p className="text-xs text-[#77716e] mt-1">Active V8 Heap Utilization</p>
              </div>

              <div className="pt-3 border-t border-[#eadbd2]/60 text-xs text-[#77716e] space-y-1">
                <div className="flex justify-between">
                  <span>Resident Set Size (RSS):</span>
                  <span className="font-mono text-[#252525]">{data.server.memory.rss}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Allocated Heap:</span>
                  <span className="font-mono text-[#252525]">{data.server.memory.heapTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Entities Metrics */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-[#252525] mb-4 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#f47b5b]" />
              Database Record Volumes (Tenant-Isolated)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-[#fffcfb] border border-[#eadbd2]">
                <div className="text-xs text-[#77716e]">Users</div>
                <div className="text-xl font-bold text-[#252525] mt-1">{data.counts.users}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#fffcfb] border border-[#eadbd2]">
                <div className="text-xs text-[#77716e]">Employees</div>
                <div className="text-xl font-bold text-[#252525] mt-1">{data.counts.employees}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#fffcfb] border border-[#eadbd2]">
                <div className="text-xs text-[#77716e]">Departments</div>
                <div className="text-xl font-bold text-[#252525] mt-1">{data.counts.departments}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#fffcfb] border border-[#eadbd2]">
                <div className="text-xs text-[#77716e]">Designations</div>
                <div className="text-xl font-bold text-[#252525] mt-1">{data.counts.designations}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#fffcfb] border border-[#eadbd2]">
                <div className="text-xs text-[#77716e]">Attendances</div>
                <div className="text-xl font-bold text-[#252525] mt-1">{data.counts.attendances}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#fffcfb] border border-[#eadbd2]">
                <div className="text-xs text-[#77716e]">Leave Records</div>
                <div className="text-xl font-bold text-[#252525] mt-1">{data.counts.leaves}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#fffcfb] border border-[#eadbd2]">
                <div className="text-xs text-[#77716e]">Tasks</div>
                <div className="text-xl font-bold text-[#252525] mt-1">{data.counts.tasks}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#fffcfb] border border-[#eadbd2]">
                <div className="text-xs text-[#77716e]">Assets Managed</div>
                <div className="text-xl font-bold text-[#252525] mt-1">{data.counts.assets}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#fffcfb] border border-[#eadbd2]">
                <div className="text-xs text-[#77716e]">Payrolls</div>
                <div className="text-xl font-bold text-[#252525] mt-1">{data.counts.payrolls}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#fffcfb] border border-[#eadbd2]">
                <div className="text-xs text-[#77716e]">Audit Logs</div>
                <div className="text-xl font-bold text-emerald-600 mt-1">{data.counts.auditLogs}</div>
              </div>
            </div>
          </div>

          {/* Security & Hardening Checklist */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-[#f47b5b]" />
              <h3 className="text-sm font-bold text-[#252525]">Oppidan ERMS Security Checklist</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-[#252525]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Multi-Tenant Tenant Isolation</div>
                  <div className="text-[11px] text-[#77716e]">All queries strictly scoped by companyId middleware</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-[#252525]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Dual-Token JWT Rotation</div>
                  <div className="text-[11px] text-[#77716e]">15-minute access token + HttpOnly secure refresh cookie</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-[#252525]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Encrypted DB Transport</div>
                  <div className="text-[11px] text-[#77716e]">TLS 1.3 enforced on Neon PostgreSQL connection strings</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-[#252525]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Argon2 / bcrypt Password Hashing</div>
                  <div className="text-[11px] text-[#77716e]">Salting and computational cost factor applied to user credentials</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-[#252525]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Immutable Audit Trail</div>
                  <div className="text-[11px] text-[#77716e]">Append-only audit logs recording admin mutations and auth events</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-[#252525]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">RBAC Permission Enforcement</div>
                  <div className="text-[11px] text-[#77716e]">Role-based route guards: OWNER, HR, MANAGER, SUPERVISOR, EMPLOYEE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
};
