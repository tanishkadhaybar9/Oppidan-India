import { useState, useEffect, useCallback } from "react";
import {
  FileEdit,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Filter,
  Search,
  Check,
  X,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { listCorrectionRequests, reviewCorrection } from "../services/attendanceService";
import type { AttendanceCorrection, CorrectionStatus } from "../types/attendance";

export function AttendanceCorrectionsPage() {
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("PENDING");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Review modal state
  const [reviewingItem, setReviewingItem] = useState<AttendanceCorrection | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const fetchCorrections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = filterStatus === "ALL" ? undefined : (filterStatus as CorrectionStatus);
      const res = await listCorrectionRequests(statusParam);
      if (res.data?.corrections) {
        setCorrections(res.data.corrections);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load correction requests");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  const handleOpenReview = (item: AttendanceCorrection, action: "APPROVED" | "REJECTED") => {
    setReviewingItem(item);
    setDecision(action);
    setReviewNotes("");
  };

  const handleConfirmReview = async () => {
    if (!reviewingItem) return;
    setSubmittingReview(true);
    setError(null);
    try {
      await reviewCorrection(reviewingItem.id, {
        status: decision,
        reviewNotes: reviewNotes || undefined,
      });
      setSuccess(`Correction request ${decision.toLowerCase()} successfully.`);
      setReviewingItem(null);
      await fetchCorrections();
    } catch (err: any) {
      setError(err?.message || "Failed to review correction request");
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredCorrections = corrections.filter((item) => {
    if (!searchTerm) return true;
    const empName = item.attendance?.employee?.name?.toLowerCase() || "";
    const empCode = item.attendance?.employee?.employeeCode?.toLowerCase() || "";
    const reason = item.reason?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return empName.includes(term) || empCode.includes(term) || reason.includes(term);
  });

  const counts = {
    pending: corrections.filter((c) => c.status === "PENDING").length,
    approved: corrections.filter((c) => c.status === "APPROVED").length,
    rejected: corrections.filter((c) => c.status === "REJECTED").length,
  };

  return (
    <PageContainer>
      <PageHeader
        title="Attendance Correction Requests"
        subtitle="Review and adjust employee clock-in and clock-out correction submissions."
        icon={<FileEdit className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Attendance", to: "/attendance" },
          { label: "Correction Requests" },
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilterStatus("PENDING")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === "PENDING"
              ? "bg-[#fff7f2] border-[#f47b5b] shadow-sm"
              : "bg-white border-[#eadbd2] hover:border-[#f47b5b]/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#77716e] uppercase tracking-wider">
              Pending Review
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-[#252525] mt-2">{counts.pending}</p>
        </div>

        <div
          onClick={() => setFilterStatus("APPROVED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === "APPROVED"
              ? "bg-[#fff7f2] border-[#f47b5b] shadow-sm"
              : "bg-white border-[#eadbd2] hover:border-[#f47b5b]/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#77716e] uppercase tracking-wider">
              Approved
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-[#252525] mt-2">{counts.approved}</p>
        </div>

        <div
          onClick={() => setFilterStatus("REJECTED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === "REJECTED"
              ? "bg-[#fff7f2] border-[#f47b5b] shadow-sm"
              : "bg-white border-[#eadbd2] hover:border-[#f47b5b]/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#77716e] uppercase tracking-wider">
              Rejected
            </span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-[#252525] mt-2">{counts.rejected}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#eadbd2] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#77716e]" />
          <div className="flex gap-1 bg-[#fff7f2] p-1 rounded-xl border border-[#eadbd2]">
            {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  filterStatus === s
                    ? "bg-[#f47b5b] text-white shadow-sm"
                    : "text-[#77716e] hover:text-[#252525]"
                }`}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#77716e]" />
          <input
            type="text"
            placeholder="Search employee, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b] bg-[#fff7f2]/30"
          />
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white rounded-2xl border border-[#eadbd2] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#77716e]">
            Loading correction requests...
          </div>
        ) : filteredCorrections.length === 0 ? (
          <div className="py-16 text-center">
            <FileEdit className="w-10 h-10 text-[#eadbd2] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#252525]">No correction requests found</p>
            <p className="text-xs text-[#77716e] mt-1">
              {filterStatus === "PENDING"
                ? "All clear! There are no pending requests to review."
                : "No matching records found for this filter."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#eadbd2]/60">
            {filteredCorrections.map((item) => {
              const emp = item.attendance?.employee;
              const isPending = item.status === "PENDING";

              return (
                <div
                  key={item.id}
                  className="p-5 hover:bg-[#fff7f2]/20 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm text-[#252525]">
                        {emp?.name || "Unknown Employee"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#fff7f2] text-[#77716e] border border-[#eadbd2]">
                        {emp?.employeeCode || "N/A"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.status === "REJECTED"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-[#77716e]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#f47b5b]" />
                        <span>Date: <strong>{item.attendance?.attendanceDate}</strong></span>
                      </div>
                      <div>
                        Original:{" "}
                        <span className="text-[#252525] font-medium">
                          {item.previousClockIn
                            ? new Date(item.previousClockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "—"}{" "}
                          →{" "}
                          {item.previousClockOut
                            ? new Date(item.previousClockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </span>
                      </div>
                      <div>
                        Corrected:{" "}
                        <span className="text-[#f47b5b] font-medium">
                          {item.correctedClockIn
                            ? new Date(item.correctedClockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "—"}{" "}
                          →{" "}
                          {item.correctedClockOut
                            ? new Date(item.correctedClockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs bg-[#fff7f2]/50 p-2.5 rounded-xl border border-[#eadbd2]/60 text-[#252525]">
                      <span className="font-semibold text-[#77716e]">Reason: </span>
                      {item.reason}
                    </div>

                    {item.reviewNotes && (
                      <div className="text-xs text-[#77716e]">
                        <span className="font-semibold">Reviewer Notes: </span>
                        {item.reviewNotes}
                      </div>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2 lg:flex-shrink-0 pt-2 lg:pt-0">
                      <button
                        onClick={() => handleOpenReview(item, "APPROVED")}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleOpenReview(item, "REJECTED")}
                        className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#eadbd2] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#eadbd2]">
              <h3 className="font-bold text-lg text-[#252525]">
                {decision === "APPROVED" ? "Approve Correction" : "Reject Correction"}
              </h3>
              <button
                onClick={() => setReviewingItem(null)}
                className="text-[#77716e] hover:text-[#252525] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-[#77716e]">
                Are you sure you want to {decision.toLowerCase()} this attendance correction for{" "}
                <strong className="text-[#252525]">{reviewingItem.attendance?.employee?.name}</strong>?
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Review Notes {decision === "REJECTED" ? "(Recommended)" : "(Optional)"}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide any comments or instructions..."
                  rows={3}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eadbd2]">
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                className="px-4 py-2 text-xs font-medium text-[#77716e] hover:text-[#252525] rounded-xl hover:bg-[#fff7f2]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={handleConfirmReview}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-colors ${
                  decision === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
              >
                {submittingReview ? "Processing..." : `Confirm ${decision === "APPROVED" ? "Approval" : "Rejection"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
