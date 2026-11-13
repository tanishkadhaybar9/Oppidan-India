import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  CheckSquare,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Loader2,
  Edit,
  Trash2,
  UserPlus,
  Play,
  Send,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  History,
  Clock,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getTask,
  updateTaskProgress,
  submitTaskForReview,
  reviewTask,
  assignTask,
  deleteTask,
  addTaskComment,
} from "../services/taskService";
import { listEmployees } from "../services/employeeService";
import type { Task } from "../types/task";
import type { EmployeeSummary } from "../types/employee";
import { PageContainer, PageHeader } from "../components/common";
import { TaskStatusBadge, TaskPriorityBadge, TaskProgressBar } from "../components/tasks/TaskBadges";

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New comment
  const [commentText, setCommentText] = useState<string>("");
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  // Progress update slider
  const [newProgress, setNewProgress] = useState<number>(0);
  const [progressComment, setProgressComment] = useState<string>("");
  const [updatingProgress, setUpdatingProgress] = useState<boolean>(false);

  // Submit for review modal
  const [isSubmitReviewOpen, setIsSubmitReviewOpen] = useState<boolean>(false);
  const [submitNotes, setSubmitNotes] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Supervisor review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "RETURN">("APPROVE");
  const [reviewFeedback, setReviewFeedback] = useState<string>("");
  const [submittingReviewAction, setSubmittingReviewAction] = useState<boolean>(false);

  // Reassign modal
  const [isReassignOpen, setIsReassignOpen] = useState<boolean>(false);
  const [reassignEmpId, setReassignEmpId] = useState<string>("");
  const [reassignInstructions, setReassignInstructions] = useState<string>("");
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [submittingReassign, setSubmittingReassign] = useState<boolean>(false);

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);

  const canManage = ["OWNER", "HR", "MANAGER", "SUPERVISOR"].includes(user?.role || "");

  const loadTask = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getTask(id);
      if (res.data) {
        setTask(res.data);
        setNewProgress(res.data.progress);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load task details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  useEffect(() => {
    if (isReassignOpen && employees.length === 0) {
      listEmployees({ status: "ACTIVE", limit: 100 })
        .then((res) => {
          if (res.data) setEmployees(res.data.employees);
        })
        .catch(console.warn);
    }
  }, [isReassignOpen, employees.length]);

  // Handle Comment Submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await addTaskComment(task.id, { content: commentText.trim() });
      setCommentText("");
      setSuccess("Comment posted.");
      loadTask();
    } catch (err: any) {
      setError(err?.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Progress Update
  const handleProgressUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setUpdatingProgress(true);
    try {
      await updateTaskProgress(task.id, {
        progress: newProgress,
        comment: progressComment.trim() || undefined,
      });
      setProgressComment("");
      setSuccess(`Task progress updated to ${newProgress}%.`);
      loadTask();
    } catch (err: any) {
      setError(err?.message || "Failed to update progress");
    } finally {
      setUpdatingProgress(false);
    }
  };

  // Start Task (TO_DO -> IN_PROGRESS)
  const handleStartTask = async () => {
    if (!task) return;
    try {
      await updateTaskProgress(task.id, {
        progress: Math.max(10, task.progress),
        status: "IN_PROGRESS",
      });
      setSuccess("Task marked as in progress!");
      loadTask();
    } catch (err: any) {
      setError(err?.message || "Failed to start task");
    }
  };

  // Submit for Review
  const handleSubmitForReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setSubmittingReview(true);
    try {
      await submitTaskForReview(task.id, { notes: submitNotes.trim() || undefined });
      setIsSubmitReviewOpen(false);
      setSubmitNotes("");
      setSuccess("Task successfully submitted for supervisor review!");
      loadTask();
    } catch (err: any) {
      setError(err?.message || "Failed to submit task for review");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Review Task Action (Approve / Return)
  const handleReviewAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !reviewFeedback.trim()) {
      setError("Review feedback is required.");
      return;
    }
    setSubmittingReviewAction(true);
    try {
      await reviewTask(task.id, {
        action: reviewAction,
        feedback: reviewFeedback.trim(),
      });
      setIsReviewModalOpen(false);
      setReviewFeedback("");
      setSuccess(
        reviewAction === "APPROVE"
          ? "Task approved and marked as COMPLETED!"
          : "Task returned to employee for revisions."
      );
      loadTask();
    } catch (err: any) {
      setError(err?.message || "Failed to review task");
    } finally {
      setSubmittingReviewAction(false);
    }
  };

  // Reassign Task
  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !reassignEmpId) return;
    setSubmittingReassign(true);
    try {
      await assignTask(task.id, {
        assignedEmployeeId: reassignEmpId,
        instructions: reassignInstructions.trim() || undefined,
      });
      setIsReassignOpen(false);
      setReassignEmpId("");
      setReassignInstructions("");
      setSuccess("Task reassigned successfully.");
      loadTask();
    } catch (err: any) {
      setError(err?.message || "Failed to reassign task");
    } finally {
      setSubmittingReassign(false);
    }
  };

  // Delete Task
  const handleDelete = async () => {
    if (!task) return;
    setSubmittingDelete(true);
    try {
      await deleteTask(task.id);
      navigate("/tasks/list");
    } catch (err: any) {
      setError(err?.message || "Failed to delete task");
      setSubmittingDelete(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="py-24 flex flex-col items-center justify-center text-[#77716e] gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b]" />
          <span className="text-xs">Loading task details...</span>
        </div>
      </PageContainer>
    );
  }

  if (!task) {
    return (
      <PageContainer>
        <div className="py-24 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#252525]">Task Not Found</h3>
          <p className="text-xs text-[#77716e] mt-1">The task you requested could not be located.</p>
          <Link
            to="/tasks/list"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#f47b5b] text-white text-xs font-semibold rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Tasks
          </Link>
        </div>
      </PageContainer>
    );
  }

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    !["COMPLETED", "CANCELLED"].includes(task.status);

  return (
    <PageContainer>
      <PageHeader
        title={task.title}
        subtitle={`${task.taskCode} • Category: ${task.category}`}
        icon={<CheckSquare className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Tasks", to: "/tasks/dashboard" },
          { label: task.taskCode },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/tasks/list"
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-[#eadbd2] text-[#252525] rounded-xl hover:bg-[#fff7f2] transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4 text-[#77716e]" />
              All Tasks
            </Link>

            {canManage && (
              <>
                <button
                  onClick={() => {
                    setIsReassignOpen(true);
                    setReassignEmpId(task.assignedEmployeeId || "");
                    setReassignInstructions(task.instructions || "");
                  }}
                  className="px-3.5 py-2 text-xs font-semibold bg-white border border-[#eadbd2] text-[#252525] rounded-xl hover:bg-[#fff7f2] transition-colors flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Assign
                </button>

                <Link
                  to={`/tasks/${task.id}/edit`}
                  className="px-3.5 py-2 text-xs font-semibold bg-white border border-[#eadbd2] text-[#252525] rounded-xl hover:bg-[#fff7f2] transition-colors flex items-center gap-1.5"
                >
                  <Edit className="w-4 h-4 text-amber-600" />
                  Edit
                </Link>

                <button
                  onClick={() => setIsDeleteOpen(true)}
                  className="p-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        }
      />

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, Action Banners, Description, Comments, History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Status & Action Card */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#eadbd2]">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-[#f47b5b]">{task.taskCode}</span>
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
                {isOverdue && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Overdue
                  </span>
                )}
              </div>

              {/* Action Buttons based on status */}
              <div className="flex items-center gap-2">
                {task.status === "TO_DO" && (
                  <button
                    onClick={handleStartTask}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Start Task
                  </button>
                )}

                {task.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => setIsSubmitReviewOpen(true)}
                    className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit for Review
                  </button>
                )}

                {task.status === "UNDER_REVIEW" && canManage && (
                  <button
                    onClick={() => {
                      setIsReviewModalOpen(true);
                      setReviewAction("APPROVE");
                      setReviewFeedback("");
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Supervisor Review
                  </button>
                )}
              </div>
            </div>

            {/* Progress Slider Bar */}
            <div className="space-y-3 bg-[#fff7f2] border border-[#eadbd2] rounded-xl p-4">
              <TaskProgressBar progress={task.progress} />

              {/* Quick Update Controls (if not completed or cancelled) */}
              {!["COMPLETED", "CANCELLED"].includes(task.status) && (
                <form onSubmit={handleProgressUpdate} className="pt-2 border-t border-[#f1ece9] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#77716e]">
                    <span>Update Progress:</span>
                    <div className="flex gap-1.5">
                      {[0, 25, 50, 75, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setNewProgress(val)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${newProgress === val
                              ? "bg-[#f47b5b] text-white"
                              : "bg-white border border-[#eadbd2] hover:bg-[#fff0e8]"
                            }`}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={newProgress}
                      onChange={(e) => setNewProgress(Number(e.target.value))}
                      className="w-full accent-[#f47b5b]"
                    />
                    <button
                      type="submit"
                      disabled={updatingProgress || newProgress === task.progress}
                      className="px-3 py-1 bg-[#252525] text-white text-[11px] font-semibold rounded-lg hover:bg-black disabled:opacity-40 transition-colors whitespace-nowrap"
                    >
                      {updatingProgress ? "Saving..." : "Save %"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-[#77716e] uppercase tracking-wider mb-2">
                Description
              </h4>
              <p className="text-xs text-[#252525] leading-relaxed whitespace-pre-line bg-[#fcfaf9] border border-[#f1ece9] rounded-xl p-4">
                {task.description || <span className="text-slate-400 italic">No description provided.</span>}
              </p>
            </div>

            {/* Instructions */}
            {task.instructions && (
              <div>
                <h4 className="text-xs font-bold text-[#77716e] uppercase tracking-wider mb-2">
                  Assignment Instructions & Requirements
                </h4>
                <div className="text-xs text-[#252525] leading-relaxed whitespace-pre-line bg-[#fff7f2] border border-[#eadbd2] rounded-xl p-4">
                  {task.instructions}
                </div>
              </div>
            )}

            {/* Supervisor Review Feedback */}
            {task.reviewFeedback && (
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Supervisor Feedback
                </div>
                <p className="text-xs text-purple-800 leading-relaxed">{task.reviewFeedback}</p>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#eadbd2]">
              <MessageSquare className="w-4 h-4 text-[#f47b5b]" />
              <h3 className="text-sm font-bold text-[#252525]">
                Task Discussion & Notes ({task.comments?.length || 0})
              </h3>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment) => (
                  <div key={comment.id} className="bg-[#fcfaf9] border border-[#f1ece9] rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#252525]">{comment.user.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {comment.user.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#77716e]">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#252525] leading-relaxed whitespace-pre-line">
                      {comment.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#77716e] italic text-center py-4">
                  No comments yet. Start a discussion below.
                </p>
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleCommentSubmit} className="space-y-2 pt-2 border-t border-[#f1ece9]">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                placeholder="Write a message, share an update, or link documents..."
                className="w-full text-xs p-3 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="px-4 py-2 bg-[#f47b5b] text-white text-xs font-semibold rounded-xl hover:bg-[#ea6a45] disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {submittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Post Comment
                </button>
              </div>
            </form>
          </div>

          {/* Activity History Timeline */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#eadbd2]">
              <History className="w-4 h-4 text-[#f47b5b]" />
              <h3 className="text-sm font-bold text-[#252525]">Activity & Audit Trail</h3>
            </div>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#f1ece9]">
              {task.activities && task.activities.length > 0 ? (
                task.activities.map((act) => (
                  <div key={act.id} className="relative flex items-start gap-3 pl-7">
                    <div className="absolute left-2.5 top-1.5 -translate-x-1/2 w-2 h-2 rounded-full bg-[#f47b5b]" />
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#252525]">{act.action}</span>
                        <span className="text-[10px] text-[#77716e]">
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#77716e] mt-0.5">
                        {act.details} {act.actorName ? `by ${act.actorName}` : ""}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#77716e] italic">No activity recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Metadata, Assignee Card, Timeline Dates */}
        <div className="space-y-6">
          {/* Organizational Metadata Card */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#77716e] pb-2 border-b border-[#f1ece9]">
              Assignment Details
            </h4>

            {/* Assignee */}
            <div>
              <span className="text-[11px] font-semibold text-[#77716e] block mb-1">Assigned Employee</span>
              {task.assignedEmployee ? (
                <div className="flex items-center gap-2.5 p-2.5 bg-[#fff7f2] border border-[#eadbd2] rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-[#f47b5b] text-white flex items-center justify-center font-bold text-xs">
                    {task.assignedEmployee.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#252525] block">{task.assignedEmployee.name}</span>
                    <span className="text-[10px] text-[#77716e] block">{task.assignedEmployee.employeeCode}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No employee assigned yet.</p>
              )}
            </div>

            {/* Department */}
            <div>
              <span className="text-[11px] font-semibold text-[#77716e] block mb-1">Department</span>
              <p className="text-xs font-medium text-[#252525]">
                {task.department?.name || <span className="text-slate-400 italic">Not specified</span>}
              </p>
            </div>

            {/* Created By */}
            <div>
              <span className="text-[11px] font-semibold text-[#77716e] block mb-1">Created By</span>
              <p className="text-xs font-medium text-[#252525]">
                {task.createdBy?.name || "System"} ({task.createdBy?.email || ""})
              </p>
            </div>

            {/* Reviewer */}
            {task.reviewer && (
              <div>
                <span className="text-[11px] font-semibold text-[#77716e] block mb-1">Reviewed By</span>
                <p className="text-xs font-medium text-[#252525]">
                  {task.reviewer.name} ({task.reviewer.employeeCode})
                </p>
              </div>
            )}
          </div>

          {/* Timeline & Deadlines */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#77716e] pb-2 border-b border-[#f1ece9]">
              Timeline & Deadlines
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#77716e] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Start Date:
                </span>
                <span className="font-semibold text-[#252525]">
                  {task.startDate ? new Date(task.startDate).toLocaleDateString() : "Immediate"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#77716e] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Due Date:
                </span>
                <span className={`font-semibold ${isOverdue ? "text-rose-600 font-bold" : "text-[#252525]"}`}>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No deadline"}
                </span>
              </div>

              {task.completedAt && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed:
                  </span>
                  <span className="font-bold">{new Date(task.completedAt).toLocaleDateString()}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-[#77716e] pt-2 border-t border-[#f1ece9]">
                <span>Created:</span>
                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#77716e]">
                <span>Last Updated:</span>
                <span>{new Date(task.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL: SUBMIT FOR SUPERVISOR REVIEW ──────────────────────── */}
      {isSubmitReviewOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
              <h3 className="font-bold text-[#252525]">Submit Work for Supervisor Review</h3>
              <button onClick={() => setIsSubmitReviewOpen(false)}>
                <X className="w-5 h-5 text-[#77716e]" />
              </button>
            </div>

            <form onSubmit={handleSubmitForReview} className="space-y-4">
              <p className="text-xs text-[#77716e]">
                Submitting this task will mark your progress as 100% and transition status to{" "}
                <strong className="text-purple-700">Under Review</strong> for your supervisor's approval.
              </p>

              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Submission Notes / Delivery Summary
                </label>
                <textarea
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  rows={3}
                  placeholder="Summarize deliverables completed, pull request links, test reports..."
                  className="w-full text-xs p-3 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitReviewOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#77716e] hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {submittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SUPERVISOR REVIEW ─────────────────────────────────── */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
              <h3 className="font-bold text-[#252525]">Review Task Submission</h3>
              <button onClick={() => setIsReviewModalOpen(false)}>
                <X className="w-5 h-5 text-[#77716e]" />
              </button>
            </div>

            <form onSubmit={handleReviewAction} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">Review Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction("APPROVE")}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${reviewAction === "APPROVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20"
                        : "bg-white text-slate-600 border-[#eadbd2] hover:bg-slate-50"
                      }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Approve Completion
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction("RETURN")}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${reviewAction === "RETURN"
                        ? "bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-500/20"
                        : "bg-white text-slate-600 border-[#eadbd2] hover:bg-slate-50"
                      }`}
                  >
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    Return for Changes
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Supervisor Feedback & Comments <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  required
                  rows={3}
                  placeholder={
                    reviewAction === "APPROVE"
                      ? "Approval notes, quality sign-off remarks..."
                      : "Explain what revisions or fixes are required before approval..."
                  }
                  className="w-full text-xs p-3 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#77716e] hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReviewAction || !reviewFeedback.trim()}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-xl disabled:opacity-50 transition-colors flex items-center gap-1.5 ${reviewAction === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-amber-600 hover:bg-amber-700"
                    }`}
                >
                  {submittingReviewAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {reviewAction === "APPROVE" ? "Confirm Approval" : "Return to Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: REASSIGN TASK ─────────────────────────────────────── */}
      {isReassignOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
              <h3 className="font-bold text-[#252525]">Reassign Task</h3>
              <button onClick={() => setIsReassignOpen(false)}>
                <X className="w-5 h-5 text-[#77716e]" />
              </button>
            </div>

            <form onSubmit={handleReassign} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Select Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reassignEmpId}
                  onChange={(e) => setReassignEmpId(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-[#eadbd2] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode}) {emp.department ? `- ${emp.department.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  New Instructions / Handover Notes
                </label>
                <textarea
                  value={reassignInstructions}
                  onChange={(e) => setReassignInstructions(e.target.value)}
                  rows={3}
                  placeholder="Handover instructions..."
                  className="w-full text-xs p-3 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReassignOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#77716e] hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReassign || !reassignEmpId}
                  className="px-4 py-2 text-xs font-semibold bg-[#f47b5b] text-white rounded-xl hover:bg-[#ea6a45] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {submittingReassign && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE CONFIRMATION ───────────────────────────────── */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#252525]">Delete Task?</h3>
                <p className="text-xs font-mono text-[#77716e]">{task.taskCode}</p>
              </div>
            </div>

            <p className="text-xs text-[#77716e] leading-relaxed">
              Are you sure you want to permanently delete task <strong>"{task.title}"</strong>?
              This will remove all associated comments and activity history.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#77716e] hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDelete}
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {submittingDelete && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

