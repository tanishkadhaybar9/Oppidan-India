import { useState, useEffect } from "react";
import {
  Layers,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Moon,
  Sun,
  X,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import {
  listShifts,
  createShift,
  updateShift,
  deactivateShift,
  listShiftAssignments,
  createShiftAssignment,
} from "../services/attendanceService";
import { listEmployees } from "../services/employeeService";
import type { Shift, ShiftAssignment, CreateShiftPayload } from "../types/attendance";
import type { EmployeeSummary } from "../types/employee";

const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export function ShiftManagementPage() {
  const [activeTab, setActiveTab] = useState<"shifts" | "assignments">("shifts");

  // Shifts state
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(60);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(10);
  const [workingDays, setWorkingDays] = useState<string[]>(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [isOvernight, setIsOvernight] = useState(false);

  // Shift assignment state
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().split("T")[0]!);
  const [effectiveTo, setEffectiveTo] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch shifts
  const loadShifts = async () => {
    setLoadingShifts(true);
    try {
      const res = await listShifts();
      if (res.data?.shifts) setShifts(res.data.shifts);
    } catch (err: any) {
      setError(err?.message || "Failed to load shifts");
    } finally {
      setLoadingShifts(false);
    }
  };

  // Fetch assignments
  const loadAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const res = await listShiftAssignments();
      if (res.data?.assignments) setAssignments(res.data.assignments);
    } catch (err: any) {
      setError(err?.message || "Failed to load assignments");
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    loadShifts();
    loadAssignments();
  }, []);

  // Load employee list for assignment dropdown
  useEffect(() => {
    async function fetchEmps() {
      try {
        const res = await listEmployees({ status: "ACTIVE", limit: 100 });
        if (res.data?.employees) setEmployees(res.data.employees);
      } catch (err) {
        console.error("Failed to load employees for assignment", err);
      }
    }
    fetchEmps();
  }, []);

  const openCreateShiftModal = () => {
    setEditingShift(null);
    setName("");
    setCode("");
    setStartTime("09:00");
    setEndTime("18:00");
    setBreakDurationMinutes(60);
    setGracePeriodMinutes(10);
    setWorkingDays(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);
    setTimezone("Asia/Kolkata");
    setIsOvernight(false);
    setShiftModalOpen(true);
  };

  const openEditShiftModal = (s: Shift) => {
    setEditingShift(s);
    setName(s.name);
    setCode(s.code);
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setBreakDurationMinutes(s.breakDurationMinutes);
    setGracePeriodMinutes(s.gracePeriodMinutes);
    setWorkingDays(s.workingDays);
    setTimezone(s.timezone);
    setIsOvernight(s.isOvernight);
    setShiftModalOpen(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: CreateShiftPayload = {
        name,
        code,
        startTime,
        endTime,
        breakDurationMinutes,
        gracePeriodMinutes,
        workingDays,
        timezone,
        isOvernight: isOvernight || startTime > endTime,
      };

      if (editingShift) {
        await updateShift(editingShift.id, payload);
        setSuccess("Shift updated successfully.");
      } else {
        await createShift(payload);
        setSuccess("Shift created successfully.");
      }
      setShiftModalOpen(false);
      await loadShifts();
    } catch (err: any) {
      setError(err?.message || "Failed to save shift");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Are you sure you want to deactivate this shift? Existing assignments will be preserved.")) return;
    try {
      await deactivateShift(id);
      setSuccess("Shift deactivated successfully.");
      await loadShifts();
    } catch (err: any) {
      setError(err?.message || "Failed to deactivate shift");
    }
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createShiftAssignment({
        employeeId: selectedEmpId,
        shiftId: selectedShiftId,
        effectiveFrom: new Date(effectiveFrom).toISOString(),
        effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : null,
      });
      setSuccess("Shift assigned to employee successfully.");
      setAssignModalOpen(false);
      await loadAssignments();
    } catch (err: any) {
      setError(err?.message || "Failed to assign shift");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Shift Scheduling & Assignments"
        subtitle="Configure daily working shifts, grace periods, overnight hours, and assign employees to shifts."
        icon={<Layers className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Attendance", to: "/attendance" },
          { label: "Shifts" },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            {activeTab === "shifts" ? (
              <button
                onClick={openCreateShiftModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#f47b5b] text-white hover:bg-[#d45838] transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Shift
              </button>
            ) : (
              <button
                onClick={() => { setSelectedEmpId(""); setSelectedShiftId(""); setAssignModalOpen(true); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#f47b5b] text-white hover:bg-[#d45838] transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" /> Assign Shift
              </button>
            )}
          </div>
        }
      />

        {/* Notifications */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#eadbd2] text-xs font-semibold">
          <button
            onClick={() => setActiveTab("shifts")}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "shifts"
                ? "border-[#f47b5b] text-[#f47b5b]"
                : "border-transparent text-[#77716e] hover:text-[#252525]"
            }`}
          >
            <Clock className="w-4 h-4" /> Shift Definitions ({shifts.length})
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "assignments"
                ? "border-[#f47b5b] text-[#f47b5b]"
                : "border-transparent text-[#77716e] hover:text-[#252525]"
            }`}
          >
            <Users className="w-4 h-4" /> Employee Assignments ({assignments.length})
          </button>
        </div>

        {/* TAB 1: SHIFTS */}
        {activeTab === "shifts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingShifts ? (
              <div className="col-span-full py-12 text-center text-xs text-[#77716e]">
                Loading company shifts...
              </div>
            ) : shifts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-[#77716e]">
                No shifts configured yet. Click "Add Shift" to create your first work schedule.
              </div>
            ) : (
              shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="bg-white border border-[#eadbd2] rounded-[18px] p-5 flex flex-col justify-between shadow-xs hover:border-[#f47b5b]/50 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#fff7f2] border border-[#eadbd2] text-[#f47b5b]">
                        {shift.code}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          shift.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {shift.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading font-bold text-base text-[#252525]">{shift.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#77716e] mt-1 font-mono font-medium">
                        {shift.isOvernight ? <Moon className="w-3.5 h-3.5 text-indigo-500" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                        <span>{shift.startTime} — {shift.endTime}</span>
                        {shift.isOvernight && <span className="text-[10px] text-indigo-600 font-sans font-semibold">(Overnight)</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#fff7f2] p-2.5 rounded-xl border border-[#eadbd2]/60">
                      <div>
                        <span className="text-[#77716e] block">Break Time:</span>
                        <span className="font-semibold text-[#252525]">{shift.breakDurationMinutes} mins</span>
                      </div>
                      <div>
                        <span className="text-[#77716e] block">Grace Period:</span>
                        <span className="font-semibold text-[#252525]">{shift.gracePeriodMinutes} mins</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#77716e] block mb-1">Working Days:</span>
                      <div className="flex flex-wrap gap-1">
                        {shift.workingDays.map((d) => (
                          <span key={d} className="px-1.5 py-0.5 text-[9px] font-semibold bg-white border border-[#eadbd2] rounded text-[#252525]">
                            {d.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#eadbd2]/60 text-xs">
                    <span className="text-[#77716e] text-[11px]">
                      {shift._count?.assignments || 0} assigned
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditShiftModal(shift)}
                        className="p-1.5 text-[#77716e] hover:text-[#f47b5b] transition-colors"
                        title="Edit Shift"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {shift.status === "ACTIVE" && (
                        <button
                          onClick={() => handleDeactivate(shift.id)}
                          className="p-1.5 text-[#77716e] hover:text-rose-600 transition-colors"
                          title="Deactivate Shift"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ASSIGNMENTS */}
        {activeTab === "assignments" && (
          <div className="bg-white border border-[#eadbd2] rounded-[20px] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#fff7f2] border-b border-[#eadbd2] text-[#77716e] font-medium">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Assigned Shift</th>
                    <th className="py-3 px-4">Timing</th>
                    <th className="py-3 px-4">Effective From</th>
                    <th className="py-3 px-4">Effective To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eadbd2]/60">
                  {loadingAssignments ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#77716e]">
                        Loading shift assignments...
                      </td>
                    </tr>
                  ) : assignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#77716e]">
                        No active employee shift assignments found. Click "Assign Shift" to schedule.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((asgn) => (
                      <tr key={asgn.id} className="hover:bg-[#fff9f6] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#252525]">{asgn.employee?.name}</div>
                          <div className="text-[10px] text-[#77716e] font-mono">{asgn.employee?.employeeCode}</div>
                        </td>
                        <td className="py-3 px-4 text-[#77716e]">
                          {asgn.employee?.department?.name || "Unassigned"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#252525]">{asgn.shift?.name}</span>
                          <span className="text-[10px] text-[#77716e] block font-mono">{asgn.shift?.code}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-[#252525]">
                          {asgn.shift?.startTime} — {asgn.shift?.endTime}
                        </td>
                        <td className="py-3 px-4 text-[#77716e]">
                          {new Date(asgn.effectiveFrom).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-[#77716e]">
                          {asgn.effectiveTo ? new Date(asgn.effectiveTo).toLocaleDateString() : "Indefinite"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL 1: Create / Edit Shift */}
        {shiftModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-[22px] max-w-lg w-full border border-[#eadbd2] p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
                <h3 className="font-heading font-bold text-lg text-[#252525]">
                  {editingShift ? "Edit Shift Schedule" : "Create New Shift"}
                </h3>
                <button onClick={() => setShiftModalOpen(false)}>
                  <X className="w-5 h-5 text-[#77716e] hover:text-[#252525]" />
                </button>
              </div>

              <form onSubmit={handleSaveShift} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#77716e] block mb-1 font-medium">Shift Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Morning Shift"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                    />
                  </div>
                  <div>
                    <label className="text-[#77716e] block mb-1 font-medium">Shift Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MS-0918"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b] uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#77716e] block mb-1 font-medium">Start Time (24h)</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                    />
                  </div>
                  <div>
                    <label className="text-[#77716e] block mb-1 font-medium">End Time (24h)</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#77716e] block mb-1 font-medium">Break Duration (mins)</label>
                    <input
                      type="number"
                      min={0}
                      max={240}
                      value={breakDurationMinutes}
                      onChange={(e) => setBreakDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                    />
                  </div>
                  <div>
                    <label className="text-[#77716e] block mb-1 font-medium">Grace Period (mins)</label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={gracePeriodMinutes}
                      onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#77716e] block mb-1.5 font-medium">Working Days</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_DAYS.map((day) => {
                      const active = workingDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                            active
                              ? "bg-[#f47b5b] text-white border-[#f47b5b]"
                              : "bg-[#fff7f2] border-[#eadbd2] text-[#77716e] hover:bg-stone-50"
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isOvernight"
                    checked={isOvernight || startTime > endTime}
                    onChange={(e) => setIsOvernight(e.target.checked)}
                    className="rounded text-[#f47b5b] focus:ring-[#f47b5b]"
                  />
                  <label htmlFor="isOvernight" className="text-xs text-[#252525] font-medium">
                    Overnight Shift (crosses midnight into next morning)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#eadbd2]">
                  <button
                    type="button"
                    onClick={() => setShiftModalOpen(false)}
                    className="px-3.5 py-2 border border-[#eadbd2] rounded-xl font-semibold text-[#77716e]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-[#f47b5b] hover:bg-[#d45838] text-white rounded-xl font-semibold transition-colors"
                  >
                    {saving ? "Saving..." : "Save Shift"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Assign Shift */}
        {assignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-[22px] max-w-md w-full border border-[#eadbd2] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
                <h3 className="font-heading font-bold text-base text-[#252525]">
                  Assign Employee to Shift
                </h3>
                <button onClick={() => setAssignModalOpen(false)}>
                  <X className="w-5 h-5 text-[#77716e] hover:text-[#252525]" />
                </button>
              </div>

              <form onSubmit={handleSaveAssignment} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[#77716e] block mb-1 font-medium">Select Employee</label>
                  <select
                    required
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                  >
                    <option value="">Choose an employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#77716e] block mb-1 font-medium">Select Shift</label>
                  <select
                    required
                    value={selectedShiftId}
                    onChange={(e) => setSelectedShiftId(e.target.value)}
                    className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                  >
                    <option value="">Choose a shift...</option>
                    {shifts.filter((s) => s.status === "ACTIVE").map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#77716e] block mb-1 font-medium">Effective From</label>
                    <input
                      type="date"
                      required
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                    />
                  </div>
                  <div>
                    <label className="text-[#77716e] block mb-1 font-medium">Effective To (Optional)</label>
                    <input
                      type="date"
                      value={effectiveTo}
                      onChange={(e) => setEffectiveTo(e.target.value)}
                      className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl focus:outline-hidden focus:border-[#f47b5b]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#eadbd2]">
                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(false)}
                    className="px-3.5 py-2 border border-[#eadbd2] rounded-xl font-semibold text-[#77716e]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-[#f47b5b] hover:bg-[#d45838] text-white rounded-xl font-semibold transition-colors"
                  >
                    {saving ? "Assigning..." : "Assign Shift"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

    </PageContainer>
  );
}
