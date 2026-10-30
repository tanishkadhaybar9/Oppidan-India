import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  listHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "../services/leaveService";
import type { Holiday, HolidayType } from "../types/leave";
import { PageContainer, PageHeader } from "../components/common";

export function HolidayCalendarPage() {
  const { user } = useAuth();
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [name, setName] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [type, setType] = useState<HolidayType>("PUBLIC");
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const isHrOrOwner = user?.role === "HR" || user?.role === "OWNER";

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listHolidays(year);
      if (res.data) {
        setHolidays(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const handleOpenCreate = () => {
    setEditingHoliday(null);
    setName("");
    setDate(`${year}-01-01`);
    setType("PUBLIC");
    setDescription("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: Holiday) => {
    setEditingHoliday(h);
    setName(h.name);
    setDate(h.date.split("T")[0]!);
    setType(h.holidayType || (h.type as HolidayType) || "PUBLIC");
    setDescription(h.description || "");
    setIsModalOpen(true);
  };

  const handleDelete = async (h: Holiday) => {
    if (!window.confirm(`Are you sure you want to delete holiday "${h.name}"?`)) {
      return;
    }
    try {
      await deleteHoliday(h.id);
      setSuccess(`Holiday "${h.name}" deleted.`);
      await loadHolidays();
    } catch (err: any) {
      setError(err?.message || "Failed to delete holiday");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) {
      setError("Please provide a name and date.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        date: new Date(date).toISOString(),
        type,
        description: description.trim() || undefined,
      };

      if (editingHoliday) {
        await updateHoliday(editingHoliday.id, payload);
        setSuccess("Holiday updated successfully.");
      } else {
        await createHoliday(payload);
        setSuccess("Holiday added successfully.");
      }
      setIsModalOpen(false);
      await loadHolidays();
    } catch (err: any) {
      setError(err?.message || "Failed to save holiday");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Holiday Calendar ${year}`}
        subtitle="Official company holiday schedule, public observances, and optional festival dates"
        icon={<CalendarDays className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Leave", to: "/leave" },
          { label: "Holiday Calendar" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#eadbd2]">
              <button
                onClick={() => setYear((y) => y - 1)}
                className="p-1.5 rounded-lg hover:bg-[#fff7f2] text-[#77716e]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-xs text-[#252525] px-2">{year}</span>
              <button
                onClick={() => setYear((y) => y + 1)}
                className="p-1.5 rounded-lg hover:bg-[#fff7f2] text-[#77716e]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {isHrOrOwner && (
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-sm font-semibold shadow-xs hover:opacity-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Holiday
              </button>
            )}
          </div>
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

      {/* Holiday List */}
      <div className="bg-white rounded-3xl border border-[#eadbd2] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#77716e]">
            Loading holiday schedule...
          </div>
        ) : holidays.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="w-10 h-10 text-[#eadbd2] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#252525]">No holidays scheduled for {year}</p>
            <p className="text-xs text-[#77716e] mt-1">
              {isHrOrOwner
                ? "Click 'Add Holiday' above to schedule new holidays for this calendar year."
                : "No holidays have been published for this year."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#eadbd2]/60">
            {holidays.map((h) => {
              const dt = new Date(h.date);
              const dayOfWeek = dt.toLocaleDateString(undefined, { weekday: "long" });

              return (
                <div
                  key={h.id}
                  className="p-5 hover:bg-[#fff7f2]/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-start gap-4">
                    {/* Date Block */}
                    <div className="w-14 h-14 rounded-2xl bg-[#fff7f2] border border-[#eadbd2] flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] uppercase font-bold text-[#f47b5b]">
                        {dt.toLocaleDateString(undefined, { month: "short" })}
                      </span>
                      <span className="text-lg font-extrabold text-[#252525] leading-tight">
                        {dt.getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#252525]">{h.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            (h.holidayType || h.type) === "PUBLIC"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : (h.holidayType || h.type) === "COMPANY"
                              ? "bg-[#fff7f2] text-[#f47b5b] border border-[#eadbd2]"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {h.holidayType || h.type}
                        </span>
                      </div>
                      <p className="text-[#77716e]">
                        {dayOfWeek} • {dt.toLocaleDateString()}
                      </p>
                      {h.description && (
                        <p className="text-[#77716e] italic">{h.description}</p>
                      )}
                    </div>
                  </div>

                  {isHrOrOwner && (
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleOpenEdit(h)}
                        className="p-2 rounded-xl border border-[#eadbd2] hover:bg-[#fff7f2] text-[#77716e] hover:text-[#252525] transition-colors"
                        title="Edit Holiday"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(h)}
                        className="p-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                        title="Delete Holiday"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Holiday Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#eadbd2] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#eadbd2]">
              <h3 className="font-bold text-lg text-[#252525]">
                {editingHoliday ? "Edit Holiday" : "Add Holiday"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#77716e] hover:text-[#252525] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Holiday Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Holiday Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as HolidayType)}
                    className="w-full p-2 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="COMPANY">Company</option>
                    <option value="OPTIONAL">Optional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Notes or observance details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b]"
                />
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
                  {submitting ? "Saving..." : editingHoliday ? "Update Holiday" : "Save Holiday"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
