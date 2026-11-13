import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  Play,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PageContainer, PageHeader } from "../components/common";
import { previewPayroll, processPayroll } from "../services/payrollService";
import { listDepartments } from "../services/employeeService";
import type { Department } from "../types/employee";
import type { PayrollPreviewItem } from "../types/payroll";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
  currentYear - 2,
  currentYear - 1,
  currentYear,
  currentYear + 1,
  currentYear + 2,
];

export function ProcessPayrollPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = ["OWNER", "HR"].includes(user?.role || "");

  const [step, setStep] = useState(1);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [previewItems, setPreviewItems] = useState<PayrollPreviewItem[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDepartments()
      .then((res) => {
        if (res.data?.departments) {
          setDepartments(res.data.departments);
        }
      })
      .catch(() => { });
  }, []);

  if (!canManage) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertTriangle size={40} className="text-red-400" />
          <p className="text-gray-500">You do not have permission to access this page.</p>
        </div>
      </PageContainer>
    );
  }

  const handlePreview = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await previewPayroll({
        month,
        year,
        departmentId: departmentId || undefined,
      });
      setPreviewItems(res.data?.items ?? []);
      setStep(2);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to load preview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const unprocessedItems = previewItems.filter((i) => !i.alreadyProcessed);

  const handleProcess = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await processPayroll({
        month,
        year,
        departmentId: departmentId || undefined,
      });
      setProcessedCount(res.data?.processed ?? unprocessedItems.length);
      setStep(3);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to process payroll. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setPreviewItems([]);
    setProcessedCount(0);
    setError(null);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <PageContainer>
      <PageHeader
        title="Process Payroll"
        subtitle="Calculate salaries, apply attendance deductions, and generate payslips"
      />

      {/* Step Indicator */}
      <div className="flex items-center gap-3 my-6">
        {[
          { num: 1, label: "Select Period" },
          { num: 2, label: "Preview & Review" },
          { num: 3, label: "Confirmation" },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center gap-2">
            {idx > 0 && <div className="w-8 h-px bg-gray-200" />}
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${step === s.num
                  ? "bg-[#f47b5b] text-white"
                  : step > s.num
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
            >
              {step > s.num ? "✓" : s.num}
            </div>
            <span
              className={`text-xs font-medium ${step === s.num ? "text-gray-800" : "text-gray-400"
                }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* STEP 1: Select Period */}
      {step === 1 && (
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs max-w-xl">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Choose Payroll Period</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Department (optional)
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePreview}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "#f47b5b" }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Loading Preview...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Preview Payroll</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Preview & Review */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                Payroll Preview — {MONTH_NAMES[month - 1]} {year}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {previewItems.length} employee(s) found · {unprocessedItems.length} ready to process
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border"
                style={{ borderColor: "#eadbd2", color: "#7c6050" }}
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
              <button
                onClick={handleProcess}
                disabled={loading || unprocessedItems.length === 0}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: "#f47b5b" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Confirm & Process ({unprocessedItems.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#eadbd2] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "#f8f4f1", borderBottom: "1px solid #eadbd2" }}>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Employee</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Dept & Role</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Days (W/P/A)</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Gross</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Deductions</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Net Pay</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewItems.map((item) => (
                    <tr
                      key={item.employeeId}
                      className={item.alreadyProcessed ? "opacity-50 bg-gray-50" : "hover:bg-orange-50/20"}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{item.employeeName}</div>
                        <div className="text-[10px] text-gray-400">{item.employeeCode}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{item.departmentName}</div>
                        <div className="text-[10px] text-gray-400">{item.designationName}</div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {item.workingDays} / {item.presentDays} / {item.absentDays}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">
                        {fmt(item.grossSalary)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-500">
                        -{fmt(item.totalDeductions)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#f47b5b]">
                        {fmt(item.netSalary)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.alreadyProcessed ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
                            Already Processed
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600">
                            Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Success Confirmation */}
      {step === 3 && (
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-8 shadow-xs max-w-lg mx-auto text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Payroll Processed Successfully!</h2>
          <p className="text-sm text-gray-500">
            Successfully generated <strong>{processedCount}</strong> payroll record(s) for{" "}
            {MONTH_NAMES[month - 1]} {year}.
          </p>
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate("/payroll/history")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white"
              style={{ background: "#f47b5b" }}
            >
              <span>View Payroll History</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-semibold border"
              style={{ background: "#f8f4f1", color: "#7c6050", border: "1px solid #eadbd2" }}
            >
              Process Another
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
