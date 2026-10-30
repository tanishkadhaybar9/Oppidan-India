import "dotenv/config";
import app from "./src/server.js";
import { prisma } from "./src/lib/prisma.js";
import { generateAccessToken } from "./src/utils/jwt.js";
import { UserRole, UserStatus, EmploymentStatus } from "./src/generated/prisma/client.js";
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

async function runWeek2Tests() {
  console.log("\n=======================================================");
  console.log("   ERMS WEEK 2: ACCESS CONTROL & EMPLOYEES TEST SUITE  ");
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

  // Test Entities Setup
  let companyAId = "";
  let companyBId = "";
  let ownerAToken = "";
  let hrAToken = "";
  let empAToken = "";
  let ownerBToken = "";

  try {
    // ---------------------------------------------------------
    // SETUP: Create Companies and Users with Different Roles
    // ---------------------------------------------------------
    console.log("--- SETUP: Multi-Company & Role Fixtures ---");

    const companyA = await prisma.company.create({
      data: { name: `Oppidan India Alpha ${timestamp}` },
    });
    companyAId = companyA.id;

    const companyB = await prisma.company.create({
      data: { name: `Oppidan India Beta ${timestamp}` },
    });
    companyBId = companyB.id;

    const ownerA = await prisma.user.create({
      data: {
        email: `owner.alpha.${timestamp}@oppidan.test`,
        passwordHash: "dummyhash",
        name: "Owner Alpha",
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
        email: `hr.alpha.${timestamp}@oppidan.test`,
        passwordHash: "dummyhash",
        name: "HR Alpha",
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

    const empA = await prisma.user.create({
      data: {
        email: `emp.alpha.${timestamp}@oppidan.test`,
        passwordHash: "dummyhash",
        name: "Employee Alpha",
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
        companyId: companyAId,
      },
    });
    empAToken = generateAccessToken({
      userId: empA.id,
      email: empA.email,
      role: empA.role,
      companyId: empA.companyId,
    });

    const ownerB = await prisma.user.create({
      data: {
        email: `owner.beta.${timestamp}@oppidan.test`,
        passwordHash: "dummyhash",
        name: "Owner Beta",
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

    assert(Boolean(ownerAToken && hrAToken && empAToken && ownerBToken), "Test fixtures and auth tokens initialized");

    // ---------------------------------------------------------
    // DAY 11: Department Management API
    // ---------------------------------------------------------
    console.log("\n--- DAY 11: Department Management API ---");

    const deptCreateRes = await request(
      "POST",
      "/api/departments",
      { name: "Engineering", description: "Software & Technology" },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(deptCreateRes.status === 201 && deptCreateRes.data.data?.department?.name === "Engineering", "Owner creates department", deptCreateRes.data);
    const engineeringDeptId = deptCreateRes.data.data?.department?.id;

    // Duplicate Department in Same Company
    const dupDeptRes = await request(
      "POST",
      "/api/departments",
      { name: "Engineering" },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(dupDeptRes.status === 409, "Rejects duplicate department name within company", dupDeptRes.data);

    // List Departments
    const listDeptRes = await request(
      "GET",
      "/api/departments",
      undefined,
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(
      listDeptRes.status === 200 && Array.isArray(listDeptRes.data.data?.departments) && listDeptRes.data.data.departments.length >= 1,
      "List departments returns array of departments",
      listDeptRes.data
    );

    // ---------------------------------------------------------
    // DAY 11: Designation Management API
    // ---------------------------------------------------------
    console.log("\n--- DAY 11: Designation Management API ---");

    const desigCreateRes = await request(
      "POST",
      "/api/designations",
      { name: "Senior Lead Architect", description: "Technical Architecture" },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(desigCreateRes.status === 201 && desigCreateRes.data.data?.designation?.name === "Senior Lead Architect", "Owner creates designation", desigCreateRes.data);
    const leadDesigId = desigCreateRes.data.data?.designation?.id;

    const devDesigCreateRes = await request(
      "POST",
      "/api/designations",
      { name: "Full Stack Developer", description: "Frontend & Backend" },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(devDesigCreateRes.status === 201, "Creates second designation", devDesigCreateRes.data);
    const devDesigId = devDesigCreateRes.data.data?.designation?.id;

    // List Designations
    const listDesigRes = await request(
      "GET",
      "/api/designations",
      undefined,
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(
      listDesigRes.status === 200 && Array.isArray(listDesigRes.data.data?.designations) && listDesigRes.data.data.designations.length >= 2,
      "List designations returns array of designations",
      listDesigRes.data
    );

    // ---------------------------------------------------------
    // DAY 08: Employee Creation & Validation
    // ---------------------------------------------------------
    console.log("\n--- DAY 08: Employee Creation & Validation ---");

    // 1. Validation: Missing required fields
    const invalidEmpRes = await request(
      "POST",
      "/api/employees",
      { name: "" },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(invalidEmpRes.status === 400, "Rejects employee creation with missing required fields", invalidEmpRes.data);

    // 2. Create Supervisor Employee
    const supervisorCode = `EMP-MGR-${timestamp}`;
    const supervisorRes = await request(
      "POST",
      "/api/employees",
      {
        name: "Arjun Verma",
        email: `arjun.${timestamp}@oppidan.test`,
        employeeCode: supervisorCode,
        departmentId: engineeringDeptId,
        designationId: leadDesigId,
      },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(supervisorRes.status === 201 && supervisorRes.data.data?.employee?.employeeCode === supervisorCode, "Successfully creates supervisor employee", supervisorRes.data);
    const supervisorId = supervisorRes.data.data?.employee?.id;

    // 3. Create Direct Report Employee with Supervisor Mapping (Day 11)
    const empCode = `EMP-DEV-${timestamp}`;
    const empCreateRes = await request(
      "POST",
      "/api/employees",
      {
        name: "Sneha Patel",
        email: `sneha.${timestamp}@oppidan.test`,
        employeeCode: empCode,
        departmentId: engineeringDeptId,
        designationId: devDesigId,
        supervisorId: supervisorId,
      },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(empCreateRes.status === 201 && empCreateRes.data.data?.employee?.supervisor?.id === supervisorId, "Creates employee with supervisor mapping", empCreateRes.data);
    const employeeId = empCreateRes.data.data?.employee?.id;

    // 4. Duplicate Employee Code Rejection
    const dupCodeRes = await request(
      "POST",
      "/api/employees",
      {
        name: "Duplicate Tester",
        email: `unique.${timestamp}@oppidan.test`,
        employeeCode: empCode,
      },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(dupCodeRes.status === 409, "Rejects duplicate employee code with 409 Conflict", dupCodeRes.data);

    // 5. Duplicate Email Rejection
    const dupEmailRes = await request(
      "POST",
      "/api/employees",
      {
        name: "Duplicate Email Tester",
        email: `sneha.${timestamp}@oppidan.test`,
        employeeCode: `EMP-OTHER-${timestamp}`,
      },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(dupEmailRes.status === 409, "Rejects duplicate employee email with 409 Conflict", dupEmailRes.data);

    // ---------------------------------------------------------
    // DAY 08: Employee List, Search, and Filtering
    // ---------------------------------------------------------
    console.log("\n--- DAY 08: Search, Pagination & Filtering ---");

    // 1. List with Pagination
    const listRes = await request(
      "GET",
      "/api/employees?page=1&limit=10",
      undefined,
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(
      listRes.status === 200 &&
      listRes.data.data?.pagination?.total >= 2 &&
      Array.isArray(listRes.data.data?.employees),
      "List employees returns paginated result structure",
      listRes.data
    );

    // 2. Search by Name
    const searchRes = await request(
      "GET",
      "/api/employees?search=Sneha",
      undefined,
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(
      searchRes.status === 200 &&
      searchRes.data.data?.employees?.some((e: { name: string }) => e.name === "Sneha Patel"),
      "Search filter by name successfully matches employee",
      searchRes.data
    );

    // 3. Filter by Department
    const deptFilterRes = await request(
      "GET",
      `/api/employees?departmentId=${engineeringDeptId}`,
      undefined,
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(
      deptFilterRes.status === 200 &&
      deptFilterRes.data.data?.employees?.length >= 2,
      "Filter by departmentId successfully returns matching employees",
      deptFilterRes.data
    );

    // 4. Filter by Status
    const statusFilterRes = await request(
      "GET",
      "/api/employees?status=ACTIVE",
      undefined,
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(
      statusFilterRes.status === 200 &&
      statusFilterRes.data.data?.employees?.every((e: { status: string }) => e.status === "ACTIVE"),
      "Filter by status=ACTIVE returns only active employees",
      statusFilterRes.data
    );

    // ---------------------------------------------------------
    // DAY 09 & 11: Get Employee Detail, Supervisor & Subordinates
    // ---------------------------------------------------------
    console.log("\n--- DAY 09 & 11: Detail, Supervisor & Subordinate Relations ---");

    // Fetch Subordinate: should show supervisor
    const getSubordinateRes = await request(
      "GET",
      `/api/employees/${employeeId}`,
      undefined,
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(
      getSubordinateRes.status === 200 &&
      getSubordinateRes.data.data?.employee?.supervisor?.id === supervisorId &&
      getSubordinateRes.data.data?.employee?.department?.name === "Engineering",
      "Employee detail includes populated supervisor and department relations",
      getSubordinateRes.data
    );

    // Fetch Supervisor: should show subordinate in subordinates array
    const getSupervisorRes = await request(
      "GET",
      `/api/employees/${supervisorId}`,
      undefined,
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(
      getSupervisorRes.status === 200 &&
      Array.isArray(getSupervisorRes.data.data?.employee?.subordinates) &&
      getSupervisorRes.data.data?.employee?.subordinates.some((sub: { id: string }) => sub.id === employeeId),
      "Supervisor detail includes subordinates array with direct reports",
      getSupervisorRes.data
    );

    // ---------------------------------------------------------
    // DAY 09: Employee Update and Employment History Tracking
    // ---------------------------------------------------------
    console.log("\n--- DAY 09: Update Employee & Audit History Tracking ---");

    // Update employee designation to Lead Architect
    const updateRes = await request(
      "PATCH",
      `/api/employees/${employeeId}`,
      {
        name: "Sneha Patel (Promoted)",
        designationId: leadDesigId,
      },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(
      updateRes.status === 200 &&
      updateRes.data.data?.employee?.designation?.id === leadDesigId &&
      updateRes.data.data?.employee?.name === "Sneha Patel (Promoted)",
      "Employee update applies new designation and name",
      updateRes.data
    );

    // Fetch History: should contain DESIGNATION_CHANGE audit record
    const historyRes = await request(
      "GET",
      `/api/employees/${employeeId}/history`,
      undefined,
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(
      historyRes.status === 200 &&
      Array.isArray(historyRes.data.data?.history) &&
      historyRes.data.data?.history.some((h: { eventType: string }) => h.eventType === "DESIGNATION_CHANGE"),
      "Employment history logs DESIGNATION_CHANGE event with previous and new values",
      historyRes.data
    );

    // ---------------------------------------------------------
    // DAY 09: Employee Deactivation Flow
    // ---------------------------------------------------------
    console.log("\n--- DAY 09: Deactivation Flow ---");

    const deactRes = await request(
      "PATCH",
      `/api/employees/${employeeId}/deactivate`,
      { reason: "Relocated to branch office" },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(
      deactRes.status === 200 &&
      deactRes.data.data?.employee?.status === EmploymentStatus.INACTIVE &&
      deactRes.data.data?.employee?.deactivatedAt !== null,
      "Employee deactivated with status INACTIVE and timestamp",
      deactRes.data
    );

    // Check history has DEACTIVATED entry with reason
    const postDeactHistRes = await request(
      "GET",
      `/api/employees/${employeeId}/history`,
      undefined,
      { Authorization: `Bearer ${ownerAToken}` }
    );
    const deactEvent = postDeactHistRes.data.data?.history?.find((h: { eventType: string }) => h.eventType === "DEACTIVATED");
    assert(
      deactEvent?.reason === "Relocated to branch office" &&
      deactEvent?.previousValue === EmploymentStatus.ACTIVE,
      "Audit trail records DEACTIVATED event with custom reason",
      deactEvent
    );

    // Deactivating again returns 409 Conflict
    const deactAgainRes = await request(
      "PATCH",
      `/api/employees/${employeeId}/deactivate`,
      { reason: "Already inactive" },
      { Authorization: `Bearer ${ownerAToken}` }
    );
    assert(deactAgainRes.status === 409, "Rejects deactivating already inactive employee with 409 Conflict", deactAgainRes.data);

    // ---------------------------------------------------------
    // DAY 07: Multi-Tenant Company Isolation Enforcement
    // ---------------------------------------------------------
    console.log("\n--- DAY 07: Multi-Tenant Company Isolation ---");

    // Company B Owner attempts to access Company A's employee
    const crossCompanyGetRes = await request(
      "GET",
      `/api/employees/${employeeId}`,
      undefined,
      { Authorization: `Bearer ${ownerBToken}` }
    );
    assert(crossCompanyGetRes.status === 404, "Cross-company employee read returns 404 (isolated)", crossCompanyGetRes.data);

    // Company B Owner attempts to update Company A's employee
    const crossCompanyPatchRes = await request(
      "PATCH",
      `/api/employees/${employeeId}`,
      { name: "Malicious Cross-Tenant Tamper" },
      { Authorization: `Bearer ${ownerBToken}` }
    );
    assert(crossCompanyPatchRes.status === 404, "Cross-company employee update returns 404 (isolated)", crossCompanyPatchRes.data);

    // Company B Owner attempts to deactivate Company A's employee
    const crossCompanyDeactRes = await request(
      "PATCH",
      `/api/employees/${employeeId}/deactivate`,
      { reason: "Cross-tenant attempt" },
      { Authorization: `Bearer ${ownerBToken}` }
    );
    assert(crossCompanyDeactRes.status === 404, "Cross-company employee deactivate returns 404 (isolated)", crossCompanyDeactRes.data);

    // Company B employee list must not show Company A employees
    const compBListRes = await request(
      "GET",
      "/api/employees",
      undefined,
      { Authorization: `Bearer ${ownerBToken}` }
    );
    assert(
      compBListRes.status === 200 &&
      compBListRes.data.data?.pagination?.total === 0,
      "Company B employee list contains 0 employees (no tenant leakage)",
      compBListRes.data
    );

    // ---------------------------------------------------------
    // DAY 07: Role-Based Authorization & Permissions (RBAC)
    // ---------------------------------------------------------
    console.log("\n--- DAY 07: Role-Based Authorization & Permissions (RBAC) ---");

    // EMPLOYEE role cannot create new employees (requires EMPLOYEE_CREATE)
    const empForbiddenCreateRes = await request(
      "POST",
      "/api/employees",
      {
        name: "Unauthorized Employee",
        email: `unauth.${timestamp}@oppidan.test`,
        employeeCode: `UNAUTH-${timestamp}`,
      },
      { Authorization: `Bearer ${empAToken}` }
    );
    assert(empForbiddenCreateRes.status === 403, "EMPLOYEE role is forbidden from creating employees (403)", empForbiddenCreateRes.data);

    // EMPLOYEE role cannot deactivate employees (requires EMPLOYEE_DEACTIVATE)
    const empForbiddenDeactRes = await request(
      "PATCH",
      `/api/employees/${employeeId}/deactivate`,
      { reason: "Employee trying to deactivate" },
      { Authorization: `Bearer ${empAToken}` }
    );
    assert(empForbiddenDeactRes.status === 403, "EMPLOYEE role is forbidden from deactivating employees (403)", empForbiddenDeactRes.data);

    // EMPLOYEE role cannot create departments (requires DEPARTMENT_CREATE)
    const empForbiddenDeptRes = await request(
      "POST",
      "/api/departments",
      { name: "Unauthorized Department" },
      { Authorization: `Bearer ${empAToken}` }
    );
    assert(empForbiddenDeptRes.status === 403, "EMPLOYEE role is forbidden from creating departments (403)", empForbiddenDeptRes.data);

    // HR role CAN create employee (has EMPLOYEE_CREATE)
    const hrAllowedCreateRes = await request(
      "POST",
      "/api/employees",
      {
        name: "Vikram Malhotra",
        email: `vikram.${timestamp}@oppidan.test`,
        employeeCode: `EMP-HR-ADDED-${timestamp}`,
        departmentId: engineeringDeptId,
      },
      { Authorization: `Bearer ${hrAToken}` }
    );
    assert(hrAllowedCreateRes.status === 201, "HR role successfully creates employee (permitted)", hrAllowedCreateRes.data);

  } finally {
    // Teardown / Cleanup
    if (companyAId || companyBId) {
      await prisma.employmentHistory.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.employee.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.department.deleteMany({
        where: { companyId: { in: [companyAId, companyBId] } },
      });
      await prisma.designation.deleteMany({
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

runWeek2Tests().catch((err) => {
  console.error("Fatal error during Week 2 tests:", err);
  process.exit(1);
});
