import { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Square,
  CheckCircle2,
  FileQuestion,
  X,
  History,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import {
  clockIn,
  clockOut,
  getTodayAttendance,
  getMyAttendanceHistory,
  requestCorrection,
} from "../services/attendanceService";
import type { AttendanceRecord } from "../types/attendance";

export function EmployeeAttendancePage() {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Live timer for active session
  const [elapsed, setElapsed] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Correction request modal state
  const [correctionTarget, setCorrectionTarget] = useState<AttendanceRecord | null>(null);
  const [reqClockIn, setReqClockIn] = useState("");
  const [reqClockOut, setReqClockOut] = useState("");
  const [reqReason, setReqReason] = useState("");
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Fetch today & history
  const loadData = async () => {
    setLoading(true);
    try {
      const [todayRes, histRes] = await Promise.all([
        getTodayAttendance(),
        getMyAttendanceHistory({ limit: 30 }),
      ]);
      if (todayRes.data?.attendance) {
        setTodayRecord(todayRes.data.attendance);
      } else {
        setTodayRecord(null);
      }
      if (histRes.data?.attendances) {
        setHistory(histRes.data.attendances);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update live elapsed clock timer
  useEffect(() => {
    if (!todayRecord?.clockIn || todayRecord.clockOut) {
      return;
    }

    const clockInTime = new Date(todayRecord.clockIn).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = Math.max(0, now - clockInTime);
      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      setElapsed({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [todayRecord]);

  const handleClockIn = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await clockIn();
      if (res.data?.attendance) {
        setTodayRecord(res.data.attendance);
        setSuccess("Clock-in recorded successfully! Have a productive shift.");
        await loadData();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to clock in");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!window.confirm("Are you sure you want to clock out for today?")) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await clockOut();
      if (res.data?.attendance) {
        setTodayRecord(res.data.attendance);
        setSuccess("Clock-out recorded successfully! Worked hours calculated.");
        await loadData();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to clock out");
    } finally {
      setActionLoading(false);
    }
  };

  const openCorrectionModal = (rec: AttendanceRecord) => {
    setCorrectionTarget(rec);
    setReqClockIn(rec.clockIn ? new Date(rec.clockIn).toISOString().slice(0, 16) : "");
    setReqClockOut(rec.clockOut ? new Date(rec.clockOut).toISOString().slice(0, 16) : "");
    setReqReason("");
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget) return;
    setSubmittingCorrection(true);
    try {
      await requestCorrection(correctionTarget.id, {
        correctedClockIn: new Date(reqClockIn).toISOString(),
        correctedClockOut: reqClockOut ? new Date(reqClockOut).toISOString() : null,
        reason: reqReason,
      });
      setSuccess("Correction request submitted for HR approval.");
      setCorrectionTarget(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to submit correction request");
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const formatTime = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isClockedIn = Boolean(todayRecord?.clockIn && !todayRecord?.clockOut);
  const isCompleted = Boolean(todayRecord?.clockIn && todayRecord?.clockOut);

  return (
    <PageContainer maxWidth="max-w-5xl">
      <PageHeader
        title="Personal Attendance Console"
        subtitle="Record your daily work shift, monitor elapsed hours, and request time corrections."
        icon={<Clock className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Attendance", to: "/attendance" },
          { label: "My Console" },
        ]}
      />

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Live Clock-In / Clock-Out Card */}
      <div className="bg-white border border-[#eadbd2] rounded-[22px] p-6 sm:p-8 shadow-xs text-center space-y-6">
        <div className="max-w-md mx-auto space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#77716e]">
            Today &bull; {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
          </span>
          <h2 className="text-3xl font-heading font-bold text-[#252525]">
            {todayRecord?.shift ? todayRecord.shift.name : "Standard Working Shift"}
          </h2>
          {todayRecord?.shift && (
            <p className="text-xs text-[#77716e] font-mono">
              Scheduled: {todayRecord.shift.startTime} — {todayRecord.shift.endTime} (Grace: {todayRecord.shift.gracePeriodMinutes}m)
            </p>
          )}
        </div>

        {/* Clock State Display */}
        <div className="py-4">
          {isClockedIn ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold animate-pulse">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Shift In Progress
              </div>
              <div className="font-mono text-4xl sm:text-5xl font-bold text-[#252525] tracking-tight">
                {String(elapsed.hours).padStart(2, "0")} : {String(elapsed.minutes).padStart(2, "0")} : {String(elapsed.seconds).padStart(2, "0")}
              </div>
              <p className="text-xs text-[#77716e]">
                Clocked in at <span className="font-mono font-medium text-[#252525]">{formatTime(todayRecord?.clockIn)}</span>
              </p>
              <div>
                <button
                  disabled={actionLoading}
                  onClick={handleClockOut}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95"
                >
                  <Square className="w-4 h-4 fill-white" /> Clock Out for the Day
                </button>
              </div>
            </div>
          ) : isCompleted ? (
            <div className="space-y-3 p-4 bg-[#fff7f2] rounded-2xl border border-[#eadbd2] max-w-md mx-auto">
              <div className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Today's Shift Completed
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div className="bg-white p-3 rounded-xl border border-[#eadbd2]">
                  <span className="text-[#77716e] block">Worked Duration</span>
                  <span className="font-mono font-bold text-base text-[#252525]">
                    {((todayRecord?.workedMinutes || 0) / 60).toFixed(1)} hrs
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#eadbd2]">
                  <span className="text-[#77716e] block">Status</span>
                  <span className="font-semibold text-base text-[#252525]">
                    {todayRecord?.status}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#77716e] pt-1">
                In: {formatTime(todayRecord?.clockIn)} &bull; Out: {formatTime(todayRecord?.clockOut)}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[#77716e]">You have not clocked in for today's shift yet.</p>
              <button
                disabled={actionLoading}
                onClick={handleClockIn}
                className="inline-flex items-center gap-2 px-10 py-4 bg-[#f47b5b] hover:bg-[#d45838] text-white rounded-2xl font-bold text-base shadow-lg shadow-[#f47b5b]/20 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <Play className="w-5 h-5 fill-white" /> Clock In Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Personal Attendance History Table */}
      <div className="bg-white border border-[#eadbd2] rounded-[20px] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#eadbd2] flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-[#252525] flex items-center gap-2">
            <History className="w-4 h-4 text-[#f47b5b]" /> Attendance Log &bull; Past 30 Days
          </h3>
          <span className="text-xs text-[#77716e]">{history.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#fff7f2] border-b border-[#eadbd2] text-[#77716e] font-medium">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Shift</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Request Fix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eadbd2]/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#77716e]">Loading history...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#77716e]">No prior attendance logs recorded yet.</td>
                </tr>
              ) : (
                history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#fff9f6] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#252525]">
                      {rec.attendanceDate}
                    </td>
                    <td className="py-3 px-4 text-[#77716e]">
                      {rec.shift?.name || "General Shift"}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[#252525]">
                      {formatTime(rec.clockIn)}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[#252525]">
                      {formatTime(rec.clockOut)}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {(rec.workedMinutes / 60).toFixed(1)} hrs
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fff7f2] border border-[#eadbd2] text-[#252525]">
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openCorrectionModal(rec)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#f47b5b] hover:text-[#d45838] transition-colors"
                      >
                        <FileQuestion className="w-3.5 h-3.5" /> Request Fix
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Request Correction */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[22px] max-w-md w-full border border-[#eadbd2] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
              <h3 className="font-heading font-bold text-base text-[#252525]">
                Request Attendance Correction
              </h3>
              <button onClick={() => setCorrectionTarget(null)}>
                <X className="w-5 h-5 text-[#77716e] hover:text-[#252525]" />
              </button>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-3.5 text-xs">
              <div className="bg-[#fff7f2] p-3 rounded-xl border border-[#eadbd2] space-y-1">
                <div className="text-[#77716e]">Date: <span className="font-semibold text-[#252525]">{correctionTarget.attendanceDate}</span></div>
                <div className="text-[#77716e]">Current Record: <span className="font-mono text-[#252525]">{formatTime(correctionTarget.clockIn)} — {formatTime(correctionTarget.clockOut)}</span></div>
              </div>

              <div>
                <label className="text-[#77716e] block mb-1 font-medium">Requested Clock-In (Required)</label>
                <input
                  type="datetime-local"
                  required
                  value={reqClockIn}
                  onChange={(e) => setReqClockIn(e.target.value)}
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                />
              </div>

              <div>
                <label className="text-[#77716e] block mb-1 font-medium">Requested Clock-Out (Optional)</label>
                <input
                  type="datetime-local"
                  value={reqClockOut}
                  onChange={(e) => setReqClockOut(e.target.value)}
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                />
              </div>

              <div>
                <label className="text-[#77716e] block mb-1 font-medium">Reason for Discrepancy (Required)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Biometric device failure, forgot to clock out before offsite meeting..."
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#eadbd2]">
                <button
                  type="button"
                  onClick={() => setCorrectionTarget(null)}
                  className="px-3.5 py-2 border border-[#eadbd2] rounded-xl font-semibold text-[#77716e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCorrection}
                  className="px-4 py-2 bg-[#f47b5b] hover:bg-[#d45838] text-white rounded-xl font-semibold transition-colors"
                >
                  {submittingCorrection ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PageContainer>
  );
}
