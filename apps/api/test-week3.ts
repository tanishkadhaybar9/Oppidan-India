import "dotenv/config";
import app from "./src/server.js";
import { prisma } from "./src/lib/prisma.js";
import { generateAccessToken } from "./src/utils/jwt.js";
import { UserRole, UserStatus, EmploymentStatus, AttendanceStatus, CorrectionStatus } from "./src/generated/prisma/client.js";
import http from "http";

let server: http.Server;
let baseUrl: string;

async function request(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {}
) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return {
    status: res.status,
    headers: res.headers,
    data,
  };
}

async function runWeek3Tests() {
  console.log("\n=======================================================");
  console.log("   ERMS WEEK 3: ATTENDANCE & SHIFTS TEST SUITE        ");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: unknown) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (detail) console.error("   Details:", detail);
      failed++;
    }
  }

  // Start temporary server on dynamic port
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as { port: number };
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });

  const timestamp = Date.now();

  let companyAId = "";
  let companyBId = "";
  let ownerAToken = "";
  let hrAToken = "";
  let empAToken = "";
  let ownerBToken = "";
  let empAId = "";
  let empAUserId = "";

  try {
    // ---------------------------------------------------------
    // SETUP: Multi-Company & Role Fixtures
    // ---------------------------------------------------------
    console.log("--- SETUP: Multi-Company & Role Fixtures ---");

    const compA = await prisma.company.create({
      data: { name: `Oppidan Attendance Alpha ${timestamp}` },
    });
    companyAId = compA.id;

    const compB = await prisma.company.create({
      data: { name: `Oppidan Attendance Beta ${timestamp}` },
    });
    companyBId = compB.id;

    const ownerA = await prisma.user.create({
      data: {
        email: `owner.att.alpha.${timestamp}@oppidan.test`,
        passwordHash: "dummyhash",
        name: "Owner Att Alpha",
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
        companyId: companyAId,
      },
    });
    ownerAToken = generateAccessToken({
      userId: ownerA.id,
      email: ownerA.email,
      role: ownerA.role,
      companyId: ownerA.companyId,
    });

    const hrA = await prisma.user.create({
      data: {
        email: `hr.att.alpha.${timestamp}@oppidan.test`,
        passwordHash: "dummyhash",
        name: "HR Att Alpha",
        role: UserRole.HR,
        status: UserStatus.ACTIVE,
        companyId: companyAId,
      },
    });
    hrAToken = generateAccessToken({
      userId: hrA.id,
      email: hrA.email,
      role: hrA.role,
      companyId: hrA.companyId,
    });

    const empUserA = await prisma.user.create({
      data: {
        email: `emp.att.alpha.${timestamp}@oppidan.test`,
        passwordHash: "dummyhash",
        name: "Rohan Sharma",
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
        companyId: companyAId,
      },
    });
    empAUserId = empUserA.id;
    empAToken = generateAccessToken({
      userId: empUserA.id,
      email: empUserA.email,
      role: empUserA.role,
      companyId: empUserA.companyId,
    });

    // Create Employee record linked to empUserA
    const empRecord = await prisma.employee.create({
      data: {
        name: "Rohan Sharma",
        email: empUserA.email,
        employeeCode: `EMP-ATT-${timestamp}`,
        companyId: companyAId,
        userId: empUserA.id,
        status: EmploymentStatus.ACTIVE,
      },
    });
    empAId = empRecord.id;

    const ownerB = await prisma.user.create({
      data: {
        email: `owner.att.beta.${timestamp}@oppidan.test`,
        passwordHash: "dummyhash",
        name: "Owner Att Beta",
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
        companyId: companyBId,
      },
    });
    ownerBToken = generateAccessToken({
      userId: ownerB.id,
      email: ownerB.email,
      role: ownerB.role,
      companyId: ownerB.companyId,
    });

    assert(Boolean(ownerAToken && hrAToken && empAToken && ownerBToken), "Auth tokens & employee fixture initialized");

    // ---------------------------------------------------------
    // DAY 14: Shift CRUD APIs
    // ---------------------------------------------------------
    console.log("\n--- DAY 14: Shift CRUD APIs ---");

    const shiftCode = `MS-${timestamp}`;
    const createShiftRes = await request(
      "POST",
      "/api/shifts",
      {
        name: "General Morning Shift",
        code: shiftCode,
        startTime: "09:00",
        endTime: "18:00",
        breakDurationMinutes: 60,
        gracePeriodMinutes: 10,
        workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(createShiftRes.status === 201 && createShiftRes.data.data?.shift?.code === shiftCode, "Owner creates standard shift", createShiftRes.data);
    const morningShiftId = createShiftRes.data.data?.shift?.id;

    // Duplicate shift code in same company
    const dupShiftRes = await request(
      "POST",
      "/api/shifts",
      {
        name: "Duplicate Shift Code",
        code: shiftCode,
        startTime: "09:00",
        endTime: "18:00",
      },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(dupShiftRes.status === 409, "Rejects duplicate shift code within company with 409 Conflict", dupShiftRes.data);

    // Create Overnight Shift (22:00 -> 06:00)
    const nightShiftRes = await request(
      "POST",
      "/api/shifts",
      {
        name: "Overnight Technical Shift",
        code: `NS-${timestamp}`,
        startTime: "22:00",
        endTime: "06:00",
        isOvernight: true,
      },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(nightShiftRes.status === 201 && nightShiftRes.data.data?.shift?.isOvernight === true, "Creates overnight shift with isOvernight flag", nightShiftRes.data);
    const nightShiftId = nightShiftRes.data.data?.shift?.id;

    // List Shifts
    const listShiftsRes = await request(
      "GET",
      "/api/shifts",
      undefined,
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(listShiftsRes.status === 200 && listShiftsRes.data.data?.shifts?.length >= 2, "List shifts returns company shifts", listShiftsRes.data);

    // Update Shift
    const updateShiftRes = await request(
      "PATCH",
      `/api/shifts/${morningShiftId}`,
      { gracePeriodMinutes: 15 },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(updateShiftRes.status === 200 && updateShiftRes.data.data?.shift?.gracePeriodMinutes === 15, "Updates shift grace period", updateShiftRes.data);

    // Deactivate Shift
    const deactShiftRes = await request(
      "PATCH",
      `/api/shifts/${nightShiftId}/deactivate`,
      {},
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(deactShiftRes.status === 200 && deactShiftRes.data.data?.shift?.status === "INACTIVE", "Deactivates shift successfully", deactShiftRes.data);

    // Cross-company shift read isolation
    const crossShiftRes = await request(
      "GET",
      `/api/shifts/${morningShiftId}`,
      undefined,
      { Authorization: `Bearer ${ownerBToken}` }
    );
    assert(crossShiftRes.status === 404, "Cross-company shift read is isolated (returns 404)", crossShiftRes.data);

    // ---------------------------------------------------------
    // DAY 14: Shift Assignment & Conflict Validation
    // ---------------------------------------------------------
    console.log("\n--- DAY 14: Shift Assignment & Conflict Validation ---");

    // Assign employee to morning shift
    const assignRes = await request(
      "POST",
      "/api/shift-assignments",
      {
        employeeId: empAId,
        shiftId: morningShiftId,
        effectiveFrom: "2026-10-01",
      },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(assignRes.status === 201 && assignRes.data.data?.assignment?.shiftId === morningShiftId, "Successfully assigns employee to shift", assignRes.data);
    const assignmentId = assignRes.data.data?.assignment?.id;

    // Overlapping assignment conflict detection
    const conflictAssignRes = await request(
      "POST",
      "/api/shift-assignments",
      {
        employeeId: empAId,
        shiftId: morningShiftId,
        effectiveFrom: "2026-10-15",
      },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(conflictAssignRes.status === 409, "Rejects overlapping active shift assignment with 409 Conflict", conflictAssignRes.data);

    // Fetch employee current shift
    const empShiftRes = await request(
      "GET",
      `/api/shift-assignments/employee/${empAId}`,
      undefined,
      { Authorization: `Bearer ${empAToken}` }
    );
    assert(empShiftRes.status === 200 && empShiftRes.data.data?.assignment?.shift?.code === shiftCode, "Employee retrieves assigned shift details", empShiftRes.data);

    // ---------------------------------------------------------
    // DAY 15: Clock-In & Duplicate Prevention
    // ---------------------------------------------------------
    console.log("\n--- DAY 15: Clock-In & Duplicate Prevention ---");

    // 1. Employee Clock-In
    const clockInRes = await request(
      "POST",
      "/api/attendance/clock-in",
      { notes: "Morning arrival" },
      { Authorization: `Bearer ${empAToken}` }
    );
    assert(clockInRes.status === 201 && clockInRes.data.data?.attendance?.clockIn !== null, "Employee clocks in successfully", clockInRes.data);
    const attendanceId = clockInRes.data.data?.attendance?.id;

    // 2. Duplicate Clock-In Prevention
    const dupClockInRes = await request(
      "POST",
      "/api/attendance/clock-in",
      {},
      { Authorization: `Bearer ${empAToken}` }
    );
    assert(dupClockInRes.status === 409, "Rejects duplicate clock-in while active session open (409 Conflict)", dupClockInRes.data);

    // 3. View Today's Attendance
    const todayRes = await request(
      "GET",
      "/api/attendance/me/today",
      undefined,
      { Authorization: `Bearer ${empAToken}` }
    );
    assert(todayRes.status === 200 && todayRes.data.data?.attendance?.id === attendanceId, "GET /api/attendance/me/today returns active session", todayRes.data);

    // ---------------------------------------------------------
    // DAY 15 & 17: Clock-Out & Worked / Overtime Calculation
    // ---------------------------------------------------------
    console.log("\n--- DAY 15 & 17: Clock-Out & Worked / Overtime Calculation ---");

    // Set clockIn back by 9 hours in database to simulate a full working shift with overtime
    const nineHoursAgo = new Date(Date.now() - 9.5 * 60 * 60 * 1000);
    await prisma.attendance.update({
      where: { id: attendanceId },
      data: { clockIn: nineHoursAgo },
    });

    // Clock-Out
    const clockOutRes = await request(
      "POST",
      "/api/attendance/clock-out",
      { notes: "Shift completed" },
      { Authorization: `Bearer ${empAToken}` }
    );
    assert(clockOutRes.status === 200 && clockOutRes.data.data?.attendance?.clockOut !== null, "Employee clocks out successfully", clockOutRes.data);

    const calculatedAttendance = clockOutRes.data.data?.attendance;
    assert(calculatedAttendance.workedMinutes > 400, "Calculates net worked minutes correctly", calculatedAttendance);
    assert(calculatedAttendance.breakMinutes === 60, "Applies standard 60-minute unpaid break deduction for >4h work", calculatedAttendance);

    // Duplicate Clock-Out Prevention
    const dupClockOutRes = await request(
      "POST",
      "/api/attendance/clock-out",
      {},
      { Authorization: `Bearer ${empAToken}` }
    );
    assert(dupClockOutRes.status === 404 || dupClockOutRes.status === 409, "Rejects duplicate clock-out when session is already closed", dupClockOutRes.data);

    // ---------------------------------------------------------
    // DAY 16: Daily Attendance Log & HR Corrections
    // ---------------------------------------------------------
    console.log("\n--- DAY 16: Daily Attendance Log & HR Corrections ---");

    // 1. Daily Attendance Log
    const dailyRes = await request(
      "GET",
      "/api/attendance/daily",
      undefined,
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(
      dailyRes.status === 200 &&
      dailyRes.data.data?.attendances?.length >= 1 &&
      dailyRes.data.data?.summary?.present >= 0,
      "Daily attendance log returns records and summary metrics",
      dailyRes.data
    );

    // 2. Employee submits correction request
    const correctionReqRes = await request(
      "POST",
      `/api/attendance/${attendanceId}/correction-request`,
      {
        correctedClockIn: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        correctedClockOut: new Date().toISOString(),
        reason: "Forgot biometric scan upon entering laboratory",
      },
      { Authorization: `Bearer ${empAToken}` }
    );
    assert(correctionReqRes.status === 201 && correctionReqRes.data.data?.correction?.status === "PENDING", "Employee submits correction request", correctionReqRes.data);
    const correctionId = correctionReqRes.data.data?.correction?.id;

    // 3. HR Reviews and Approves Correction
    const approveRes = await request(
      "PATCH",
      `/api/attendance/correction-requests/${correctionId}/review`,
      {
        status: "APPROVED",
        reviewNotes: "Verified with front desk log",
      },
      { Authorization: `Bearer ${hrAToken}` }
    );
    assert(approveRes.status === 200 && approveRes.data.data?.correction?.status === "APPROVED", "HR approves correction request and triggers recalculation", approveRes.data);

    // Verify Audit Log was recorded
    const auditCount = await prisma.attendanceAudit.count({
      where: { companyId: companyAId, attendanceId },
    });
    assert(auditCount >= 2, "AttendanceAudit immutable log records clock-in, clock-out, and correction events", { auditCount });

    // 4. HR Direct Correction
    const directCorrRes = await request(
      "PATCH",
      `/api/attendance/${attendanceId}/correct`,
      {
        correctedClockIn: new Date(Date.now() - 8.5 * 60 * 60 * 1000).toISOString(),
        correctedClockOut: new Date().toISOString(),
        reason: "HR administrative adjustment for official offsite duty",
      },
      { Authorization: `Bearer ${hrAToken}` }
    );
    assert(directCorrRes.status === 200 && directCorrRes.data.data?.attendance?.id === attendanceId, "HR performs direct attendance correction with audit logging", directCorrRes.data);

    // ---------------------------------------------------------
    // DAY 18: Weekly Attendance Reporting & CSV Export
    // ---------------------------------------------------------
    console.log("\n--- DAY 18: Weekly Attendance Reporting & CSV Export ---");

    const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const weeklyRes = await request(
      "GET",
      `/api/attendance/reports/weekly?startDate=2026-10-01&endDate=${todayStr}`,
      undefined,
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(
      weeklyRes.status === 200 &&
      Array.isArray(weeklyRes.data.data?.report) &&
      weeklyRes.data.data?.report.length >= 1,
      "Weekly attendance report generates aggregated summary per employee",
      weeklyRes.data
    );

    // CSV Export
    const csvRes = await fetch(`${baseUrl}/api/attendance/reports/weekly/export?startDate=2026-10-01&endDate=${todayStr}`, {
      headers: { Authorization: `Bearer ${ownerAToken}` },
    });
    const csvText = await csvRes.text();
    assert(
      csvRes.status === 200 &&
      csvRes.headers.get("content-type")?.includes("text/csv") === true &&
      csvText.includes("Employee Code") &&
      csvText.includes("Worked Hours"),
      "CSV export generates downloadable RFC-4180 spreadsheet with correct headers",
      csvText.slice(0, 150)
    );

    // ---------------------------------------------------------
    // DAY 18: Cross-Tenant Isolation & Role Authorization (RBAC)
    // ---------------------------------------------------------
    console.log("\n--- DAY 18: Tenant Isolation & RBAC Security ---");

    // Company B cannot read Company A's attendance records
    const crossDailyRes = await request(
      "GET",
      "/api/attendance/daily",
      undefined,
      { Authorization: `Bearer ${ownerBToken}` }
    );
    assert(crossDailyRes.data.data?.attendances?.length === 0, "Company B daily log has 0 records (tenant isolated)", crossDailyRes.data);

    // Regular Employee cannot create shifts (403 Forbidden)
    const empForbiddenShiftRes = await request(
      "POST",
      "/api/shifts",
      {
        name: "Unauthorized Shift",
        code: `UNAUTH-${timestamp}`,
        startTime: "09:00",
        endTime: "18:00",
      },
      { Authorization: `Bearer ${empAToken}` }
    );
    assert(empForbiddenShiftRes.status === 403, "EMPLOYEE role is forbidden from creating shifts (403 Forbidden)", empForbiddenShiftRes.data);

    // Regular Employee cannot approve corrections (403 Forbidden)
    const empForbiddenReviewRes = await request(
      "PATCH",
      `/api/attendance/correction-requests/${correctionId}/review`,
      { status: "APPROVED" },
      { Authorization: `Bearer ${empAToken}` }
    );
    assert(empForbiddenReviewRes.status === 403, "EMPLOYEE role is forbidden from reviewing/approving corrections (403)", empForbiddenReviewRes.data);

    // Regular Employee cannot export CSV (403 Forbidden)
    const empForbiddenCsvRes = await fetch(`${baseUrl}/api/attendance/reports/weekly/export?startDate=2026-10-01&endDate=${todayStr}`, {
      headers: { Authorization: `Bearer ${empAToken}` },
    });
    assert(empForbiddenCsvRes.status === 403, "EMPLOYEE role is forbidden from exporting company attendance CSV (403)", { status: empForbiddenCsvRes.status });

  } finally {
    // Teardown / Cleanup
    if (companyAId || companyBId) {
      await prisma.attendanceAudit.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.attendanceCorrection.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.attendance.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.shiftAssignment.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.shift.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.employee.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.user.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.company.deleteMany({
        where: { id: { in: [companyAId, companyBId] } },
      });
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  console.log("\n==========================================");
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runWeek3Tests().catch((err) => {
  console.error("Fatal error during Week 3 tests:", err);
  process.exit(1);
});
