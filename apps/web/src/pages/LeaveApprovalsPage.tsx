import { useState, useEffect, useCallback } from "react";
import {
  CheckSquare,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  Check,
  X,
  Calendar,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { useAuth } from "../context/AuthContext";
import { listLeaveRequests, reviewLeaveRequest } from "../services/leaveService";
import type { LeaveRequest } from "../types/leave";

export function LeaveApprovalsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filterStage, setFilterStage] = useState<string>("MINE");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Review modal state
  const [reviewingReq, setReviewingReq] = useState<LeaveRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [comments, setComments] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const isHrOrOwner = user?.role === "HR" || user?.role === "OWNER";
  const isSupervisor = user?.role === "SUPERVISOR";
  const isManager = user?.role === "MANAGER";

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listLeaveRequests({ limit: 100 });
      if (res.data?.requests) {
        setRequests(res.data.requests);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load approval queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleOpenReview = (req: LeaveRequest, action: "APPROVE" | "REJECT") => {
    setReviewingReq(req);
    setReviewAction(action);
    setComments("");
    setRejectionReason("");
  };

  const handleConfirmReview = async () => {
    if (!reviewingReq) return;
    if (reviewAction === "REJECT" && !rejectionReason.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }

    setSubmittingReview(true);
    setError(null);
    try {
      await reviewLeaveRequest(reviewingReq.id, {
        action: reviewAction,
        comments: comments.trim() || undefined,
        rejectionReason: reviewAction === "REJECT" ? rejectionReason.trim() : undefined,
      });
      setSuccess(`Leave request ${reviewAction === "APPROVE" ? "approved" : "rejected"} successfully.`);
      setReviewingReq(null);
      await loadRequests();
    } catch (err: any) {
      setError(err?.message || "Failed to review leave request");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filter requests based on stage and role
  const pendingRequests = requests.filter((r) =>
    ["PENDING_SUPERVISOR", "PENDING_MANAGER", "PENDING_HR"].includes(r.status)
  );

  const filteredRequests = pendingRequests.filter((r) => {
    if (filterStage === "MINE") {
      if (isHrOrOwner) return r.status === "PENDING_HR";
      if (isSupervisor) return r.status === "PENDING_SUPERVISOR";
      if (isManager) return r.status === "PENDING_MANAGER" || r.status === "PENDING_SUPERVISOR";
      return true;
    }
    if (filterStage === "ALL_PENDING") return true;
    return r.status === filterStage;
  }).filter((r) => {
    if (!searchTerm) return true;
    const empName = r.employee?.name?.toLowerCase() || "";
    const empCode = r.employee?.employeeCode?.toLowerCase() || "";
    const reason = r.reason?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return empName.includes(term) || empCode.includes(term) || reason.includes(term);
  });

  return (
    <PageContainer>
      <PageHeader
        title="Leave Approval Queue"
        subtitle="Review and advance employee leave requests through the multi-stage approval workflow."
        icon={<CheckSquare className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Leave", to: "/leave" },
          { label: "Approval Queue" },
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#eadbd2] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#77716e]" />
          <div className="flex gap-1 bg-[#fff7f2] p-1 rounded-xl border border-[#eadbd2]">
            <button
              onClick={() => setFilterStage("MINE")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterStage === "MINE"
                  ? "bg-[#f47b5b] text-white shadow-sm"
                  : "text-[#77716e] hover:text-[#252525]"
              }`}
            >
              My Stage
            </button>
            <button
              onClick={() => setFilterStage("ALL_PENDING")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterStage === "ALL_PENDING"
                  ? "bg-[#f47b5b] text-white shadow-sm"
                  : "text-[#77716e] hover:text-[#252525]"
              }`}
            >
              All Pending ({pendingRequests.length})
            </button>
            {isHrOrOwner && (
              <button
                onClick={() => setFilterStage("PENDING_HR")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  filterStage === "PENDING_HR"
                    ? "bg-[#f47b5b] text-white shadow-sm"
                    : "text-[#77716e] hover:text-[#252525]"
                }`}
              >
                HR Stage
              </button>
            )}
            <button
              onClick={() => setFilterStage("PENDING_SUPERVISOR")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterStage === "PENDING_SUPERVISOR"
                  ? "bg-[#f47b5b] text-white shadow-sm"
                  : "text-[#77716e] hover:text-[#252525]"
              }`}
            >
              Supervisor Stage
            </button>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#77716e]" />
          <input
            type="text"
            placeholder="Search employee, code, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b] bg-[#fff7f2]/30"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl border border-[#eadbd2] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#77716e]">
            Loading approval queue...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#252525]">All caught up!</p>
            <p className="text-xs text-[#77716e] mt-1">
              There are no pending leave requests awaiting your review.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#eadbd2]/60">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 hover:bg-[#fff7f2]/10 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-[#252525]">
                      {req.employee?.name || "Employee"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#fff7f2] text-[#77716e] border border-[#eadbd2]">
                      {req.employee?.employeeCode}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#fff7f2] text-[#f47b5b] border border-[#eadbd2]">
                      {req.leaveType?.name} ({req.leaveType?.code})
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#77716e]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#f47b5b]" />
                      <span>
                        {new Date(req.startDate).toLocaleDateString()} →{" "}
                        {new Date(req.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span>Days: </span>
                      <strong className="text-[#252525]">{req.days} Day(s)</strong>
                    </div>
                    <div>
                      <span>Stage: </span>
                      <strong className="text-[#f47b5b]">{req.currentStage}</strong>
                    </div>
                  </div>

                  <div className="text-xs bg-[#fff7f2]/50 p-2.5 rounded-xl border border-[#eadbd2]/60 text-[#252525]">
                    <span className="font-semibold text-[#77716e]">Reason: </span>
                    {req.reason}
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:flex-shrink-0 pt-2 lg:pt-0">
                  <button
                    onClick={() => handleOpenReview(req, "APPROVE")}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleOpenReview(req, "REJECT")}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingReq && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#eadbd2] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#eadbd2]">
              <h3 className="font-bold text-lg text-[#252525]">
                {reviewAction === "APPROVE" ? "Approve Leave Request" : "Reject Leave Request"}
              </h3>
              <button
                onClick={() => setReviewingReq(null)}
                className="text-[#77716e] hover:text-[#252525] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-[#77716e]">
                {reviewAction === "APPROVE"
                  ? `You are approving the leave request for ${reviewingReq.employee?.name} (${reviewingReq.days} days). This will advance it to the next workflow stage or grant final approval.`
                  : `You are rejecting the leave request for ${reviewingReq.employee?.name}. Any reserved balance will be restored.`}
              </p>

              {reviewAction === "REJECT" ? (
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Rejection Reason *
                  </label>
                  <textarea
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this request is being rejected..."
                    rows={3}
                    className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Approval Comments (Optional)
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add comments or instructions..."
                    rows={2}
                    className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eadbd2]">
              <button
                type="button"
                onClick={() => setReviewingReq(null)}
                className="px-4 py-2 text-xs font-medium text-[#77716e] hover:text-[#252525] rounded-xl hover:bg-[#fff7f2]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={handleConfirmReview}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-colors ${
                  reviewAction === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
              >
                {submittingReview
                  ? "Processing..."
                  : `Confirm ${reviewAction === "APPROVE" ? "Approval" : "Rejection"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
