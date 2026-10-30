import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Umbrella,
  Send,
  Info,
  ShieldCheck,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import {
  listLeaveTypes,
  getMyLeaveBalances,
  listHolidays,
  createLeaveRequest,
} from "../services/leaveService";
import type { LeaveType, LeaveBalance, Holiday } from "../types/leave";

export function ApplyLeavePage() {
  const navigate = useNavigate();

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]!
  );
  const [endDate, setEndDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]!
  );
  const [startHalfDay, setStartHalfDay] = useState<boolean>(false);
  const [endHalfDay, setEndHalfDay] = useState<boolean>(false);
  const [reason, setReason] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load types, balances, and holidays
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const year = new Date().getFullYear();
      const [typesRes, balRes, holRes] = await Promise.all([
        listLeaveTypes(),
        getMyLeaveBalances(),
        listHolidays(year),
      ]);

      if (typesRes.data) {
        const activeTypes = typesRes.data.filter((t) => t.status === "ACTIVE");
        setLeaveTypes(activeTypes);
        if (activeTypes.length > 0) {
          setSelectedTypeId(activeTypes[0]!.id);
        }
      }
      if (balRes.data) setBalances(balRes.data);
      if (holRes.data) setHolidays(holRes.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load leave configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedType = useMemo(
    () => leaveTypes.find((t) => t.id === selectedTypeId),
    [leaveTypes, selectedTypeId]
  );

  const selectedBalance = useMemo(
    () => balances.find((b) => b.leaveTypeId === selectedTypeId),
    [balances, selectedTypeId]
  );

  // Available balance
  const availableDays = useMemo(() => {
    if (!selectedBalance) return selectedType ? selectedType.maximumDays : 0;
    return (
      selectedBalance.allocatedDays +
      selectedBalance.carriedForwardDays +
      selectedBalance.adjustedDays -
      selectedBalance.usedDays
    );
  }, [selectedBalance, selectedType]);

  const pendingDays = selectedBalance?.pendingDays || 0;
  const remainingAfterPending = Math.max(0, availableDays - pendingDays);

  // Calculate estimated working days (skipping weekends & holidays)
  const calculatedDuration = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) return 0;
    const holidaySet = new Set(holidays.map((h) => h.date.split("T")[0]));
    let count = 0;
    const cursor = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    while (cursor <= end) {
      const dayOfWeek = cursor.getDay(); // 0 = Sun, 6 = Sat
      const dateStr = cursor.toISOString().split("T")[0]!;

      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
        const isFirst = dateStr === startDate;
        const isLast = dateStr === endDate;

        if (isFirst && startHalfDay && isLast && endHalfDay) {
          count += 0.5;
        } else if (isFirst && startHalfDay) {
          count += 0.5;
        } else if (isLast && endHalfDay) {
          count += 0.5;
        } else {
          count += 1;
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  }, [startDate, endDate, startHalfDay, endHalfDay, holidays]);

  const balanceAfterThisRequest = remainingAfterPending - calculatedDuration;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId || !startDate || !endDate || !reason.trim()) {
      setError("Please complete all required fields.");
      return;
    }
    if (startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }
    if (calculatedDuration <= 0) {
      setError("Requested range covers 0 working days (weekends or public holidays).");
      return;
    }

    if (selectedType && !selectedType.allowNegativeBalance && balanceAfterThisRequest < 0) {
      setError(
        `Insufficient leave balance. You have ${remainingAfterPending} day(s) available, but requested ${calculatedDuration} day(s).`
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createLeaveRequest({
        leaveTypeId: selectedTypeId,
        startDate,
        endDate,
        startHalfDay,
        endHalfDay,
        reason: reason.trim(),
      });
      setSuccess("Leave request submitted successfully! Redirecting to your requests...");
      setTimeout(() => {
        navigate("/leave/my-requests");
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to submit leave request.");
      setSubmitting(false);
    }
  };

  return (
    <PageContainer maxWidth="max-w-5xl">
      <PageHeader
        title="Submit Leave Request"
        subtitle="Apply for planned or medical leave. Duration is automatically computed based on working days and holidays."
        icon={<Umbrella className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Leave", to: "/leave" },
          { label: "Apply for Leave" },
        ]}
        actions={
          <Link
            to="/leave/my-requests"
            className="text-xs font-semibold text-[#f47b5b] hover:underline flex items-center gap-1"
          >
            View My Requests <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      />

        {/* Feedback Messages */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{success}</span>
          </div>
        )}

        {/* Main Application Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-[#eadbd2] rounded-[22px] p-6 shadow-xs space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Leave Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                  Leave Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {leaveTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTypeId(t.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedTypeId === t.id
                          ? "border-[#f47b5b] bg-[#fff0e8]/50 shadow-xs"
                          : "border-[#eadbd2] bg-white hover:border-[#f47b5b]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#252525]">{t.name}</span>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#fff7f2] text-[#77716e] border border-[#eadbd2]">
                          {t.code}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#77716e] mt-1 block">
                        {t.paid ? "Paid Leave" : "Unpaid Leave"} &bull; Max {t.maximumDays}d
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 p-2.5 bg-[#fff7f2] border border-[#eadbd2] rounded-xl">
                    <Calendar className="w-4 h-4 text-[#f47b5b]" />
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent border-none text-xs text-[#252525] focus:outline-hidden w-full"
                    />
                  </div>
                  {selectedType?.allowHalfDay && (
                    <label className="mt-2 flex items-center gap-2 text-xs text-[#77716e] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={startHalfDay}
                        onChange={(e) => setStartHalfDay(e.target.checked)}
                        className="rounded border-[#eadbd2] text-[#f47b5b] focus:ring-[#f47b5b]"
                      />
                      <span>Half Day (Morning/Afternoon)</span>
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 p-2.5 bg-[#fff7f2] border border-[#eadbd2] rounded-xl">
                    <Calendar className="w-4 h-4 text-[#f47b5b]" />
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent border-none text-xs text-[#252525] focus:outline-hidden w-full"
                    />
                  </div>
                  {selectedType?.allowHalfDay && (
                    <label className="mt-2 flex items-center gap-2 text-xs text-[#77716e] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={endHalfDay}
                        onChange={(e) => setEndHalfDay(e.target.checked)}
                        className="rounded border-[#eadbd2] text-[#f47b5b] focus:ring-[#f47b5b]"
                      />
                      <span>Half Day on Last Day</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                  Reason for Leave <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide brief context for your supervisor and HR reviewers..."
                  className="w-full p-3 text-xs rounded-xl border border-[#eadbd2] bg-[#fff7f2]/20 text-[#252525] focus:outline-hidden focus:border-[#f47b5b] transition-colors"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eadbd2]">
                <button
                  type="button"
                  onClick={() => navigate("/leave")}
                  className="px-5 py-2.5 rounded-xl border border-[#eadbd2] text-xs font-semibold text-[#77716e] hover:bg-[#fff0e8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || loading || calculatedDuration <= 0}
                  className="px-6 py-2.5 rounded-xl bg-[#f47b5b] hover:bg-[#d95d3d] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Submitting..." : `Submit Leave (${calculatedDuration} Days)`}
                </button>
              </div>
            </form>
          </div>

          {/* Right Summary & Workflow Preview (1 col) */}
          <div className="space-y-6">
            {/* Calculation Preview Card */}
            <div className="bg-white border border-[#eadbd2] rounded-[22px] p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#77716e] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#f47b5b]" /> Leave Calculation Preview
              </h3>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#77716e]">Requested Duration</span>
                  <span className="font-mono font-bold text-[#252525] text-sm">
                    {calculatedDuration} Working Days
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#77716e]">Current Available</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {remainingAfterPending} Days
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#77716e]">Pending Under Review</span>
                  <span className="font-mono font-semibold text-amber-600">
                    {pendingDays} Days
                  </span>
                </div>
                <div className="border-t border-[#eadbd2] pt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#252525]">Balance After Approval</span>
                  <span
                    className={`font-mono font-bold ${
                      balanceAfterThisRequest >= 0 ? "text-indigo-600" : "text-rose-600"
                    }`}
                  >
                    {balanceAfterThisRequest.toFixed(1)} Days
                  </span>
                </div>
              </div>

              {selectedType?.minimumNoticeDays ? (
                <div className="p-3 bg-[#fff0e8] rounded-xl border border-[#eadbd2] text-[11px] text-[#77716e] flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-[#f47b5b] flex-shrink-0 mt-0.5" />
                  <span>
                    Advance notice required: <strong>{selectedType.minimumNoticeDays} day(s)</strong>.
                  </span>
                </div>
              ) : null}
            </div>

            {/* Approval Workflow Stepper */}
            <div className="bg-white border border-[#eadbd2] rounded-[22px] p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#77716e] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#f47b5b]" /> Approval Workflow
              </h3>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#eadbd2]">
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-[#f47b5b] text-white flex items-center justify-center text-[10px] font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#252525]">Submission</h4>
                    <p className="text-[11px] text-[#77716e]">Request verified by rules engine</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-white border-2 border-[#f47b5b] text-[#f47b5b] flex items-center justify-center text-[10px] font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#252525]">Direct Supervisor Review</h4>
                    <p className="text-[11px] text-[#77716e]">Supervisor validates coverage</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-white border-2 border-[#eadbd2] text-[#77716e] flex items-center justify-center text-[10px] font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#252525]">HR Final Sign-Off</h4>
                    <p className="text-[11px] text-[#77716e]">Entitlement deduction & attendance sync</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </PageContainer>
  );
}
