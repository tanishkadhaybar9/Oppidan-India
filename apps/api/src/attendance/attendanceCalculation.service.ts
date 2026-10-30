import { AttendanceStatus } from "../generated/prisma/client.js";

export interface ShiftTimeWindow {
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  breakDurationMinutes: number;
  gracePeriodMinutes: number;
  isOvernight: boolean;
  timezone: string;
}

export interface CalculationResult {
  lateMinutes: number;
  earlyDepartureMinutes: number;
  workedMinutes: number;
  breakMinutes: number;
  overtimeMinutes: number;
  status: AttendanceStatus;
}

export class AttendanceCalculationService {
  /**
   * Convert a Date to a YYYY-MM-DD calendar date string in the specified timezone.
   */
  static getLocalDateString(date: Date, timezone: string = "Asia/Kolkata"): string {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date); // outputs "YYYY-MM-DD"
  }

  /**
   * Extract local hour and minute (0-23, 0-59) from a Date in the specified timezone.
   */
  static getLocalTimeParts(date: Date, timezone: string = "Asia/Kolkata"): { hour: number; minute: number } {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    return { hour: hour === 24 ? 0 : hour, minute };
  }

  /**
   * Parse "HH:mm" string into total minutes from start of day.
   */
  static parseTimeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  /**
   * Calculate scheduled shift duration in minutes.
   */
  static getScheduledShiftDuration(shift: Pick<ShiftTimeWindow, "startTime" | "endTime" | "isOvernight">): number {
    const startM = this.parseTimeToMinutes(shift.startTime);
    const endM = this.parseTimeToMinutes(shift.endTime);

    if (shift.isOvernight || startM > endM) {
      return (24 * 60 - startM) + endM;
    }
    return endM - startM;
  }

  /**
   * Calculate late arrival minutes beyond the grace period.
   * If arrival is within start + grace, lateMinutes = 0.
   * If arrival is past grace, lateMinutes = arrivalTime - (startTime + grace).
   */
  static calculateLateArrival(
    clockIn: Date,
    shift: Pick<ShiftTimeWindow, "startTime" | "gracePeriodMinutes" | "timezone">
  ): number {
    const { hour, minute } = this.getLocalTimeParts(clockIn, shift.timezone);
    const actualClockInMinutes = hour * 60 + minute;
    const scheduledStartMinutes = this.parseTimeToMinutes(shift.startTime);
    const graceMinutes = shift.gracePeriodMinutes || 0;

    const delta = actualClockInMinutes - scheduledStartMinutes;
    if (delta <= graceMinutes) {
      return 0;
    }
    return delta - graceMinutes;
  }

  /**
   * Calculate early departure minutes.
   */
  static calculateEarlyDeparture(
    clockOut: Date,
    shift: Pick<ShiftTimeWindow, "endTime" | "isOvernight" | "timezone">
  ): number {
    const { hour, minute } = this.getLocalTimeParts(clockOut, shift.timezone);
    const actualClockOutMinutes = hour * 60 + minute;
    const scheduledEndMinutes = this.parseTimeToMinutes(shift.endTime);

    // For non-overnight shift on same day:
    if (!shift.isOvernight) {
      if (actualClockOutMinutes < scheduledEndMinutes) {
        return scheduledEndMinutes - actualClockOutMinutes;
      }
      return 0;
    }

    // For overnight shift:
    // Scheduled end is on next calendar morning (e.g. 06:00 = 360m).
    // If clocked out earlier on that morning (e.g. 05:30 = 330m):
    if (actualClockOutMinutes < scheduledEndMinutes) {
      return scheduledEndMinutes - actualClockOutMinutes;
    }
    return 0;
  }

  /**
   * Perform complete calculation for an attendance record with clockIn & clockOut.
   */
  static calculateAttendance(
    clockIn: Date,
    clockOut: Date | null | undefined,
    shift?: ShiftTimeWindow,
    settings?: {
      isBreakPaid?: boolean;
      halfDayThresholdMinutes?: number;
    }
  ): CalculationResult {
    // If not clocked out yet:
    if (!clockOut) {
      let lateMinutes = 0;
      if (shift) {
        lateMinutes = this.calculateLateArrival(clockIn, shift);
      }
      return {
        lateMinutes,
        earlyDepartureMinutes: 0,
        workedMinutes: 0,
        breakMinutes: 0,
        overtimeMinutes: 0,
        status: AttendanceStatus.NOT_CLOCKED_OUT,
      };
    }

    // Elapsed milliseconds
    const elapsedMs = clockOut.getTime() - clockIn.getTime();
    const grossMinutes = Math.max(0, Math.floor(elapsedMs / (1000 * 60)));

    // Break deduction: apply shift break or default 60 min if worked > 4 hours and unpaid
    let breakMinutes = 0;
    const isBreakPaid = settings?.isBreakPaid ?? false;
    const configuredBreak = shift?.breakDurationMinutes ?? 60;

    if (!isBreakPaid && grossMinutes >= 240) {
      breakMinutes = Math.min(configuredBreak, grossMinutes);
    }

    const netWorkedMinutes = Math.max(0, grossMinutes - breakMinutes);

    // Late & early calculation
    let lateMinutes = 0;
    let earlyDepartureMinutes = 0;
    let overtimeMinutes = 0;
    let scheduledDuration = 480; // default 8 hours

    if (shift) {
      lateMinutes = this.calculateLateArrival(clockIn, shift);
      earlyDepartureMinutes = this.calculateEarlyDeparture(clockOut, shift);
      scheduledDuration = this.getScheduledShiftDuration(shift);

      // Overtime: net worked minutes exceeding scheduled shift duration
      if (netWorkedMinutes > scheduledDuration) {
        overtimeMinutes = netWorkedMinutes - scheduledDuration;
      }
    }

    // Determine Status
    const halfDayThreshold = settings?.halfDayThresholdMinutes ?? 240;
    let status: AttendanceStatus = AttendanceStatus.PRESENT;

    if (netWorkedMinutes < halfDayThreshold) {
      status = AttendanceStatus.HALF_DAY;
    } else if (lateMinutes > 0) {
      status = AttendanceStatus.LATE;
    } else {
      status = AttendanceStatus.PRESENT;
    }

    return {
      lateMinutes,
      earlyDepartureMinutes,
      workedMinutes: netWorkedMinutes,
      breakMinutes,
      overtimeMinutes,
      status,
    };
  }
}
