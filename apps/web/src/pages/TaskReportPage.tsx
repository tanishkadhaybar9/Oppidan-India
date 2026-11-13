import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Printer,
  CheckSquare,
  Loader2,
  Search,
  Filter,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { getTaskReport } from "../services/reportsService";
import { listDepartments } from "../services/employeeService";
import type { TaskReportData } from "../types/reports";
import type { Department } from "../types/employee";

export function TaskReportPage() {
  const [data, setData] = useState<TaskReportData | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [departmentId, setDepartmentId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, deptRes] = await Promise.all([
        getTaskReport({
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
      setError(e.message || "Failed to load task report.");
    } finally {
      setLoading(false);
    }
  }, [departmentId, status]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const filteredRecords = (data?.records || []).filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.taskCode.toLowerCase().includes(q) ||
      r.assignedTo.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (!data || !filteredRecords.length) return;
    const headers = [
      "Task Code",
      "Title",
      "Category",
      "Priority",
      "Status",
      "Progress (%)",
      "Assigned To",
      "Department",
      "Due Date",
      "Completed At",
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.taskCode}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      `"${r.priority}"`,
      `"${r.status}"`,
      `"${r.progress}"`,
      `"${r.assignedTo}"`,
      `"${r.department}"`,
      `"${r.dueDate || "—"}"`,
      `"${r.completedAt ? new Date(r.completedAt).toLocaleDateString() : "—"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `task-productivity-report-${new Date().toISOString().split("T")[0]}.csv`);
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
        title="Tasks & Operational Productivity Audit Report"
        subtitle="Work item tracking, milestone completion rates, bottleneck diagnostics, and workload distributions"
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

      {/* Summary KPI Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Total Tasks
            </span>
            <div className="text-2xl font-bold text-[#252525]">{data.summary.total}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Completed
            </span>
            <div className="text-2xl font-bold text-emerald-700">{data.summary.completed}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              In Progress
            </span>
            <div className="text-2xl font-bold text-blue-600">{data.summary.inProgress}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Under Review
            </span>
            <div className="text-2xl font-bold text-purple-600">{data.summary.underReview}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Overdue
            </span>
            <div className="text-2xl font-bold text-red-600">{data.summary.overdue}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Completion Rate
            </span>
            <div className="text-2xl font-bold text-[#f47b5b]">
              {data.summary.completionRate.toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Priority & Department Breakdown */}
      {data?.summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* By Priority */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-bold text-[#252525] uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#f47b5b]" />
              <span>Tasks by Priority Level</span>
            </h4>
            <div className="space-y-3">
              {data.summary.byPriority.map((p) => {
                const pct = data.summary.total > 0 ? (p.count / data.summary.total) * 100 : 0;
                const barColor =
                  p.priority === "URGENT"
                    ? "bg-red-500"
                    : p.priority === "HIGH"
                    ? "bg-amber-500"
                    : p.priority === "MEDIUM"
                    ? "bg-blue-500"
                    : "bg-slate-400";
                return (
                  <div key={p.priority}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-[#252525]">{p.priority}</span>
                      <span className="text-[#77716e]">
                        {p.count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[#f8f4f1] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-300`}
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
              <span>Department Workload</span>
            </h4>
            <div className="space-y-3">
              {data.summary.byDepartment.map((d) => {
                const pct = data.summary.total > 0 ? (d.count / data.summary.total) * 100 : 0;
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, code, assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
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
              <option value="">All Task Statuses</option>
              <option value="TO_DO">TO_DO</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ON_HOLD">ON_HOLD</option>
              <option value="CANCELLED">CANCELLED</option>
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
            <span className="text-sm">Evaluating tasks and milestones...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-[#77716e]">
            <CheckSquare className="w-12 h-12 text-[#eadbd2] mb-3" />
            <h3 className="text-base font-semibold text-[#252525] mb-1">No Tasks Found</h3>
            <p className="text-sm text-[#77716e] max-w-sm text-center">
              No tasks matched the selected department or status filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f4f1] border-b border-[#eadbd2] text-[11px] font-semibold text-[#77716e] uppercase tracking-wider">
                  <th className="py-3 px-4">Task Code</th>
                  <th className="py-3 px-4">Title & Category</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-center">Progress</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadbd2] text-sm">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#fff9f6] transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-indigo-700">
                      {r.taskCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#252525]">{r.title}</div>
                      <div className="text-xs text-[#77716e]">{r.category}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-[#252525]">{r.assignedTo}</td>
                    <td className="py-3 px-4 text-xs text-[#77716e]">{r.department}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          r.priority === "URGENT"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : r.priority === "HIGH"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : r.priority === "MEDIUM"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {r.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 h-2 bg-[#f8f4f1] rounded-full overflow-hidden border border-[#eadbd2]">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${r.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#252525]">{r.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          r.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : r.status === "IN_PROGRESS"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : r.status === "UNDER_REVIEW"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : r.status === "ON_HOLD"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#77716e]">
                      {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—"}
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

