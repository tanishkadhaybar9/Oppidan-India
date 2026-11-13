import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Printer,
  Umbrella,
  Loader2,
  Search,
  Building2,
  Filter,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { getLeaveReport } from "../services/reportsService";
import { listDepartments } from "../services/employeeService";
import type { LeaveReportData } from "../types/reports";
import type { Department } from "../types/employee";

export function LeaveReportPage() {
  const [data, setData] = useState<LeaveReportData | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, deptRes] = await Promise.all([
        getLeaveReport({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          departmentId: departmentId || undefined,
          status: status || undefined,
        }),
        listDepartments().catch(() => ({ data: { departments: [] } })),
      ]);

      if (res.data) {
        setData(res.data);
      }
      if (deptRes.data?.departments) {
        setDepartments(deptRes.data.departments);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to load leave report.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, departmentId, status]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const filteredRecords = (data?.records || []).filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.employeeName.toLowerCase().includes(q) ||
      r.employeeCode.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.leaveType.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (!data || !filteredRecords.length) return;
    const headers = [
      "Employee Code",
      "Employee Name",
      "Department",
      "Leave Type",
      "Start Date",
      "End Date",
      "Days",
      "Status",
      "Reason",
      "Applied On",
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.employeeCode}"`,
      `"${r.employeeName}"`,
      `"${r.department}"`,
      `"${r.leaveType}"`,
      `"${r.startDate}"`,
      `"${r.endDate}"`,
      `"${r.daysCount}"`,
      `"${r.status}"`,
      `"${(r.reason || "").replace(/"/g, '""')}"`,
      `"${r.appliedAt ? new Date(r.appliedAt).toLocaleDateString() : ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `leave-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageContainer>
      <PageHeader
        title="Leave & Absence Analytics Report"
        subtitle="Vacation balances, medical leave audits, departmental absence rates, and approval cycles"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#eadbd2] hover:bg-[#f8f4f1] text-[#77716e] text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!filteredRecords.length}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#f47b5b] hover:bg-[#e06847] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* 4 Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Total Applications
            </span>
            <div className="text-2xl font-bold text-[#252525]">{data.summary.totalRequests}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Pending Approvals
            </span>
            <div className="text-2xl font-bold text-amber-600">{data.summary.pending}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Approved
            </span>
            <div className="text-2xl font-bold text-emerald-700">{data.summary.approved}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Rejected
            </span>
            <div className="text-2xl font-bold text-red-600">{data.summary.rejected}</div>
          </div>
        </div>
      )}

      {/* Categorical Breakdowns */}
      {data?.summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* By Type */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-bold text-[#252525] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Umbrella className="w-4 h-4 text-[#f47b5b]" />
              <span>Leaves by Policy Type</span>
            </h4>
            <div className="space-y-3">
              {data.summary.byType.map((t) => {
                const pct =
                  data.summary.totalRequests > 0
                    ? (t.count / data.summary.totalRequests) * 100
                    : 0;
                return (
                  <div key={t.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-[#252525]">{t.name}</span>
                      <span className="text-[#77716e]">
                        {t.count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[#f8f4f1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Department */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-bold text-[#252525] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#f47b5b]" />
              <span>Leaves by Department</span>
            </h4>
            <div className="space-y-3">
              {data.summary.byDepartment.map((d) => {
                const pct =
                  data.summary.totalRequests > 0
                    ? (d.count / data.summary.totalRequests) * 100
                    : 0;
                return (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-[#252525]">{d.name}</span>
                      <span className="text-[#77716e]">
                        {d.count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[#f8f4f1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#f47b5b] rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 mb-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee, leave type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
            />
          </div>

          <div>
            <input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
            />
          </div>

          <div>
            <input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
            />
          </div>

          <div className="relative">
            <Building2 className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b] appearance-none"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b] appearance-none"
            >
              <option value="">All Leave Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-[#77716e]">
            <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b] mb-2" />
            <span className="text-sm">Fetching leave analytics...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-[#77716e]">
            <Umbrella className="w-12 h-12 text-[#eadbd2] mb-3" />
            <h3 className="text-base font-semibold text-[#252525] mb-1">No Leave Records Found</h3>
            <p className="text-sm text-[#77716e] max-w-sm text-center">
              No leave records match the selected date window or filter values.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f4f1] border-b border-[#eadbd2] text-[11px] font-semibold text-[#77716e] uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Leave Policy</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-center">Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadbd2] text-sm">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#fff9f6] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#252525]">{r.employeeName}</div>
                      <div className="text-xs text-[#77716e] font-mono">{r.employeeCode}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-[#252525]">
                      {r.department}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        {r.leaveType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#77716e]">
                      {r.startDate} to {r.endDate}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#252525]">
                      {r.daysCount}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#77716e] max-w-xs truncate">
                      {r.reason || "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          r.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : r.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

