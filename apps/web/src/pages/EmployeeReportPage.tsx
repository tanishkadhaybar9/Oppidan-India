import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Printer,
  Users,
  Building2,
  Briefcase,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { getEmployeeReport } from "../services/reportsService";
import { listDepartments } from "../services/employeeService";
import type { EmployeeReportData } from "../types/reports";
import type { Department } from "../types/employee";

export function EmployeeReportPage() {
  const [data, setData] = useState<EmployeeReportData | null>(null);
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
        getEmployeeReport({
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
      setError(e.message || "Failed to load employee report.");
    } finally {
      setLoading(false);
    }
  }, [departmentId, status]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const filteredEmployees = (data?.employees || []).filter((emp) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.employeeCode.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (!data || !filteredEmployees.length) return;
    const headers = [
      "Employee Code",
      "Name",
      "Email",
      "Department",
      "Designation",
      "Joining Date",
      "Status",
      "Supervisor",
    ];

    const rows = filteredEmployees.map((e) => [
      `"${e.employeeCode}"`,
      `"${e.name}"`,
      `"${e.email}"`,
      `"${e.department}"`,
      `"${e.designation}"`,
      `"${e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : ""}"`,
      `"${e.status}"`,
      `"${e.supervisorName}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `employee-report-${new Date().toISOString().split("T")[0]}.csv`);
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
        title="Employee Demographics & Headcount Report"
        subtitle="Comprehensive staff directory, departmental allocations, and tenure metrics"
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
              disabled={!filteredEmployees.length}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Total Headcount
            </span>
            <div className="text-2xl font-bold text-[#252525]">{data.summary.total}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Active Employees
            </span>
            <div className="text-2xl font-bold text-emerald-700">{data.summary.active}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              On Probation
            </span>
            <div className="text-2xl font-bold text-amber-600">{data.summary.probation}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Inactive / Separated
            </span>
            <div className="text-2xl font-bold text-gray-500">{data.summary.inactive}</div>
          </div>
        </div>
      )}

      {/* Distributions (Department & Designation Breakdown) */}
      {data?.summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Dept Breakdown */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-bold text-[#252525] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#f47b5b]" />
              <span>Department Distribution</span>
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

          {/* Designation Breakdown */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-bold text-[#252525] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#f47b5b]" />
              <span>Top Designations</span>
            </h4>
            <div className="space-y-3">
              {data.summary.byDesignation.map((d) => {
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
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
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

      {/* Filter Bar */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 mb-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name, code, role..."
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
              <option value="">All Employment Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PROBATION">PROBATION</option>
              <option value="INACTIVE">INACTIVE</option>
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
            <span className="text-sm">Generating employee report...</span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-[#77716e]">
            <Users className="w-12 h-12 text-[#eadbd2] mb-3" />
            <h3 className="text-base font-semibold text-[#252525] mb-1">No Matching Employees</h3>
            <p className="text-sm text-[#77716e] max-w-sm text-center">
              No employees matched the specified filters. Try adjusting your search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f4f1] border-b border-[#eadbd2] text-[11px] font-semibold text-[#77716e] uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Supervisor</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadbd2] text-sm">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#fff9f6] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#252525]">{emp.name}</div>
                      <div className="text-xs text-[#77716e] font-mono">{emp.employeeCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#77716e]">{emp.email}</td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[#252525]">
                      {emp.department}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#77716e]">{emp.designation}</td>
                    <td className="py-3.5 px-4 text-xs text-[#77716e]">{emp.supervisorName}</td>
                    <td className="py-3.5 px-4 text-xs text-[#77716e]">
                      {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          emp.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : emp.status === "PROBATION"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {emp.status}
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

