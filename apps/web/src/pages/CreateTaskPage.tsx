import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  CheckSquare,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";
import { createTask } from "../services/taskService";
import { listDepartments, listEmployees } from "../services/employeeService";
import type { TaskPriority } from "../types/task";
import type { Department, EmployeeSummary } from "../types/employee";
import { PageContainer, PageHeader } from "../components/common";
import { TaskPriorityBadge } from "../components/tasks/TaskBadges";

const CATEGORIES = [
  "GENERAL",
  "DEVELOPMENT",
  "DESIGN",
  "MARKETING",
  "OPERATIONS",
  "SALES",
  "SUPPORT",
  "HR",
  "FINANCE",
  "OTHER",
];

export function CreateTaskPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [departmentId, setDepartmentId] = useState("");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [instructions, setInstructions] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        departmentId: departmentId || undefined,
        assignedEmployeeId: assignedEmployeeId || undefined,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        instructions: instructions.trim() || undefined,
      });

      if (res.data?.id) {
        navigate(`/tasks/${res.data.id}`);
      } else {
        navigate("/tasks/list");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create task");
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create New Task"
        subtitle="Define deliverables, assign responsible team members, set priorities and deadlines."
        icon={<CheckSquare className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Tasks", to: "/tasks/dashboard" },
          { label: "Create Task" },
        ]}
        actions={
          <Link
            to="/tasks/list"
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-[#eadbd2] text-[#252525] rounded-xl hover:bg-[#fff7f2] transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-[#77716e]" />
            Back to All Tasks
          </Link>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Conduct Q3 Cloud Infrastructure Security Audit"
                className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Detailed Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Elaborate on scope, goals, reference documentation, and acceptance criteria..."
                className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
              />
            </div>

            {/* Category & Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Department & Assignee Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                >
                  <option value="">-- Optional: Assign Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                  Assign Employee
                </label>
                <select
                  value={assignedEmployeeId}
                  onChange={(e) => setAssignedEmployeeId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                >
                  <option value="">-- Unassigned (Assign Later) --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode}) {emp.department ? `- ${emp.department.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                  Due Date (Deadline)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                />
              </div>
            </div>

            {/* Instructions / Special Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Assignment Instructions & Notes
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder="Specific guidance for the assigned employee, checklists, links to internal repositories..."
                className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-[#eadbd2] flex items-center justify-end gap-3">
              <Link
                to="/tasks/list"
                className="px-4 py-2.5 text-xs font-semibold text-[#77716e] hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-[#f47b5b] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#ea6a45] disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Task...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Task
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview / Info Card */}
        <div className="space-y-4">
          <div className="bg-[#fff7f2] border border-[#eadbd2] rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#77716e] mb-3">
              Task Preview
            </h4>

            <div className="bg-white border border-[#eadbd2] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-[#f47b5b]">
                  TSK-2026-AUTO
                </span>
                <TaskPriorityBadge priority={priority} />
              </div>

              <h5 className="font-bold text-sm text-[#252525] line-clamp-2">
                {title || "Untitled Task"}
              </h5>

              <p className="text-xs text-[#77716e] line-clamp-3">
                {description || "No description provided."}
              </p>

              <div className="pt-2 border-t border-[#f1ece9] text-[11px] text-[#77716e] space-y-1">
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-semibold text-[#252525]">{category}</span>
                </div>
                <div className="flex justify-between">
                  <span>Due Date:</span>
                  <span className="font-semibold text-[#252525]">
                    {dueDate ? new Date(dueDate).toLocaleDateString() : "No deadline"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Assignee:</span>
                  <span className="font-semibold text-[#252525]">
                    {employees.find((e) => e.id === assignedEmployeeId)?.name || "Unassigned"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#eadbd2] rounded-2xl p-5 text-xs text-[#77716e] space-y-2">
            <h5 className="font-bold text-[#252525]">Task Workflow Tips</h5>
            <p>• Tasks start in <strong>To Do</strong> status with 0% progress.</p>
            <p>• Once an employee updates progress or starts work, status transitions to <strong>In Progress</strong>.</p>
            <p>• When complete (100%), the employee can submit the task for <strong>Supervisor Review</strong>.</p>
            <p>• An assigned employee will receive an in-app notification immediately upon creation.</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

