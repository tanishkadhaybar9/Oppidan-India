import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  Loader2,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import { listTasks, assignTask } from "../services/taskService";
import { listEmployees, listDepartments } from "../services/employeeService";
import type { Task } from "../types/task";
import type { EmployeeSummary, Department } from "../types/employee";
import { PageContainer, PageHeader } from "../components/common";
import { TaskStatusBadge } from "../components/tasks/TaskBadges";

export function TaskAssignmentsPage() {

  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Assign Modal
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [targetEmpId, setTargetEmpId] = useState<string>("");
  const [assignInstructions, setAssignInstructions] = useState<string>("");
  const [submittingAssign, setSubmittingAssign] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, eRes, dRes] = await Promise.all([
        listTasks({
          departmentId: selectedDeptId || undefined,
          search: search.trim() || undefined,
          limit: 100,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
        listEmployees({ status: "ACTIVE", limit: 100 }),
        listDepartments(),
      ]);

      if (tRes.data) setTasks(tRes.data.tasks);
      if (eRes.data) setEmployees(eRes.data.employees);
      if (dRes.data) setDepartments(dRes.data.departments);
    } catch (err: any) {
      setError(err?.message || "Failed to load task assignments");
    } finally {
      setLoading(false);
    }
  }, [selectedDeptId, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const unassignedTasks = tasks.filter((t) => !t.assignedEmployeeId);

  // Calculate workload per employee
  const employeeWorkload = employees.map((emp) => {
    const empTasks = tasks.filter((t) => t.assignedEmployeeId === emp.id);
    const activeTasks = empTasks.filter((t) => ["TO_DO", "IN_PROGRESS", "UNDER_REVIEW"].includes(t.status));
    const completedTasks = empTasks.filter((t) => t.status === "COMPLETED");
    const overdueTasks = empTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        !["COMPLETED", "CANCELLED"].includes(t.status)
    );

    return {
      employee: emp,
      total: empTasks.length,
      active: activeTasks.length,
      completed: completedTasks.length,
      overdue: overdueTasks.length,
      tasks: empTasks,
    };
  }).filter((ew) => !selectedDeptId || ew.employee.department?.id === selectedDeptId);

  return (
    <PageContainer>
      <PageHeader
        title="Task Assignments & Workload"
        subtitle="Distribute deliverables across departments, monitor employee workload, and rebalance tasks."
        icon={<Users className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Tasks", to: "/tasks/dashboard" },
          { label: "Assignments" },
        ]}
      />

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center justify-between mb-4">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between mb-4">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
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

          <div className="relative w-64">
            <Search className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
            />
          </div>
        </div>

        <div className="text-xs text-[#77716e]">
          Tracking <strong>{tasks.length}</strong> tasks across <strong>{employees.length}</strong> active team members
        </div>
      </div>

      {/* Unassigned Tasks Alert (if any) */}
      {unassignedTasks.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 mb-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-900">
                Unassigned Tasks Awaiting Delegation ({unassignedTasks.length})
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unassignedTasks.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-amber-100 rounded-xl p-3 flex items-center justify-between shadow-xs"
              >
                <div>
                  <span className="font-mono text-[10px] text-amber-700 font-semibold">{t.taskCode}</span>
                  <h4 className="text-xs font-bold text-[#252525] line-clamp-1">{t.title}</h4>
                  <span className="text-[10px] text-[#77716e]">{t.department?.name || "General"}</span>
                </div>
                <button
                  onClick={() => {
                    setAssigningTask(t);
                    setTargetEmpId("");
                    setAssignInstructions(t.instructions || "");
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#f47b5b] text-white rounded-lg hover:bg-[#ea6a45] transition-colors shadow-xs"
                >
                  Assign
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee Workload Cards Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-[#77716e] gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#f47b5b]" />
          <span className="text-xs">Loading employee assignments...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employeeWorkload.map((ew) => (
            <div
              key={ew.employee.id}
              className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#f47b5b]/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#f1ece9]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#fff0e8] border border-[#eadbd2] text-[#f47b5b] font-bold text-sm flex items-center justify-center">
                      {ew.employee.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#252525]">{ew.employee.name}</h4>
                      <p className="text-[11px] text-[#77716e]">
                        {ew.employee.employeeCode} {ew.employee.department ? `• ${ew.employee.department.name}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Workload Stats Meter */}
                <div className="grid grid-cols-3 gap-2 py-3 text-center border-b border-[#f1ece9]">
                  <div className="p-2 bg-blue-50/50 rounded-xl">
                    <span className="text-[10px] text-blue-600 uppercase font-semibold block">Active</span>
                    <span className="text-base font-bold text-blue-800">{ew.active}</span>
                  </div>
                  <div className="p-2 bg-emerald-50/50 rounded-xl">
                    <span className="text-[10px] text-emerald-600 uppercase font-semibold block">Done</span>
                    <span className="text-base font-bold text-emerald-800">{ew.completed}</span>
                  </div>
                  <div className="p-2 bg-rose-50/50 rounded-xl">
                    <span className="text-[10px] text-rose-600 uppercase font-semibold block">Overdue</span>
                    <span className="text-base font-bold text-rose-800">{ew.overdue}</span>
                  </div>
                </div>

                {/* Assigned Task Snippets */}
                <div className="pt-3 space-y-2">
                  <span className="text-[11px] font-bold text-[#77716e] uppercase tracking-wider block">
                    Current Tasks ({ew.tasks.length})
                  </span>

                  {ew.tasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No tasks assigned currently.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {ew.tasks.slice(0, 4).map((t) => (
                        <div
                          key={t.id}
                          className="p-2 bg-[#fcfaf9] border border-[#f1ece9] rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="truncate mr-2">
                            <span className="font-mono text-[10px] text-[#f47b5b] font-semibold mr-1">
                              {t.taskCode}
                            </span>
                            <span className="text-[#252525] font-medium">{t.title}</span>
                          </div>
                          <TaskStatusBadge status={t.status} />
                        </div>
                      ))}
                      {ew.tasks.length > 4 && (
                        <p className="text-[10px] text-center text-[#77716e] font-medium pt-1">
                          +{ew.tasks.length - 4} more tasks
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#f1ece9] flex justify-end">
                <Link
                  to={`/tasks/list?assignedEmployeeId=${ew.employee.id}`}
                  className="text-xs font-semibold text-[#f47b5b] hover:text-[#ea6a45] flex items-center gap-1"
                >
                  View Employee Tasks
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL: ASSIGN TASK ────────────────────────────────────────── */}
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
                  Assignment Instructions & Notes
                </label>
                <textarea
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  rows={3}
                  placeholder="Specific requirements, expected deliverables..."
                  className="w-full text-xs p-3 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
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
    </PageContainer>
  );
}

