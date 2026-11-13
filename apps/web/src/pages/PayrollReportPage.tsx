import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Printer,
  DollarSign,
  Loader2,
  Search,
  Filter,
  Building2,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { getPayrollReport } from "../services/reportsService";
import { listDepartments } from "../services/employeeService";
import type { PayrollReportData } from "../types/reports";
import type { Department } from "../types/employee";

function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

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

export function PayrollReportPage() {
  const [data, setData] = useState<PayrollReportData | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [year, setYear] = useState<number | undefined>(undefined);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, deptRes] = await Promise.all([
        getPayrollReport({
          month: month || undefined,
          year: year || undefined,
          departmentId: departmentId || undefined,
          status: status || undefined,
        }),
        listDepartments().catch(() => ({ data: { departments: [] } })),
      ]);

      if (res.data) {
        setData(res.data);
      }
      if (deptRes.data?.departments) {
        setDepartments(deptRes.data.departments);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to load payroll report.");
    } finally {
      setLoading(false);
    }
  }, [month, year, departmentId, status]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const filteredRecords = (data?.records || []).filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.employeeName.toLowerCase().includes(q) ||
      r.employeeCode.toLowerCase().includes(q) ||
      r.payrollCode.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (!data || !filteredRecords.length) return;
    const headers = [
      "Payroll Code",
      "Employee Code",
      "Employee Name",
      "Department",
      "Month",
      "Year",
      "Basic Pay (INR)",
      "Gross Pay (INR)",
      "Deductions (INR)",
      "Net Pay (INR)",
      "Status",
      "Payment Method",
      "Payment Date",
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.payrollCode}"`,
      `"${r.employeeCode}"`,
      `"${r.employeeName}"`,
      `"${r.department}"`,
      `"${r.month}"`,
      `"${r.year}"`,
      `"${r.basicSalary}"`,
      `"${r.grossSalary}"`,
      `"${r.totalDeductions}"`,
      `"${r.netSalary}"`,
      `"${r.status}"`,
      `"${r.paymentMethod || "—"}"`,
      `"${r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : "—"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `payroll-summary-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageContainer>
      <PageHeader
        title="Payroll & Compensation Audit Report"
        subtitle="Historical disbursement logs, tax liabilities, gross-to-net variances, and department cost distributions"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#eadbd2] hover:bg-[#f8f4f1] text-[#77716e] text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!filteredRecords.length}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#f47b5b] hover:bg-[#e06847] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Net Payout
            </span>
            <div className="text-xl font-bold text-[#f47b5b] truncate">
              {formatINR(data.summary.totalPayrollAmount)}
            </div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Gross Expense
            </span>
            <div className="text-xl font-bold text-[#252525] truncate">
              {formatINR(data.summary.totalGrossAmount)}
            </div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Deductions
            </span>
            <div className="text-xl font-bold text-red-600 truncate">
              -{formatINR(data.summary.totalDeductions)}
            </div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Paid Slips
            </span>
            <div className="text-2xl font-bold text-emerald-700">{data.summary.paidCount}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Processed
            </span>
            <div className="text-2xl font-bold text-blue-600">{data.summary.processedCount}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Draft
            </span>
            <div className="text-2xl font-bold text-gray-500">{data.summary.draftCount}</div>
          </div>
        </div>
      )}

      {/* Department-wise Payroll Allocation */}
      {data?.summary && data.summary.byDepartment.length > 0 && (
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs mb-6">
          <h4 className="text-xs font-bold text-[#252525] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#f47b5b]" />
            <span>Departmental Payroll Distribution</span>
          </h4>
          <div className="space-y-3">
            {data.summary.byDepartment.map((d) => {
              const maxAmount = Math.max(...data.summary.byDepartment.map((x) => x.amount), 1);
              const pct = (d.amount / maxAmount) * 100;
              return (
                <div key={d.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#252525]">{d.name}</span>
                    <span className="font-bold text-[#f47b5b]">{formatINR(d.amount)}</span>
                  </div>
                  <div className="h-2 bg-[#f8f4f1] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f47b5b] rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 mb-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee, slip code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
            />
          </div>

          <div>
            <select
              value={month || ""}
              onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
            >
              <option value="">All Months</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={year || ""}
              onChange={(e) => setYear(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
            >
              <option value="">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          <div className="relative">
            <Building2 className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b] appearance-none"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b] appearance-none"
            >
              <option value="">All Payroll Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="PROCESSED">PROCESSED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PAID">PAID</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-[#77716e]">
            <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b] mb-2" />
            <span className="text-sm">Calculating payroll distributions...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-[#77716e]">
            <DollarSign className="w-12 h-12 text-[#eadbd2] mb-3" />
            <h3 className="text-base font-semibold text-[#252525] mb-1">No Payroll Logs Found</h3>
            <p className="text-sm text-[#77716e] max-w-sm text-center">
              No payroll items match the filter selections.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f4f1] border-b border-[#eadbd2] text-[11px] font-semibold text-[#77716e] uppercase tracking-wider">
                  <th className="py-3 px-4">Slip Code</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-right">Basic</th>
                  <th className="py-3 px-4 text-right">Gross</th>
                  <th className="py-3 px-4 text-right">Deductions</th>
                  <th className="py-3 px-4 text-right">Net Payout</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadbd2] text-sm">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#fff9f6] transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-rose-700">
                      {r.payrollCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#252525]">{r.employeeName}</div>
                      <div className="text-xs text-[#77716e] font-mono">{r.employeeCode}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-[#252525]">
                      {r.department}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#77716e]">
                      {MONTHS.find((m) => m.value === r.month)?.label.slice(0, 3)} {r.year}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[#252525]">
                      {formatINR(r.basicSalary)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[#252525]">
                      {formatINR(r.grossSalary)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-red-600">
                      -{formatINR(r.totalDeductions)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#f47b5b]">
                      {formatINR(r.netSalary)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          r.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : r.status === "APPROVED"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : r.status === "PROCESSED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

