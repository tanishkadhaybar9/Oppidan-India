import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CheckSquare,
  ArrowRight,
  X,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { useAuth } from "../context/AuthContext";
import {
  getMyLeaveBalances,
  listLeaveRequests,
  listLeaveTypes,
  createLeaveRequest,
} from "../services/leaveService";
import type { LeaveBalance, LeaveRequest, LeaveType } from "../types/leave";

export function LeaveDashboardPage() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
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

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [balRes, reqRes, typesRes] = await Promise.all([
        getMyLeaveBalances(),
        listLeaveRequests({ limit: 5 }),
        listLeaveTypes(),
      ]);

      if (balRes.data) setBalances(balRes.data);
      if (reqRes.data?.requests) setRecentRequests(reqRes.data.requests);
      if (typesRes.data) setLeaveTypes(typesRes.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load leave dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId || !startDate || !endDate || !reason.trim()) {
      setError("Please fill in all required fields.");
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
      setSuccess("Leave request submitted successfully for approval.");
      setIsApplyModalOpen(false);
      // Reset form
      setSelectedTypeId("");
      setReason("");
      setStartHalfDay(false);
      setEndHalfDay(false);
      await loadDashboardData();
    } catch (err: any) {
      setError(err?.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedType = leaveTypes.find((t) => t.id === selectedTypeId);

  const isManagerOrHr =
    user?.role === "HR" ||
    user?.role === "OWNER" ||
    user?.role === "MANAGER" ||
    user?.role === "SUPERVISOR";

  return (
    <PageContainer>
      <PageHeader
        title="Leave Management"
        subtitle="Track leave balances, submit requests, and check approval status."
        icon={<CalendarDays className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Leave Management" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="px-4 py-2 bg-[#f47b5b] hover:bg-[#d95d3d] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Apply for Leave
            </button>
          </div>
        }
      />

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Leave Balances Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#252525] uppercase tracking-wider">
            Your Leave Balances
          </h2>
          <span className="text-xs text-[#77716e]">
            Current Period {new Date().getFullYear()}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-white rounded-2xl border border-[#eadbd2] animate-pulse"
              />
            ))}
          </div>
        ) : balances.length === 0 ? (
          <div className="p-6 bg-white rounded-2xl border border-[#eadbd2] text-center">
            <Calendar className="w-8 h-8 text-[#eadbd2] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#252525]">No leave balances allocated</p>
            <p className="text-xs text-[#77716e] mt-1">
              Contact your HR administrator to set up leave quotas for your account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {balances.map((bal) => {
              const available =
                bal.allocatedDays +
                bal.carriedForwardDays +
                bal.adjustedDays -
                bal.usedDays -
                bal.pendingDays;

              return (
                <div
                  key={bal.id}
                  className="p-5 bg-white rounded-2xl border border-[#eadbd2] hover:border-[#f47b5b]/50 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#252525]">
                        {bal.leaveType?.name || "Leave"}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#fff7f2] text-[#f47b5b] border border-[#eadbd2]">
                        {bal.leaveType?.code}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-[#252525]">
                        {available.toFixed(available % 1 === 0 ? 0 : 1)}
                      </span>
                      <span className="text-xs text-[#77716e]">days available</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#eadbd2]/60 grid grid-cols-3 text-center text-[11px] text-[#77716e]">
                    <div>
                      <p className="font-semibold text-[#252525]">
                        {bal.allocatedDays + bal.carriedForwardDays + bal.adjustedDays}
                      </p>
                      <p className="text-[10px]">Total</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#f47b5b]">{bal.usedDays}</p>
                      <p className="text-[10px]">Used</p>
                    </div>
                    <div>
                      <p className="font-semibold text-amber-600">{bal.pendingDays}</p>
                      <p className="text-[10px]">Pending</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Links & Approvals Banner (for Managers / HR) */}
      {isManagerOrHr && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#fff7f2] to-[#fff1e8] border border-[#eadbd2] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#f47b5b] text-white">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#252525]">Manager & HR Approval Queue</h3>
              <p className="text-xs text-[#77716e]">
                Review, approve, or reject employee leave requests in your approval stage
              </p>
            </div>
          </div>
          <Link
            to="/leave/approvals"
            className="px-4 py-2 bg-white hover:bg-[#fff7f2] border border-[#eadbd2] text-[#252525] text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
          >
            Go to Approval Queue
            <ArrowRight className="w-3.5 h-3.5 text-[#f47b5b]" />
          </Link>
        </div>
      )}

      {/* Recent Leave Requests */}
      <div className="bg-white rounded-2xl border border-[#eadbd2] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#eadbd2] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#252525]">Your Recent Leave Requests</h2>
            <p className="text-xs text-[#77716e] mt-0.5">
              Latest applications and their current approval stages
            </p>
          </div>
          <Link
            to="/leave/my-requests"
            className="text-xs text-[#f47b5b] hover:text-[#d95d3d] font-semibold flex items-center gap-1"
          >
            View all requests
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#77716e]">
            No leave requests submitted yet.
          </div>
        ) : (
          <div className="divide-y divide-[#eadbd2]/60">
            {recentRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 hover:bg-[#fff7f2]/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#252525]">
                      {req.leaveType?.name || "Leave"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fff7f2] text-[#f47b5b] border border-[#eadbd2]">
                      {req.days} {req.days === 1 ? "day" : "days"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        req.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : req.status === "REJECTED"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : req.status === "CANCELLED"
                          ? "bg-gray-100 text-gray-600 border border-gray-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <div className="text-[#77716e] flex items-center gap-2">
                    <span>
                      {new Date(req.startDate).toLocaleDateString()} →{" "}
                      {new Date(req.endDate).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="italic truncate max-w-xs">{req.reason}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#77716e]">
                  <span>Stage: <strong className="text-[#252525]">{req.currentStage}</strong></span>
                  <Link
                    to="/leave/my-requests"
                    className="p-1.5 rounded-lg hover:bg-[#fff7f2] text-[#f47b5b]"
                    title="View Details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#eadbd2] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#eadbd2]">
              <h3 className="font-bold text-lg text-[#252525]">Apply for Leave</h3>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-[#77716e] hover:text-[#252525] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Leave Type *
                </label>
                <select
                  required
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                >
                  <option value="">-- Choose Leave Type --</option>
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) {t.paid ? "— Paid" : "— Unpaid"}
                    </option>
                  ))}
                </select>
                {selectedType && (
                  <p className="text-[11px] text-[#77716e] mt-1">
                    {selectedType.description} • Requires {selectedType.minimumNoticeDays} day(s) notice
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                  {selectedType?.allowHalfDay && (
                    <label className="mt-1 flex items-center gap-1.5 text-[11px] text-[#77716e] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={startHalfDay}
                        onChange={(e) => setStartHalfDay(e.target.checked)}
                        className="rounded border-[#eadbd2] text-[#f47b5b] focus:ring-[#f47b5b]"
                      />
                      <span>Half Day (Start)</span>
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                  {selectedType?.allowHalfDay && (
                    <label className="mt-1 flex items-center gap-1.5 text-[11px] text-[#77716e] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={endHalfDay}
                        onChange={(e) => setEndHalfDay(e.target.checked)}
                        className="rounded border-[#eadbd2] text-[#f47b5b] focus:ring-[#f47b5b]"
                      />
                      <span>Half Day (End)</span>
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Reason for Leave *
                </label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the purpose of your leave..."
                  rows={3}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eadbd2]">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#77716e] hover:text-[#252525] rounded-xl hover:bg-[#fff7f2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#f47b5b] hover:bg-[#d95d3d] rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
