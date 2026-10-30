import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Filter,
  Clock,
  ChevronLeft,
  FileSpreadsheet,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import {
  getWeeklyReport,
  getExportCsvUrl,
  listShifts,
} from "../services/attendanceService";
import { listDepartments } from "../services/employeeService";
import type { WeeklyEmployeeSummary, Shift } from "../types/attendance";
import type { Department } from "../types/employee";

export function WeeklyReportPage() {
  // Default to current week (Monday to Sunday)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
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

  const [report, setReport] = useState<WeeklyEmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dropdown options
  useEffect(() => {
    async function loadOptions() {
      try {
        const [deptRes, shiftRes] = await Promise.all([
          listDepartments(),
          listShifts("ACTIVE"),
        ]);
        if (deptRes.data?.departments) setDepartments(deptRes.data.departments);
        if (shiftRes.data?.shifts) setShifts(shiftRes.data.shifts);
      } catch (err) {
        console.error("Failed to load options", err);
      }
    }
    loadOptions();
  }, []);

  // Fetch report
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
    } catch (err: any) {
      setError(err?.message || "Failed to generate weekly report");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, departmentId, shiftId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Aggregate totals
  const totalEmployees = report.length;
  const totalPresent = report.reduce((acc, r) => acc + r.presentDays, 0);
  const totalLate = report.reduce((acc, r) => acc + r.lateDays, 0);
  const totalWorkedHrs = (report.reduce((acc, r) => acc + r.totalWorkedMinutes, 0) / 60).toFixed(1);
  const totalOvertimeHrs = (report.reduce((acc, r) => acc + r.totalOvertimeMinutes, 0) / 60).toFixed(1);

  return (
    <PageContainer>
      <PageHeader
        title="Weekly Attendance Reporting"
        subtitle="Aggregate work metrics, present days, overtime summaries, and export data as spreadsheet CSV."
        icon={<FileSpreadsheet className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Attendance", to: "/attendance" },
          { label: "Weekly Report" },
        ]}
        actions={
          <a
            href={getExportCsvUrl({
              startDate,
              endDate,
              departmentId: departmentId || undefined,
              shiftId: shiftId || undefined,
            })}
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#f47b5b] hover:bg-[#d45838] text-white rounded-xl font-semibold text-xs shadow-xs transition-all"
          >
            <Download className="w-4 h-4" /> Download CSV Report
          </a>
        }
      />

        {/* Error notification */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-[#eadbd2] rounded-[18px] p-4 shadow-xs flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fff7f2] border border-[#eadbd2] rounded-xl text-xs">
            <span className="text-[#77716e]">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-[#252525] focus:outline-hidden text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fff7f2] border border-[#eadbd2] rounded-xl text-xs">
            <span className="text-[#77716e]">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-[#252525] focus:outline-hidden text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fff7f2] border border-[#eadbd2] rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-[#77716e]" />
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="bg-transparent border-none text-[#252525] focus:outline-hidden text-xs"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fff7f2] border border-[#eadbd2] rounded-xl text-xs">
            <Clock className="w-3.5 h-3.5 text-[#77716e]" />
            <select
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              className="bg-transparent border-none text-[#252525] focus:outline-hidden text-xs"
            >
              <option value="">All Shifts</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Aggregates Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-white border border-[#eadbd2] rounded-[18px] p-4 shadow-xs">
            <span className="text-[11px] font-medium text-[#77716e] uppercase">Staff Members</span>
            <div className="text-2xl font-bold font-heading text-[#252525] mt-1">{totalEmployees}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-[18px] p-4 shadow-xs">
            <span className="text-[11px] font-medium text-[#77716e] uppercase">Total Present Days</span>
            <div className="text-2xl font-bold font-heading text-emerald-600 mt-1">{totalPresent}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-[18px] p-4 shadow-xs">
            <span className="text-[11px] font-medium text-[#77716e] uppercase">Late Instances</span>
            <div className="text-2xl font-bold font-heading text-amber-600 mt-1">{totalLate}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-[18px] p-4 shadow-xs">
            <span className="text-[11px] font-medium text-[#77716e] uppercase">Worked Hours</span>
            <div className="text-2xl font-bold font-heading text-[#252525] mt-1">{totalWorkedHrs} hrs</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-[18px] p-4 shadow-xs">
            <span className="text-[11px] font-medium text-[#77716e] uppercase">Overtime</span>
            <div className="text-2xl font-bold font-heading text-[#f47b5b] mt-1">{totalOvertimeHrs} hrs</div>
          </div>
        </div>

        {/* Aggregate Table */}
        <div className="bg-white border border-[#eadbd2] rounded-[20px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#fff7f2] border-b border-[#eadbd2] text-[#77716e] font-medium">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Recorded Days</th>
                  <th className="py-3 px-4">Present</th>
                  <th className="py-3 px-4">Late</th>
                  <th className="py-3 px-4">Half Day</th>
                  <th className="py-3 px-4">Worked Hours</th>
                  <th className="py-3 px-4">Overtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadbd2]/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#77716e]">
                      Generating weekly aggregate report...
                    </td>
                  </tr>
                ) : report.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#77716e]">
                      No attendance data recorded in selected date range.
                    </td>
                  </tr>
                ) : (
                  report.map((item) => (
                    <tr key={item.employee.id} className="hover:bg-[#fff9f6] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#252525]">{item.employee.name}</div>
                        <div className="text-[10px] text-[#77716e] font-mono">{item.employee.employeeCode}</div>
                      </td>
                      <td className="py-3 px-4 text-[#77716e]">{item.employee.departmentName}</td>
                      <td className="py-3 px-4 font-mono font-medium">{item.totalDays}</td>
                      <td className="py-3 px-4 text-emerald-700 font-semibold">{item.presentDays}</td>
                      <td className="py-3 px-4 text-amber-700 font-semibold">{item.lateDays}</td>
                      <td className="py-3 px-4 text-orange-700 font-semibold">{item.halfDays}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#252525]">
                        {(item.totalWorkedMinutes / 60).toFixed(1)} hrs
                      </td>
                      <td className="py-3 px-4 font-mono text-[#f47b5b] font-semibold">
                        {(item.totalOvertimeMinutes / 60).toFixed(1)} hrs
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

    </PageContainer>
  );
}
