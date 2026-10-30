import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BarChart2,
  Download,
  Calendar,
  Building2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Umbrella,
  Loader2,
  FileText,
} from "lucide-react";
import {
  getWeeklyReport,
  getExportCsvUrl,
  listShifts,
} from "../services/attendanceService";
import { listDepartments } from "../services/employeeService";
import { listLeaveTypes } from "../services/leaveService";
import type { WeeklyEmployeeSummary, Shift } from "../types/attendance";
import type { Department } from "../types/employee";
import type { LeaveType } from "../types/leave";
import { PageContainer, PageHeader } from "../components/common";

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"attendance" | "leave">("attendance");

  // Date filters (defaults to current week)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split("T")[0]!;
  });

  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0]!;
  });

  const [departmentId, setDepartmentId] = useState("");
  const [shiftId, setShiftId] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);

  const [report, setReport] = useState<WeeklyEmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [deptRes, shiftRes, ltRes] = await Promise.all([
          listDepartments(),
          listShifts("ACTIVE"),
          listLeaveTypes(),
        ]);
        if (deptRes.data?.departments) setDepartments(deptRes.data.departments);
        if (shiftRes.data?.shifts) setShifts(shiftRes.data.shifts);
        if (ltRes.data) setLeaveTypes(ltRes.data);
      } catch (err) {
        console.error("Failed to load report metadata", err);
      }
    }
    void loadMetadata();
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWeeklyReport({
        startDate,
        endDate,
        departmentId: departmentId || undefined,
        shiftId: shiftId || undefined,
      });
      if (res.data?.report) {
        setReport(res.data.report);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to generate attendance report.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, departmentId, shiftId]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  // Aggregate metrics
  const totalEmployees = report.length;
  const totalPresent = report.reduce((acc, r) => acc + r.presentDays, 0);
  const totalLate = report.reduce((acc, r) => acc + r.lateDays, 0);
  const totalHalfDay = report.reduce((acc, r) => acc + r.halfDays, 0);
  const totalWorkedHrs = (report.reduce((acc, r) => acc + r.totalWorkedMinutes, 0) / 60).toFixed(1);
  const totalOvertimeHrs = (report.reduce((acc, r) => acc + r.totalOvertimeMinutes, 0) / 60).toFixed(1);

  const handleExportCsv = () => {
    const url = getExportCsvUrl({
      startDate,
      endDate,
      departmentId: departmentId || undefined,
      shiftId: shiftId || undefined,
    });
    window.open(url, "_blank");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Company Reports & Analytics"
        subtitle="Export official RFC-4180 audit spreadsheets, analyze work hours, and track leave utilization."
        icon={<BarChart2 className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Reports & Analytics" },
        ]}
        actions={
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-sm font-semibold shadow-xs hover:opacity-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#eadbd2] pb-2">
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "attendance"
              ? "bg-[#fff0e8] text-[#f47b5b] border border-[#eadbd2]"
              : "text-[#77716e] hover:text-[#252525] hover:bg-white"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Attendance & Work Hours</span>
        </button>
        <button
          onClick={() => setActiveTab("leave")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "leave"
              ? "bg-[#fff0e8] text-[#f47b5b] border border-[#eadbd2]"
              : "text-[#77716e] hover:text-[#252525] hover:bg-white"
          }`}
        >
          <Umbrella className="w-4 h-4" />
          <span>Leave & Policy Summary</span>
        </button>
      </div>

      {/* Date & Filter Bar */}
      <div className="bg-white border border-[#eadbd2] rounded-[22px] p-4 shadow-xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#77716e]" />
          <span className="text-xs font-semibold text-[#77716e]">Period:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs bg-[#fff7f2] border border-[#eadbd2] text-[#252525] focus:outline-none focus:border-[#f47b5b]"
          />
          <span className="text-xs text-[#77716e]">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs bg-[#fff7f2] border border-[#eadbd2] text-[#252525] focus:outline-none focus:border-[#f47b5b]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#77716e]" />
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs bg-[#fff7f2] border border-[#eadbd2] text-[#252525] focus:outline-none focus:border-[#f47b5b]"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#77716e]" />
          <select
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs bg-[#fff7f2] border border-[#eadbd2] text-[#252525] focus:outline-none focus:border-[#f47b5b]"
          >
            <option value="">All Shifts</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === "attendance" ? (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white border border-[#eadbd2] rounded-[20px] p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block">Staff Reported</span>
              <span className="text-xl font-bold text-[#252525] mt-1 block">{totalEmployees}</span>
              <span className="text-[10px] text-[#77716e]">Active members</span>
            </div>

            <div className="bg-white border border-[#eadbd2] rounded-[20px] p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block">Present Days</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block">{totalPresent}</span>
              <span className="text-[10px] text-emerald-700">Days attended</span>
            </div>

            <div className="bg-white border border-[#eadbd2] rounded-[20px] p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block">Late Days</span>
              <span className="text-xl font-bold text-amber-600 mt-1 block">{totalLate}</span>
              <span className="text-[10px] text-amber-700">Punctuality breaches</span>
            </div>

            <div className="bg-white border border-[#eadbd2] rounded-[20px] p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block">Half Days</span>
              <span className="text-xl font-bold text-blue-600 mt-1 block">{totalHalfDay}</span>
              <span className="text-[10px] text-blue-700">Partial attendance</span>
            </div>

            <div className="bg-white border border-[#eadbd2] rounded-[20px] p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block">Total Hours</span>
              <span className="text-xl font-bold text-[#252525] mt-1 block">{totalWorkedHrs} hrs</span>
              <span className="text-[10px] text-[#77716e]">Net working time</span>
            </div>

            <div className="bg-white border border-[#eadbd2] rounded-[20px] p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block">Overtime</span>
              <span className="text-xl font-bold text-[#f47b5b] mt-1 block">{totalOvertimeHrs} hrs</span>
              <span className="text-[10px] text-[#f47b5b]">Approved extra work</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#eadbd2] rounded-[22px] overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-[#eadbd2] flex items-center justify-between">
              <h3 className="font-heading font-semibold text-sm text-[#252525] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#f47b5b]" />
                Employee Attendance Log Breakdown
              </h3>
              <span className="text-xs text-[#77716e]">
                Showing {report.length} entries for selected dates
              </span>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b] mb-2" />
                <p className="text-sm text-[#77716e]">Generating report data...</p>
              </div>
            ) : report.length === 0 ? (
              <div className="text-center py-16 p-6">
                <FileText className="w-12 h-12 text-[#eadbd2] mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-[#252525]">No attendance records found</h4>
                <p className="text-xs text-[#77716e] mt-1">Try expanding the selected date interval.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#eadbd2] bg-[#fff7f2] text-[#77716e] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4 text-center">Present</th>
                      <th className="py-3 px-4 text-center">Late</th>
                      <th className="py-3 px-4 text-center">Half Day</th>
                      <th className="py-3 px-4 text-right">Net Hours</th>
                      <th className="py-3 px-4 text-right">Overtime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eadbd2]/60">
                    {report.map((item) => (
                      <tr key={item.employee.id} className="hover:bg-[#fff0e8]/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#252525]">
                          <Link to={`/employees/${item.employee.id}`} className="hover:text-[#f47b5b] transition-colors">
                            {item.employee.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#77716e]">{item.employee.employeeCode}</td>
                        <td className="py-3 px-4 text-[#77716e]">
                          {item.employee.departmentName || "Unassigned"}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-emerald-600">
                          {item.presentDays}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-amber-600">
                          {item.lateDays}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-blue-600">
                          {item.halfDays}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-[#252525]">
                          {(item.totalWorkedMinutes / 60).toFixed(1)} hrs
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#f47b5b]">
                          {(item.totalOvertimeMinutes / 60).toFixed(1)} hrs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Leave Policies & Categories Tab */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {leaveTypes.map((lt) => (
              <div
                key={lt.id}
                className="bg-white border border-[#eadbd2] rounded-[22px] p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-heading font-bold text-base text-[#252525]">{lt.name}</h3>
                      <span className="text-[11px] font-mono text-[#77716e]">Code: {lt.code}</span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        lt.paid
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      {lt.paid ? "PAID LEAVE" : "UNPAID"}
                    </span>
                  </div>

                  <p className="text-xs text-[#77716e] line-clamp-2 mt-2">
                    {lt.description || "No specific policy notes defined."}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#eadbd2]/60 text-xs">
                    <div>
                      <span className="text-[#77716e] block text-[11px]">Max Days / Year</span>
                      <span className="font-bold text-[#252525]">{lt.maximumDays} days</span>
                    </div>
                    <div>
                      <span className="text-[#77716e] block text-[11px]">Notice Period</span>
                      <span className="font-bold text-[#252525]">{lt.minimumNoticeDays} days prior</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#eadbd2]/60 flex items-center justify-between text-xs">
                  <span className="text-[#77716e]">
                    Requires Approval: <strong className="text-[#252525]">{lt.requiresApproval ? "Yes" : "Auto"}</strong>
                  </span>
                  <Link
                    to="/leave/types"
                    className="text-[#f47b5b] font-semibold hover:underline"
                  >
                    Manage Policy →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
};
