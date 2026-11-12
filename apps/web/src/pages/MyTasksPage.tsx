import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ListTodo,
  CheckSquare,
  Play,
  Send,
  Loader2,
  ExternalLink,
  Search,
} from "lucide-react";
import { getMyTasks, updateTaskProgress, submitTaskForReview } from "../services/taskService";
import type { Task } from "../types/task";
import { PageContainer, PageHeader } from "../components/common";
import { TaskStatusBadge, TaskPriorityBadge, TaskProgressBar } from "../components/tasks/TaskBadges";

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All My Tasks" },
  { value: "TO_DO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "COMPLETED", label: "Completed" },
];

export function MyTasksPage() {

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyTasks({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: search.trim() || undefined,
        limit: 50,
        sortBy: "dueDate",
        sortOrder: "asc",
      });
      if (res.data) {
        setTasks(res.data.tasks);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load your assigned tasks");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Fast Actions
  const handleStartTask = async (task: Task) => {
    try {
      await updateTaskProgress(task.id, {
        progress: Math.max(10, task.progress),
        status: "IN_PROGRESS",
      });
      setSuccess(`Task ${task.taskCode} is now in progress.`);
      loadTasks();
    } catch (err: any) {
      setError(err?.message || "Failed to start task");
    }
  };

  const handleSubmitForReview = async (task: Task) => {
    try {
      await submitTaskForReview(task.id, { notes: "Submitted work via My Tasks dashboard." });
      setSuccess(`Task ${task.taskCode} submitted for supervisor review!`);
      loadTasks();
    } catch (err: any) {
      setError(err?.message || "Failed to submit for review");
    }
  };

  // Metrics calculation
  const totalCount = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const reviewCount = tasks.filter((t) => t.status === "UNDER_REVIEW").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdueCount = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) < new Date() &&
      !["COMPLETED", "CANCELLED"].includes(t.status)
  ).length;

  return (
    <PageContainer>
      <PageHeader
        title="My Tasks"
        subtitle="Your personalized workspace for viewing assigned deliverables, updating progress, and submitting work."
        icon={<ListTodo className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Tasks", to: "/tasks/dashboard" },
          { label: "My Tasks" },
        ]}
      />

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center justify-between mb-4">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between mb-4">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            &times;
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
            Assigned Tasks
          </span>
          <div className="text-2xl font-bold text-[#252525]">{totalCount}</div>
        </div>

        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block mb-1">
            In Progress
          </span>
          <div className="text-2xl font-bold text-blue-700">{inProgressCount}</div>
        </div>

        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider block mb-1">
            Under Review
          </span>
          <div className="text-2xl font-bold text-purple-700">{reviewCount}</div>
        </div>

        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
            Completed
          </span>
          <div className="text-2xl font-bold text-emerald-700">{completedCount}</div>
        </div>

        <div className="bg-rose-50/40 border border-rose-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
            Overdue
          </span>
          <div className="text-2xl font-bold text-rose-700">{overdueCount}</div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                  statusFilter === tab.value
                    ? "bg-[#f47b5b] text-white shadow-xs"
                    : "text-[#77716e] hover:text-[#252525] hover:bg-[#fff7f2]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search my tasks..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
            />
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-[#77716e] gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#f47b5b]" />
          <span className="text-xs">Loading your tasks...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-12 text-center text-[#77716e]">
          <CheckSquare className="w-12 h-12 mx-auto text-[#eadbd2] mb-3" />
          <h4 className="font-bold text-sm text-[#252525]">No tasks in this view</h4>
          <p className="text-xs mt-1">You are all caught up on your assigned deliverables!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => {
            const isOverdue =
              task.dueDate &&
              new Date(task.dueDate) < new Date() &&
              !["COMPLETED", "CANCELLED"].includes(task.status);

            return (
              <div
                key={task.id}
                className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#f47b5b]/40 hover:shadow-sm transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#f47b5b]">{task.taskCode}</span>
                    <div className="flex items-center gap-1.5">
                      <TaskPriorityBadge priority={task.priority} />
                      <TaskStatusBadge status={task.status} />
                    </div>
                  </div>

                  <Link to={`/tasks/${task.id}`}>
                    <h3 className="font-bold text-sm text-[#252525] hover:text-[#f47b5b] transition-colors line-clamp-2">
                      {task.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-[#77716e] line-clamp-2">
                    {task.description || "No description provided."}
                  </p>

                  <div className="pt-2">
                    <TaskProgressBar progress={task.progress} />
                  </div>

                  {task.instructions && (
                    <div className="p-2.5 bg-[#fff7f2] border border-[#eadbd2] rounded-xl text-[11px] text-[#77716e]">
                      <span className="font-semibold text-[#252525] block">Instructions:</span>
                      <p className="line-clamp-2 mt-0.5">{task.instructions}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-[#f1ece9] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#77716e] block">Deadline:</span>
                    <span
                      className={`font-semibold ${
                        isOverdue ? "text-rose-600 font-bold" : "text-[#252525]"
                      }`}
                    >
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "None"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.status === "TO_DO" && (
                      <button
                        onClick={() => handleStartTask(task)}
                        className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        Start
                      </button>
                    )}

                    {task.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => handleSubmitForReview(task)}
                        className="px-3 py-1.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        Submit
                      </button>
                    )}

                    <Link
                      to={`/tasks/${task.id}`}
                      className="p-1.5 text-slate-500 hover:text-[#f47b5b] hover:bg-[#fff0e8] rounded-lg transition-colors"
                      title="View Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

