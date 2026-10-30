import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Calendar,
} from "lucide-react";
import {
  getEmployeeLeaveBalances,
  allocateLeaveBalance,
  listLeaveTypes,
} from "../services/leaveService";
import { listEmployees } from "../services/employeeService";
import type { LeaveBalance, LeaveType } from "../types/leave";
import type { EmployeeSummary } from "../types/employee";
import { PageContainer, PageHeader } from "../components/common";

export function LeaveBalancesPage() {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Allocate / Adjust Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formEmpId, setFormEmpId] = useState<string>("");
  const [formTypeId, setFormTypeId] = useState<string>("");
  const [periodStart, setPeriodStart] = useState<string>(
    () => `${new Date().getFullYear()}-01-01`
  );
  const [periodEnd, setPeriodEnd] = useState<string>(
    () => `${new Date().getFullYear()}-12-31`
  );
  const [allocatedDays, setAllocatedDays] = useState<number>(12);
  const [carriedForwardDays, setCarriedForwardDays] = useState<number>(0);
  const [adjustedDays, setAdjustedDays] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, typesRes] = await Promise.all([
        listEmployees({ limit: 100 }),
        listLeaveTypes(),
      ]);

      if (empRes.data?.employees) {
        setEmployees(empRes.data.employees);
        if (empRes.data.employees.length > 0) {
          setSelectedEmpId(empRes.data.employees[0]!.id);
        }
      }
      if (typesRes.data) {
        setLeaveTypes(typesRes.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load employees and leave types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const loadEmployeeBalances = useCallback(async (empId: string) => {
    if (!empId) return;
    try {
      const res = await getEmployeeLeaveBalances(empId);
      if (res.data) {
        setBalances(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load employee leave balances");
    }
  }, []);

  useEffect(() => {
    if (selectedEmpId) {
      loadEmployeeBalances(selectedEmpId);
    }
  }, [selectedEmpId, loadEmployeeBalances]);

  const handleOpenAllocate = () => {
    setFormEmpId(selectedEmpId || (employees[0]?.id || ""));
    setFormTypeId(leaveTypes[0]?.id || "");
    setAllocatedDays(leaveTypes[0]?.maximumDays || leaveTypes[0]?.defaultDaysPerYear || 12);
    setCarriedForwardDays(0);
    setAdjustedDays(0);
    setIsModalOpen(true);
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId || !formTypeId) {
      setError("Please select an employee and leave type.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await allocateLeaveBalance({
        employeeId: formEmpId,
        leaveTypeId: formTypeId,
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd).toISOString(),
        allocatedDays: Number(allocatedDays),
        carriedForwardDays: Number(carriedForwardDays),
        adjustedDays: Number(adjustedDays),
      });

      setSuccess("Leave balance allocated/adjusted successfully.");
      setIsModalOpen(false);
      if (formEmpId === selectedEmpId) {
        await loadEmployeeBalances(selectedEmpId);
      } else {
        setSelectedEmpId(formEmpId);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to allocate leave balance");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId);

  return (
    <PageContainer>
      <PageHeader
        title="Employee Leave Balances"
        subtitle="Manage annual allowances, carryovers, manual adjustments, and track consumption"
        icon={<Wallet className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Leave", to: "/leave" },
          { label: "Leave Balances" },
        ]}
        actions={
          <button
            onClick={handleOpenAllocate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-sm font-semibold shadow-xs hover:opacity-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Allocate / Adjust Balance
          </button>
        }
      />

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Employee Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#eadbd2] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Users className="w-4 h-4 text-[#f47b5b]" />
          <span className="text-xs font-semibold text-[#252525]">Select Employee:</span>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="p-2 text-xs rounded-xl border border-[#eadbd2] bg-[#fff7f2]/40 focus:outline-none focus:border-[#f47b5b] font-medium"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.employeeCode}) — {e.department?.name || "Unassigned"}
              </option>
            ))}
          </select>
        </div>

        {selectedEmployee && (
          <div className="text-xs text-[#77716e] flex items-center gap-2 self-start sm:self-auto">
            <span>Email: <strong>{selectedEmployee.email}</strong></span>
            <span>•</span>
            <span>Designation: <strong>{selectedEmployee.designation?.name || "N/A"}</strong></span>
          </div>
        )}
      </div>

      {/* Balances Display */}
      <div className="bg-white rounded-3xl border border-[#eadbd2] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#eadbd2] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#252525]">
              Balances for {selectedEmployee?.name || "Selected Employee"}
            </h2>
            <p className="text-xs text-[#77716e] mt-0.5">
              Current quotas, active reservations, and consumed leave days
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-[#77716e]">
            Loading balance data...
          </div>
        ) : balances.length === 0 ? (
          <div className="py-16 text-center">
            <Wallet className="w-10 h-10 text-[#eadbd2] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#252525]">No balances assigned</p>
            <p className="text-xs text-[#77716e] mt-1">
              Click &quot;Allocate / Adjust Balance&quot; above to set up allowances for this employee.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fff7f2] border-b border-[#eadbd2] text-[#77716e] font-semibold">
                <tr>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-center">Allocated</th>
                  <th className="py-3 px-4 text-center">Carried Fwd</th>
                  <th className="py-3 px-4 text-center">Adjusted</th>
                  <th className="py-3 px-4 text-center">Used</th>
                  <th className="py-3 px-4 text-center">Pending</th>
                  <th className="py-3 px-4 text-center">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadbd2]/60 text-[#252525]">
                {balances.map((b) => {
                  const available =
                    b.allocatedDays +
                    b.carriedForwardDays +
                    b.adjustedDays -
                    b.usedDays -
                    b.pendingDays;

                  return (
                    <tr key={b.id} className="hover:bg-[#fff7f2]/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#252525]">
                          {b.leaveType?.name}
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#fff7f2] text-[#f47b5b] border border-[#eadbd2]">
                          {b.leaveType?.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#77716e]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#77716e]" />
                          <span>
                            {new Date(b.periodStart).toLocaleDateString()} →{" "}
                            {new Date(b.periodEnd).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">{b.allocatedDays}</td>
                      <td className="py-3 px-4 text-center text-[#77716e]">{b.carriedForwardDays}</td>
                      <td className="py-3 px-4 text-center text-[#77716e]">{b.adjustedDays}</td>
                      <td className="py-3 px-4 text-center font-semibold text-[#f47b5b]">
                        {b.usedDays}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-amber-600">
                        {b.pendingDays}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-base text-emerald-600">
                        {available.toFixed(available % 1 === 0 ? 0 : 1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Allocate / Adjust Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#eadbd2] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#eadbd2]">
              <h3 className="font-bold text-lg text-[#252525]">Allocate / Adjust Balance</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#77716e] hover:text-[#252525] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllocateSubmit} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Employee *
                </label>
                <select
                  required
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Leave Type *
                </label>
                <select
                  required
                  value={formTypeId}
                  onChange={(e) => {
                    setFormTypeId(e.target.value);
                    const lt = leaveTypes.find((t) => t.id === e.target.value);
                    if (lt) setAllocatedDays(lt.maximumDays || lt.defaultDaysPerYear || 12);
                  }}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Period Start *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Period End *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Allocated Days *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={allocatedDays}
                    onChange={(e) => setAllocatedDays(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Carried Fwd
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={carriedForwardDays}
                    onChange={(e) => setCarriedForwardDays(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Adjusted
                  </label>
                  <input
                    type="number"
                    value={adjustedDays}
                    onChange={(e) => setAdjustedDays(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eadbd2]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#77716e] hover:text-[#252525] rounded-xl hover:bg-[#fff7f2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#f47b5b] hover:bg-[#d95d3d] rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Balance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
