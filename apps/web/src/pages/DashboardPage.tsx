import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Users,
  Umbrella,
  Clock,
  Building2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  FileText,
  BarChart2,
  Calendar,
  CheckSquare,
  ArrowRight,
  Loader2,
  LogOut,
} from "lucide-react";
import { PageContainer } from "../components/common";
import {
  getTodayAttendance,
  clockIn,
  clockOut,
  getDailyAttendance,
} from "../services/attendanceService";
import {
  getMyLeaveBalances,
  listLeaveRequests,
  listHolidays,
} from "../services/leaveService";
import { listEmployees, listDepartments } from "../services/employeeService";
import type { AttendanceRecord } from "../types/attendance";
import type { LeaveBalance, Holiday, LeaveRequest } from "../types/leave";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || "EMPLOYEE";
  const isOwnerOrHr = role === "OWNER" || role === "HR";
  const isManagerOrSupervisor = role === "MANAGER" || role === "SUPERVISOR";

  // Clock in / out widget state
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockNotes, setClockNotes] = useState("");
  const [clockMsg, setClockMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Leave & Holidays state
  const [myBalances, setMyBalances] = useState<LeaveBalance[]>([]);
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState<Holiday[]>([]);

  // Admin / Manager counts state
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    late: 0,
    absent: 0,
    notClockedOut: 0,
  });

  const [loading, setLoading] = useState(true);

  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const promises: Promise<any>[] = [
        getTodayAttendance().catch(() => ({ data: { attendance: null } })),
        getMyLeaveBalances().catch(() => ({ data: [] })),
        listHolidays(new Date().getFullYear()).catch(() => ({ data: [] })),
        listLeaveRequests({ limit: 5 }).catch(() => ({ data: { requests: [] } })),
      ];

      if (isOwnerOrHr || isManagerOrSupervisor) {
        promises.push(
          listEmployees({ limit: 1 }).catch(() => ({ data: { pagination: { total: 0 } } })),
          listDepartments().catch(() => ({ data: { departments: [] } })),
          getDailyAttendance({ date: new Date().toISOString().split("T")[0] }).catch(() => ({
            data: { summary: { present: 0, late: 0, absent: 0, notClockedOut: 0 } },
          })),
          listLeaveRequests({
            status: isOwnerOrHr
              ? "PENDING_HR"
              : role === "MANAGER"
              ? "PENDING_MANAGER"
              : "PENDING_SUPERVISOR",
            limit: 1,
          }).catch(() => ({ data: { total: 0 } }))
        );
      }

      const results = await Promise.all(promises);

      // Personal data
      if (results[0]?.data?.attendance) {
        setTodayAttendance(results[0].data.attendance);
      }
      if (Array.isArray(results[1]?.data)) {
        setMyBalances(results[1].data);
      }
      if (Array.isArray(results[2]?.data)) {
        const todayStr = new Date().toISOString().split("T")[0]!;
        const futureHolidays = results[2].data
          .filter((h: Holiday) => h.date >= todayStr)
          .sort((a: Holiday, b: Holiday) => a.date.localeCompare(b.date))
          .slice(0, 3);
        setUpcomingHolidays(futureHolidays);
      }
      if (results[3]?.data?.requests) {
        setRecentRequests(results[3].data.requests);
      }

      // Admin / Manager data
      if (isOwnerOrHr || isManagerOrSupervisor) {
        if (results[4]?.data?.pagination?.total !== undefined) {
          setTotalEmployees(results[4].data.pagination.total);
        }
        if (results[5]?.data?.departments) {
          setTotalDepartments(results[5].data.departments.length);
        }
        if (results[6]?.data?.summary) {
          setAttendanceSummary(results[6].data.summary);
        }
        if (results[7]?.data?.total !== undefined) {
          setPendingApprovalsCount(results[7].data.total);
        }
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  }, [isOwnerOrHr, isManagerOrSupervisor, role]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const handleClockIn = async () => {
    setClockLoading(true);
    setClockMsg(null);
    try {
      const res = await clockIn(clockNotes || undefined);
      if (res.data?.attendance) {
        setTodayAttendance(res.data.attendance);
        setClockMsg({ type: "success", text: "Clock-in recorded successfully!" });
        setClockNotes("");
      }
    } catch (err: any) {
      setClockMsg({ type: "error", text: err?.message || "Failed to clock in." });
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    setClockMsg(null);
    try {
      const res = await clockOut(clockNotes || undefined);
      if (res.data?.attendance) {
        setTodayAttendance(res.data.attendance);
        setClockMsg({ type: "success", text: "Clock-out recorded successfully!" });
        setClockNotes("");
      }
    } catch (err: any) {
      setClockMsg({ type: "error", text: err?.message || "Failed to clock out." });
    } finally {
      setClockLoading(false);
    }
  };

  const isClockedIn = !!todayAttendance?.clockIn && !todayAttendance?.clockOut;
  const isClockedOut = !!todayAttendance?.clockOut;

  // Calculate total leave stats
  const totalAllocated = myBalances.reduce((acc, b) => acc + Number(b.allocatedDays), 0);
  const totalUsed = myBalances.reduce((acc, b) => acc + Number(b.usedDays), 0);
  const totalAvailable = myBalances.reduce(
    (acc, b) => acc + (Number(b.allocatedDays) + Number(b.carriedForwardDays || 0) + Number(b.adjustedDays || 0) - Number(b.usedDays || 0)),
    0
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#f47b5b] animate-spin" />
          <p className="text-sm text-[#77716e]">Loading workspace overview...</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-[#fff0e8] via-[#ffece2] to-[#fff7f2] border border-[#eadbd2] rounded-[24px] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-[#eadbd2] text-[#23855b] text-xs font-semibold mb-3">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Workspace: {user?.companyName || "Oppidan India"}</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#252525] tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="text-sm text-[#77716e] mt-1">
              {role === "OWNER" && "Executive Company Workspace Overview & Operational Control"}
              {role === "HR" && "Human Resources Management, Approvals & Staff Administration"}
              {role === "MANAGER" && "Department Operations, Shift Oversight & Team Leave Workflow"}
              {role === "SUPERVISOR" && "Team Attendance Oversight, Duty Schedules & Direct Reviews"}
              {role === "EMPLOYEE" && "Employee Self-Service Portal, Attendance Punch & Leave Management"}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1.5 self-start sm:self-auto bg-white/80 p-3 rounded-2xl border border-[#eadbd2]">
            <span className="text-[11px] text-[#77716e] uppercase tracking-wider font-semibold">
              Live System Time
            </span>
            <span className="text-xl font-bold text-[#252525] font-mono">
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <span className="text-xs text-[#77716e]">
              {currentTime.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* PENDING APPROVALS ALERT (For Reviewers) */}
      {(isOwnerOrHr || isManagerOrSupervisor) && pendingApprovalsCount > 0 && (
        <div className="bg-[#fff0e8] border border-[#f47b5b]/40 rounded-[20px] p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f47b5b] text-white flex items-center justify-center font-bold">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-[#252525]">
                {pendingApprovalsCount} Leave Request{pendingApprovalsCount > 1 ? "s" : ""} Pending Review
              </h3>
              <p className="text-xs text-[#77716e]">
                Applications require your approval in the {role} stage queue.
              </p>
            </div>
          </div>
          <Link
            to="/leave/approvals"
            className="px-4 py-2 bg-[#f47b5b] text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-[#d96243] transition-all flex items-center gap-1.5"
          >
            <span>Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ADMIN & MANAGEMENT SUMMARY METRICS */}
      {(isOwnerOrHr || isManagerOrSupervisor) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-[#252525] flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#f47b5b]" />
              {isOwnerOrHr ? "Company Headcount & Attendance Pulse" : "Departmental Overview"}
            </h2>
            <Link to="/attendance" className="text-xs font-semibold text-[#f47b5b] hover:underline flex items-center gap-1">
              Full Attendance Log <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-[#eadbd2] rounded-[20px] p-4 shadow-xs">
              <div className="flex items-center justify-between text-[#77716e] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Staff</span>
                <Users className="w-4 h-4 text-[#f47b5b]" />
              </div>
              <span className="text-2xl font-bold text-[#252525]">{totalEmployees}</span>
              <span className="text-[11px] text-[#77716e] block mt-0.5">Enrolled personnel</span>
            </div>

            <div className="bg-white border border-[#eadbd2] rounded-[20px] p-4 shadow-xs">
              <div className="flex items-center justify-between text-[#77716e] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Present Today</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-emerald-600">{attendanceSummary.present}</span>
              <span className="text-[11px] text-emerald-700 block mt-0.5">On duty now</span>
            </div>

            <div className="bg-white border border-[#eadbd2] rounded-[20px] p-4 shadow-xs">
              <div className="flex items-center justify-between text-[#77716e] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Late Clock-Ins</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-amber-600">{attendanceSummary.late}</span>
              <span className="text-[11px] text-amber-700 block mt-0.5">Grace period passed</span>
            </div>

            <div className="bg-white border border-[#eadbd2] rounded-[20px] p-4 shadow-xs">
              <div className="flex items-center justify-between text-[#77716e] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Departments</span>
                <Building2 className="w-4 h-4 text-[#f47b5b]" />
              </div>
              <span className="text-2xl font-bold text-[#252525]">{totalDepartments}</span>
              <span className="text-[11px] text-[#77716e] block mt-0.5">Active organizational units</span>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE WORKSPACE: CLOCK-IN / LEAVE BALANCES / HOLIDAYS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Punch Widget + Recent Requests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-Time Attendance Punch Widget */}
          <div className="bg-white border border-[#eadbd2] rounded-[24px] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fff0e8] text-[#f47b5b] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-base text-[#252525]">
                    Attendance Terminal
                  </h2>
                  <p className="text-xs text-[#77716e]">
                    Punch clock-in and clock-out with geolocation & shift schedule sync
                  </p>
                </div>
              </div>

              {todayAttendance && (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    isClockedIn
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : isClockedOut
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {isClockedIn ? "ON CLOCK (ACTIVE)" : isClockedOut ? "DAY COMPLETED" : "NOT CLOCKED IN"}
                </span>
              )}
            </div>

            {clockMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  clockMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {clockMsg.type === "success" ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                )}
                <span>{clockMsg.text}</span>
              </div>
            )}

            <div className="bg-[#fff7f2] border border-[#eadbd2] rounded-2xl p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-center">
                <div className="bg-white p-3 rounded-xl border border-[#eadbd2]">
                  <span className="text-[11px] text-[#77716e] uppercase tracking-wider block">Punch In</span>
                  <span className="text-base font-bold text-[#252525] mt-0.5 block">
                    {todayAttendance?.clockIn
                      ? new Date(todayAttendance.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "--:--"}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#eadbd2]">
                  <span className="text-[11px] text-[#77716e] uppercase tracking-wider block">Punch Out</span>
                  <span className="text-base font-bold text-[#252525] mt-0.5 block">
                    {todayAttendance?.clockOut
                      ? new Date(todayAttendance.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "--:--"}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#eadbd2]">
                  <span className="text-[11px] text-[#77716e] uppercase tracking-wider block">Hours Worked</span>
                  <span className="text-base font-bold text-[#f47b5b] mt-0.5 block">
                    {todayAttendance?.workedMinutes
                      ? `${(todayAttendance.workedMinutes / 60).toFixed(1)} hrs`
                      : isClockedIn
                      ? "In Progress"
                      : "0.0 hrs"}
                  </span>
                </div>
              </div>

              {!isClockedOut && (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    placeholder="Optional punch notes (e.g. Remote work, Client meeting)..."
                    value={clockNotes}
                    onChange={(e) => setClockNotes(e.target.value)}
                    className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-white border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b] text-[#252525]"
                  />

                  {!isClockedIn ? (
                    <button
                      onClick={handleClockIn}
                      disabled={clockLoading}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold text-xs shadow-xs hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {clockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                      <span>Clock In Now</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleClockOut}
                      disabled={clockLoading}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold text-xs shadow-xs hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {clockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                      <span>Clock Out Now</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 flex justify-between items-center text-xs">
              <span className="text-[#77716e]">Missed your punch?</span>
              <Link to="/attendance/my" className="text-[#f47b5b] font-semibold hover:underline">
                View My History & Submit Correction →
              </Link>
            </div>
          </div>

          {/* Recent Leave Requests Card */}
          <div className="bg-white border border-[#eadbd2] rounded-[24px] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fff0e8] text-[#f47b5b] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-base text-[#252525]">
                    Recent Leave Applications
                  </h2>
                  <p className="text-xs text-[#77716e]">Track real-time status of your time-off requests</p>
                </div>
              </div>

              <Link
                to="/leave/apply"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Apply Leave</span>
              </Link>
            </div>

            {recentRequests.length === 0 ? (
              <div className="text-center py-8 bg-[#fff7f2] rounded-xl border border-[#eadbd2]">
                <Umbrella className="w-8 h-8 text-[#eadbd2] mx-auto mb-2" />
                <p className="text-xs text-[#77716e]">No recent leave applications on record.</p>
                <Link
                  to="/leave/apply"
                  className="mt-2 text-xs font-semibold text-[#f47b5b] inline-flex items-center gap-1"
                >
                  Submit your first request <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-[#fff7f2] border border-[#eadbd2] hover:bg-[#fff0e8]/30 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#252525] flex items-center gap-2">
                        <span>{req.leaveType?.name || "Leave"}</span>
                        <span className="text-[11px] font-normal text-[#77716e]">
                          ({req.days} {req.days === 1 ? "day" : "days"})
                        </span>
                      </div>
                      <div className="text-[11px] text-[#77716e] mt-0.5">
                        {req.startDate} to {req.endDate} • {req.reason}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                        req.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : req.status === "REJECTED"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : req.status === "CANCELLED"
                          ? "bg-gray-100 text-gray-500 border-gray-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}

                <div className="pt-2 text-right">
                  <Link to="/leave/my-requests" className="text-xs font-semibold text-[#f47b5b] hover:underline">
                    View all my requests →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Leave Balances & Upcoming Holidays */}
        <div className="space-y-6">
          {/* Leave Balances Summary */}
          <div className="bg-white border border-[#eadbd2] rounded-[24px] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-base text-[#252525] flex items-center gap-2">
                <Umbrella className="w-5 h-5 text-[#f47b5b]" />
                Leave Balances
              </h2>
              <Link to="/leave" className="text-xs text-[#f47b5b] font-semibold hover:underline">
                Details
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="bg-[#fff7f2] p-2.5 rounded-xl border border-[#eadbd2]">
                <span className="text-[10px] text-[#77716e] uppercase tracking-wider block">Allocated</span>
                <span className="text-base font-bold text-[#252525]">{totalAllocated}</span>
              </div>
              <div className="bg-[#fff7f2] p-2.5 rounded-xl border border-[#eadbd2]">
                <span className="text-[10px] text-[#77716e] uppercase tracking-wider block">Used</span>
                <span className="text-base font-bold text-amber-600">{totalUsed}</span>
              </div>
              <div className="bg-[#fff0e8] p-2.5 rounded-xl border border-[#f47b5b]/30">
                <span className="text-[10px] text-[#f47b5b] uppercase tracking-wider font-semibold block">Available</span>
                <span className="text-base font-bold text-[#f47b5b]">{totalAvailable}</span>
              </div>
            </div>

            {myBalances.length === 0 ? (
              <p className="text-xs text-[#77716e] text-center py-4 bg-[#fff7f2] rounded-xl border border-[#eadbd2]">
                No leave allocations currently assigned.
              </p>
            ) : (
              <div className="space-y-2">
                {myBalances.map((bal) => (
                  <div
                    key={bal.id}
                    className="p-2.5 bg-[#fff7f2] rounded-xl border border-[#eadbd2] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#252525] block">{bal.leaveType?.name}</span>
                      <span className="text-[10px] text-[#77716e]">
                        Used: {bal.usedDays} of {bal.allocatedDays}
                      </span>
                    </div>
                    <span className="font-bold text-[#f47b5b] bg-white px-2 py-0.5 rounded-lg border border-[#eadbd2]">
                      {bal.allocatedDays + (bal.carriedForwardDays || 0) + (bal.adjustedDays || 0) - (bal.usedDays || 0)} days left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Holidays */}
          <div className="bg-white border border-[#eadbd2] rounded-[24px] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-base text-[#252525] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#f47b5b]" />
                Upcoming Holidays
              </h2>
              <Link to="/leave/holidays" className="text-xs text-[#f47b5b] font-semibold hover:underline">
                Calendar
              </Link>
            </div>

            {upcomingHolidays.length === 0 ? (
              <p className="text-xs text-[#77716e] text-center py-4 bg-[#fff7f2] rounded-xl border border-[#eadbd2]">
                No upcoming holidays scheduled.
              </p>
            ) : (
              <div className="space-y-2.5">
                {upcomingHolidays.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-[#fff7f2] rounded-xl border border-[#eadbd2] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#252525]">{h.name}</div>
                      <div className="text-[11px] text-[#77716e]">
                        {new Date(h.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {h.holidayType}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white border border-[#eadbd2] rounded-[24px] p-5 shadow-xs">
            <h3 className="text-xs font-bold text-[#77716e] uppercase tracking-wider mb-3">
              Quick Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/leave/calendar"
                className="p-3 rounded-xl bg-[#fff7f2] border border-[#eadbd2] hover:bg-[#fff0e8] hover:text-[#f47b5b] transition-colors font-medium text-center flex flex-col items-center gap-1"
              >
                <Calendar className="w-4 h-4 text-[#f47b5b]" />
                <span>Leave Calendar</span>
              </Link>

              <Link
                to="/attendance/my"
                className="p-3 rounded-xl bg-[#fff7f2] border border-[#eadbd2] hover:bg-[#fff0e8] hover:text-[#f47b5b] transition-colors font-medium text-center flex flex-col items-center gap-1"
              >
                <Clock className="w-4 h-4 text-[#f47b5b]" />
                <span>My Attendance</span>
              </Link>

              {isOwnerOrHr && (
                <>
                  <Link
                    to="/employees/new"
                    className="p-3 rounded-xl bg-[#fff7f2] border border-[#eadbd2] hover:bg-[#fff0e8] hover:text-[#f47b5b] transition-colors font-medium text-center flex flex-col items-center gap-1"
                  >
                    <Plus className="w-4 h-4 text-[#f47b5b]" />
                    <span>Add Employee</span>
                  </Link>

                  <Link
                    to="/reports"
                    className="p-3 rounded-xl bg-[#fff7f2] border border-[#eadbd2] hover:bg-[#fff0e8] hover:text-[#f47b5b] transition-colors font-medium text-center flex flex-col items-center gap-1"
                  >
                    <BarChart2 className="w-4 h-4 text-[#f47b5b]" />
                    <span>Company Reports</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
