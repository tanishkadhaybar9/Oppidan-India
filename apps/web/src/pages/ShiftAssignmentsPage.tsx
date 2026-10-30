import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Users,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import {
  listShiftAssignments,
  createShiftAssignment,
  listShifts,
} from "../services/attendanceService";
import { listEmployees, listDepartments } from "../services/employeeService";
import type { Shift, ShiftAssignment } from "../types/attendance";
import type { EmployeeSummary, Department } from "../types/employee";

export function ShiftAssignmentsPage() {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("");

  // Assign Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    () => new Date().toISOString().split("T")[0]!
  );
  const [effectiveTo, setEffectiveTo] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignRes, shiftRes, empRes, deptRes] = await Promise.all([
        listShiftAssignments(),
        listShifts(),
        listEmployees({ limit: 100 }),
        listDepartments(),
      ]);

      if (assignRes.data?.assignments) {
        setAssignments(assignRes.data.assignments);
      }
      if (shiftRes.data?.shifts) {
        setShifts(shiftRes.data.shifts);
      }
      if (empRes.data?.employees) {
        setEmployees(empRes.data.employees);
      }
      if (deptRes.data?.departments) {
        setDepartments(deptRes.data.departments);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load shift assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !selectedShiftId || !effectiveFrom) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createShiftAssignment({
        employeeId: selectedEmpId,
        shiftId: selectedShiftId,
        effectiveFrom,
        effectiveTo: effectiveTo || undefined,
      });
      setSuccess("Shift assigned successfully.");
      setIsModalOpen(false);
      setSelectedEmpId("");
      setSelectedShiftId("");
      setEffectiveTo("");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to assign shift");
    } finally {
      setSaving(false);
    }
  };

  const filteredAssignments = assignments.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employee?.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShift = !selectedShiftFilter || item.shiftId === selectedShiftFilter;
    const matchesDept = !selectedDeptFilter || item.employee?.department?.id === selectedDeptFilter;
    return matchesSearch && matchesShift && matchesDept;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Shift Assignments"
        subtitle="Map employees to specific work shifts and manage scheduling periods."
        icon={<Layers className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Attendance", to: "/attendance" },
          { label: "Shift Rosters" },
        ]}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#f47b5b] hover:bg-[#d95d3d] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Assign Shift
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

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#eadbd2] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#77716e]" />
          <input
            type="text"
            placeholder="Search employee name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b] bg-[#fff7f2]/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#77716e]" />
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-[#eadbd2] bg-white text-[#252525] focus:outline-none focus:border-[#f47b5b]"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={selectedShiftFilter}
            onChange={(e) => setSelectedShiftFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-[#eadbd2] bg-white text-[#252525] focus:outline-none focus:border-[#f47b5b]"
          >
            <option value="">All Shifts</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-2xl border border-[#eadbd2] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#77716e]">
            Loading shift assignments...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-[#eadbd2] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#252525]">No shift assignments found</p>
            <p className="text-xs text-[#77716e] mt-1">
              Click &quot;Assign Shift&quot; above to map an employee to a shift schedule.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fff7f2] border-b border-[#eadbd2] text-[#77716e] font-semibold">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Assigned Shift</th>
                  <th className="py-3 px-4">Timing</th>
                  <th className="py-3 px-4">Effective Period</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadbd2]/60 text-[#252525]">
                {filteredAssignments.map((a) => {
                  const now = new Date();
                  const from = new Date(a.effectiveFrom);
                  const to = a.effectiveTo ? new Date(a.effectiveTo) : null;
                  const isActive = from <= now && (!to || to >= now);
                  const isFuture = from > now;

                  return (
                    <tr key={a.id} className="hover:bg-[#fff7f2]/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#252525]">
                          {a.employee?.name || "N/A"}
                        </div>
                        <div className="text-[11px] font-mono text-[#77716e]">
                          {a.employee?.employeeCode || ""}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#77716e]">
                        {a.employee?.department?.name || "Unassigned"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#252525]">
                          {a.shift?.name || "N/A"}
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#fff7f2] text-[#f47b5b] border border-[#eadbd2]">
                          {a.shift?.code || ""}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#77716e]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#f47b5b]" />
                          <span>
                            {a.shift?.startTime} - {a.shift?.endTime}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#77716e]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#77716e]" />
                          <span>
                            {new Date(a.effectiveFrom).toLocaleDateString()} →{" "}
                            {a.effectiveTo ? new Date(a.effectiveTo).toLocaleDateString() : "Ongoing"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isFuture
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {isActive ? "ACTIVE" : isFuture ? "UPCOMING" : "EXPIRED"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#eadbd2] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#eadbd2]">
              <h3 className="font-bold text-lg text-[#252525]">Assign Shift to Employee</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#77716e] hover:text-[#252525] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Select Employee *
                </label>
                <select
                  required
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Select Shift *
                </label>
                <select
                  required
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                >
                  <option value="">-- Choose Shift --</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) — {s.startTime} to {s.endTime}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Effective From *
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Effective To (Optional)
                  </label>
                  <input
                    type="date"
                    value={effectiveTo}
                    onChange={(e) => setEffectiveTo(e.target.value)}
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
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#f47b5b] hover:bg-[#d95d3d] rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
