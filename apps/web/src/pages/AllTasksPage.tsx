import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckSquare,
  Search,
  Plus,
  Loader2,
  Trash2,
  Edit,
  ExternalLink,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listTasks, deleteTask, assignTask } from "../services/taskService";
import { listDepartments, listEmployees } from "../services/employeeService";
import type { Task } from "../types/task";
import type { Department, EmployeeSummary } from "../types/employee";
import { PageContainer, PageHeader } from "../components/common";
import { TaskStatusBadge, TaskPriorityBadge, TaskProgressBar } from "../components/tasks/TaskBadges";

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All Tasks" },
  { value: "TO_DO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function AllTasksPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);

  // Filter states
  const [search, setSearch] = useState<string>(searchParams.get("search") || "");
  const [status, setStatus] = useState<string>(searchParams.get("status") || "ALL");
  const [priority, setPriority] = useState<string>(searchParams.get("priority") || "");
  const [deptId, setDeptId] = useState<string>(searchParams.get("departmentId") || "");
  const [empId, setEmpId] = useState<string>(searchParams.get("assignedEmployeeId") || "");
  const [isOverdue, setIsOverdue] = useState<boolean>(searchParams.get("isOverdue") === "true");
  const [sortBy, setSortBy] = useState<"createdAt" | "dueDate" | "priority" | "title">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Quick Assign Modal
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [targetEmpId, setTargetEmpId] = useState<string>("");
  const [assignInstructions, setAssignInstructions] = useState<string>("");
  const [submittingAssign, setSubmittingAssign] = useState<boolean>(false);

  // Delete Dialog
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);

  const canManage = ["OWNER", "HR", "MANAGER", "SUPERVISOR"].includes(user?.role || "");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listTasks({
        search: search.trim() || undefined,
        status: status === "ALL" ? undefined : status,
        priority: priority || undefined,
        departmentId: deptId || undefined,
        assignedEmployeeId: empId || undefined,
        isOverdue: isOverdue ? true : undefined,
        sortBy,
        sortOrder,
        page,
        limit: 12,
      });

      if (res.data) {
        setTasks(res.data.tasks);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, deptId, empId, isOverdue, sortBy, sortOrder, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load department and employee metadata for filter dropdowns
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [dRes, eRes] = await Promise.all([
          listDepartments(),
          listEmployees({ status: "ACTIVE", limit: 100 }),
        ]);
        if (dRes.data) setDepartments(dRes.data.departments);
        if (eRes.data) setEmployees(eRes.data.employees);
      } catch (err) {
        console.warn("Failed to load metadata", err);
      }
    };
    loadMetadata();
  }, []);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTask || !targetEmpId) return;
    setSubmittingAssign(true);
    try {
      await assignTask(assigningTask.id, {
        assignedEmployeeId: targetEmpId,
        instructions: assignInstructions.trim() || undefined,
      });
      setSuccess(`Task ${assigningTask.taskCode} assigned successfully.`);
      setAssigningTask(null);
      setTargetEmpId("");
      setAssignInstructions("");
      loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to assign task");
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    setSubmittingDelete(true);
    try {
      await deleteTask(deletingTask.id);
      setSuccess(`Task ${deletingTask.taskCode} deleted successfully.`);
      setDeletingTask(null);
      loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete task");
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="All Tasks"
        subtitle="Manage, filter, search, and track all organizational tasks and assignments."
        icon={<CheckSquare className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Tasks", to: "/tasks/dashboard" },
          { label: "All Tasks" },
        ]}
        actions={
          canManage ? (
            <Link
              to="/tasks/new"
              className="px-3.5 py-2 text-xs font-semibold bg-[#f47b5b] text-white rounded-xl shadow-xs hover:bg-[#ea6a45] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </Link>
          ) : undefined
        }
      />

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-[#f1ece9]">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                status === tab.value
                  ? "bg-[#f47b5b] text-white shadow-xs"
                  : "text-[#77716e] hover:text-[#252525] hover:bg-[#fff7f2]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, code, description, assignee..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptId}
              onChange={(e) => {
                setDeptId(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs border border-[#eadbd2] rounded-xl px-3 py-2 bg-white text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs border border-[#eadbd2] rounded-xl px-3 py-2 bg-white text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Overdue Checkbox & Sorting */}
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isOverdue}
                onChange={(e) => {
                  setIsOverdue(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-[#eadbd2] text-rose-600 focus:ring-rose-500"
              />
              <span>Overdue Only</span>
            </label>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-") as [any, any];
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="text-xs border border-[#eadbd2] rounded-xl px-2.5 py-2 bg-white text-[#77716e] focus:outline-none"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="dueDate-asc">Due Date (Earliest)</option>
              <option value="dueDate-desc">Due Date (Latest)</option>
              <option value="priority-desc">Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#77716e] gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#f47b5b]" />
            <span className="text-xs">Loading tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center text-[#77716e]">
            <CheckSquare className="w-12 h-12 mx-auto text-[#eadbd2] mb-3" />
            <p className="text-sm font-semibold text-[#252525]">No tasks match your filters</p>
            <p className="text-xs mt-1">Try adjusting your search criteria or resetting filters.</p>
            {(search || status !== "ALL" || priority || deptId || isOverdue) && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatus("ALL");
                  setPriority("");
                  setDeptId("");
                  setEmpId("");
                  setIsOverdue(false);
                  setPage(1);
                }}
                className="mt-3 text-xs font-semibold text-[#f47b5b] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fff7f2] border-b border-[#eadbd2] text-[#77716e] uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Task ID & Title</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Assignee</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 min-w-[130px]">Progress</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1ece9]">
                {tasks.map((task) => {
                  const overdue =
                    task.dueDate &&
                    new Date(task.dueDate) < new Date() &&
                    !["COMPLETED", "CANCELLED"].includes(task.status);

                  return (
                    <tr key={task.id} className="hover:bg-[#fff7f2]/50 transition-colors group">
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="font-bold text-[#252525] group-hover:text-[#f47b5b] line-clamp-1"
                        >
                          {task.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-[#77716e]">{task.taskCode}</span>
                          <span className="text-[10px] text-[#77716e]">• {task.category}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-[#77716e]">
                        {task.department?.name || <span className="text-slate-400 italic">None</span>}
                      </td>

                      <td className="py-3.5 px-3">
                        {task.assignedEmployee ? (
                          <div>
                            <span className="font-medium text-[#252525]">{task.assignedEmployee.name}</span>
                            <span className="block text-[10px] text-[#77716e]">
                              {task.assignedEmployee.employeeCode}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <TaskPriorityBadge priority={task.priority} />
                      </td>

                      <td className="py-3.5 px-3">
                        <TaskStatusBadge status={task.status} />
                      </td>

                      <td className="py-3.5 px-3">
                        <TaskProgressBar progress={task.progress} />
                      </td>

                      <td className="py-3.5 px-3">
                        {task.dueDate ? (
                          <div>
                            <span className={overdue ? "text-rose-600 font-bold" : "text-[#252525]"}>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                            {overdue && (
                              <span className="block text-[10px] text-rose-600 font-bold">
                                Overdue
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No deadline</span>
                        )}
                      </td>

                      <td className="py-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/tasks/${task.id}`}
                            className="p-1.5 text-slate-500 hover:text-[#f47b5b] hover:bg-[#fff0e8] rounded-lg transition-colors"
                            title="View Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {canManage && (
                            <>
                              <button
                                onClick={() => {
                                  setAssigningTask(task);
                                  setTargetEmpId(task.assignedEmployeeId || "");
                                  setAssignInstructions(task.instructions || "");
                                }}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Assign / Reassign"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>

                              <Link
                                to={`/tasks/${task.id}/edit`}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Edit Task"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                onClick={() => setDeletingTask(task)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#eadbd2] flex items-center justify-between text-xs text-[#77716e]">
            <span>
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total tasks)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-[#eadbd2] rounded-lg disabled:opacity-40 hover:bg-[#fff7f2] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-[#eadbd2] rounded-lg disabled:opacity-40 hover:bg-[#fff7f2] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: ASSIGN / REASSIGN TASK ──────────────────────────────── */}
      {assigningTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
              <div>
                <h3 className="font-bold text-[#252525]">Assign Task</h3>
                <p className="text-xs font-mono text-[#77716e]">{assigningTask.taskCode}</p>
              </div>
              <button onClick={() => setAssigningTask(null)}>
                <X className="w-5 h-5 text-[#77716e]" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Select Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetEmpId}
                  onChange={(e) => setTargetEmpId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
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
                  Assignment Instructions / Notes
                </label>
                <textarea
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  rows={3}
                  placeholder="Specific requirements, expected deliverables..."
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningTask(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#77716e] hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign || !targetEmpId}
                  className="px-4 py-2 text-xs font-semibold bg-[#f47b5b] text-white rounded-xl hover:bg-[#ea6a45] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {submittingAssign && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE CONFIRMATION ─────────────────────────────────── */}
      {deletingTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#252525]">Delete Task?</h3>
                <p className="text-xs font-mono text-[#77716e]">{deletingTask.taskCode}</p>
              </div>
            </div>

            <p className="text-xs text-[#77716e] leading-relaxed">
              Are you sure you want to permanently delete task <strong>"{deletingTask.title}"</strong>?
              This will remove all associated comments and activity history.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTask(null)}
                className="px-4 py-2 text-xs font-semibold text-[#77716e] hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDelete}
                onClick={handleDeleteConfirm}
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

