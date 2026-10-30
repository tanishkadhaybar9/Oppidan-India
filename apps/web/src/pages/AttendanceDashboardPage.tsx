import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  Clock,
  Calendar,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Umbrella,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { useAuth } from "../context/AuthContext";
import {
  getDailyAttendance,
  listShifts,
  listCorrectionRequests,
  reviewCorrection,
  hrDirectCorrection,
  getExportCsvUrl,
} from "../services/attendanceService";
import { listDepartments } from "../services/employeeService";
import type {
  AttendanceRecord,
  AttendanceCorrection,
  Shift,
} from "../types/attendance";
import type { Department } from "../types/employee";

export function AttendanceDashboardPage() {
  const { user } = useAuth();
  const isHrOrOwner = user?.role === "OWNER" || user?.role === "HR";

  // Filters State
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]!);
  const [departmentId, setDepartmentId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState({
    present: 0,
    late: 0,
    halfDay: 0,
    absent: 0,
    onLeave: 0,
    notClockedOut: 0,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Dropdown options
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Correction requests modal state
  const [correctionsModalOpen, setCorrectionsModalOpen] = useState(false);
  const [pendingCorrections, setPendingCorrections] = useState<AttendanceCorrection[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Direct HR correction modal state
  const [directCorrectionRecord, setDirectCorrectionRecord] = useState<AttendanceRecord | null>(null);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [editReason, setEditReason] = useState("");
  const [directEditLoading, setDirectEditLoading] = useState(false);

  // Load dropdown lists on mount
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

  // Fetch daily attendance
  const fetchDaily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDailyAttendance({
        date,
        departmentId: departmentId || undefined,
        shiftId: shiftId || undefined,
        status: status || undefined,
        search: search.trim() || undefined,
        page,
        limit: 15,
      });

      const data = res.data;
      if (data) {
        setAttendances(data.attendances);
        setSummary((prev) => ({ ...prev, ...data.summary }));
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load daily attendance");
    } finally {
      setLoading(false);
    }
  }, [date, departmentId, shiftId, status, search, page]);

  useEffect(() => {
    fetchDaily();
  }, [fetchDaily]);

  // Fetch pending corrections count
  const fetchPendingCorrections = useCallback(async () => {
    if (!isHrOrOwner) return;
    try {
      const res = await listCorrectionRequests("PENDING");
      if (res.data?.corrections) {
        setPendingCorrections(res.data.corrections);
      }
    } catch (err) {
      console.error("Failed to fetch corrections", err);
    }
  }, [isHrOrOwner]);

  useEffect(() => {
    fetchPendingCorrections();
  }, [fetchPendingCorrections]);

  // Handle Review Correction Request
  const handleReviewCorrection = async (id: string, decision: "APPROVED" | "REJECTED") => {
    setReviewLoading(true);
    try {
      await reviewCorrection(id, { status: decision });
      setSuccessMsg(`Correction request ${decision.toLowerCase()} successfully.`);
      await fetchPendingCorrections();
      await fetchDaily();
    } catch (err: any) {
      setError(err?.message || "Failed to process correction review.");
    } finally {
      setReviewLoading(false);
    }
  };

  // Open Direct HR Correction Modal
  const openDirectCorrection = (rec: AttendanceRecord) => {
    setDirectCorrectionRecord(rec);
    setEditClockIn(rec.clockIn ? new Date(rec.clockIn).toISOString().slice(0, 16) : "");
    setEditClockOut(rec.clockOut ? new Date(rec.clockOut).toISOString().slice(0, 16) : "");
    setEditReason("");
  };

  // Submit Direct HR Correction
  const handleSubmitDirectCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directCorrectionRecord) return;
    setDirectEditLoading(true);
    try {
      await hrDirectCorrection(directCorrectionRecord.id, {
        correctedClockIn: new Date(editClockIn).toISOString(),
        correctedClockOut: editClockOut ? new Date(editClockOut).toISOString() : null,
        reason: editReason,
      });
      setSuccessMsg("Attendance record updated and recalculated successfully.");
      setDirectCorrectionRecord(null);
      await fetchDaily();
    } catch (err: any) {
      setError(err?.message || "Failed to update attendance.");
    } finally {
      setDirectEditLoading(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "PRESENT":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Present</span>;
      case "LATE":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Late Arrival</span>;
      case "HALF_DAY":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-200">Half Day</span>;
      case "ABSENT":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Absent</span>;
      case "NOT_CLOCKED_OUT":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">In Progress</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-stone-100 text-stone-600">{st}</span>;
    }
  };

  const formatTime = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Daily Attendance Overview"
        subtitle="Monitor daily clock-ins, shift schedules, overtime, and handle audit corrections."
        icon={<CalendarCheck className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Attendance & Shifts" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/attendance/my"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#fff0e8] text-[#f47b5b] hover:bg-[#f47b5b] hover:text-white transition-all shadow-xs"
            >
              <Clock className="w-4 h-4" /> My Clock Console
            </Link>

            {isHrOrOwner && (
              <>
                <Link
                  to="/attendance/shifts"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-[#eadbd2] text-[#252525] hover:border-[#f47b5b] hover:text-[#f47b5b] transition-all"
                >
                  <Layers className="w-4 h-4" /> Shifts & Schedule
                </Link>

                <Link
                  to="/attendance/reports"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-[#eadbd2] text-[#252525] hover:border-[#f47b5b] hover:text-[#f47b5b] transition-all"
                >
                  <Calendar className="w-4 h-4" /> Weekly Reports
                </Link>

                {pendingCorrections.length > 0 && (
                  <button
                    onClick={() => setCorrectionsModalOpen(true)}
                    className="relative inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-xs"
                  >
                    <AlertTriangle className="w-4 h-4" /> Requests
                    <span className="ml-1 px-1.5 py-0.2 bg-white text-amber-700 rounded-full text-[10px] font-bold">
                      {pendingCorrections.length}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        }
      />

        {/* Notifications */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white border border-[#eadbd2] rounded-[18px] p-4 flex flex-col justify-between shadow-xs">
            <span className="text-[11px] font-medium text-[#77716e] uppercase tracking-wider">Present</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-heading text-emerald-600">{summary.present}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] text-[#77716e] mt-1">On-time arrivals</span>
          </div>

          <div className="bg-white border border-[#eadbd2] rounded-[18px] p-4 flex flex-col justify-between shadow-xs">
            <span className="text-[11px] font-medium text-[#77716e] uppercase tracking-wider">Late</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-heading text-amber-600">{summary.late}</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-[10px] text-[#77716e] mt-1">Past grace period</span>
          </div>

          <div className="bg-white border border-[#eadbd2] rounded-[18px] p-4 flex flex-col justify-between shadow-xs">
            <span className="text-[11px] font-medium text-[#77716e] uppercase tracking-wider">Half Day</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-heading text-orange-600">{summary.halfDay}</span>
              <Sparkles className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-[10px] text-[#77716e] mt-1">&lt; 8 hrs worked</span>
          </div>

          <div className="bg-white border border-[#eadbd2] rounded-[18px] p-4 flex flex-col justify-between shadow-xs">
            <span className="text-[11px] font-medium text-[#77716e] uppercase tracking-wider">Absent</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-heading text-rose-600">{summary.absent}</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-[10px] text-[#77716e] mt-1">Unexcused absence</span>
          </div>

          <div className="bg-white border border-[#eadbd2] rounded-[18px] p-4 flex flex-col justify-between shadow-xs">
            <span className="text-[11px] font-medium text-[#77716e] uppercase tracking-wider">On Leave</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-heading text-indigo-600">{summary.onLeave}</span>
              <Umbrella className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-[10px] text-[#77716e] mt-1">Approved leaves</span>
          </div>

          <div className="bg-white border border-[#eadbd2] rounded-[18px] p-4 flex flex-col justify-between shadow-xs">
            <span className="text-[11px] font-medium text-[#77716e] uppercase tracking-wider">In Progress</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-heading text-blue-600">{summary.notClockedOut}</span>
              <RotateCcw className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-[10px] text-[#77716e] mt-1">Active sessions</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-[#eadbd2] rounded-[18px] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Date Input */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fff7f2] border border-[#eadbd2] rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#f47b5b]" />
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setPage(1); }}
                className="bg-transparent border-none text-[#252525] focus:outline-hidden text-xs"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fff7f2] border border-[#eadbd2] rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-[#77716e]" />
              <select
                value={departmentId}
                onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}
                className="bg-transparent border-none text-[#252525] focus:outline-hidden text-xs"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Shift Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fff7f2] border border-[#eadbd2] rounded-xl text-xs">
              <Layers className="w-3.5 h-3.5 text-[#77716e]" />
              <select
                value={shiftId}
                onChange={(e) => { setShiftId(e.target.value); setPage(1); }}
                className="bg-transparent border-none text-[#252525] focus:outline-hidden text-xs"
              >
                <option value="">All Shifts</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fff7f2] border border-[#eadbd2] rounded-xl text-xs">
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="bg-transparent border-none text-[#252525] focus:outline-hidden text-xs"
              >
                <option value="">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late Arrival</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ABSENT">Absent</option>
                <option value="NOT_CLOCKED_OUT">In Progress</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fff7f2] border border-[#eadbd2] rounded-xl text-xs flex-1 min-w-[150px]">
              <Search className="w-3.5 h-3.5 text-[#77716e]" />
              <input
                type="text"
                placeholder="Search name, code, email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="bg-transparent border-none text-[#252525] focus:outline-hidden w-full text-xs"
              />
            </div>
          </div>

          {/* Export CSV Button */}
          {isHrOrOwner && (
            <a
              href={getExportCsvUrl({ startDate: date, endDate: date, departmentId: departmentId || undefined, shiftId: shiftId || undefined })}
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-[#eadbd2] text-[#252525] hover:border-[#f47b5b] hover:text-[#f47b5b] transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export Day CSV
            </a>
          )}
        </div>

        {/* Attendance Records Table */}
        <div className="bg-white border border-[#eadbd2] rounded-[20px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#fff7f2] border-b border-[#eadbd2] text-[#77716e] font-medium">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department & Shift</th>
                  <th className="py-3 px-4">Clock In</th>
                  <th className="py-3 px-4">Clock Out</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Late / Overtime</th>
                  {isHrOrOwner && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadbd2]/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#77716e]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Clock className="w-6 h-6 animate-spin text-[#f47b5b]" />
                        <span>Loading daily attendance records...</span>
                      </div>
                    </td>
                  </tr>
                ) : attendances.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#77716e]">
                      No attendance records found matching current date and filters.
                    </td>
                  </tr>
                ) : (
                  attendances.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#fff9f6] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#252525]">{rec.employee?.name}</div>
                        <div className="text-[10px] text-[#77716e] font-mono">{rec.employee?.employeeCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[#252525]">{rec.employee?.department?.name || "Unassigned"}</div>
                        <div className="text-[10px] text-[#77716e]">
                          {rec.shift ? `${rec.shift.name} (${rec.shift.startTime}-${rec.shift.endTime})` : "General Shift"}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#252525]">
                        {formatTime(rec.clockIn)}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#252525]">
                        {formatTime(rec.clockOut)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(rec.status)}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {(rec.workedMinutes / 60).toFixed(1)} hrs
                      </td>
                      <td className="py-3 px-4">
                        {rec.lateMinutes > 0 && (
                          <span className="text-amber-600 font-semibold block text-[11px]">
                            +{rec.lateMinutes}m late
                          </span>
                        )}
                        {rec.overtimeMinutes > 0 && (
                          <span className="text-emerald-600 font-semibold block text-[11px]">
                            +{(rec.overtimeMinutes / 60).toFixed(1)}h OT
                          </span>
                        )}
                        {rec.lateMinutes === 0 && rec.overtimeMinutes === 0 && (
                          <span className="text-[#77716e]">—</span>
                        )}
                      </td>
                      {isHrOrOwner && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openDirectCorrection(rec)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#f47b5b] hover:text-[#d45838] transition-colors"
                          >
                            <FileEdit className="w-3.5 h-3.5" /> Correct
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#fff7f2] border-t border-[#eadbd2] text-xs text-[#77716e]">
            <span>Showing {attendances.length} of {totalCount} total entries</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#eadbd2] disabled:opacity-40 hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-[#252525]">Page {page} of {totalPages || 1}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-[#eadbd2] disabled:opacity-40 hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL 1: Pending Correction Requests (HR Review) */}
        {correctionsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-[22px] max-w-2xl w-full border border-[#eadbd2] p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
                <h3 className="font-heading font-bold text-lg text-[#252525] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> Pending Correction Requests
                </h3>
                <button onClick={() => setCorrectionsModalOpen(false)}>
                  <X className="w-5 h-5 text-[#77716e] hover:text-[#252525]" />
                </button>
              </div>

              {pendingCorrections.length === 0 ? (
                <p className="text-center py-8 text-xs text-[#77716e]">No pending requests at this time.</p>
              ) : (
                <div className="space-y-3">
                  {pendingCorrections.map((corr) => (
                    <div key={corr.id} className="p-4 rounded-xl border border-[#eadbd2] bg-[#fff7f2] space-y-2 text-xs">
                      <div className="flex justify-between font-semibold text-[#252525]">
                        <span>{corr.attendance?.employee?.name} ({corr.attendance?.employee?.employeeCode})</span>
                        <span className="text-[#77716e]">{corr.attendance?.attendanceDate}</span>
                      </div>
                      <p className="text-[#77716e] italic">"{corr.reason}"</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-[#eadbd2]/60">
                        <div>
                          <span className="text-[#77716e] block">Original Timings:</span>
                          <span className="font-mono">{formatTime(corr.previousClockIn)} — {formatTime(corr.previousClockOut)}</span>
                        </div>
                        <div>
                          <span className="text-emerald-700 font-semibold block">Requested Timings:</span>
                          <span className="font-mono text-emerald-800">{formatTime(corr.correctedClockIn)} — {formatTime(corr.correctedClockOut)}</span>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          disabled={reviewLoading}
                          onClick={() => handleReviewCorrection(corr.id, "REJECTED")}
                          className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          disabled={reviewLoading}
                          onClick={() => handleReviewCorrection(corr.id, "APPROVED")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs transition-colors"
                        >
                          Approve &amp; Recalculate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 2: Direct HR Correction */}
        {directCorrectionRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-[22px] max-w-md w-full border border-[#eadbd2] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
                <h3 className="font-heading font-bold text-base text-[#252525] flex items-center gap-2">
                  <FileEdit className="w-5 h-5 text-[#f47b5b]" /> HR Attendance Correction
                </h3>
                <button onClick={() => setDirectCorrectionRecord(null)}>
                  <X className="w-5 h-5 text-[#77716e] hover:text-[#252525]" />
                </button>
              </div>

              <form onSubmit={handleSubmitDirectCorrection} className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[#77716e] block mb-1">Employee</span>
                  <div className="font-semibold text-[#252525]">
                    {directCorrectionRecord.employee?.name} ({directCorrectionRecord.employee?.employeeCode})
                  </div>
                </div>

                <div>
                  <label className="text-[#77716e] block mb-1 font-medium">Clock-In Timestamp (Required)</label>
                  <input
                    type="datetime-local"
                    required
                    value={editClockIn}
                    onChange={(e) => setEditClockIn(e.target.value)}
                    className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                  />
                </div>

                <div>
                  <label className="text-[#77716e] block mb-1 font-medium">Clock-Out Timestamp (Optional)</label>
                  <input
                    type="datetime-local"
                    value={editClockOut}
                    onChange={(e) => setEditClockOut(e.target.value)}
                    className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                  />
                </div>

                <div>
                  <label className="text-[#77716e] block mb-1 font-medium">Audit Reason (Required)</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Provide justification for compliance audit log..."
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#eadbd2]">
                  <button
                    type="button"
                    onClick={() => setDirectCorrectionRecord(null)}
                    className="px-3.5 py-2 border border-[#eadbd2] rounded-xl font-semibold text-[#77716e] hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={directEditLoading}
                    className="px-4 py-2 bg-[#f47b5b] hover:bg-[#d45838] text-white rounded-xl font-semibold shadow-xs transition-colors"
                  >
                    {directEditLoading ? "Saving..." : "Save & Recalculate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

    </PageContainer>
  );
}
