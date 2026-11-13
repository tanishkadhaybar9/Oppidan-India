import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart2,
  Building2,
  Filter,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PageContainer, PageHeader } from "../components/common";
import { getPayrollSummary, getPayrollAnalytics } from "../services/payrollService";
import type { PayrollSummaryStats, PayrollAnalytics } from "../types/payroll";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function PayrollDashboardPage() {
  const { user } = useAuth();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedDept, setSelectedDept] = useState<string>("");

  const [stats, setStats] = useState<PayrollSummaryStats>({
    totalEmployees: 0,
    employeesWithSalaryStructure: 0,
    totalMonthlyGross: 0,
    totalMonthlyDeductions: 0,
    totalNetPayroll: 0,
    processedPayrolls: 0,
    pendingPayrolls: 0,
    paidPayrolls: 0,
  });

  const [analytics, setAnalytics] = useState<PayrollAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canManage = ["OWNER", "HR", "MANAGER"].includes(user?.role || "");

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, analyticsRes] = await Promise.all([
        getPayrollSummary({
          month: selectedMonth,
          year: selectedYear,
          departmentId: selectedDept || undefined,
        }),
        getPayrollAnalytics(),
      ]);
      if (summaryRes.data) setStats(summaryRes.data);
      if (analyticsRes.data) setAnalytics(analyticsRes.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load payroll dashboard");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedDept]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const maxMonthlyGross = analytics?.monthlyExpenditure?.length
    ? Math.max(...analytics.monthlyExpenditure.map((m) => m.gross), 1)
    : 1;

  const maxDeptAmount = analytics?.byDepartment?.length
    ? Math.max(...analytics.byDepartment.map((d) => d.totalAmount), 1)
    : 1;

  const totalStatusCount = analytics?.byStatus?.reduce((acc, s) => acc + s.count, 0) || 1;

  const statusColors: Record<string, string> = {
    DRAFT: "#94a3b8",
    PROCESSED: "#60a5fa",
    APPROVED: "#a78bfa",
    PAID: "#34d399",
    CANCELLED: "#f87171",
  };

  return (
    <PageContainer>
      <PageHeader
        title="Payroll Dashboard"
        subtitle="Overview of payroll processing, salary structures, and financial analytics."
        icon={<DollarSign className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Payroll", to: "/payroll" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/payroll/salary-structures"
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-[#eadbd2] text-[#252525] rounded-xl hover:bg-[#fff7f2] transition-colors flex items-center gap-1.5"
            >
              <Users className="w-4 h-4 text-[#f47b5b]" />
              Salary Structures
            </Link>
            {canManage && (
              <Link
                to="/payroll/process"
                className="px-3.5 py-2 text-xs font-semibold bg-[#f47b5b] text-white rounded-xl shadow-xs hover:bg-[#ea6a45] transition-colors flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                Process Payroll
              </Link>
            )}
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#77716e]">
          <Filter className="w-3.5 h-3.5 text-[#f47b5b]" />
          <span>Filter by:</span>
        </div>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="text-xs border border-[#eadbd2] rounded-xl px-3 py-2 bg-white text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="text-xs border border-[#eadbd2] rounded-xl px-3 py-2 bg-white text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {selectedDept && (
          <button
            onClick={() => setSelectedDept("")}
            className="text-xs text-[#f47b5b] hover:underline font-semibold"
          >
            Reset Filters
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/payroll/history"
            className="px-3 py-1.5 text-xs font-semibold text-[#77716e] hover:text-[#252525] bg-[#fff7f2] border border-[#eadbd2] rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5 text-[#f47b5b]" />
            Payroll History
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl flex items-center gap-2">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Employees */}
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/40 hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total</span>
            <Users className="w-4 h-4 text-[#f47b5b] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-[#252525]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#f47b5b]" /> : stats.totalEmployees}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Employees</p>
        </div>

        {/* With Salary Structure */}
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/40 hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between text-[#77716e] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Struct.</span>
            <DollarSign className="w-4 h-4 text-[#f47b5b] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-[#252525]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#f47b5b]" /> : stats.employeesWithSalaryStructure}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">With Structure</p>
        </div>

        {/* Total Gross */}
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group col-span-2">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gross</span>
            <TrendingUp className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-emerald-800">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatINR(stats.totalMonthlyGross)}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Total Gross Payroll</p>
        </div>

        {/* Total Deductions */}
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-rose-300 hover:shadow-sm transition-all group col-span-2">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Deductions</span>
            <TrendingDown className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-rose-700">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatINR(stats.totalMonthlyDeductions)}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Total Deductions</p>
        </div>

        {/* Net Payroll */}
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/40 hover:shadow-sm transition-all group col-span-2">
          <div className="flex items-center justify-between text-[#f47b5b] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Net</span>
            <CreditCard className="w-4 h-4 text-[#f47b5b] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-[#252525]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#f47b5b]" /> : formatINR(stats.totalNetPayroll)}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Net Payroll</p>
        </div>
      </div>

      {/* Second row: Processed / Pending / Paid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between text-blue-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Processed</span>
            <BarChart2 className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.processedPayrolls}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Payrolls Processed</p>
        </div>

        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending</span>
            <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-amber-800">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.pendingPayrolls}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Awaiting Processing</p>
        </div>

        <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Paid</span>
            <CheckCircle className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.paidPayrolls}
          </div>
          <p className="text-[10px] text-[#77716e] mt-1">Payments Released</p>
        </div>
      </div>

      {/* Charts Row */}
      {!loading && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monthly Expenditure */}
          <div className="lg:col-span-2 bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-5 border-b border-[#eadbd2] pb-4">
              <TrendingUp className="w-4 h-4 text-[#f47b5b]" />
              <h3 className="text-sm font-bold text-[#252525]">Monthly Expenditure</h3>
              <span className="text-[11px] text-[#77716e] ml-auto">Last 6 months</span>
            </div>
            {analytics.monthlyExpenditure.length === 0 ? (
              <div className="py-8 text-center text-[#77716e] text-xs">No data available</div>
            ) : (
              <div className="space-y-3">
                {analytics.monthlyExpenditure.slice(-6).map((m) => (
                  <div key={m.month}>
                    <div className="flex justify-between text-[11px] text-[#77716e] mb-1">
                      <span className="font-semibold">{m.month}</span>
                      <span>{formatINR(m.gross)}</span>
                    </div>
                    <div className="h-2.5 bg-[#f8f4f1] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round((m.gross / maxMonthlyGross) * 100)}%`,
                          background: "linear-gradient(90deg, #f47b5b, #ea6a45)",
                        }}
                      />
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] text-[#77716e]">
                      <span>Net: {formatINR(m.net)}</span>
                      <span>Deductions: {formatINR(m.deductions)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Distribution */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-5 border-b border-[#eadbd2] pb-4">
              <BarChart2 className="w-4 h-4 text-[#f47b5b]" />
              <h3 className="text-sm font-bold text-[#252525]">By Status</h3>
            </div>
            {analytics.byStatus.length === 0 ? (
              <div className="py-8 text-center text-[#77716e] text-xs">No data available</div>
            ) : (
              <div className="space-y-3">
                {analytics.byStatus.map((s) => (
                  <div key={s.status}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-[#252525]">{s.status}</span>
                      <span className="text-[#77716e]">{s.count}</span>
                    </div>
                    <div className="h-2.5 bg-[#f8f4f1] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round((s.count / totalStatusCount) * 100)}%`,
                          backgroundColor: statusColors[s.status] || "#f47b5b",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Department Distribution */}
      {!loading && analytics && analytics.byDepartment.length > 0 && (
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-5 border-b border-[#eadbd2] pb-4">
            <Building2 className="w-4 h-4 text-[#f47b5b]" />
            <h3 className="text-sm font-bold text-[#252525]">Department Payroll Distribution</h3>
          </div>
          <div className="space-y-3">
            {analytics.byDepartment.map((d) => (
              <div key={d.departmentId}>
                <div className="flex justify-between text-[11px] mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#252525]">{d.departmentName}</span>
                    <span className="text-[10px] text-[#77716e] bg-[#fff0e8] px-1.5 py-0.5 rounded-full">
                      {d.employeeCount} emp
                    </span>
                  </div>
                  <span className="text-[#77716e]">{formatINR(d.totalAmount)}</span>
                </div>
                <div className="h-2.5 bg-[#f8f4f1] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round((d.totalAmount / maxDeptAmount) * 100)}%`,
                      background: "linear-gradient(90deg, #f47b5b88, #f47b5b)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/payroll/salary-structures"
          className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs hover:border-[#f47b5b]/50 hover:shadow-sm transition-all group flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-[#fff0e8] flex items-center justify-center group-hover:bg-[#f47b5b]/20 transition-colors">
            <Users className="w-5 h-5 text-[#f47b5b]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#252525]">Salary Structures</p>
            <p className="text-[11px] text-[#77716e] mt-0.5">Manage employee compensation</p>
          </div>
        </Link>

        <Link
          to="/payroll/process"
          className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs hover:border-[#f47b5b]/50 hover:shadow-sm transition-all group flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-[#fff0e8] flex items-center justify-center group-hover:bg-[#f47b5b]/20 transition-colors">
            <CreditCard className="w-5 h-5 text-[#f47b5b]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#252525]">Process Payroll</p>
            <p className="text-[11px] text-[#77716e] mt-0.5">Run monthly payroll cycle</p>
          </div>
        </Link>

        <Link
          to="/payroll/history"
          className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs hover:border-[#f47b5b]/50 hover:shadow-sm transition-all group flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-[#fff0e8] flex items-center justify-center group-hover:bg-[#f47b5b]/20 transition-colors">
            <BarChart2 className="w-5 h-5 text-[#f47b5b]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#252525]">Payroll History</p>
            <p className="text-[11px] text-[#77716e] mt-0.5">View past payroll records</p>
          </div>
        </Link>
      </div>
    </PageContainer>
  );
}
