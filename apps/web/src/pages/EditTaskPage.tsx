import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  CheckSquare,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";
import { getTask, updateTask } from "../services/taskService";
import { listDepartments, listEmployees } from "../services/employeeService";
import type { TaskPriority, TaskStatus } from "../types/task";
import type { Department, EmployeeSummary } from "../types/employee";
import { PageContainer, PageHeader } from "../components/common";

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

export function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>("TO_DO");
  const [progress, setProgress] = useState(0);
  const [departmentId, setDepartmentId] = useState("");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [taskCode, setTaskCode] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const [taskRes, dRes, eRes] = await Promise.all([
          getTask(id),
          listDepartments(),
          listEmployees({ status: "ACTIVE", limit: 100 }),
        ]);

        if (taskRes.data) {
          const t = taskRes.data;
          setTaskCode(t.taskCode);
          setTitle(t.title);
          setDescription(t.description || "");
          setCategory(t.category);
          setPriority(t.priority);
          setStatus(t.status);
          setProgress(t.progress);
          setDepartmentId(t.departmentId || "");
          setAssignedEmployeeId(t.assignedEmployeeId || "");
          setStartDate(t.startDate ? t.startDate.split("T")[0] : "");
          setDueDate(t.dueDate ? t.dueDate.split("T")[0] : "");
          setInstructions(t.instructions || "");
        }

        if (dRes.data) setDepartments(dRes.data.departments);
        if (eRes.data) setEmployees(eRes.data.employees);
      } catch (err: any) {
        setError(err?.message || "Failed to load task details");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !title.trim()) {
      setError("Task title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await updateTask(id, {
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        status,
        progress,
        departmentId: departmentId || null,
        assignedEmployeeId: assignedEmployeeId || null,
        startDate: startDate || null,
        dueDate: dueDate || null,
        instructions: instructions.trim() || null,
      });

      navigate(`/tasks/${id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to update task");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="py-24 flex flex-col items-center justify-center text-[#77716e] gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b]" />
          <span className="text-xs">Loading task editor...</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Edit Task: ${taskCode}`}
        subtitle="Update deliverables, change status, reassign team members, adjust deadlines."
        icon={<CheckSquare className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Tasks", to: "/tasks/dashboard" },
          { label: taskCode, to: `/tasks/${id}` },
          { label: "Edit" },
        ]}
        actions={
          <Link
            to={`/tasks/${id}`}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-[#eadbd2] text-[#252525] rounded-xl hover:bg-[#fff7f2] transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-[#77716e]" />
            Back to Task
          </Link>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs max-w-3xl">
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
              className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
            />
          </div>

          {/* Status & Progress Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
              >
                <option value="TO_DO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Progress: <strong className="text-[#f47b5b]">{progress}%</strong>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-[#f47b5b] mt-2"
              />
            </div>
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">Category</label>
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
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">Priority</label>
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
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
              >
                <option value="">-- No Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Assigned Employee
              </label>
              <select
                value={assignedEmployeeId}
                onChange={(e) => setAssignedEmployeeId(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
              >
                <option value="">-- Unassigned --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1.5">
              Instructions & Notes
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="w-full text-xs px-3.5 py-2.5 border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#eadbd2] flex items-center justify-end gap-3">
            <Link
              to={`/tasks/${id}`}
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
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

