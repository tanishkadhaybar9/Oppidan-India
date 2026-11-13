import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Loader2,
  Calendar,
  Search,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PageContainer, PageHeader } from "../components/common";
import { listPayrolls, updatePayrollStatus } from "../services/payrollService";
import type { Payroll, PayrollStatus } from "../types/payroll";
import { listDepartments } from "../services/employeeService";
import type { Department } from "../types/employee";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_COLORS: Record<PayrollStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "#f1f5f9", text: "#64748b", label: "Draft" },
  PROCESSED: { bg: "#eff6ff", text: "#3b82f6", label: "Processed" },
  APPROVED: { bg: "#fffbeb", text: "#f59e0b", label: "Approved" },
  PAID: { bg: "#f0fdf4", text: "#22c55e", label: "Paid" },
  CANCELLED: { bg: "#fef2f2", text: "#ef4444", label: "Cancelled" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

export function PayrollHistoryPage() {
  const { user } = useAuth();
  const canManage = ["OWNER", "HR"].includes(user?.role || "");

  // Filters
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Load departments
  useEffect(() => {
    listDepartments()
      .then((res) => {
        if (res.data?.departments) {
          setDepartments(res.data.departments);
        }
      })
      .catch(() => { });
  }, []);

  const fetchPayrolls = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page: p, limit };
      if (month) params.month = Number(month);
      if (year) params.year = Number(year);
      if (departmentId) params.departmentId = departmentId;
      if (status) params.status = status;
      if (search) params.search = search;
      const res = await listPayrolls(params);
      if (res.data) {
        setPayrolls(res.data.payrolls || []);
        setTotal(res.data.total ?? res.data.payrolls.length);
        setPage(p);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to load payroll records.");
    } finally {
      setLoading(false);
    }
  }, [month, year, departmentId, status, search, limit]);

  useEffect(() => {
    fetchPayrolls(1);
  }, [fetchPayrolls]);

  const handleStatusUpdate = async (payrollId: string, newStatus: PayrollStatus) => {
    setActionLoading(payrollId);
    setOpenDropdown(null);
    try {
      await updatePayrollStatus(payrollId, newStatus);
      await fetchPayrolls(page);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = () => {
    if (payrolls.length === 0) return;
    const headers = [
      "Payroll Code",
      "Employee",
      "Code",
      "Department",
      "Month",
      "Year",
      "Basic",
      "Gross",
      "Deductions",
      "Net",
      "Status",
    ];
    const rows = payrolls.map((p) => [
      p.payrollCode,
      p.employee?.name ?? "",
      p.employee?.employeeCode ?? "",
      p.employee?.department?.name ?? "",
      MONTH_NAMES[p.month - 1] ?? p.month,
      p.year,
      p.basicSalary,
      p.grossSalary,
      p.totalDeductions,
      p.netSalary,
      p.status,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-history-${year || "all"}-${month || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <PageContainer>
      <PageHeader
        title="Payroll History"
        subtitle="View and manage processed payrolls across all pay periods"
        actions={
          <button
            onClick={handleExportCSV}
            disabled={payrolls.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: "#f47b5b" }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        }
      />

      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 mb-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-xs focus:outline-none focus:border-[#f47b5b]"
            />
          </div>

          <div>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-xs focus:outline-none focus:border-[#f47b5b]"
            >
              <option value="">All Months</option>
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-xs focus:outline-none focus:border-[#f47b5b]"
            >
              <option value="">All Years</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-xs focus:outline-none focus:border-[#f47b5b]"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-xs focus:outline-none focus:border-[#f47b5b]"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PROCESSED">Processed</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-[#77716e] gap-2">
            <Loader2 className="animate-spin text-[#f47b5b]" size={20} />
            <span className="text-xs">Loading payroll records...</span>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-[#77716e] gap-2">
            <Calendar size={32} className="text-[#eadbd2]" />
            <p className="text-sm font-semibold text-[#252525]">No Payroll Records Found</p>
            <p className="text-xs text-[#77716e]">Try adjusting the filter options above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "#f8f4f1", borderBottom: "1px solid #eadbd2" }}>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Payroll Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Employee</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Department</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Period</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Basic</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Gross</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Deductions</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Net Pay</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  {canManage && (
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payrolls.map((p) => {
                  const sc = STATUS_COLORS[p.status] ?? STATUS_COLORS.DRAFT;
                  const isActioning = actionLoading === p.id;
                  const isOpen = openDropdown === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-gray-700">
                        {p.payrollCode}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{p.employee?.name ?? "—"}</div>
                        <div className="text-[10px] text-gray-400">
                          {p.employee?.employeeCode ?? ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.employee?.department?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {MONTH_NAMES[p.month - 1]} {p.year}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{fmt(p.basicSalary)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">
                        {fmt(p.grossSalary)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-500">
                        -{fmt(p.totalDeductions)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#f47b5b]">
                        {fmt(p.netSalary)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: sc.bg, color: sc.text }}
                        >
                          {sc.label}
                        </span>
                      </td>

                      {canManage && (
                        <td className="px-4 py-3 text-center relative">
                          <button
                            onClick={() => setOpenDropdown(isOpen ? null : p.id)}
                            disabled={isActioning}
                            className="px-2 py-1 rounded-lg text-[11px] font-medium border hover:bg-gray-50 transition-colors"
                            style={{ borderColor: "#eadbd2", color: "#7c6050" }}
                          >
                            {isActioning ? (
                              <Loader2 className="animate-spin inline" size={12} />
                            ) : (
                              "Update ▾"
                            )}
                          </button>

                          {isOpen && (
                            <div
                              className="absolute right-4 top-8 z-20 bg-white border border-[#eadbd2] rounded-xl shadow-lg p-1 text-left min-w-[120px]"
                            >
                              {p.status === "PROCESSED" && (
                                <button
                                  onClick={() => handleStatusUpdate(p.id, "APPROVED")}
                                  className="w-full text-left px-3 py-1.5 text-[11px] rounded-lg hover:bg-amber-50 text-amber-700 font-medium"
                                >
                                  Approve
                                </button>
                              )}
                              {(p.status === "PROCESSED" || p.status === "APPROVED") && (
                                <button
                                  onClick={() => handleStatusUpdate(p.id, "PAID")}
                                  className="w-full text-left px-3 py-1.5 text-[11px] rounded-lg hover:bg-emerald-50 text-emerald-700 font-medium"
                                >
                                  Mark Paid
                                </button>
                              )}
                              {p.status !== "PAID" && p.status !== "CANCELLED" && (
                                <button
                                  onClick={() => handleStatusUpdate(p.id, "CANCELLED")}
                                  className="w-full text-left px-3 py-1.5 text-[11px] rounded-lg hover:bg-red-50 text-red-700 font-medium"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#eadbd2] text-xs text-gray-500">
            <span>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} records
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => fetchPayrolls(page - 1)}
                className="px-2.5 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
                style={{ borderColor: "#eadbd2" }}
              >
                ← Prev
              </button>
              <span className="px-2 font-medium">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchPayrolls(page + 1)}
                className="px-2.5 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
                style={{ borderColor: "#eadbd2" }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
