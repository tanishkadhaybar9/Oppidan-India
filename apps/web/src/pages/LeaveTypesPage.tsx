import { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { listLeaveTypes, createLeaveType, updateLeaveType } from "../services/leaveService";
import type { LeaveType } from "../types/leave";
import { PageContainer, PageHeader } from "../components/common";

export function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [defaultDaysPerYear, setDefaultDaysPerYear] = useState<number>(12);
  const [paid, setPaid] = useState<boolean>(true);
  const [allowHalfDay, setAllowHalfDay] = useState<boolean>(true);
  const [requiresApproval, setRequiresApproval] = useState<boolean>(true);
  const [allowCarryForward, setAllowCarryForward] = useState<boolean>(false);
  const [maxCarryForwardDays, setMaxCarryForwardDays] = useState<number>(0);
  const [minimumNoticeDays, setMinimumNoticeDays] = useState<number>(1);
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState<number>(14);
  const [allowNegativeBalance, setAllowNegativeBalance] = useState<boolean>(false);

  const loadLeaveTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listLeaveTypes(true); // include inactive
      if (res.data) {
        setLeaveTypes(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load leave types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaveTypes();
  }, [loadLeaveTypes]);

  const handleOpenCreate = () => {
    setEditingType(null);
    setName("");
    setCode("");
    setDescription("");
    setDefaultDaysPerYear(12);
    setPaid(true);
    setAllowHalfDay(true);
    setRequiresApproval(true);
    setAllowCarryForward(false);
    setMaxCarryForwardDays(0);
    setMinimumNoticeDays(1);
    setMaxConsecutiveDays(14);
    setAllowNegativeBalance(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: LeaveType) => {
    setEditingType(t);
    setName(t.name);
    setCode(t.code);
    setDescription(t.description || "");
    setDefaultDaysPerYear(t.maximumDays || t.defaultDaysPerYear || 12);
    setPaid(t.paid);
    setAllowHalfDay(t.allowHalfDay);
    setRequiresApproval(t.requiresApproval);
    setAllowCarryForward(t.allowCarryForward);
    setMaxCarryForwardDays(t.maxCarryForwardDays || 0);
    setMinimumNoticeDays(t.minimumNoticeDays);
    setMaxConsecutiveDays(t.maxConsecutiveDays || 14);
    setAllowNegativeBalance(t.allowNegativeBalance);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (t: LeaveType) => {
    const newStatus = t.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateLeaveType(t.id, { status: newStatus as any });
      setSuccess(`Leave type status changed to ${newStatus}.`);
      await loadLeaveTypes();
    } catch (err: any) {
      setError(err?.message || "Failed to toggle status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError("Please fill in Name and Code.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        defaultDaysPerYear: Number(defaultDaysPerYear),
        paid,
        allowHalfDay,
        requiresApproval,
        allowCarryForward,
        maxCarryForwardDays: allowCarryForward ? Number(maxCarryForwardDays) : 0,
        minimumNoticeDays: Number(minimumNoticeDays),
        maxConsecutiveDays: Number(maxConsecutiveDays),
        allowNegativeBalance,
      };

      if (editingType) {
        await updateLeaveType(editingType.id, payload);
        setSuccess("Leave type updated successfully.");
      } else {
        await createLeaveType(payload);
        setSuccess("Leave type created successfully.");
      }
      setIsModalOpen(false);
      await loadLeaveTypes();
    } catch (err: any) {
      setError(err?.message || "Failed to save leave type");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Leave Types Configuration"
        subtitle="Define organizational leave categories, quotas, carryover rules, and approval settings"
        icon={<Layers className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Leave", to: "/leave" },
          { label: "Leave Types" },
        ]}
        actions={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-sm font-semibold shadow-xs hover:opacity-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Leave Type
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

      {/* Grid of Leave Types */}
      {loading ? (
        <div className="py-16 text-center text-sm text-[#77716e]">
          Loading leave types...
        </div>
      ) : leaveTypes.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-[#eadbd2] text-center">
          <Layers className="w-12 h-12 text-[#eadbd2] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#252525]">No leave types configured</p>
          <p className="text-xs text-[#77716e] mt-1">
            Click &quot;Add Leave Type&quot; above to define annual, sick, or casual leaves.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {leaveTypes.map((t) => {
            const isActive = t.status === "ACTIVE";

            return (
              <div
                key={t.id}
                className="bg-white rounded-3xl border border-[#eadbd2] p-5 shadow-sm hover:border-[#f47b5b]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-[#252525]">{t.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#fff7f2] text-[#f47b5b] border border-[#eadbd2] inline-block mt-1">
                        {t.code}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-100 text-gray-500 border border-gray-200"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  {t.description && (
                    <p className="text-xs text-[#77716e] mt-2 line-clamp-2">
                      {t.description}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-[#eadbd2]/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#77716e] block text-[11px]">Annual Quota:</span>
                      <strong className="text-[#252525]">{t.maximumDays || t.defaultDaysPerYear || 12} Days</strong>
                    </div>
                    <div>
                      <span className="text-[#77716e] block text-[11px]">Type:</span>
                      <strong className={t.paid ? "text-emerald-600" : "text-amber-600"}>
                        {t.paid ? "Paid" : "Unpaid"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#77716e] block text-[11px]">Min Notice:</span>
                      <strong className="text-[#252525]">{t.minimumNoticeDays} Day(s)</strong>
                    </div>
                    <div>
                      <span className="text-[#77716e] block text-[11px]">Carry Forward:</span>
                      <strong className="text-[#252525]">
                        {t.allowCarryForward ? `Max ${t.maxCarryForwardDays || 0}d` : "No"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#eadbd2]/60 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(t)}
                    className="text-xs font-semibold text-[#77716e] hover:text-[#252525] flex items-center gap-1"
                  >
                    {isActive ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                        Active
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                        Inactive
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="px-3 py-1.5 rounded-xl border border-[#eadbd2] hover:bg-[#fff7f2] text-xs font-semibold text-[#252525] flex items-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#f47b5b]" />
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#eadbd2] animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#eadbd2]">
              <h3 className="font-bold text-lg text-[#252525]">
                {editingType ? "Edit Leave Type" : "Create Leave Type"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#77716e] hover:text-[#252525] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Leave Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Leave"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AL"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Purpose or eligibility notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Annual Quota *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={defaultDaysPerYear}
                    onChange={(e) => setDefaultDaysPerYear(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Min Notice (days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minimumNoticeDays}
                    onChange={(e) => setMinimumNoticeDays(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Max Consecutive
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxConsecutiveDays}
                    onChange={(e) => setMaxConsecutiveDays(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#eadbd2]/60">
                <label className="flex items-center gap-2 text-xs text-[#252525] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paid}
                    onChange={(e) => setPaid(e.target.checked)}
                    className="rounded border-[#eadbd2] text-[#f47b5b] focus:ring-[#f47b5b]"
                  />
                  <span>Paid Leave</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[#252525] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowHalfDay}
                    onChange={(e) => setAllowHalfDay(e.target.checked)}
                    className="rounded border-[#eadbd2] text-[#f47b5b] focus:ring-[#f47b5b]"
                  />
                  <span>Allow Half-Day Requests</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[#252525] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                    className="rounded border-[#eadbd2] text-[#f47b5b] focus:ring-[#f47b5b]"
                  />
                  <span>Requires Approval Workflow</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[#252525] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCarryForward}
                    onChange={(e) => setAllowCarryForward(e.target.checked)}
                    className="rounded border-[#eadbd2] text-[#f47b5b] focus:ring-[#f47b5b]"
                  />
                  <span>Allow Carry Forward to Next Period</span>
                </label>

                {allowCarryForward && (
                  <div className="pl-6 pt-1">
                    <label className="block text-[11px] font-semibold text-[#252525] mb-1">
                      Max Carry Forward Days
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={maxCarryForwardDays}
                      onChange={(e) => setMaxCarryForwardDays(Number(e.target.value))}
                      className="w-32 p-1.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 text-xs text-[#252525] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowNegativeBalance}
                    onChange={(e) => setAllowNegativeBalance(e.target.checked)}
                    className="rounded border-[#eadbd2] text-[#f47b5b] focus:ring-[#f47b5b]"
                  />
                  <span>Allow Negative Balance (Unrestricted)</span>
                </label>
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
                  {submitting ? "Saving..." : editingType ? "Update Type" : "Create Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
