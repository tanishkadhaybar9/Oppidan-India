import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

/**
 * Returns the day-of-week name (e.g. "MONDAY") for a YYYY-MM-DD string.
 */
function getDayOfWeek(dateStr: string): string {
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const d = new Date(dateStr + "T00:00:00");
  return days[d.getUTCDay()]!;
}

/**
 * Iterates every calendar day from startDate to endDate inclusive,
 * skips company weekends (based on shift workingDays), skips active holidays,
 * and counts each working day. Half-days contribute 0.5.
 *
 * @param companyId     Tenant scope
 * @param startDate     "YYYY-MM-DD"
 * @param endDate       "YYYY-MM-DD"
 * @param startHalfDay  First day counts as 0.5
 * @param endHalfDay    Last day counts as 0.5
 * @returns             Net working days (may include 0.5 increments)
 */
export async function calculateLeaveDays(
  companyId: string,
  startDate: string,
  endDate: string,
  startHalfDay = false,
  endHalfDay = false
): Promise<number> {
  if (startDate > endDate) {
    throw new Error("startDate must not be after endDate");
  }

  // Fetch active holidays for the company in date range
  const holidays = await prisma.holiday.findMany({
    where: {
      companyId,
      status: "ACTIVE",
      date: { gte: startDate, lte: endDate },
    },
    select: { date: true },
  });
  const holidaySet = new Set(holidays.map((h) => h.date));

  // Determine company-level working days (from attendance setting or default Mon-Fri)
  const setting = await prisma.companyAttendanceSetting.findUnique({
    where: { companyId },
    select: { workingDays: true },
  });
  const workingDays: string[] = setting?.workingDays ?? [
    "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY",
  ];

  // Iterate days
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  let totalDays = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const dateStr = cursor.toISOString().split("T")[0]!;
    const dayOfWeek = getDayOfWeek(dateStr);

    if (workingDays.includes(dayOfWeek) && !holidaySet.has(dateStr)) {
      const isFirst = dateStr === startDate;
      const isLast = dateStr === endDate;

      if (isFirst && startHalfDay && isLast && endHalfDay) {
        // Single day, both half — treat as 0.5 (avoids double 0.5 confusion)
        totalDays += 0.5;
      } else if (isFirst && startHalfDay) {
        totalDays += 0.5;
      } else if (isLast && endHalfDay) {
        totalDays += 0.5;
      } else {
        totalDays += 1;
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return totalDays;
}

/**
 * Returns the available balance for an employee for a specific leave type
 * in the current period. Returns null if no balance record is found.
 */
export async function getAvailableBalance(
  companyId: string,
  employeeId: string,
  leaveTypeId: string,
  referenceDate?: string
): Promise<{
  balanceId: string;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  carriedForwardDays: number;
  adjustedDays: number;
  availableBalance: number;
  remainingBalance: number;
} | null> {
  const ref = referenceDate ? new Date(referenceDate + "T00:00:00") : new Date();

  const balance = await prisma.leaveBalance.findFirst({
    where: {
      companyId,
      employeeId,
      leaveTypeId,
      periodStart: { lte: ref },
      periodEnd: { gte: ref },
    },
  });

  if (!balance) return null;

  const availableBalance =
    balance.allocatedDays +
    balance.carriedForwardDays +
    balance.adjustedDays -
    balance.usedDays;

  const remainingBalance = availableBalance - balance.pendingDays;

  return {
    balanceId: balance.id,
    allocatedDays: balance.allocatedDays,
    usedDays: balance.usedDays,
    pendingDays: balance.pendingDays,
    carriedForwardDays: balance.carriedForwardDays,
    adjustedDays: balance.adjustedDays,
    availableBalance,
    remainingBalance,
  };
}

/**
 * Check for overlapping leave requests for an employee within the given date range.
 * Returns the conflicting request IDs if any.
 */
export async function checkLeaveOverlap(
  companyId: string,
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<string[]> {
  const overlapping = await prisma.leaveRequest.findMany({
    where: {
      companyId,
      employeeId,
      id: excludeRequestId ? { not: excludeRequestId } : undefined,
      status: {
        in: ["PENDING_SUPERVISOR", "PENDING_MANAGER", "PENDING_HR", "APPROVED"],
      },
      OR: [
        { startDate: { lte: endDate }, endDate: { gte: startDate } },
      ],
    },
    select: { id: true },
  });
  return overlapping.map((r) => r.id);
}
