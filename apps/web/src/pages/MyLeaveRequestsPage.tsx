import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Ban,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { listLeaveRequests, cancelLeaveRequest } from "../services/leaveService";
import type { LeaveRequest } from "../types/leave";

export function MyLeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Expand history map
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Cancel modal state
  const [cancellingItem, setCancellingItem] = useState<LeaveRequest | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>("");
  const [submittingCancel, setSubmittingCancel] = useState<boolean>(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = statusFilter === "ALL" ? undefined : statusFilter;
      const res = await listLeaveRequests({ status: statusParam });
      if (res.data?.requests) {
        setRequests(res.data.requests);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancellingItem || !cancellationReason.trim()) {
      setError("Please provide a reason for cancellation.");
      return;
    }

    setSubmittingCancel(true);
    setError(null);
    try {
      await cancelLeaveRequest(cancellingItem.id, cancellationReason.trim());
      setSuccess("Leave request cancelled successfully.");
      setCancellingItem(null);
      setCancellationReason("");
      await loadRequests();
    } catch (err: any) {
      setError(err?.message || "Failed to cancel leave request");
    } finally {
      setSubmittingCancel(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="My Leave Requests"
        subtitle="View full history, stage progressions, and manage your leave submissions."
        icon={<FileText className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Leave", to: "/leave" },
          { label: "My Requests" },
        ]}
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

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#eadbd2] flex items-center gap-2 overflow-x-auto">
        {(["ALL", "PENDING_SUPERVISOR", "PENDING_HR", "APPROVED", "REJECTED", "CANCELLED"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? "bg-[#f47b5b] text-white shadow-sm"
                  : "bg-[#fff7f2] text-[#77716e] hover:text-[#252525] border border-[#eadbd2]"
              }`}
            >
              {status === "ALL"
                ? "All Requests"
                : status.replace("_", " ")}
            </button>
          )
        )}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl border border-[#eadbd2] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#77716e]">
            Loading leave requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="w-10 h-10 text-[#eadbd2] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#252525]">No leave requests found</p>
            <p className="text-xs text-[#77716e] mt-1">
              No leave requests match the selected filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#eadbd2]/60">
            {requests.map((req) => {
              const isExpanded = expandedIds.has(req.id);
              const canCancel =
                req.status !== "CANCELLED" && req.status !== "REJECTED";

              return (
                <div key={req.id} className="p-5 hover:bg-[#fff7f2]/10 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-[#252525]">
                          {req.leaveType?.name || "Leave"}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#fff7f2] text-[#f47b5b] border border-[#eadbd2]">
                          {req.leaveType?.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#fff7f2] text-[#252525] border border-[#eadbd2]">
                          {req.days} {req.days === 1 ? "Day" : "Days"}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-[#77716e]">
                        <div>
                          <span>Duration: </span>
                          <strong className="text-[#252525]">
                            {new Date(req.startDate).toLocaleDateString()} →{" "}
                            {new Date(req.endDate).toLocaleDateString()}
                          </strong>
                        </div>
                        <div>
                          <span>Current Stage: </span>
                          <strong className="text-[#f47b5b]">{req.currentStage}</strong>
                        </div>
                        <div>
                          <span>Submitted: </span>
                          <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="text-xs bg-[#fff7f2]/40 p-2.5 rounded-xl border border-[#eadbd2]/60 text-[#252525]">
                        <span className="font-semibold text-[#77716e]">Reason: </span>
                        {req.reason}
                      </div>

                      {req.rejectionReason && (
                        <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                          <span className="font-semibold">Rejection Reason: </span>
                          {req.rejectionReason}
                        </div>
                      )}

                      {req.cancellationReason && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                          <span className="font-semibold">Cancellation Reason: </span>
                          {req.cancellationReason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 lg:flex-shrink-0">
                      {canCancel && (
                        <button
                          onClick={() => {
                            setCancellingItem(req);
                            setCancellationReason("");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5 text-gray-500" />
                          Cancel Request
                        </button>
                      )}

                      <button
                        onClick={() => toggleExpand(req.id)}
                        className="px-3 py-1.5 rounded-xl border border-[#eadbd2] hover:bg-[#fff7f2] text-xs font-semibold text-[#252525] flex items-center gap-1.5 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            Hide Timeline <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            View Timeline <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Immutable Approval History Timeline */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#eadbd2]/60">
                      <h4 className="text-xs font-bold text-[#252525] mb-3 uppercase tracking-wider">
                        Approval Audit Timeline
                      </h4>
                      {req.approvalHistory && req.approvalHistory.length > 0 ? (
                        <div className="space-y-3 pl-2 border-l-2 border-[#f47b5b]">
                          {req.approvalHistory.map((hist) => (
                            <div key={hist.id} className="relative pl-4 text-xs">
                              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#f47b5b]" />
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[#252525]">
                                  {hist.action}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#fff7f2] text-[#77716e] border border-[#eadbd2]">
                                  {hist.actorRole}
                                </span>
                                <span className="text-[#77716e] text-[11px]">
                                  {new Date(hist.createdAt).toLocaleString()}
                                </span>
                              </div>
                              {hist.comments && (
                                <p className="text-[#77716e] mt-1 italic">
                                  &quot;{hist.comments}&quot;
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#77716e]">
                          No approval history actions recorded yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {cancellingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#eadbd2] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#eadbd2]">
              <h3 className="font-bold text-lg text-[#252525]">Cancel Leave Request</h3>
              <button
                onClick={() => setCancellingItem(null)}
                className="text-[#77716e] hover:text-[#252525] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-[#77716e]">
                Are you sure you want to cancel this leave request for{" "}
                <strong className="text-[#252525]">
                  {cancellingItem.leaveType?.name} ({cancellingItem.days} days)
                </strong>
                ? If previously approved or pending, your leave balance will be restored.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Reason for Cancellation *
                </label>
                <textarea
                  required
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Provide reason for cancelling..."
                  rows={3}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eadbd2]">
              <button
                type="button"
                onClick={() => setCancellingItem(null)}
                className="px-4 py-2 text-xs font-medium text-[#77716e] hover:text-[#252525] rounded-xl hover:bg-[#fff7f2]"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={submittingCancel}
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {submittingCancel ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
