import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit2,
  Loader2,
  Building2,
  Users,
  X,
  Save,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PageContainer, PageHeader } from "../components/common";
import { listSalaryStructures, updateSalaryStructure } from "../services/payrollService";
import { listDepartments } from "../services/employeeService";
import type { SalaryStructure, UpdateSalaryStructurePayload, SalaryFrequency } from "../types/payroll";
import type { Department } from "../types/employee";

function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function SalaryStructuresPage() {
  const { user } = useAuth();
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [deptFilter, setDeptFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<SalaryStructure | null>(null);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateSalaryStructurePayload>({});

  const canManage = ["OWNER", "HR"].includes(user?.role || "");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, deptRes] = await Promise.all([
        listSalaryStructures({
          search: search || undefined,
          departmentId: deptFilter || undefined,
          status: statusFilter || undefined,
        }),
        listDepartments().catch(() => ({ data: { departments: [] } })),
      ]);

      if (res.data) {
        setStructures(res.data.salaryStructures || []);
      }
      if (deptRes.data?.departments) {
        setDepartments(deptRes.data.departments);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to load salary structures.");
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openEditModal = (item: SalaryStructure) => {
    setEditingItem(item);
    setEditSuccess(null);
    setEditForm({
      basicSalary: item.basicSalary,
      hra: item.hra,
      conveyance: item.conveyance,
      medical: item.medical,
      special: item.special,
      otherAllowances: item.otherAllowances,
      pfEmployee: item.pfEmployee,
      pfEmployer: item.pfEmployer,
      professionalTax: item.professionalTax,
      tds: item.tds,
      otherDeductions: item.otherDeductions,
      frequency: item.frequency,
      status: item.status,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setSavingEdit(true);
    setError(null);
    try {
      await updateSalaryStructure(editingItem.id, editForm);
      setEditSuccess("Salary structure updated successfully!");
      setTimeout(() => {
        setEditingItem(null);
        loadData();
      }, 1000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to update salary structure.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Calculation for edit modal preview
  const editGross =
    (editForm.basicSalary || 0) +
    (editForm.hra || 0) +
    (editForm.conveyance || 0) +
    (editForm.medical || 0) +
    (editForm.special || 0) +
    (editForm.otherAllowances || 0);

  const editTotalDeductions =
    (editForm.pfEmployee || 0) +
    (editForm.professionalTax || 0) +
    (editForm.tds || 0) +
    (editForm.otherDeductions || 0);

  const editNet = Math.max(0, editGross - editTotalDeductions);

  return (
    <PageContainer>
      <PageHeader
        title="Salary Structures"
        subtitle="Manage employee compensation components, allowances, and statutory deductions"
        actions={
          canManage ? (
            <Link
              to="/payroll/salary-structures/create"
              className="flex items-center gap-2 px-4 py-2 bg-[#f47b5b] hover:bg-[#e06847] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Structure</span>
            </Link>
          ) : undefined
        }
      />

      {/* Filter Bar */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 mb-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b] transition-colors"
            />
          </div>

          <div className="relative">
            <Building2 className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b] transition-colors appearance-none"
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b] transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-[#77716e]">
            <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b] mb-2" />
            <span className="text-sm">Loading salary structures...</span>
          </div>
        ) : structures.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-[#77716e]">
            <Users className="w-12 h-12 text-[#eadbd2] mb-3" />
            <h3 className="text-base font-semibold text-[#252525] mb-1">No Salary Structures Found</h3>
            <p className="text-sm text-[#77716e] mb-4 text-center max-w-sm">
              No salary structures have been defined yet or none matched your current filter criteria.
            </p>
            {canManage && (
              <Link
                to="/payroll/salary-structures/create"
                className="px-4 py-2 bg-[#f47b5b] text-white text-sm font-semibold rounded-xl shadow-xs hover:bg-[#e06847] transition-colors"
              >
                Define First Structure
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f4f1] border-b border-[#eadbd2] text-[11px] font-semibold text-[#77716e] uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department / Role</th>
                  <th className="py-3 px-4 text-right">Basic</th>
                  <th className="py-3 px-4 text-right">Gross</th>
                  <th className="py-3 px-4 text-right">Net</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4">Status</th>
                  {canManage && <th className="py-3 px-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadbd2] text-sm">
                {structures.map((s) => (
                  <tr key={s.id} className="hover:bg-[#fff9f6] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#252525]">
                        {s.employee?.name || "Unknown"}
                      </div>
                      <div className="text-xs text-[#77716e] font-mono">
                        {s.employee?.employeeCode || "—"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[#252525] text-xs font-medium">
                        {s.employee?.department?.name || "—"}
                      </div>
                      <div className="text-[11px] text-[#77716e]">
                        {s.employee?.designation?.name || "—"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-[#252525]">
                      {formatINR(s.basicSalary)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#252525]">
                      {formatINR(s.grossSalary)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#f47b5b]">
                      {formatINR(s.netSalary)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        {s.frequency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#77716e]">
                      {s.effectiveFrom ? new Date(s.effectiveFrom).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                          s.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-[#77716e] hover:text-[#f47b5b] hover:bg-[#fff0e8] rounded-lg transition-colors"
                          title="Edit Structure"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#eadbd2] shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-[#eadbd2] bg-[#f8f4f1]">
              <div>
                <h3 className="text-base font-bold text-[#252525]">Edit Salary Structure</h3>
                <p className="text-xs text-[#77716e]">
                  {editingItem.employee?.name} ({editingItem.employee?.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg text-[#77716e] hover:bg-[#eadbd2]/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {editSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{editSuccess}</span>
                </div>
              )}

              {/* Status and Frequency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Frequency
                  </label>
                  <select
                    value={editForm.frequency || "MONTHLY"}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        frequency: e.target.value as SalaryFrequency,
                      }))
                    }
                    className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                  >
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="BI_WEEKLY">BI_WEEKLY</option>
                    <option value="WEEKLY">WEEKLY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">Status</label>
                  <select
                    value={editForm.status || "ACTIVE"}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Earnings Components */}
              <div>
                <h4 className="text-xs font-bold text-[#f47b5b] uppercase tracking-wider mb-2">
                  Earnings Components (₹)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#77716e] mb-1 font-medium">Basic</label>
                    <input
                      type="number"
                      value={editForm.basicSalary || 0}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, basicSalary: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#77716e] mb-1 font-medium">HRA</label>
                    <input
                      type="number"
                      value={editForm.hra || 0}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, hra: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#77716e] mb-1 font-medium">Conveyance</label>
                    <input
                      type="number"
                      value={editForm.conveyance || 0}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, conveyance: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#77716e] mb-1 font-medium">Medical</label>
                    <input
                      type="number"
                      value={editForm.medical || 0}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, medical: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#77716e] mb-1 font-medium">Special</label>
                    <input
                      type="number"
                      value={editForm.special || 0}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, special: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#77716e] mb-1 font-medium">Other</label>
                    <input
                      type="number"
                      value={editForm.otherAllowances || 0}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, otherAllowances: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions Components */}
              <div>
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">
                  Deductions Components (₹)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#77716e] mb-1 font-medium">PF (Employee)</label>
                    <input
                      type="number"
                      value={editForm.pfEmployee || 0}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, pfEmployee: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#77716e] mb-1 font-medium">Prof Tax (PT)</label>
                    <input
                      type="number"
                      value={editForm.professionalTax || 0}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, professionalTax: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#77716e] mb-1 font-medium">TDS</label>
                    <input
                      type="number"
                      value={editForm.tds || 0}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, tds: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#77716e] mb-1 font-medium">Other</label>
                    <input
                      type="number"
                      value={editForm.otherDeductions || 0}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, otherDeductions: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Summary */}
              <div className="bg-[#fff7f2] border border-[#eadbd2] rounded-xl p-4 flex justify-between items-center text-sm">
                <div>
                  <span className="text-xs text-[#77716e] block">Calculated Gross</span>
                  <span className="font-bold text-[#252525]">{formatINR(editGross)}</span>
                </div>
                <div>
                  <span className="text-xs text-[#77716e] block">Total Deductions</span>
                  <span className="font-bold text-red-600">-{formatINR(editTotalDeductions)}</span>
                </div>
                <div>
                  <span className="text-xs text-[#77716e] block">Calculated Net</span>
                  <span className="font-bold text-[#f47b5b] text-base">{formatINR(editNet)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#f8f4f1] border-t border-[#eadbd2] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border border-[#eadbd2] bg-white text-[#77716e] hover:bg-[#f8f4f1] text-sm font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex items-center gap-2 px-5 py-2 bg-[#f47b5b] hover:bg-[#e06847] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {savingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

