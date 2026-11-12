import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  Percent,
} from "lucide-react";
import { getTaskAnalytics } from "../services/taskService";
import type { TaskAnalytics } from "../types/task";
import { listDepartments, listEmployees } from "../services/employeeService";
import type { Department, EmployeeSummary } from "../types/employee";

export function TaskAnalyticsPage() {
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedEmp, setSelectedEmp] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFilters = async () => {
    try {
      const [deptRes, empRes] = await Promise.allSettled([
        listDepartments(),
        listEmployees({ limit: 100 }),
      ]);
      if (deptRes.status === "fulfilled" && deptRes.value.data) {
        setDepartments(deptRes.value.data.departments);
      }
      if (empRes.status === "fulfilled" && empRes.value.data) {
        setEmployees(empRes.value.data.employees);
      }
    } catch {
      // Non-blocking
    }
  };

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTaskAnalytics({
        departmentId: selectedDept || undefined,
        employeeId: selectedEmp || undefined,
      });
      setAnalytics(res.data || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load analytics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedDept, selectedEmp]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Status Color mapping
  const statusColors: Record<string, string> = {
    TO_DO: "#64748b",
    IN_PROGRESS: "#3b82f6",
    UNDER_REVIEW: "#8b5cf6",
    COMPLETED: "#10b981",
    ON_HOLD: "#f59e0b",
    CANCELLED: "#ef4444",
  };

  const priorityColors: Record<string, string> = {
    LOW: "#10b981",
    MEDIUM: "#3b82f6",
    HIGH: "#f97316",
    URGENT: "#ef4444",
  };

  const totalTasks = analytics?.byStatus?.reduce((acc: number, item) => acc + item.count, 0) || 0;
  const completedTasks =
    analytics?.byStatus?.find((s) => s.status === "COMPLETED")?.count || 0;
  const inProgressTasks =
    analytics?.byStatus?.find((s) => s.status === "IN_PROGRESS")?.count || 0;
  const underReviewTasks =
    analytics?.byStatus?.find((s) => s.status === "UNDER_REVIEW")?.count || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalOverdue =
    analytics?.byEmployee?.reduce((acc: number, e) => acc + (e.overdueCount || 0), 0) || 0;

  const maxTrendCount = analytics?.completionTrend?.length
    ? Math.max(...analytics.completionTrend.map((t: { count: number }) => t.count), 1)
    : 1;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-[#f47b5b]/10 text-[#f47b5b] rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Analytics & Insights</h1>
            <p className="text-sm text-gray-500">
              Real-time operational metrics, team workload distributions, and completion velocity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadAnalytics()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-[#eadbd2] rounded-lg hover:bg-gray-50 transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            to="/tasks/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#f47b5b] rounded-lg hover:bg-[#e06646] transition shadow-xs"
          >
            Task Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#eadbd2] rounded-xl p-4 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Scope Filters:
          </span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-sm border border-[#eadbd2] rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/20 focus:border-[#f47b5b]"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
            className="text-sm border border-[#eadbd2] rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/20 focus:border-[#f47b5b]"
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.employeeCode})
              </option>
            ))}
          </select>
        </div>

        {(selectedDept || selectedEmp) && (
          <button
            onClick={() => {
              setSelectedDept("");
              setSelectedEmp("");
            }}
            className="text-xs font-medium text-[#f47b5b] hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* High-Level Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-[#eadbd2] rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-gray-500">Total Tasks</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {loading ? "..." : totalTasks}
          </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            Active scope
          </div>
        </div>

        <div className="bg-white border border-[#eadbd2] rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-gray-500">Completion Rate</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {loading ? "..." : `${completionRate}%`}
          </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-emerald-500" />
            Completed vs total
          </div>
        </div>

        <div className="bg-white border border-[#eadbd2] rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-gray-500">In Progress</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {loading ? "..." : inProgressTasks}
          </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            Under active work
          </div>
        </div>

        <div className="bg-white border border-[#eadbd2] rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-gray-500">Under Review</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {loading ? "..." : underReviewTasks}
          </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
            Awaiting sign-off
          </div>
        </div>

        <div className="bg-white border border-[#eadbd2] rounded-xl p-4 shadow-xs col-span-2 md:col-span-1">
          <div className="text-xs font-medium text-gray-500">Overdue Tasks</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {loading ? "..." : totalOverdue}
          </div>
          <div className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Requires attention
          </div>
        </div>
      </div>

      {/* Grid of 6 Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tasks by Status */}
        <div className="bg-white border border-[#eadbd2] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#f47b5b]" />
              <h3 className="font-semibold text-gray-900 text-sm">
                1. Tasks by Status Distribution
              </h3>
            </div>
            <span className="text-xs text-gray-400">Current snapshot</span>
          </div>

          <div className="space-y-3 pt-2">
            {analytics?.byStatus && analytics.byStatus.length > 0 ? (
              analytics.byStatus.map((item: { status: string; count: number; percentage: number }) => {
                const color = statusColors[item.status] || "#94a3b8";
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-gray-700">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {item.status.replace("_", " ")}
                      </span>
                      <span>
                        {item.count} tasks ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">No status data</p>
            )}
          </div>
        </div>

        {/* Chart 2: Tasks by Priority */}
        <div className="bg-white border border-[#eadbd2] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#f47b5b]" />
              <h3 className="font-semibold text-gray-900 text-sm">
                2. Tasks by Priority Level
              </h3>
            </div>
            <span className="text-xs text-gray-400">Urgency breakdown</span>
          </div>

          <div className="space-y-3 pt-2">
            {analytics?.byPriority && analytics.byPriority.length > 0 ? (
              analytics.byPriority.map((item: { priority: string; count: number; percentage: number }) => {
                const color = priorityColors[item.priority] || "#94a3b8";
                return (
                  <div key={item.priority} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-gray-700">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {item.priority}
                      </span>
                      <span>
                        {item.count} tasks ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">No priority data</p>
            )}
          </div>
        </div>

        {/* Chart 3: Department-wise Task Distribution */}
        <div className="bg-white border border-[#eadbd2] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#f47b5b]" />
              <h3 className="font-semibold text-gray-900 text-sm">
                3. Department Task Distribution
              </h3>
            </div>
            <span className="text-xs text-gray-400">Total vs Completed</span>
          </div>

          <div className="space-y-3 pt-2">
            {analytics?.byDepartment && analytics.byDepartment.length > 0 ? (
              analytics.byDepartment.map((dept: {
                departmentId: string;
                departmentName: string;
                count: number;
                completedCount: number;
              }) => {
                const compPct =
                  dept.count > 0 ? Math.round((dept.completedCount / dept.count) * 100) : 0;
                return (
                  <div key={dept.departmentId} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-gray-700">
                      <span className="truncate max-w-[180px]">{dept.departmentName}</span>
                      <span className="text-gray-500">
                        <strong className="text-emerald-600">{dept.completedCount}</strong> /{" "}
                        {dept.count} done ({compPct}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${compPct}%` }}
                        title={`${dept.completedCount} completed`}
                      />
                      <div
                        className="h-full bg-[#f47b5b]/60 transition-all duration-500"
                        style={{ width: `${100 - compPct}%` }}
                        title={`${dept.count - dept.completedCount} in progress or pending`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">
                No department task data
              </p>
            )}
          </div>
        </div>

        {/* Chart 4: Employee-wise Task Distribution */}
        <div className="bg-white border border-[#eadbd2] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#f47b5b]" />
              <h3 className="font-semibold text-gray-900 text-sm">
                4. Employee Task Allocation
              </h3>
            </div>
            <span className="text-xs text-gray-400">Top assignees</span>
          </div>

          <div className="space-y-3 pt-2">
            {analytics?.byEmployee && analytics.byEmployee.length > 0 ? (
              analytics.byEmployee.slice(0, 6).map((emp: {
                employeeId: string;
                employeeName: string;
                count: number;
                completedCount: number;
                overdueCount: number;
              }) => {
                const compPct =
                  emp.count > 0 ? Math.round((emp.completedCount / emp.count) * 100) : 0;
                return (
                  <div key={emp.employeeId} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-gray-700">
                      <span className="truncate max-w-[180px]">{emp.employeeName}</span>
                      <span className="text-gray-500">
                        {emp.completedCount} done • {emp.count} total
                        {emp.overdueCount > 0 && (
                          <span className="text-rose-600 font-semibold ml-1.5">
                            ({emp.overdueCount} overdue)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3b82f6] rounded-full transition-all duration-500"
                        style={{ width: `${compPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">
                No employee assignment data
              </p>
            )}
          </div>
        </div>

        {/* Chart 5: 14-Day Completion Trend */}
        <div className="bg-white border border-[#eadbd2] rounded-xl p-5 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#f47b5b]" />
              <h3 className="font-semibold text-gray-900 text-sm">
                5. 14-Day Task Completion Velocity Trend
              </h3>
            </div>
            <span className="text-xs text-gray-400">Completed per day</span>
          </div>

          <div className="pt-4">
            <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 px-2 border-b border-gray-100 pb-2">
              {analytics?.completionTrend && analytics.completionTrend.length > 0 ? (
                analytics.completionTrend.map((day: { date: string; count: number }) => {
                  const heightPct = Math.round((day.count / maxTrendCount) * 100);
                  const isToday =
                    day.date === new Date().toISOString().split("T")[0];
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-1.5 group relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 bg-gray-900 text-white text-[10px] py-1 px-1.5 rounded pointer-events-none whitespace-nowrap z-10">
                        {day.date}: {day.count} tasks
                      </div>
                      <div className="w-full max-w-[28px] h-32 bg-gray-50 rounded-t flex items-end">
                        <div
                          className={`w-full rounded-t transition-all duration-500 ${
                            isToday ? "bg-[#f47b5b]" : "bg-emerald-500"
                          } group-hover:brightness-110`}
                          style={{ height: `${Math.max(heightPct, 6)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 truncate max-w-[32px]">
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full text-center text-xs text-gray-400 py-10">
                  No completion trend recorded in this window
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart 6: Workload Distribution */}
        <div className="bg-white border border-[#eadbd2] rounded-xl p-5 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#f47b5b]" />
              <h3 className="font-semibold text-gray-900 text-sm">
                6. Workload Distribution (% Share by Department)
              </h3>
            </div>
            <span className="text-xs text-gray-400">Organizational bandwidth</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {analytics?.workloadDistribution && analytics.workloadDistribution.length > 0 ? (
              analytics.workloadDistribution.map((item: { name: string; count: number; percentage: number }) => {
                return (
                  <div
                    key={item.name}
                    className="p-4 bg-gray-50/60 border border-gray-200/60 rounded-xl space-y-2"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-900 truncate">
                        {item.name}
                      </span>
                      <span className="font-bold text-[#f47b5b]">{item.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#f47b5b] rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500 pt-1">
                      <span>{item.count} Active Tasks</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 col-span-3 text-center py-6">
                No departmental workload data available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
