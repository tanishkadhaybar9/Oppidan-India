import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CheckSquare,
  ListTodo,
  Clock,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  XCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getTaskSummary, listTasks } from "../services/taskService";
import { listDepartments, listEmployees } from "../services/employeeService";
import type { Task, TaskSummaryStats } from "../types/task";
import type { Department, EmployeeSummary } from "../types/employee";
import { PageContainer, PageHeader } from "../components/common";
import { TaskStatusBadge, TaskPriorityBadge, TaskProgressBar } from "../components/tasks/TaskBadges";
export function TaskDashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState<TaskSummaryStats>({
    total: 0,
    toDo: 0,
    inProgress: 0,
    underReview: 0,
    completed: 0,
    overdue: 0,
    onHold: 0,
    cancelled: 0,
  });

  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [reviewTasks, setReviewTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);

  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canManage = ["OWNER", "HR", "MANAGER", "SUPERVISOR"].includes(user?.role || "");

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, tasksRes, reviewRes] = await Promise.all([
        getTaskSummary({
          departmentId: selectedDeptId || undefined,
          employeeId: selectedEmpId || undefined,
        }),
        listTasks({
          departmentId: selectedDeptId || undefined,
          assignedEmployeeId: selectedEmpId || undefined,
          limit: 6,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
        listTasks({
          status: "UNDER_REVIEW",
          limit: 4,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      ]);

      if (summaryRes.data) setStats(summaryRes.data);
      if (tasksRes.data) setRecentTasks(tasksRes.data.tasks);
      if (reviewRes.data) setReviewTasks(reviewRes.data.tasks);
    } catch (err: any) {
      setError(err?.message || "Failed to load task dashboard");
    } finally {
      setLoading(false);
    }
  }, [selectedDeptId, selectedEmpId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Load department & employee filters
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [deptRes, empRes] = await Promise.all([
          listDepartments(),
          listEmployees({ status: "ACTIVE", limit: 100 }),
        ]);
        if (deptRes.data) setDepartments(deptRes.data.departments);
        if (empRes.data) setEmployees(empRes.data.employees);
      } catch (err) {
        console.warn("Failed to load filter options", err);
      }
    };
    if (canManage) {
      loadFilters();
    }
  }, [canManage]);

  return (
    <PageContainer>
      <PageHeader
        title="Task Dashboard"
        subtitle="Real-time task tracking, team workload allocation, review pipelines, and analytics."
        icon={<CheckSquare className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Tasks", to: "/tasks/dashboard" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/tasks/my"
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-[#eadbd2] text-[#252525] rounded-xl hover:bg-[#fff7f2] transition-colors flex items-center gap-1.5"
            >
              <ListTodo className="w-4 h-4 text-[#f47b5b]" />
              My Tasks
            </Link>
            {canManage && (
              <Link
                to="/tasks/new"
                className="px-3.5 py-2 text-xs font-semibold bg-[#f47b5b] text-white rounded-xl shadow-xs hover:bg-[#ea6a45] transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Create Task
              </Link>
            )}
          </div>
        }
      />

      {/* Filter Bar */}
      {canManage && (
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#77716e]">
              <span>Filter by:</span>
            </div>

            {/* Department Filter */}
            <div className="relative min-w-[180px]">
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
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

            {/* Employee Filter */}
            <div className="relative min-w-[200px]">
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full text-xs border border-[#eadbd2] rounded-xl px-3 py-2 bg-white text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
              >
                <option value="">All Assignees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            {(selectedDeptId || selectedEmpId) && (
              <button
                onClick={() => {
                  setSelectedDeptId("");
                  setSelectedEmpId("");
                }}
                className="text-xs text-[#f47b5b] hover:underline font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/tasks/analytics"
              className="px-3 py-1.5 text-xs font-semibold text-[#77716e] hover:text-[#252525] bg-[#fff7f2] border border-[#eadbd2] rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#f47b5b]" />
              View Full Analytics
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Link
          to="/tasks/list"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total</span>
            <CheckSquare className="w-4 h-4 text-[#f47b5b] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-[#252525]">{stats.total}</div>
          <p className="text-[10px] text-[#77716e] mt-1">All Tasks</p>
        </Link>

        <Link
          to="/tasks/list?status=TO_DO"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">To Do</span>
            <ListTodo className="w-4 h-4 text-slate-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats.toDo}</div>
          <p className="text-[10px] text-[#77716e] mt-1">Not Started</p>
        </Link>

        <Link
          to="/tasks/list?status=IN_PROGRESS"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-blue-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-blue-800">{stats.inProgress}</div>
          <p className="text-[10px] text-[#77716e] mt-1">Active Work</p>
        </Link>

        <Link
          to="/tasks/reviews"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-purple-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Review</span>
            <ClipboardCheck className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-purple-800">{stats.underReview}</div>
          <p className="text-[10px] text-[#77716e] mt-1">Awaiting Sign-off</p>
        </Link>

        <Link
          to="/tasks/list?status=COMPLETED"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">{stats.completed}</div>
          <p className="text-[10px] text-[#77716e] mt-1">Finished</p>
        </Link>

        <Link
          to="/tasks/list?isOverdue=true"
          className="bg-white border border-rose-200 bg-rose-50/20 rounded-2xl p-4 shadow-xs hover:border-rose-400 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{stats.overdue}</div>
          <p className="text-[10px] text-rose-600 font-medium mt-1">Passed Deadline</p>
        </Link>

        <Link
          to="/tasks/list?status=ON_HOLD"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">On Hold</span>
            <PauseCircle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-amber-800">{stats.onHold}</div>
          <p className="text-[10px] text-[#77716e] mt-1">Paused</p>
        </Link>

        <Link
          to="/tasks/list?status=CANCELLED"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cancelled</span>
            <XCircle className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-600">{stats.cancelled}</div>
          <p className="text-[10px] text-[#77716e] mt-1">Dropped</p>
        </Link>
      </div>

      {/* Review Alert Section (if pending reviews exist) */}
      {reviewTasks.length > 0 && canManage && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-purple-900">
                Tasks Awaiting Supervisor Approval ({reviewTasks.length})
              </h3>
            </div>
            <Link
              to="/tasks/reviews"
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
            >
              Open Review Queue
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reviewTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white/90 border border-purple-100 rounded-xl p-3 flex items-center justify-between hover:bg-white transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] font-semibold text-purple-700">
                      {task.taskCode}
                    </span>
                    <TaskPriorityBadge priority={task.priority} />
                  </div>
                  <h4 className="text-xs font-bold text-[#252525] line-clamp-1">{task.title}</h4>
                  <p className="text-[11px] text-[#77716e] mt-0.5">
                    Assigned: <span className="font-medium text-[#252525]">{task.assignedEmployee?.name || "Unassigned"}</span>
                  </p>
                </div>
                <Link
                  to={`/tasks/${task.id}`}
                  className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 shadow-xs"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tasks List */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5 border-b border-[#eadbd2] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#252525]">Recent Task Activity</h3>
            <p className="text-xs text-[#77716e] mt-0.5">
              Live updates across all company operations and departments.
            </p>
          </div>
          <Link
            to="/tasks/list"
            className="text-xs font-semibold text-[#f47b5b] hover:text-[#ea6a45] flex items-center gap-1"
          >
            View All Tasks
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#77716e] gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#f47b5b]" />
            <span className="text-xs">Loading task dashboard...</span>
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="py-12 text-center text-[#77716e]">
            <CheckSquare className="w-10 h-10 mx-auto text-[#eadbd2] mb-2" />
            <p className="text-sm font-semibold text-[#252525]">No tasks recorded yet</p>
            <p className="text-xs mt-1">Get started by creating your first organizational task.</p>
            {canManage && (
              <Link
                to="/tasks/new"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#f47b5b] text-white text-xs font-semibold rounded-xl hover:bg-[#ea6a45] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Task
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#eadbd2] text-[#77716e] uppercase tracking-wider font-semibold text-[11px]">
                  <th className="pb-3 pr-4">Task</th>
                  <th className="pb-3 px-3">Department</th>
                  <th className="pb-3 px-3">Assignee</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 min-w-[120px]">Progress</th>
                  <th className="pb-3 px-3">Due Date</th>
                  <th className="pb-3 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1ece9]">
                {recentTasks.map((t) => {
                  const isOverdue =
                    t.dueDate &&
                    new Date(t.dueDate) < new Date() &&
                    !["COMPLETED", "CANCELLED"].includes(t.status);

                  return (
                    <tr key={t.id} className="hover:bg-[#fff7f2]/50 transition-colors group">
                      <td className="py-3.5 pr-4">
                        <Link
                          to={`/tasks/${t.id}`}
                          className="font-semibold text-[#252525] group-hover:text-[#f47b5b] line-clamp-1"
                        >
                          {t.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-[#77716e]">{t.taskCode}</span>
                          <span className="text-[10px] text-[#77716e]">• {t.category}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-[#77716e]">
                        {t.department?.name || <span className="text-slate-400 italic">None</span>}
                      </td>

                      <td className="py-3.5 px-3">
                        {t.assignedEmployee ? (
                          <div>
                            <span className="font-medium text-[#252525]">{t.assignedEmployee.name}</span>
                            <span className="block text-[10px] text-[#77716e]">
                              {t.assignedEmployee.employeeCode}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <TaskPriorityBadge priority={t.priority} />
                      </td>

                      <td className="py-3.5 px-3">
                        <TaskStatusBadge status={t.status} />
                      </td>

                      <td className="py-3.5 px-3">
                        <TaskProgressBar progress={t.progress} />
                      </td>

                      <td className="py-3.5 px-3">
                        {t.dueDate ? (
                          <div>
                            <span className={isOverdue ? "text-rose-600 font-bold" : "text-[#252525]"}>
                              {new Date(t.dueDate).toLocaleDateString()}
                            </span>
                            {isOverdue && (
                              <span className="block text-[10px] text-rose-600 font-semibold">
                                Overdue
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No deadline</span>
                        )}
                      </td>

                      <td className="py-3.5 pl-3 text-right">
                        <Link
                          to={`/tasks/${t.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-[#f47b5b] hover:bg-[#fff0e8] rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

