import { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Loader2,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { getMyPayrolls } from "../services/payrollService";
import type { Payroll, PayrollStatus } from "../types/payroll";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_COLORS: Record<PayrollStatus, { bg: string; text: string; label: string }> = {
  DRAFT:     { bg: "#f1f5f9", text: "#64748b", label: "Draft" },
  PROCESSED: { bg: "#eff6ff", text: "#3b82f6", label: "Processed" },
  APPROVED:  { bg: "#fffbeb", text: "#f59e0b", label: "Approved" },
  PAID:      { bg: "#f0fdf4", text: "#22c55e", label: "Paid" },
  CANCELLED: { bg: "#fef2f2", text: "#ef4444", label: "Cancelled" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b last:border-0" style={{ borderColor: "#f8f4f1" }}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${bold ? "font-bold" : "text-gray-800"}`}>{value}</span>
    </div>
  );
}

export function PayslipPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getMyPayrolls()
      .then((res) => {
        if (res.data?.payrolls) {
          setPayrolls(res.data.payrolls);
        }
      })
      .catch((err: unknown) => {
        const e = err as { message?: string };
        setError(e.message || "Failed to load payslips.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => window.print();

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          aside, nav, [data-sidebar], header { display: none !important; }
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <PageContainer>
        <PageHeader
          title="My Payslips"
          subtitle="View and download your monthly salary statements and tax breakdowns"
        />

        {error && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-12 text-[#77716e] gap-2">
            <Loader2 className="animate-spin text-[#f47b5b]" size={20} />
            <span className="text-xs">Loading payslips...</span>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-12 text-center shadow-xs">
            <FileText size={36} className="text-[#eadbd2] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#252525]">No Payslips Available</p>
            <p className="text-xs text-[#77716e] mt-1">
              Your payslips will appear here once payroll is processed for your account.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payrolls.map((p) => {
              const sc = STATUS_COLORS[p.status] ?? STATUS_COLORS.DRAFT;
              const isExp = expanded === p.id;
              const monthName = MONTH_NAMES[p.month - 1] ?? p.month;

              return (
                <div
                  key={p.id}
                  className="bg-white border border-[#eadbd2] rounded-2xl shadow-xs overflow-hidden transition-all"
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => setExpanded(isExp ? null : p.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-orange-50/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "#fff0e8", color: "#f47b5b" }}
                      >
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800">
                            {monthName} {p.year}
                          </span>
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ background: sc.bg, color: sc.text }}
                          >
                            {sc.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">{p.payrollCode}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-gray-400">Net Pay</div>
                        <div className="text-base font-bold text-[#f47b5b]">{fmt(p.netSalary)}</div>
                      </div>
                      <span className="text-xs text-gray-400">{isExp ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* Expanded Payslip Details */}
                  {isExp && (
                    <div className="border-t border-[#eadbd2] p-6 space-y-6 bg-white">
                      {/* Payslip Header (for print) */}
                      <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                        <div>
                          <div className="text-base font-bold text-gray-800">
                            PAYSLIP FOR {monthName.toUpperCase()} {p.year}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Code: {p.payrollCode} · Generated on{" "}
                            {p.processedAt ? new Date(p.processedAt).toLocaleDateString() : "—"}
                          </div>
                        </div>
                        <button
                          onClick={handlePrint}
                          className="no-print flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                          style={{ background: "#f47b5b" }}
                        >
                          <Download size={13} />
                          <span>Print / Save PDF</span>
                        </button>
                      </div>

                      {/* Employee & Attendance Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#f8f4f1] text-xs">
                        <div>
                          <div className="text-gray-400">Employee</div>
                          <div className="font-semibold text-gray-800 mt-0.5">
                            {p.employee?.name}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Employee Code</div>
                          <div className="font-semibold text-gray-800 mt-0.5">
                            {p.employee?.employeeCode}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Department</div>
                          <div className="font-semibold text-gray-800 mt-0.5">
                            {p.employee?.department?.name ?? "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Designation</div>
                          <div className="font-semibold text-gray-800 mt-0.5">
                            {p.employee?.designation?.name ?? "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Working Days</div>
                          <div className="font-semibold text-gray-800 mt-0.5">{p.workingDays}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Present Days</div>
                          <div className="font-semibold text-emerald-600 mt-0.5">
                            {p.presentDays}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Paid Leaves</div>
                          <div className="font-semibold text-blue-600 mt-0.5">{p.paidLeaveDays}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Absent Days</div>
                          <div className="font-semibold text-red-500 mt-0.5">{p.absentDays}</div>
                        </div>
                      </div>

                      {/* Earnings vs Deductions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Earnings */}
                        <div className="p-4 rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3">
                            Earnings
                          </h4>
                          <div className="space-y-1">
                            <Row label="Basic Salary" value={fmt(p.basicSalary)} />
                            <Row label="HRA" value={fmt(p.hra)} />
                            <Row label="Conveyance Allowance" value={fmt(p.conveyance)} />
                            <Row label="Medical Allowance" value={fmt(p.medical)} />
                            <Row label="Special Allowance" value={fmt(p.special)} />
                            <Row label="Other Allowances" value={fmt(p.otherAllowances)} />
                            <Row label="Total Gross Earnings" value={fmt(p.grossSalary)} bold />
                          </div>
                        </div>

                        {/* Deductions */}
                        <div className="p-4 rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-3">
                            Deductions
                          </h4>
                          <div className="space-y-1">
                            <Row label="Provident Fund (Employee)" value={fmt(p.pfEmployee)} />
                            <Row label="Professional Tax (PT)" value={fmt(p.professionalTax)} />
                            <Row label="TDS / Income Tax" value={fmt(p.tds)} />
                            <Row label="Other Deductions" value={fmt(p.otherDeductions)} />
                            <Row label="Total Deductions" value={fmt(p.totalDeductions)} bold />
                          </div>
                        </div>
                      </div>

                      {/* Net Pay Banner */}
                      <div
                        className="flex justify-between items-center p-4 rounded-xl"
                        style={{ background: "#fff0e8" }}
                      >
                        <div>
                          <div className="text-xs text-gray-500">Take-Home Pay (Net Salary)</div>
                          <div className="text-xl font-bold text-[#f47b5b] mt-0.5">
                            {fmt(p.netSalary)}
                          </div>
                        </div>
                        {p.paymentDate && (
                          <div className="text-right text-xs text-gray-500">
                            <div>Paid on {new Date(p.paymentDate).toLocaleDateString()}</div>
                            {p.paymentMethod && <div>via {p.paymentMethod}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>
    </>
  );
}
