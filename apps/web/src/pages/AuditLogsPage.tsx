import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Calendar,
  Activity,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  AlertCircle,
  Database,
  ArrowUpRight,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { listAuditLogs, getAuditStats } from "../services/auditService";
import type { AuditLogItem, AuditStats } from "../types/audit";

const MODULES = [
  "ALL",
  "AUTH",
  "EMPLOYEE",
  "DEPARTMENT",
  "DESIGNATION",
  "ATTENDANCE",
  "LEAVE",
  "ASSET",
  "TASK",
  "PAYROLL",
  "SETTINGS",
  "USER",
];

const ACTIONS = [
  "ALL",
  "LOGIN",
  "LOGOUT",
  "CREATE",
  "UPDATE",
  "DELETE",
  "APPROVE",
  "REJECT",
  "ASSIGN",
  "STATUS_CHANGE",
];

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Expanded row ID for JSON viewing
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await getAuditStats();
      if (res.data) setStats(res.data);
    } catch {
      // silent
    }
  };

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listAuditLogs({
        page,
        limit: 20,
        search: search.trim() || undefined,
        module: selectedModule !== "ALL" ? selectedModule : undefined,
        action: selectedAction !== "ALL" ? selectedAction : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.data) {
        setLogs(res.data.logs);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedModule, selectedAction, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleRow = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "UPDATE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "DELETE":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "APPROVE":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "REJECT":
        return "bg-red-50 text-red-700 border-red-200";
      case "LOGIN":
      case "LOGOUT":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Audit Logs & Activity Tracking"
        subtitle="Immutable security trail of administrative mutations, approvals, and authentication events."
        icon={<FileText className="w-5 h-5 text-[#f47b5b]" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Settings", to: "/settings" },
          { label: "Audit Logs" },
        ]}
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Audit Records</span>
            <Database className="w-4 h-4 text-[#f47b5b]" />
          </div>
          <div className="text-2xl font-extrabold text-[#252525]">{stats?.totalLogs ?? "..."}</div>
          <div className="text-[11px] text-[#77716e] mt-1">Tenant activity history</div>
        </div>

        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Past 24 Hours</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{stats?.recentCount24h ?? "..."}</div>
          <div className="text-[11px] text-[#77716e] mt-1">Recent operational events</div>
        </div>

        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Module</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-bold text-[#252525] truncate">
            {stats?.byModule?.[0]?.module ?? "None"}
          </div>
          <div className="text-[11px] text-[#77716e] mt-1">
            {stats?.byModule?.[0]?.count ? `${stats.byModule[0].count} events logged` : "No activity"}
          </div>
        </div>

        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Action</span>
            <ArrowUpRight className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-[#252525] truncate">
            {stats?.byAction?.[0]?.action ?? "None"}
          </div>
          <div className="text-[11px] text-[#77716e] mt-1">
            {stats?.byAction?.[0]?.count ? `${stats.byAction[0].count} operations` : "No operations"}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#77716e] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search description, user..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
            />
          </div>

          {/* Module */}
          <select
            value={selectedModule}
            onChange={(e) => {
              setSelectedModule(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
          >
            {MODULES.map((m) => (
              <option key={m} value={m}>
                Module: {m}
              </option>
            ))}
          </select>

          {/* Action */}
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                Action: {a}
              </option>
            ))}
          </select>

          {/* Reset button */}
          <button
            onClick={() => {
              setSearch("");
              setSelectedModule("ALL");
              setSelectedAction("ALL");
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#eadbd2] bg-[#fff7f2] text-xs font-semibold text-[#77716e] hover:text-[#252525] hover:border-[#f47b5b]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>

        {/* Date range filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#eadbd2]/60 text-xs text-[#77716e]">
          <span className="font-semibold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Date Range:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1 rounded-lg border border-[#eadbd2] bg-[#fffcfb] text-xs"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1 rounded-lg border border-[#eadbd2] bg-[#fffcfb] text-xs"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[#77716e]">
            <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b] mx-auto mb-3" />
            <p className="text-xs font-medium">Loading audit log entries...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-[#77716e]">
            <FileText className="w-12 h-12 text-[#eadbd2] mx-auto mb-3" />
            <h4 className="text-sm font-bold text-[#252525] mb-1">No audit records match your filters</h4>
            <p className="text-xs">Adjust your search query or module filters to view matching entries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fff7f2] border-b border-[#eadbd2] text-[#77716e] uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4 w-8"></th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Record ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadbd2]/60 text-[#252525]">
                {logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => toggleRow(log.id)}
                        className="hover:bg-[#fff7f2]/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 text-[#77716e]">
                          {log.details ? (
                            isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-[#f47b5b]" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-[#77716e]" />
                            )
                          ) : null}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-[#77716e]">
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-[#252525]">{log.userName || "System"}</div>
                          <div className="text-[10px] text-[#77716e] flex items-center gap-1">
                            <span className="font-mono">{log.userRole || "SERVICE"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-[#fff0e8] text-[#f47b5b] font-bold text-[10px] border border-[#eadbd2]">
                            {log.module}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-[#252525]">{log.description}</td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-[#77716e]">
                          {log.recordId ? log.recordId.slice(0, 10) + "..." : "—"}
                        </td>
                      </tr>

                      {/* Expandable JSON details */}
                      {isExpanded && log.details && (
                        <tr className="bg-[#fffcfb]">
                          <td colSpan={7} className="p-4 border-b border-[#eadbd2]">
                            <div className="bg-[#252525] text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto shadow-inner">
                              <div className="text-[10px] text-gray-400 mb-1 border-b border-gray-700 pb-1">
                                Audit Metadata (IP: {log.ipAddress || "Internal"} | Agent:{" "}
                                {log.userAgent?.slice(0, 40) || "Direct API"})
                              </div>
                              <pre>{JSON.stringify(log.details, null, 2)}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#eadbd2] flex items-center justify-between text-xs text-[#77716e]">
            <span>
              Showing {logs.length} of {total} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-[#eadbd2] hover:bg-[#fff7f2] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-semibold text-[#252525]">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-[#eadbd2] hover:bg-[#fff7f2] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
