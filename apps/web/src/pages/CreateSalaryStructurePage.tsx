import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Loader2, DollarSign, Users, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PageContainer, PageHeader } from "../components/common";
import { createSalaryStructure } from "../services/payrollService";
import { listEmployees } from "../services/employeeService";
import type { EmployeeSummary } from "../types/employee";
import type { SalaryFrequency } from "../types/payroll";

function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function CreateSalaryStructurePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [employeeId, setEmployeeId] = useState<string>("");
  const [frequency, setFrequency] = useState<SalaryFrequency>("MONTHLY");
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Earnings
  const [basicSalary, setBasicSalary] = useState<number>(30000);
  const [hra, setHra] = useState<number>(12000);
  const [conveyance, setConveyance] = useState<number>(1600);
  const [medical, setMedical] = useState<number>(1250);
  const [special, setSpecial] = useState<number>(5150);
  const [otherAllowances, setOtherAllowances] = useState<number>(0);

  // Deductions
  const [pfEmployee, setPfEmployee] = useState<number>(1800);
  const [pfEmployer, setPfEmployer] = useState<number>(1800);
  const [professionalTax, setProfessionalTax] = useState<number>(200);
  const [tds, setTds] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);

  const canManage = ["OWNER", "HR"].includes(user?.role || "");

  useEffect(() => {
    async function fetchEmployees() {
      setLoadingEmployees(true);
      try {
        const res = await listEmployees({ limit: 100 });
        if (res.data?.employees) {
          setEmployees(res.data.employees);
        }
      } catch (err: unknown) {
        console.error("Failed to load employees:", err);
      } finally {
        setLoadingEmployees(false);
      }
    }
    fetchEmployees();
  }, []);

  // Calculated totals
  const grossSalary =
    (basicSalary || 0) +
    (hra || 0) +
    (conveyance || 0) +
    (medical || 0) +
    (special || 0) +
    (otherAllowances || 0);

  const totalDeductions =
    (pfEmployee || 0) +
    (professionalTax || 0) +
    (tds || 0) +
    (otherDeductions || 0);

  const netSalary = Math.max(0, grossSalary - totalDeductions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }
    if (basicSalary <= 0) {
      setError("Basic salary must be greater than zero.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createSalaryStructure({
        employeeId,
        basicSalary,
        hra,
        conveyance,
        medical,
        special,
        otherAllowances,
        pfEmployee,
        pfEmployer,
        professionalTax,
        tds,
        otherDeductions,
        frequency,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : undefined,
      });
      navigate("/payroll/salary-structures");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to create salary structure.");
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <PageContainer>
        <div className="p-8 text-center bg-white border border-[#eadbd2] rounded-2xl shadow-xs">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#252525]">Access Restricted</h2>
          <p className="text-sm text-[#77716e] mt-1 mb-4">
            Only HR and Owners are authorized to define salary structures.
          </p>
          <Link
            to="/payroll/dashboard"
            className="px-4 py-2 bg-[#f47b5b] text-white text-sm font-semibold rounded-xl"
          >
            Go to Dashboard
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-4">
        <Link
          to="/payroll/salary-structures"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#77716e] hover:text-[#f47b5b] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Salary Structures</span>
        </Link>
      </div>

      <PageHeader
        title="Create Salary Structure"
        subtitle="Configure base compensation, standard allowances, and deductions for an employee"
      />

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Configuration */}
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-[#252525] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#f47b5b]" />
            <span>Employee & Tenure</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={loadingEmployees}
                required
                className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
              >
                <option value="">
                  {loadingEmployees ? "Loading employees..." : "Select Employee"}
                </option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeCode}) — {emp.department?.name || "General"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Payment Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as SalaryFrequency)}
                className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="BI_WEEKLY">Bi-Weekly</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Effective From <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
              />
            </div>
          </div>
        </div>

        {/* Two-Column Earnings & Deductions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings (Allowances) */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#eadbd2]">
                <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Earnings / Allowances (₹)</span>
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Gross: {formatINR(grossSalary)}
                </span>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#252525] mb-1">
                    Basic Salary <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#252525] mb-1">
                    House Rent Allowance (HRA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={hra}
                    onChange={(e) => setHra(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#252525] mb-1">
                    Conveyance Allowance
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={conveyance}
                    onChange={(e) => setConveyance(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#252525] mb-1">
                    Medical Allowance
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={medical}
                    onChange={(e) => setMedical(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#252525] mb-1">
                    Special Allowance
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={special}
                    onChange={(e) => setSpecial(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#252525] mb-1">
                    Other Allowances
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={otherAllowances}
                    onChange={(e) => setOtherAllowances(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#eadbd2] flex justify-between items-center text-sm font-semibold">
              <span className="text-[#77716e]">Total Gross Earnings:</span>
              <span className="text-emerald-700 text-base">{formatINR(grossSalary)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#eadbd2]">
                <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-red-500" />
                  <span>Statutory Deductions (₹)</span>
                </h3>
                <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                  Deductions: -{formatINR(totalDeductions)}
                </span>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#252525] mb-1">
                    PF — Employee Contribution
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pfEmployee}
                    onChange={(e) => setPfEmployee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#252525] mb-1">
                    PF — Employer Contribution (info)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pfEmployer}
                    onChange={(e) => setPfEmployer(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#252525] mb-1">
                    Professional Tax (PT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={professionalTax}
                    onChange={(e) => setProfessionalTax(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#252525] mb-1">
                    Tax Deducted at Source (TDS)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tds}
                    onChange={(e) => setTds(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#252525] mb-1">
                    Other Statutory Deductions
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={otherDeductions}
                    onChange={(e) => setOtherDeductions(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#eadbd2] flex justify-between items-center text-sm font-semibold">
              <span className="text-[#77716e]">Total Deductions:</span>
              <span className="text-red-600 text-base">-{formatINR(totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Final Take-Home Net Salary Banner */}
        <div className="bg-[#fff0e8] border border-[#eadbd2] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div>
            <h4 className="text-xs font-bold text-[#f47b5b] uppercase tracking-wider">
              Calculated Net Pay (Take Home)
            </h4>
            <p className="text-2xl font-extrabold text-[#252525] mt-1">
              {formatINR(netSalary)}{" "}
              <span className="text-xs font-normal text-[#77716e]">/ {frequency.toLowerCase()}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/payroll/salary-structures")}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-white border border-[#eadbd2] hover:bg-[#f8f4f1] text-[#77716e] text-sm font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-[#f47b5b] hover:bg-[#e06847] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Structure...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Structure</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}

