import { prisma } from "../lib/prisma.js";
import { logAudit } from "../audit/audit.service.js";
import type {
  UpdateOrganizationPayload,
  UpdateWorkingHoursPayload,
  UpdateAttendanceSettingsPayload,
  UpdateLeaveSettingsPayload,
  UpdateSystemPreferencesPayload,
} from "./settings.types.js";

export async function getCompanySettings(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      attendanceSetting: true,
      leaveSetting: true,
    },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  // Ensure attendance setting exists
  let attendanceSetting = company.attendanceSetting;
  if (!attendanceSetting) {
    attendanceSetting = await prisma.companyAttendanceSetting.create({
      data: {
        companyId,
        timezone: company.timezone || "Asia/Kolkata",
        gracePeriodMinutes: 10,
        defaultBreakMinutes: 60,
        isBreakPaid: false,
        workingDays: company.workingDays || ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
        weeklyOvertimeThresholdHours: 40.0,
        halfDayThresholdMinutes: 240,
        fullDayThresholdMinutes: 480,
        allowRemoteClockIn: true,
        requireLocation: false,
      },
    });
  }

  // Ensure leave setting exists
  let leaveSetting = company.leaveSetting;
  if (!leaveSetting) {
    leaveSetting = await prisma.companyLeaveSetting.create({
      data: {
        companyId,
        leaveYearStart: "JANUARY",
        allowCarryForward: true,
        maxCarryForwardDays: 10,
        requireDocumentProofDays: 3,
        maxConsecutiveDays: 15,
      },
    });
  }

  return {
    organization: {
      id: company.id,
      name: company.name,
      logoUrl: company.logoUrl,
      email: company.email,
      phone: company.phone,
      website: company.website,
      address: company.address,
      city: company.city,
      state: company.state,
      country: company.country,
      postalCode: company.postalCode,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    },
    workingHours: {
      workingDays: company.workingDays,
      workStartTime: company.workStartTime,
      workEndTime: company.workEndTime,
    },
    attendance: attendanceSetting,
    leave: leaveSetting,
    preferences: {
      timezone: company.timezone,
      dateFormat: company.dateFormat,
      timeFormat: company.timeFormat,
      currency: company.currency,
    },
  };
}

export async function updateOrganizationProfile(
  companyId: string,
  data: UpdateOrganizationPayload,
  user?: { id: string; name: string; email: string; role: string }
) {
  const updated = await prisma.company.update({
    where: { id: companyId },
    data: {
      name: data.name,
      logoUrl: data.logoUrl,
      email: data.email,
      phone: data.phone,
      website: data.website,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
    },
  });

  if (user) {
    await logAudit({
      companyId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: "UPDATE",
      module: "SETTINGS",
      recordId: companyId,
      description: `Updated organization profile for "${updated.name}"`,
      details: data,
    });
  }

  return updated;
}

export async function updateWorkingHours(
  companyId: string,
  data: UpdateWorkingHoursPayload,
  user?: { id: string; name: string; email: string; role: string }
) {
  const updated = await prisma.company.update({
    where: { id: companyId },
    data: {
      workingDays: data.workingDays,
      workStartTime: data.workStartTime,
      workEndTime: data.workEndTime,
    },
  });

  if (user) {
    await logAudit({
      companyId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: "UPDATE",
      module: "SETTINGS",
      recordId: companyId,
      description: `Updated standard working hours & days schedule`,
      details: data,
    });
  }

  return updated;
}

export async function updateAttendanceSettings(
  companyId: string,
  data: UpdateAttendanceSettingsPayload,
  user?: { id: string; name: string; email: string; role: string }
) {
  const updated = await prisma.companyAttendanceSetting.upsert({
    where: { companyId },
    update: data,
    create: {
      companyId,
      timezone: data.timezone || "Asia/Kolkata",
      gracePeriodMinutes: data.gracePeriodMinutes ?? 10,
      defaultBreakMinutes: data.defaultBreakMinutes ?? 60,
      isBreakPaid: data.isBreakPaid ?? false,
      weeklyOvertimeThresholdHours: data.weeklyOvertimeThresholdHours ?? 40.0,
      halfDayThresholdMinutes: data.halfDayThresholdMinutes ?? 240,
      fullDayThresholdMinutes: data.fullDayThresholdMinutes ?? 480,
      allowRemoteClockIn: data.allowRemoteClockIn ?? true,
      requireLocation: data.requireLocation ?? false,
    },
  });

  if (user) {
    await logAudit({
      companyId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: "UPDATE",
      module: "SETTINGS",
      recordId: updated.id,
      description: `Updated company attendance calculation rules`,
      details: data,
    });
  }

  return updated;
}

export async function updateLeaveSettings(
  companyId: string,
  data: UpdateLeaveSettingsPayload,
  user?: { id: string; name: string; email: string; role: string }
) {
  const updated = await prisma.companyLeaveSetting.upsert({
    where: { companyId },
    update: data,
    create: {
      companyId,
      leaveYearStart: data.leaveYearStart || "JANUARY",
      allowCarryForward: data.allowCarryForward ?? true,
      maxCarryForwardDays: data.maxCarryForwardDays ?? 10,
      requireDocumentProofDays: data.requireDocumentProofDays ?? 3,
      maxConsecutiveDays: data.maxConsecutiveDays ?? 15,
    },
  });

  if (user) {
    await logAudit({
      companyId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: "UPDATE",
      module: "SETTINGS",
      recordId: updated.id,
      description: `Updated company leave policies and carry-forward parameters`,
      details: data,
    });
  }

  return updated;
}

export async function updateSystemPreferences(
  companyId: string,
  data: UpdateSystemPreferencesPayload,
  user?: { id: string; name: string; email: string; role: string }
) {
  const updated = await prisma.company.update({
    where: { id: companyId },
    data: {
      timezone: data.timezone,
      dateFormat: data.dateFormat,
      timeFormat: data.timeFormat,
      currency: data.currency,
    },
  });

  if (user) {
    await logAudit({
      companyId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: "UPDATE",
      module: "SETTINGS",
      recordId: companyId,
      description: `Updated system formatting and locale preferences`,
      details: data,
    });
  }

  return updated;
}
