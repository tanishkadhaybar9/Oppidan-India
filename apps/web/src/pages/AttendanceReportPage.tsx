import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Printer,
  CalendarCheck,
  Loader2,
  Search,
  Building2,
  Filter,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { getAttendanceReport } from "../services/reportsService";
import { listDepartments } from "../services/employeeService";
import type { AttendanceReportData } from "../types/reports";
import type { Department } from "../types/employee";

export function AttendanceReportPage() {
  const [data, setData] = useState<AttendanceReportData | null>(null);
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
        getAttendanceReport({
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
      setError(e.message || "Failed to load attendance report.");
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
      r.department.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (!data || !filteredRecords.length) return;
    const headers = [
      "Employee Code",
      "Employee Name",
      "Department",
      "Date",
      "Check In",
      "Check Out",
      "Working Hours",
      "Status",
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.employeeCode}"`,
      `"${r.employeeName}"`,
      `"${r.department}"`,
      `"${r.date}"`,
      `"${r.checkInTime || "—"}"`,
      `"${r.checkOutTime || "—"}"`,
      `"${r.workingHours.toFixed(1)}"`,
      `"${r.status}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance-report-${new Date().toISOString().split("T")[0]}.csv`);
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
        title="Attendance & Time-Tracking Audit Report"
        subtitle="Timesheet verification, shift records, working hours analysis, and punctuality monitoring"
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

      {/* 6 Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Total Logs
            </span>
            <div className="text-2xl font-bold text-[#252525]">{data.summary.totalRecords}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Present
            </span>
            <div className="text-2xl font-bold text-emerald-700">{data.summary.present}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Late Arrivals
            </span>
            <div className="text-2xl font-bold text-amber-600">{data.summary.late}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Half Days
            </span>
            <div className="text-2xl font-bold text-blue-600">{data.summary.halfDay}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Absent
            </span>
            <div className="text-2xl font-bold text-red-600">{data.summary.absent}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Avg Hours
            </span>
            <div className="text-2xl font-bold text-[#f47b5b]">
              {data.summary.averageWorkingHours.toFixed(1)}h
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 mb-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee or code..."
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
              <option value="">All Attendance Statuses</option>
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
              <option value="HALF_DAY">HALF_DAY</option>
              <option value="ABSENT">ABSENT</option>
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
            <span className="text-sm">Compiling attendance logs...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-[#77716e]">
            <CalendarCheck className="w-12 h-12 text-[#eadbd2] mb-3" />
            <h3 className="text-base font-semibold text-[#252525] mb-1">No Attendance Records</h3>
            <p className="text-sm text-[#77716e] max-w-sm text-center">
              No records found for the selected dates and filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f4f1] border-b border-[#eadbd2] text-[11px] font-semibold text-[#77716e] uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4 text-right">Worked Hours</th>
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
                    <td className="py-3 px-4 text-xs text-[#77716e]">{r.date}</td>
                    <td className="py-3 px-4 text-xs text-[#252525] font-mono">
                      {r.checkInTime || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#252525] font-mono">
                      {r.checkOutTime || "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[#252525]">
                      {r.workingHours.toFixed(1)}h
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          r.status === "PRESENT"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : r.status === "LATE"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : r.status === "HALF_DAY"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
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

