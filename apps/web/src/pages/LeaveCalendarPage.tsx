import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { listLeaveRequests, listHolidays } from "../services/leaveService";
import type { LeaveRequest, Holiday } from "../types/leave";

export function LeaveCalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);

  // Selected Day Details
  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    dateStr: string;
    dayHolidays: Holiday[];
    dayLeaves: LeaveRequest[];
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const firstDay = new Date(year, month, 1).toISOString().split("T")[0]!;
      const lastDay = new Date(year, month + 1, 0).toISOString().split("T")[0]!;

      const [reqRes, holRes] = await Promise.all([
        listLeaveRequests({ startDate: firstDay, endDate: lastDay, limit: 100 }),
        listHolidays(year),
      ]);

      if (reqRes.data?.requests) setRequests(reqRes.data.requests);
      if (holRes.data) setHolidays(holRes.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build Month Grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  const days: { dateStr: string; dayNum: number; isWeekend: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dObj = new Date(year, month, d);
    const dayOfWeek = dObj.getDay();
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    days.push({
      dateStr: `${year}-${mm}-${dd}`,
      dayNum: d,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handleDayClick = (dayStr: string) => {
    const dayHols = holidays.filter((h) => h.date.startsWith(dayStr));
    const dayLvs = requests.filter((r) => r.startDate <= dayStr && r.endDate >= dayStr);
    setSelectedDayInfo({
      dateStr: dayStr,
      dayHolidays: dayHols,
      dayLeaves: dayLvs,
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Leave & Holiday Calendar"
        subtitle="Visual overview of team leave schedules, holidays, and working days."
        icon={<CalendarDays className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Leave", to: "/leave" },
          { label: "Calendar" },
        ]}
        actions={
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#eadbd2] shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-[#fff7f2] text-[#77716e] hover:text-[#252525] transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-[#252525] px-3 min-w-[140px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-[#fff7f2] text-[#77716e] hover:text-[#252525] transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-[#fff7f2] text-[#f47b5b] hover:bg-[#f47b5b] hover:text-white transition-colors"
            >
              Today
            </button>
          </div>
        }
      />

      {/* Legend */}
      <div className="bg-white p-4 rounded-2xl border border-[#eadbd2] flex flex-wrap items-center gap-4 text-xs">
        <span className="font-semibold text-[#252525]">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
          <span className="text-[#77716e]">Approved Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" />
          <span className="text-[#77716e]">Pending Approval</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-[#f47b5b] inline-block" />
          <span className="text-[#77716e]">Company Holiday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-gray-200 inline-block" />
          <span className="text-[#77716e]">Weekend</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl border border-[#eadbd2] shadow-sm overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-[#fff7f2] border-b border-[#eadbd2] text-center text-xs font-semibold text-[#77716e] py-3">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#eadbd2]/60 text-xs">
          {/* Empty cells before month starts */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="bg-gray-50/50 min-h-[100px] p-2" />
          ))}

          {/* Month Days */}
          {days.map((day) => {
            const dayHols = holidays.filter((h) => h.date.startsWith(day.dateStr));
            const dayLvs = requests.filter(
              (r) => r.startDate <= day.dateStr && r.endDate >= day.dateStr
            );
            const isToday =
              new Date().toISOString().split("T")[0] === day.dateStr;

            return (
              <div
                key={day.dateStr}
                onClick={() => handleDayClick(day.dateStr)}
                className={`min-h-[100px] p-2 transition-colors cursor-pointer flex flex-col justify-between ${
                  day.isWeekend ? "bg-[#fff7f2]/20" : "bg-white"
                } hover:bg-[#fff7f2]/50`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-semibold text-xs rounded-full w-6 h-6 flex items-center justify-center ${
                      isToday
                        ? "bg-[#f47b5b] text-white shadow-sm"
                        : "text-[#252525]"
                    }`}
                  >
                    {day.dayNum}
                  </span>
                  {dayHols.length > 0 && (
                    <span className="text-[10px] font-bold text-[#f47b5b] bg-[#fff7f2] px-1.5 py-0.5 rounded-full border border-[#eadbd2]">
                      Holiday
                    </span>
                  )}
                </div>

                {/* Day events badges */}
                <div className="mt-1 space-y-1 overflow-hidden">
                  {dayHols.map((h) => (
                    <div
                      key={h.id}
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#fff7f2] text-[#f47b5b] border border-[#f47b5b]/30 truncate"
                      title={h.name}
                    >
                      🎉 {h.name}
                    </div>
                  ))}

                  {dayLvs.map((lv) => {
                    const isApproved = lv.status === "APPROVED";
                    return (
                      <div
                        key={lv.id}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                        title={`${lv.employee?.name}: ${lv.leaveType?.name}`}
                      >
                        {lv.employee?.name || "Leave"} ({lv.leaveType?.code})
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Info Modal */}
      {selectedDayInfo && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#eadbd2] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#eadbd2]">
              <h3 className="font-bold text-base text-[#252525] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#f47b5b]" />
                {new Date(selectedDayInfo.dateStr + "T00:00:00").toLocaleDateString(
                  undefined,
                  { weekday: "long", year: "numeric", month: "long", day: "numeric" }
                )}
              </h3>
              <button
                onClick={() => setSelectedDayInfo(null)}
                className="text-[#77716e] hover:text-[#252525] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Holidays */}
              <div>
                <h4 className="text-xs font-bold text-[#252525] uppercase tracking-wider mb-2">
                  Company Holidays
                </h4>
                {selectedDayInfo.dayHolidays.length === 0 ? (
                  <p className="text-xs text-[#77716e]">No holidays on this day</p>
                ) : (
                  selectedDayInfo.dayHolidays.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 rounded-xl bg-[#fff7f2] border border-[#eadbd2] text-xs space-y-1"
                    >
                      <div className="font-semibold text-[#f47b5b]">{h.name}</div>
                      <div className="text-[11px] text-[#77716e]">
                        Type: {h.holidayType || h.type} • {h.description || "Official company holiday"}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Leaves */}
              <div>
                <h4 className="text-xs font-bold text-[#252525] uppercase tracking-wider mb-2">
                  Scheduled Leaves
                </h4>
                {selectedDayInfo.dayLeaves.length === 0 ? (
                  <p className="text-xs text-[#77716e]">No employee leaves on this day</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayInfo.dayLeaves.map((lv) => (
                      <div
                        key={lv.id}
                        className="p-3 rounded-xl bg-white border border-[#eadbd2] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#252525]">
                            {lv.employee?.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              lv.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {lv.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#77716e]">
                          {lv.leaveType?.name} • {lv.days} {lv.days === 1 ? "day" : "days"} • Reason:{" "}
                          <span className="italic">{lv.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#eadbd2] flex justify-end">
              <button
                onClick={() => setSelectedDayInfo(null)}
                className="px-4 py-2 text-xs font-semibold text-[#252525] bg-[#fff7f2] hover:bg-[#eadbd2] rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
