import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  Umbrella,
  Package,
  DollarSign,
  CheckSquare,
  Building2,
  TrendingUp,
  ArrowRight,
  Loader2,
  FileBarChart,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { getReportsDashboard } from "../services/reportsService";
import type { ReportsDashboardStats } from "../types/reports";

function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function ReportsDashboardPage() {
  const [stats, setStats] = useState<ReportsDashboardStats>({
    totalEmployees: 0,
    totalDepartments: 0,
    activeToday: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    totalAssets: 0,
    assignedAssets: 0,
    monthlyPayrollExpenditure: 0,
    totalTasks: 0,
    completedTasks: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const res = await getReportsDashboard();
        if (res.data) {
          setStats(res.data);
        }
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e.message || "Failed to load reports statistics.");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const reportCards = [
    {
      title: "Employee Demographics",
      description: "Staff headcount, department distributions, designations, and status reports.",
      icon: Users,
      path: "/reports/employees",
      color: "bg-blue-50 text-blue-600 border-blue-200",
      badge: `${stats.totalEmployees} Employees`,
    },
    {
      title: "Attendance & Shifts",
      description: "Daily presenteeism, tardiness, average working hours, and check-in logs.",
      icon: CalendarCheck,
      path: "/reports/attendance",
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      badge: `${stats.activeToday} Clocked-In`,
    },
    {
      title: "Leave & Absences",
      description: "Leave application status, quota utilization, types breakdown, and approvals.",
      icon: Umbrella,
      path: "/reports/leaves",
      color: "bg-amber-50 text-amber-600 border-amber-200",
      badge: `${stats.pendingLeaves} Pending`,
    },
    {
      title: "Assets & Inventory",
      description: "Hardware valuation, status tracking, maintenance schedules, and assignments.",
      icon: Package,
      path: "/reports/assets",
      color: "bg-purple-50 text-purple-600 border-purple-200",
      badge: `${stats.totalAssets} Total Assets`,
    },
    {
      title: "Payroll & Compensation",
      description: "Monthly gross vs net payouts, deductions, statutory breakdowns, and history.",
      icon: DollarSign,
      path: "/reports/payroll",
      color: "bg-rose-50 text-rose-600 border-rose-200",
      badge: formatINR(stats.monthlyPayrollExpenditure),
    },
    {
      title: "Tasks & Productivity",
      description: "Project task completion rate, department workloads, and pending deadlines.",
      icon: CheckSquare,
      path: "/reports/tasks",
      color: "bg-orange-50 text-orange-600 border-orange-200",
      badge: `${stats.completedTasks}/${stats.totalTasks} Done`,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Reports & Analytics Dashboard"
        subtitle="Cross-module organizational metrics, executive summaries, and downloadable audit trails"
      />

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl">
          {error}
        </div>
      )}

      {/* 10 Executive Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <Link
          to="/reports/employees"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/50 transition-all group"
        >
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Employees</span>
            <Users className="w-4 h-4 text-[#f47b5b] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-[#252525]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.totalEmployees}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Total workforce</p>
        </Link>

        <Link
          to="/reports/employees"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/50 transition-all group"
        >
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Departments</span>
            <Building2 className="w-4 h-4 text-[#f47b5b] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-[#252525]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.totalDepartments}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Functional units</p>
        </Link>

        <Link
          to="/reports/attendance"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/50 transition-all group"
        >
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Today</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.activeToday}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Clocked in today</p>
        </Link>

        <Link
          to="/reports/leaves"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/50 transition-all group"
        >
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Leaves</span>
            <Umbrella className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.pendingLeaves}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Awaiting decision</p>
        </Link>

        <Link
          to="/reports/leaves"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/50 transition-all group"
        >
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Approved Leaves</span>
            <Umbrella className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.approvedLeaves}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Active / upcoming</p>
        </Link>

        <Link
          to="/reports/assets"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/50 transition-all group"
        >
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Assets</span>
            <Package className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-[#252525]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.totalAssets}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Cataloged items</p>
        </Link>

        <Link
          to="/reports/assets"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/50 transition-all group"
        >
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Assigned Assets</span>
            <Package className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-[#252525]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.assignedAssets}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">In employee custody</p>
        </Link>

        <Link
          to="/reports/payroll"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/50 transition-all group"
        >
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Payroll Spend</span>
            <DollarSign className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-rose-700 truncate">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              formatINR(stats.monthlyPayrollExpenditure)
            )}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Latest monthly spend</p>
        </Link>

        <Link
          to="/reports/tasks"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/50 transition-all group"
        >
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Tasks</span>
            <CheckSquare className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-[#252525]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.totalTasks}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Assigned work items</p>
        </Link>

        <Link
          to="/reports/tasks"
          className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/50 transition-all group"
        >
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Completed Tasks</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.completedTasks}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Successfully closed</p>
        </Link>
      </div>

      {/* Reports Directory Sections */}
      <h3 className="text-sm font-bold text-[#252525] uppercase tracking-wider mb-4 flex items-center gap-2">
        <FileBarChart className="w-4 h-4 text-[#f47b5b]" />
        <span>Analytical Report Modules</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportCards.map((rc) => {
          const Icon = rc.icon;
          return (
            <Link
              key={rc.path}
              to={rc.path}
              className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-[#f47b5b]/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${rc.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f8f4f1] text-[#252525] border border-[#eadbd2]">
                    {rc.badge}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#252525] group-hover:text-[#f47b5b] transition-colors mb-1.5">
                  {rc.title}
                </h4>
                <p className="text-xs text-[#77716e] leading-relaxed mb-4">
                  {rc.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f47b5b] pt-3 border-t border-[#eadbd2]/60">
                <span>View Full Report & Export</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}

