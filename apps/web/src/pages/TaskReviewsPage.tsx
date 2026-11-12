import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  User as UserIcon,
  Building2,
  Calendar,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  listTasks,
  reviewTask,
} from "../services/taskService";
import type { Task, TaskPriority } from "../types/task";
import {
  TaskStatusBadge,
  TaskPriorityBadge,
  TaskProgressBar,
} from "../components/tasks/TaskBadges";

export function TaskReviewsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Review Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "RETURN">("APPROVE");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listTasks({
        status: "UNDER_REVIEW",
        search: search.trim() || undefined,
        priority: (priorityFilter as TaskPriority) || undefined,
        limit: 50,
      });
      setTasks(res.data?.tasks || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load review queue";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, priorityFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleOpenReview = (task: Task, action: "APPROVE" | "RETURN") => {
    setSelectedTask(task);
    setReviewAction(action);
    setReviewFeedback(
      action === "APPROVE"
        ? "Work inspected and approved. Excellent job on delivery."
        : ""
    );
  };

  const handleSubmitReview = async () => {
    if (!selectedTask) return;
    if (reviewAction === "RETURN" && !reviewFeedback.trim()) {
      alert("Please provide constructive feedback explaining the revisions needed.");
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewTask(selectedTask.id, {
        action: reviewAction,
        feedback: reviewFeedback.trim(),
      });
      setSuccessMsg(
        reviewAction === "APPROVE"
          ? `Task ${selectedTask.taskCode} approved and marked COMPLETED.`
          : `Task ${selectedTask.taskCode} returned to IN_PROGRESS for revision.`
      );
      setSelectedTask(null);
      setReviewFeedback("");
      fetchReviews();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit review decision";
      alert(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#f47b5b]/10 text-[#f47b5b] rounded-lg">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Task Review Queue</h1>
              <p className="text-sm text-gray-500">
                Inspect, verify, and approve deliverable submissions from employees
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReviews()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-[#eadbd2] rounded-lg hover:bg-gray-50 transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            to="/tasks/list"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#f47b5b] rounded-lg hover:bg-[#e06646] transition shadow-xs"
          >
            All Tasks
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white border border-[#eadbd2] rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pending reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#eadbd2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/20 focus:border-[#f47b5b]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-sm border border-[#eadbd2] rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/20 focus:border-[#f47b5b]"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Queue Grid / List */}
      {loading ? (
        <div className="py-20 text-center bg-white border border-[#eadbd2] rounded-xl">
          <div className="animate-spin w-8 h-8 border-3 border-[#f47b5b] border-t-transparent rounded-full mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading pending reviews...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-[#eadbd2] rounded-xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">All caught up!</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
            There are no tasks currently awaiting supervisor or management review.
            Any employee deliverable submissions will appear here automatically.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/tasks/assignments"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-[#eadbd2] rounded-lg hover:bg-gray-50"
            >
              Manage Assignments
            </Link>
            <Link
              to="/tasks/new"
              className="px-4 py-2 text-sm font-medium text-white bg-[#f47b5b] rounded-lg hover:bg-[#e06646]"
            >
              Create New Task
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-[#eadbd2] rounded-xl p-5 shadow-xs hover:border-[#f47b5b]/50 transition space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                    {task.taskCode}
                  </span>
                  <TaskStatusBadge status={task.status} />
                  <TaskPriorityBadge priority={task.priority} />
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {task.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/tasks/${task.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-[#f47b5b] bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                  >
                    View Details
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div>
                <Link
                  to={`/tasks/${task.id}`}
                  className="text-base font-semibold text-gray-900 hover:text-[#f47b5b] transition"
                >
                  {task.title}
                </Link>
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Progress and Submission Notes */}
              <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-amber-900">
                  <span>Reported Completion</span>
                  <span>{task.progress}%</span>
                </div>
                <TaskProgressBar progress={task.progress} status={task.status} />
                {task.instructions && (
                  <p className="text-xs text-amber-800 pt-1">
                    <span className="font-semibold">Original Instructions: </span>
                    {task.instructions}
                  </p>
                )}
              </div>

              {/* Meta details & Action buttons */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span>Assigned to: </span>
                    <strong className="text-gray-700 font-medium">
                      {task.assignedEmployee?.name || "Unassigned"}
                    </strong>
                  </div>

                  {task.department && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      <span>{task.department.name}</span>
                    </div>
                  )}

                  {task.dueDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    <span>{task._count?.comments || 0} Comments</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenReview(task, "RETURN")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Request Changes
                  </button>
                  <button
                    onClick={() => handleOpenReview(task, "APPROVE")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve & Complete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Decision Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#eadbd2] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span
                  className={`p-2 rounded-lg ${
                    reviewAction === "APPROVE"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {reviewAction === "APPROVE" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <RotateCcw className="w-5 h-5" />
                  )}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {reviewAction === "APPROVE"
                      ? "Approve Deliverable & Complete Task"
                      : "Request Revisions / Return to In Progress"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Task {selectedTask.taskCode} • {selectedTask.title}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-600">
                {reviewAction === "APPROVE"
                  ? "Marking this task approved will set status to COMPLETED, finalize progress to 100%, and record your supervisor sign-off in the audit trail."
                  : "Returning this task will change its status back to IN_PROGRESS so the assigned employee can revise and resubmit. Please provide clear feedback below."}
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Supervisor Feedback & Comments{" "}
                  {reviewAction === "RETURN" && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={4}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder={
                    reviewAction === "APPROVE"
                      ? "Optional commendation or review notes..."
                      : "Explain what needs to be fixed or adjusted before approval..."
                  }
                  className="w-full p-3 text-xs border border-[#eadbd2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/20 focus:border-[#f47b5b]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                disabled={submittingReview}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-[#eadbd2] rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className={`px-4 py-2 text-xs font-medium text-white rounded-lg transition shadow-xs flex items-center gap-1.5 ${
                  reviewAction === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {submittingReview ? (
                  "Saving..."
                ) : reviewAction === "APPROVE" ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm Approval
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    Return for Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
