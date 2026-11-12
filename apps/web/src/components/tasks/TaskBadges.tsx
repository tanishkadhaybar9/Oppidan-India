import type { TaskPriority, TaskStatus } from "../../types/task";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, { bg: string; text: string; border: string; label: string }> = {
    TO_DO: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", label: "To Do" },
    IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "In Progress" },
    UNDER_REVIEW: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Under Review" },
    COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Completed" },
    ON_HOLD: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "On Hold" },
    CANCELLED: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", label: "Cancelled" },
  };

  const current = styles[status] || styles.TO_DO;

  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${current.bg} ${current.text} ${current.border}`}
    >
      {current.label}
    </span>
  );
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const styles: Record<TaskPriority, { bg: string; text: string; border: string; dot: string }> = {
    LOW: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-400" },
    MEDIUM: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
    HIGH: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    URGENT: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  };

  const current = styles[priority] || styles.MEDIUM;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${current.bg} ${current.text} ${current.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {priority}
    </span>
  );
}

export function TaskProgressBar({
  progress,
  status,
  className,
}: {
  progress: number;
  status?: TaskStatus;
  className?: string;
}) {
  let color = "bg-[#f47b5b]";
  if (status === "COMPLETED" || progress === 100) color = "bg-emerald-500";
  else if (status === "UNDER_REVIEW") color = "bg-purple-500";
  else if (progress >= 50) color = "bg-blue-500";
  else if (progress > 0) color = "bg-amber-500";

  return (
    <div className={`w-full ${className || ""}`}>
      <div className="flex justify-between items-center text-[11px] font-medium text-[#77716e] mb-1">
        <span>Progress</span>
        <span className="font-semibold text-[#252525]">{progress}%</span>
      </div>
      <div className="w-full bg-[#f1ece9] h-2 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300 rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
