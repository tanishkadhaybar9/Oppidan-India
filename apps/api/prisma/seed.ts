/**
 * ERMS Demo Data Seed Script
 *
 * Usage:
 *   cd apps/api
 *   npx tsx prisma/seed.ts
 *
 * Safety:
 *   - Uses upsert / createIfNotExists logic — safe to re-run
 *   - Never drops or resets the database
 *   - Never deletes existing user-created data
 *   - Only inserts data when the record doesn't already exist (by unique key)
 *   - Requires DATABASE_URL in apps/api/.env
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client.js";

// Load .env from apps/api/.env regardless of where the script is invoked from
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

let dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl.includes("pool_timeout")) {
  dbUrl += "&pool_timeout=30&connection_limit=1";
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: dbUrl },
  },
  log: ["warn", "error"],
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

function ago(days: number, hours = 9, minutes = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Seed Constants ──────────────────────────────────────────────────────────

const COMPANY_NAME = "Oppidan India Pvt. Ltd.";

// Fixed UUIDs so the seed is idempotent
const IDS = {
  company: "11111111-0000-0000-0000-000000000001",

  // Departments
  deptEngineering:  "22220000-0000-0000-0000-000000000001",
  deptHR:           "22220000-0000-0000-0000-000000000002",
  deptOperations:   "22220000-0000-0000-0000-000000000003",
  deptFinance:      "22220000-0000-0000-0000-000000000004",
  deptSales:        "22220000-0000-0000-0000-000000000005",
  deptMarketing:    "22220000-0000-0000-0000-000000000006",

  // Designations
  desigSWE:         "33330000-0000-0000-0000-000000000001",
  desigSrSWE:       "33330000-0000-0000-0000-000000000002",
  desigTechLead:    "33330000-0000-0000-0000-000000000003",
  desigHROfficer:   "33330000-0000-0000-0000-000000000004",
  desigHRManager:   "33330000-0000-0000-0000-000000000005",
  desigOpsExec:     "33330000-0000-0000-0000-000000000006",
  desigOpsManager:  "33330000-0000-0000-0000-000000000007",
  desigAccountant:  "33330000-0000-0000-0000-000000000008",
  desigFinManager:  "33330000-0000-0000-0000-000000000009",
  desigSalesExec:   "33330000-0000-0000-0000-000000000010",
  desigSalesManager:"33330000-0000-0000-0000-000000000011",
  desigMktExec:     "33330000-0000-0000-0000-000000000012",

  // Users (seed users — login-capable demo accounts)
  userOwner:        "44440000-0000-0000-0000-000000000001",
  userHR:           "44440000-0000-0000-0000-000000000002",
  userManager1:     "44440000-0000-0000-0000-000000000003",  // Eng Manager
  userManager2:     "44440000-0000-0000-0000-000000000004",  // Ops Manager
  userSupervisor1:  "44440000-0000-0000-0000-000000000005",  // Tech Lead / Supervisor
  userEmp1:         "44440000-0000-0000-0000-000000000006",
  userEmp2:         "44440000-0000-0000-0000-000000000007",
  userEmp3:         "44440000-0000-0000-0000-000000000008",
  userEmp4:         "44440000-0000-0000-0000-000000000009",
  userEmp5:         "44440000-0000-0000-0000-000000000010",

  // Employees (20 total — 10 linked to users above, 10 employee-only)
  empOwner:         "55550000-0000-0000-0000-000000000001",
  empHR:            "55550000-0000-0000-0000-000000000002",
  empMgr1:          "55550000-0000-0000-0000-000000000003",  // Eng Manager
  empMgr2:          "55550000-0000-0000-0000-000000000004",  // Ops Manager
  empSup1:          "55550000-0000-0000-0000-000000000005",  // Tech Lead
  empE1:            "55550000-0000-0000-0000-000000000006",
  empE2:            "55550000-0000-0000-0000-000000000007",
  empE3:            "55550000-0000-0000-0000-000000000008",
  empE4:            "55550000-0000-0000-0000-000000000009",
  empE5:            "55550000-0000-0000-0000-000000000010",
  empE6:            "55550000-0000-0000-0000-000000000011",
  empE7:            "55550000-0000-0000-0000-000000000012",
  empE8:            "55550000-0000-0000-0000-000000000013",
  empE9:            "55550000-0000-0000-0000-000000000014",
  empE10:           "55550000-0000-0000-0000-000000000015",
  empE11:           "55550000-0000-0000-0000-000000000016",
  empE12:           "55550000-0000-0000-0000-000000000017",
  empE13:           "55550000-0000-0000-0000-000000000018",
  empE14:           "55550000-0000-0000-0000-000000000019",
  empE15:           "55550000-0000-0000-0000-000000000020",

  // Shifts
  shiftMorning:     "66660000-0000-0000-0000-000000000001",
  shiftAfternoon:   "66660000-0000-0000-0000-000000000002",
  shiftNight:       "66660000-0000-0000-0000-000000000003",
  shiftFlexible:    "66660000-0000-0000-0000-000000000004",

  // Leave Types
  ltAnnual:         "77770000-0000-0000-0000-000000000001",
  ltSick:           "77770000-0000-0000-0000-000000000002",
  ltCasual:         "77770000-0000-0000-0000-000000000003",
  ltMaternity:      "77770000-0000-0000-0000-000000000004",
  ltPaternity:      "77770000-0000-0000-0000-000000000005",

  // Assets (10)
  asset1:           "88880000-0000-0000-0000-000000000001",
  asset2:           "88880000-0000-0000-0000-000000000002",
  asset3:           "88880000-0000-0000-0000-000000000003",
  asset4:           "88880000-0000-0000-0000-000000000004",
  asset5:           "88880000-0000-0000-0000-000000000005",
  asset6:           "88880000-0000-0000-0000-000000000006",
  asset7:           "88880000-0000-0000-0000-000000000007",
  asset8:           "88880000-0000-0000-0000-000000000008",
  asset9:           "88880000-0000-0000-0000-000000000009",
  asset10:          "88880000-0000-0000-0000-000000000010",
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting ERMS demo data seed...\n");

  // ── 1. Company ─────────────────────────────────────────────────────────────
  console.log("1️⃣  Upserting company...");
  const company = await prisma.company.upsert({
    where: { id: IDS.company },
    update: {},
    create: { id: IDS.company, name: COMPANY_NAME },
  });
  console.log(`   ✓ ${company.name} (${company.id})`);

  // ── 2. Departments ─────────────────────────────────────────────────────────
  console.log("\n2️⃣  Upserting departments...");
  const departments = [
    { id: IDS.deptEngineering, name: "Engineering" },
    { id: IDS.deptHR,          name: "Human Resources" },
    { id: IDS.deptOperations,  name: "Operations" },
    { id: IDS.deptFinance,     name: "Finance" },
    { id: IDS.deptSales,       name: "Sales" },
    { id: IDS.deptMarketing,   name: "Marketing" },
  ];
  for (const d of departments) {
    await prisma.department.upsert({
      where: { id: d.id },
      update: {},
      create: { id: d.id, name: d.name, companyId: IDS.company, status: "ACTIVE" },
    });
    console.log(`   ✓ ${d.name}`);
  }

  // ── 3. Designations ────────────────────────────────────────────────────────
  console.log("\n3️⃣  Upserting designations...");
  const designations = [
    { id: IDS.desigSWE,         name: "Software Engineer",        deptHint: "Engineering" },
    { id: IDS.desigSrSWE,       name: "Senior Software Engineer", deptHint: "Engineering" },
    { id: IDS.desigTechLead,    name: "Tech Lead",                deptHint: "Engineering" },
    { id: IDS.desigHROfficer,   name: "HR Officer",               deptHint: "Human Resources" },
    { id: IDS.desigHRManager,   name: "HR Manager",               deptHint: "Human Resources" },
    { id: IDS.desigOpsExec,     name: "Operations Executive",     deptHint: "Operations" },
    { id: IDS.desigOpsManager,  name: "Operations Manager",       deptHint: "Operations" },
    { id: IDS.desigAccountant,  name: "Accountant",               deptHint: "Finance" },
    { id: IDS.desigFinManager,  name: "Finance Manager",          deptHint: "Finance" },
    { id: IDS.desigSalesExec,   name: "Sales Executive",          deptHint: "Sales" },
    { id: IDS.desigSalesManager,name: "Sales Manager",            deptHint: "Sales" },
    { id: IDS.desigMktExec,     name: "Marketing Executive",      deptHint: "Marketing" },
  ];
  for (const d of designations) {
    await prisma.designation.upsert({
      where: { id: d.id },
      update: {},
      create: { id: d.id, name: d.name, companyId: IDS.company, status: "ACTIVE" },
    });
    console.log(`   ✓ ${d.name}`);
  }

  // ── 4. Users + Employees ───────────────────────────────────────────────────
  console.log("\n4️⃣  Upserting users & employee records...");

  const userDefs = [
    {
      userId: IDS.userOwner,     empId: IDS.empOwner,
      name: "Tanishka Dhaybar",  email: "owner@oppidan.in",        password: "Owner@1234",
      role: "OWNER" as const,    deptId: IDS.deptEngineering,      desigId: IDS.desigTechLead,
      empCode: "EMP-0001",       empRole: "OWNER",                 joiningDays: 400,
    },
    {
      userId: IDS.userHR,        empId: IDS.empHR,
      name: "Priya Sharma",      email: "priya.sharma@oppidan.in",  password: "Demo@1234",
      role: "HR" as const,       deptId: IDS.deptHR,               desigId: IDS.desigHRManager,
      empCode: "EMP-0002",       empRole: "HR",                    joiningDays: 380,
    },
    {
      userId: IDS.userManager1,  empId: IDS.empMgr1,
      name: "Rahul Verma",       email: "rahul.verma@oppidan.in",   password: "Demo@1234",
      role: "MANAGER" as const,  deptId: IDS.deptEngineering,      desigId: IDS.desigSrSWE,
      empCode: "EMP-0003",       empRole: "MANAGER",               joiningDays: 360,
    },
    {
      userId: IDS.userManager2,  empId: IDS.empMgr2,
      name: "Anjali Mehta",      email: "anjali.mehta@oppidan.in",  password: "Demo@1234",
      role: "MANAGER" as const,  deptId: IDS.deptOperations,       desigId: IDS.desigOpsManager,
      empCode: "EMP-0004",       empRole: "MANAGER",               joiningDays: 350,
    },
    {
      userId: IDS.userSupervisor1, empId: IDS.empSup1,
      name: "Karan Patel",         email: "karan.patel@oppidan.in", password: "Demo@1234",
      role: "SUPERVISOR" as const, deptId: IDS.deptEngineering,    desigId: IDS.desigTechLead,
      empCode: "EMP-0005",         empRole: "SUPERVISOR",          joiningDays: 320,
    },
    {
      userId: IDS.userEmp1,       empId: IDS.empE1,
      name: "Deepika Singh",      email: "deepika.singh@oppidan.in", password: "Demo@1234",
      role: "EMPLOYEE" as const,  deptId: IDS.deptEngineering,      desigId: IDS.desigSWE,
      empCode: "EMP-0006",        empRole: "EMPLOYEE",              joiningDays: 300,
    },
    {
      userId: IDS.userEmp2,       empId: IDS.empE2,
      name: "Amit Joshi",         email: "amit.joshi@oppidan.in",    password: "Demo@1234",
      role: "EMPLOYEE" as const,  deptId: IDS.deptEngineering,      desigId: IDS.desigSWE,
      empCode: "EMP-0007",        empRole: "EMPLOYEE",              joiningDays: 280,
    },
    {
      userId: IDS.userEmp3,       empId: IDS.empE3,
      name: "Sneha Kulkarni",     email: "sneha.kulkarni@oppidan.in",password: "Demo@1234",
      role: "EMPLOYEE" as const,  deptId: IDS.deptHR,               desigId: IDS.desigHROfficer,
      empCode: "EMP-0008",        empRole: "EMPLOYEE",              joiningDays: 260,
    },
    {
      userId: IDS.userEmp4,       empId: IDS.empE4,
      name: "Vikram Reddy",       email: "vikram.reddy@oppidan.in",  password: "Demo@1234",
      role: "EMPLOYEE" as const,  deptId: IDS.deptFinance,          desigId: IDS.desigAccountant,
      empCode: "EMP-0009",        empRole: "EMPLOYEE",              joiningDays: 240,
    },
    {
      userId: IDS.userEmp5,       empId: IDS.empE5,
      name: "Meera Nair",         email: "meera.nair@oppidan.in",    password: "Demo@1234",
      role: "EMPLOYEE" as const,  deptId: IDS.deptSales,            desigId: IDS.desigSalesExec,
      empCode: "EMP-0010",        empRole: "EMPLOYEE",              joiningDays: 220,
    },
  ];

  // Employee-only records (no login account)
  const empOnlyDefs = [
    { empId: IDS.empE6,  empCode: "EMP-0011", name: "Rohan Desai",       email: "rohan.desai@oppidan.in",       deptId: IDS.deptEngineering, desigId: IDS.desigSrSWE,       joiningDays: 200 },
    { empId: IDS.empE7,  empCode: "EMP-0012", name: "Pooja Iyer",        email: "pooja.iyer@oppidan.in",        deptId: IDS.deptMarketing,   desigId: IDS.desigMktExec,     joiningDays: 190 },
    { empId: IDS.empE8,  empCode: "EMP-0013", name: "Arjun Gupta",       email: "arjun.gupta@oppidan.in",       deptId: IDS.deptSales,       desigId: IDS.desigSalesExec,   joiningDays: 180 },
    { empId: IDS.empE9,  empCode: "EMP-0014", name: "Nisha Kapoor",      email: "nisha.kapoor@oppidan.in",      deptId: IDS.deptFinance,     desigId: IDS.desigAccountant,  joiningDays: 170 },
    { empId: IDS.empE10, empCode: "EMP-0015", name: "Suresh Bhatt",      email: "suresh.bhatt@oppidan.in",      deptId: IDS.deptOperations,  desigId: IDS.desigOpsExec,     joiningDays: 160 },
    { empId: IDS.empE11, empCode: "EMP-0016", name: "Kavitha Rao",       email: "kavitha.rao@oppidan.in",       deptId: IDS.deptHR,          desigId: IDS.desigHROfficer,   joiningDays: 150 },
    { empId: IDS.empE12, empCode: "EMP-0017", name: "Manish Tripathi",   email: "manish.tripathi@oppidan.in",   deptId: IDS.deptEngineering, desigId: IDS.desigSWE,         joiningDays: 140 },
    { empId: IDS.empE13, empCode: "EMP-0018", name: "Ritu Pandey",       email: "ritu.pandey@oppidan.in",       deptId: IDS.deptMarketing,   desigId: IDS.desigMktExec,     joiningDays: 120 },
    { empId: IDS.empE14, empCode: "EMP-0019", name: "Sanjay Malhotra",   email: "sanjay.malhotra@oppidan.in",   deptId: IDS.deptSales,       desigId: IDS.desigSalesManager,joiningDays: 100 },
    { empId: IDS.empE15, empCode: "EMP-0020", name: "Lavanya Krishnan",  email: "lavanya.krishnan@oppidan.in",  deptId: IDS.deptOperations,  desigId: IDS.desigOpsExec,     joiningDays: 90  },
  ];

  // Upsert users + linked employees
  for (const u of userDefs) {
    const existing = await prisma.user.findUnique({ where: { id: u.userId } });
    if (!existing) {
      const hash = await hashPassword(u.password);
      await prisma.user.create({
        data: {
          id: u.userId,
          name: u.name,
          email: u.email,
          passwordHash: hash,
          role: u.role,
          status: "ACTIVE",
          companyId: IDS.company,
        },
      });
      console.log(`   ✓ User created: ${u.email} [${u.role}]`);
    } else {
      console.log(`   – User exists:  ${u.email}`);
    }

    const existingEmp = await prisma.employee.findUnique({ where: { id: u.empId } });
    if (!existingEmp) {
      await prisma.employee.create({
        data: {
          id: u.empId,
          companyId: IDS.company,
          userId: u.userId,
          name: u.name,
          email: u.email,
          employeeCode: u.empCode,
          role: u.empRole,
          status: "ACTIVE",
          departmentId: u.deptId,
          designationId: u.desigId,
          joiningDate: ago(u.joiningDays),
        },
      });
      console.log(`   ✓ Employee created: ${u.empCode} - ${u.name}`);
    } else {
      console.log(`   – Employee exists: ${u.empCode}`);
    }
  }

  // Upsert employee-only records
  for (const e of empOnlyDefs) {
    const existingEmp = await prisma.employee.findUnique({ where: { id: e.empId } });
    if (!existingEmp) {
      await prisma.employee.create({
        data: {
          id: e.empId,
          companyId: IDS.company,
          name: e.name,
          email: e.email,
          employeeCode: e.empCode,
          role: "EMPLOYEE",
          status: "ACTIVE",
          departmentId: e.deptId,
          designationId: e.desigId,
          joiningDate: ago(e.joiningDays),
        },
      });
      console.log(`   ✓ Employee created: ${e.empCode} - ${e.name}`);
    } else {
      console.log(`   – Employee exists: ${e.empCode}`);
    }
  }

  // ── 5. Supervisor mappings ─────────────────────────────────────────────────
  console.log("\n5️⃣  Setting supervisor mappings...");
  const supervisorMap: Array<[string, string]> = [
    // [employeeId, supervisorId]
    [IDS.empE1,  IDS.empSup1],  // Deepika → Karan
    [IDS.empE2,  IDS.empSup1],  // Amit → Karan
    [IDS.empE6,  IDS.empSup1],  // Rohan → Karan
    [IDS.empE12, IDS.empSup1],  // Manish → Karan
    [IDS.empE7,  IDS.empMgr1],  // Pooja (Mkt) → Rahul (Eng Mgr, cross-dept)
    [IDS.empE8,  IDS.empMgr2],  // Arjun (Sales) → Anjali (Ops Mgr)
    [IDS.empE9,  IDS.empMgr1],  // Nisha (Fin) → Rahul
    [IDS.empE10, IDS.empMgr2],  // Suresh → Anjali
    [IDS.empE11, IDS.empHR],    // Kavitha → Priya (HR)
    [IDS.empE3,  IDS.empHR],    // Sneha → Priya (HR)
    [IDS.empE4,  IDS.empMgr1],  // Vikram → Rahul
    [IDS.empE5,  IDS.empMgr2],  // Meera → Anjali
    [IDS.empE13, IDS.empMgr2],  // Ritu → Anjali
    [IDS.empE14, IDS.empMgr2],  // Sanjay → Anjali
    [IDS.empE15, IDS.empMgr2],  // Lavanya → Anjali
  ];
  for (const [empId, supId] of supervisorMap) {
    await prisma.employee.update({
      where: { id: empId },
      data: { supervisorId: supId },
    }).catch(() => {}); // skip if already set or doesn't exist
    console.log(`   ✓ Mapped ${empId.slice(-4)} → ${supId.slice(-4)}`);
  }

  // ── 6. Shifts ──────────────────────────────────────────────────────────────
  console.log("\n6️⃣  Upserting shifts...");
  const shifts = [
    {
      id: IDS.shiftMorning, name: "Morning Shift", code: "SHIFT-MORN",
      startTime: "09:00", endTime: "18:00", breakDurationMinutes: 60, gracePeriodMinutes: 10,
      workingDays: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"],
    },
    {
      id: IDS.shiftAfternoon, name: "Afternoon Shift", code: "SHIFT-AFTN",
      startTime: "13:00", endTime: "22:00", breakDurationMinutes: 60, gracePeriodMinutes: 10,
      workingDays: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"],
    },
    {
      id: IDS.shiftNight, name: "Night Shift", code: "SHIFT-NGHT",
      startTime: "22:00", endTime: "06:00", breakDurationMinutes: 30, gracePeriodMinutes: 15,
      workingDays: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"],
      isOvernight: true,
    },
    {
      id: IDS.shiftFlexible, name: "Flexible Hours", code: "SHIFT-FLEX",
      startTime: "08:00", endTime: "17:00", breakDurationMinutes: 60, gracePeriodMinutes: 30,
      workingDays: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"],
    },
  ];
  for (const s of shifts) {
    await prisma.shift.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id, companyId: IDS.company, name: s.name, code: s.code,
        startTime: s.startTime, endTime: s.endTime,
        breakDurationMinutes: s.breakDurationMinutes,
        gracePeriodMinutes: s.gracePeriodMinutes,
        workingDays: s.workingDays,
        isOvernight: (s as { isOvernight?: boolean }).isOvernight ?? false,
        status: "ACTIVE",
      },
    });
    console.log(`   ✓ ${s.name}`);
  }

  // ── 7. Shift Assignments ───────────────────────────────────────────────────
  console.log("\n7️⃣  Creating shift assignments (skip if exists)...");
  const shiftAssignments = [
    // Engineering → Morning
    { empId: IDS.empMgr1,  shiftId: IDS.shiftMorning,   from: ago(360) },
    { empId: IDS.empSup1,  shiftId: IDS.shiftMorning,   from: ago(320) },
    { empId: IDS.empE1,    shiftId: IDS.shiftMorning,   from: ago(300) },
    { empId: IDS.empE2,    shiftId: IDS.shiftMorning,   from: ago(280) },
    { empId: IDS.empE6,    shiftId: IDS.shiftMorning,   from: ago(200) },
    { empId: IDS.empE12,   shiftId: IDS.shiftMorning,   from: ago(140) },
    // HR → Flexible
    { empId: IDS.empHR,    shiftId: IDS.shiftFlexible,  from: ago(380) },
    { empId: IDS.empE3,    shiftId: IDS.shiftFlexible,  from: ago(260) },
    { empId: IDS.empE11,   shiftId: IDS.shiftFlexible,  from: ago(150) },
    // Operations → Afternoon
    { empId: IDS.empMgr2,  shiftId: IDS.shiftAfternoon, from: ago(350) },
    { empId: IDS.empE10,   shiftId: IDS.shiftAfternoon, from: ago(160) },
    { empId: IDS.empE15,   shiftId: IDS.shiftAfternoon, from: ago(90) },
    // Finance, Sales, Marketing → Morning
    { empId: IDS.empE4,    shiftId: IDS.shiftMorning,   from: ago(240) },
    { empId: IDS.empE9,    shiftId: IDS.shiftMorning,   from: ago(170) },
    { empId: IDS.empE5,    shiftId: IDS.shiftMorning,   from: ago(220) },
    { empId: IDS.empE8,    shiftId: IDS.shiftMorning,   from: ago(180) },
    { empId: IDS.empE14,   shiftId: IDS.shiftMorning,   from: ago(100) },
    { empId: IDS.empE7,    shiftId: IDS.shiftFlexible,  from: ago(190) },
    { empId: IDS.empE13,   shiftId: IDS.shiftFlexible,  from: ago(120) },
    { empId: IDS.empOwner, shiftId: IDS.shiftFlexible,  from: ago(400) },
  ];

  let saCreated = 0, saSkipped = 0;
  const shiftAssignmentIds: Record<string, string> = {};
  for (const sa of shiftAssignments) {
    // Check if this employee already has a shift assignment
    const existing = await prisma.shiftAssignment.findFirst({
      where: { companyId: IDS.company, employeeId: sa.empId },
    });
    if (!existing) {
      const created = await prisma.shiftAssignment.create({
        data: {
          companyId: IDS.company,
          employeeId: sa.empId,
          shiftId: sa.shiftId,
          effectiveFrom: sa.from,
        },
      });
      shiftAssignmentIds[sa.empId] = created.id;
      saCreated++;
    } else {
      shiftAssignmentIds[sa.empId] = existing.id;
      saSkipped++;
    }
  }
  console.log(`   ✓ Created: ${saCreated}, Skipped (already exist): ${saSkipped}`);

  // ── 8. Attendance Records (last 30 days) ───────────────────────────────────
  console.log("\n8️⃣  Creating attendance records...");
  const attendanceEmployees = [
    { empId: IDS.empOwner, shiftId: IDS.shiftFlexible },
    { empId: IDS.empHR,    shiftId: IDS.shiftFlexible },
    { empId: IDS.empMgr1,  shiftId: IDS.shiftMorning },
    { empId: IDS.empMgr2,  shiftId: IDS.shiftAfternoon },
    { empId: IDS.empSup1,  shiftId: IDS.shiftMorning },
    { empId: IDS.empE1,    shiftId: IDS.shiftMorning },
    { empId: IDS.empE2,    shiftId: IDS.shiftMorning },
    { empId: IDS.empE3,    shiftId: IDS.shiftFlexible },
    { empId: IDS.empE4,    shiftId: IDS.shiftMorning },
    { empId: IDS.empE5,    shiftId: IDS.shiftMorning },
    { empId: IDS.empE6,    shiftId: IDS.shiftMorning },
    { empId: IDS.empE7,    shiftId: IDS.shiftFlexible },
    { empId: IDS.empE8,    shiftId: IDS.shiftMorning },
    { empId: IDS.empE9,    shiftId: IDS.shiftMorning },
    { empId: IDS.empE10,   shiftId: IDS.shiftAfternoon },
  ];

  type AttStatus = "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "ON_LEAVE" | "WEEKEND";
  const statusPool: AttStatus[] = [
    "PRESENT","PRESENT","PRESENT","PRESENT","PRESENT","PRESENT","PRESENT",
    "LATE","LATE",
    "HALF_DAY",
    "ABSENT",
  ];

  const attendanceRecords: any[] = [];
  for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    const dow = date.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dow === 0 || dow === 6;
    const dStr = dateStr(date);

    for (const { empId, shiftId } of attendanceEmployees) {
      let status: AttStatus = isWeekend ? "WEEKEND" : statusPool[Math.floor(Math.random() * statusPool.length)];
      let clockIn: Date | null = null;
      let clockOut: Date | null = null;
      let lateMinutes = 0, workedMinutes = 0, breakMinutes = 60;

      if (!isWeekend && status !== "ABSENT" && status !== "ON_LEAVE") {
        const baseHour = shiftId === IDS.shiftAfternoon ? 13 : 9;
        const shiftEndHour = shiftId === IDS.shiftAfternoon ? 22 : 18;

        if (status === "LATE") {
          lateMinutes = 15 + Math.floor(Math.random() * 30);
          clockIn = new Date(date); clockIn.setHours(baseHour, lateMinutes, 0, 0);
        } else if (status === "HALF_DAY") {
          clockIn = new Date(date); clockIn.setHours(baseHour, 5, 0, 0);
          clockOut = new Date(date); clockOut.setHours(baseHour + 4, 0, 0, 0);
          workedMinutes = 240; breakMinutes = 0;
        } else {
          clockIn = new Date(date); clockIn.setHours(baseHour, Math.floor(Math.random() * 10), 0, 0);
        }

        if (status !== "HALF_DAY" && clockIn) {
          clockOut = new Date(date);
          clockOut.setHours(shiftEndHour, Math.floor(Math.random() * 15), 0, 0);
          const diffMs = clockOut.getTime() - clockIn.getTime();
          workedMinutes = Math.max(0, Math.floor(diffMs / 60000) - breakMinutes);
        }
      }

      attendanceRecords.push({
        companyId: IDS.company,
        employeeId: empId,
        shiftId: isWeekend ? null : shiftId,
        shiftAssignmentId: isWeekend ? null : (shiftAssignmentIds[empId] ?? null),
        attendanceDate: dStr,
        clockIn: clockIn ?? undefined,
        clockOut: clockOut ?? undefined,
        status,
        lateMinutes,
        workedMinutes,
        breakMinutes: (status === "PRESENT" || status === "LATE") ? breakMinutes : 0,
        overtimeMinutes: workedMinutes > 480 ? workedMinutes - 480 : 0,
        earlyDepartureMinutes: 0,
      });
    }
  }

  const attResult = await prisma.attendance.createMany({
    data: attendanceRecords,
    skipDuplicates: true,
  });
  console.log(`   ✓ Created attendance records: ${attResult.count}`);

  // ── 9. Leave Types ─────────────────────────────────────────────────────────
  console.log("\n9️⃣  Upserting leave types...");
  const leaveTypes = [
    { id: IDS.ltAnnual,   name: "Annual Leave",    code: "AL",  paid: true,  maxDays: 20, allowCarry: true },
    { id: IDS.ltSick,     name: "Sick Leave",      code: "SL",  paid: true,  maxDays: 12, allowCarry: false },
    { id: IDS.ltCasual,   name: "Casual Leave",    code: "CL",  paid: true,  maxDays: 8,  allowCarry: false },
    { id: IDS.ltMaternity,name: "Maternity Leave", code: "ML",  paid: true,  maxDays: 90, allowCarry: false },
    { id: IDS.ltPaternity,name: "Paternity Leave", code: "PL",  paid: true,  maxDays: 5,  allowCarry: false },
  ];
  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { id: lt.id },
      update: {},
      create: {
        id: lt.id, companyId: IDS.company, name: lt.name, code: lt.code,
        paid: lt.paid, maximumDays: lt.maxDays, requiresApproval: true,
        allowHalfDay: true, allowCarryForward: lt.allowCarry,
        minimumNoticeDays: lt.code === "SL" ? 0 : 1, status: "ACTIVE",
      },
    });
    console.log(`   ✓ ${lt.name}`);
  }

  // ── 10. Leave Balances ─────────────────────────────────────────────────────
  console.log("\n🔟  Upserting leave balances...");
  const periodStart = new Date("2026-01-01");
  const periodEnd   = new Date("2026-12-31");
  const allEmpIds = [
    IDS.empOwner, IDS.empHR, IDS.empMgr1, IDS.empMgr2, IDS.empSup1,
    IDS.empE1, IDS.empE2, IDS.empE3, IDS.empE4, IDS.empE5,
    IDS.empE6, IDS.empE7, IDS.empE8, IDS.empE9, IDS.empE10,
    IDS.empE11, IDS.empE12, IDS.empE13, IDS.empE14, IDS.empE15,
  ];
  const balanceData: any[] = [];
  for (const empId of allEmpIds) {
    for (const lt of leaveTypes) {
      const used = lt.code === "AL" ? Math.floor(Math.random() * 5) : (lt.code === "SL" ? Math.floor(Math.random() * 3) : 0);
      balanceData.push({
        companyId: IDS.company,
        employeeId: empId,
        leaveTypeId: lt.id,
        periodStart,
        periodEnd,
        allocatedDays: lt.maxDays,
        usedDays: used,
        pendingDays: 0,
        carriedForwardDays: 0,
        adjustedDays: 0,
      });
    }
  }
  const lbResult = await prisma.leaveBalance.createMany({
    data: balanceData,
    skipDuplicates: true,
  });
  console.log(`   ✓ Created leave balances: ${lbResult.count}`);

  // ── 11. Leave Requests ─────────────────────────────────────────────────────
  console.log("\n1️⃣1️⃣  Creating leave requests (skip if exists)...");
  const leaveRequestDefs = [
    // Approved historical requests
    { id: "77771111-0000-0000-0000-000000000001", employeeId: IDS.empE1,   leaveTypeId: IDS.ltAnnual,  startDate: "2026-09-10", endDate: "2026-09-12", days: 3, status: "APPROVED" as any,           currentStage: "COMPLETED", reason: "Family vacation to Goa", companyId: IDS.company },
    { id: "77771111-0000-0000-0000-000000000002", employeeId: IDS.empE2,   leaveTypeId: IDS.ltSick,    startDate: "2026-09-20", endDate: "2026-09-20", days: 1, status: "APPROVED" as any,           currentStage: "COMPLETED", reason: "Fever and body ache", companyId: IDS.company },
    { id: "77771111-0000-0000-0000-000000000003", employeeId: IDS.empE3,   leaveTypeId: IDS.ltCasual,  startDate: "2026-10-05", endDate: "2026-10-05", days: 1, status: "APPROVED" as any,           currentStage: "COMPLETED", reason: "Personal work at government office", companyId: IDS.company },
    { id: "77771111-0000-0000-0000-000000000004", employeeId: IDS.empE6,   leaveTypeId: IDS.ltAnnual,  startDate: "2026-10-14", endDate: "2026-10-16", days: 3, status: "APPROVED" as any,           currentStage: "COMPLETED", reason: "Diwali travel", companyId: IDS.company },
    { id: "77771111-0000-0000-0000-000000000005", employeeId: IDS.empE4,   leaveTypeId: IDS.ltSick,    startDate: "2026-10-22", endDate: "2026-10-23", days: 2, status: "APPROVED" as any,           currentStage: "COMPLETED", reason: "Viral infection, doctor advised rest", companyId: IDS.company },
    // Pending requests
    { id: "77771111-0000-0000-0000-000000000006", employeeId: IDS.empE2,   leaveTypeId: IDS.ltAnnual,  startDate: "2026-11-15", endDate: "2026-11-17", days: 3, status: "PENDING_SUPERVISOR" as any, currentStage: "SUPERVISOR", reason: "Sister's wedding ceremony", companyId: IDS.company },
    { id: "77771111-0000-0000-0000-000000000007", employeeId: IDS.empE7,   leaveTypeId: IDS.ltCasual,  startDate: "2026-11-10", endDate: "2026-11-10", days: 1, status: "PENDING_HR" as any,         currentStage: "HR", reason: "Medical appointment, mandatory check-up", companyId: IDS.company },
    { id: "77771111-0000-0000-0000-000000000008", employeeId: IDS.empE8,   leaveTypeId: IDS.ltAnnual,  startDate: "2026-11-20", endDate: "2026-11-22", days: 3, status: "PENDING_MANAGER" as any,    currentStage: "MANAGER", reason: "Annual family trip", companyId: IDS.company },
    { id: "77771111-0000-0000-0000-000000000009", employeeId: IDS.empE12,  leaveTypeId: IDS.ltSick,    startDate: "2026-11-05", endDate: "2026-11-05", days: 1, status: "PENDING_SUPERVISOR" as any, currentStage: "SUPERVISOR", reason: "Severe migraine", companyId: IDS.company },
    { id: "77771111-0000-0000-0000-000000000010", employeeId: IDS.empE13,  leaveTypeId: IDS.ltCasual,  startDate: "2026-11-25", endDate: "2026-11-25", days: 1, status: "PENDING_SUPERVISOR" as any, currentStage: "SUPERVISOR", reason: "Banking and documentation work", companyId: IDS.company },
    // Rejected
    { id: "77771111-0000-0000-0000-000000000011", employeeId: IDS.empE5,   leaveTypeId: IDS.ltAnnual,  startDate: "2026-10-01", endDate: "2026-10-05", days: 5, status: "REJECTED" as any,           currentStage: "COMPLETED", reason: "Month-end quarter closure", rejectionReason: "High priority project deadline, please reschedule.", companyId: IDS.company },
    // Upcoming approved
    { id: "77771111-0000-0000-0000-000000000012", employeeId: IDS.empMgr1, leaveTypeId: IDS.ltAnnual,  startDate: "2026-12-20", endDate: "2026-12-26", days: 5, status: "APPROVED" as any,           currentStage: "COMPLETED", reason: "Christmas holidays with family", companyId: IDS.company },
  ];
  const lrResult = await prisma.leaveRequest.createMany({
    data: leaveRequestDefs,
    skipDuplicates: true,
  });
  console.log(`   ✓ Created leave requests: ${lrResult.count}`);

  // ── 12. Assets ─────────────────────────────────────────────────────────────
  console.log("\n1️⃣2️⃣  Upserting assets...");
  const assetDefs = [
    {
      id: IDS.asset1, code: "AST-2026-001", name: "Dell XPS 15 Laptop", cat: "LAPTOP",
      brand: "Dell", model: "XPS 15 9530", serial: "DXPS15-2026-001",
      purchase: new Date("2026-01-15"), cost: 125000, warranty: new Date("2029-01-14"),
      condition: "EXCELLENT", status: "ASSIGNED", assignedEmpId: IDS.empMgr1,
    },
    {
      id: IDS.asset2, code: "AST-2026-002", name: "MacBook Pro 14 Laptop", cat: "LAPTOP",
      brand: "Apple", model: "MacBook Pro M3", serial: "MBP14-2026-002",
      purchase: new Date("2026-02-10"), cost: 185000, warranty: new Date("2029-02-09"),
      condition: "EXCELLENT", status: "ASSIGNED", assignedEmpId: IDS.empSup1,
    },
    {
      id: IDS.asset3, code: "AST-2026-003", name: "HP EliteDesk Desktop", cat: "DESKTOP",
      brand: "HP", model: "EliteDesk 800 G9", serial: "HPED-2026-003",
      purchase: new Date("2026-01-20"), cost: 65000, warranty: new Date("2028-01-19"),
      condition: "GOOD", status: "ASSIGNED", assignedEmpId: IDS.empE1,
    },
    {
      id: IDS.asset4, code: "AST-2026-004", name: "iPhone 15 Pro", cat: "MOBILE",
      brand: "Apple", model: "iPhone 15 Pro", serial: "IP15P-2026-004",
      purchase: new Date("2026-03-05"), cost: 134900, warranty: new Date("2027-03-04"),
      condition: "EXCELLENT", status: "ASSIGNED", assignedEmpId: IDS.empMgr2,
    },
    {
      id: IDS.asset5, code: "AST-2026-005", name: "Samsung Galaxy S24 Ultra", cat: "MOBILE",
      brand: "Samsung", model: "Galaxy S24 Ultra", serial: "SGS24-2026-005",
      purchase: new Date("2026-03-15"), cost: 129999, warranty: new Date("2027-03-14"),
      condition: "EXCELLENT", status: "AVAILABLE", assignedEmpId: null,
    },
    {
      id: IDS.asset6, code: "AST-2026-006", name: "Logitech MX Master Mouse + Keyboard", cat: "PERIPHERAL",
      brand: "Logitech", model: "MX Master 3S + MX Keys", serial: "LGT-2026-006",
      purchase: new Date("2026-01-10"), cost: 18500, warranty: new Date("2028-01-09"),
      condition: "GOOD", status: "ASSIGNED", assignedEmpId: IDS.empE3,
    },
    {
      id: IDS.asset7, code: "AST-2026-007", name: "Dell UltraSharp 27\" Monitor", cat: "PERIPHERAL",
      brand: "Dell", model: "UltraSharp U2723D", serial: "DUS27-2026-007",
      purchase: new Date("2026-02-01"), cost: 42000, warranty: new Date("2029-01-31"),
      condition: "EXCELLENT", status: "ASSIGNED", assignedEmpId: IDS.empE2,
    },
    {
      id: IDS.asset8, code: "AST-2026-008", name: "Cisco Catalyst Switch 24-Port", cat: "NETWORKING",
      brand: "Cisco", model: "Catalyst 1200-24T", serial: "CCSC-2026-008",
      purchase: new Date("2026-01-05"), cost: 55000, warranty: new Date("2028-01-04"),
      condition: "EXCELLENT", status: "AVAILABLE", assignedEmpId: null,
    },
    {
      id: IDS.asset9, code: "AST-2026-009", name: "Lenovo ThinkPad E15 Laptop", cat: "LAPTOP",
      brand: "Lenovo", model: "ThinkPad E15 Gen 4", serial: "LTP15-2026-009",
      purchase: new Date("2026-04-01"), cost: 72000, warranty: new Date("2028-03-31"),
      condition: "GOOD", status: "UNDER_MAINTENANCE", assignedEmpId: null,
    },
    {
      id: IDS.asset10, code: "AST-2026-010", name: "iPad Air 5th Gen", cat: "TABLET",
      brand: "Apple", model: "iPad Air M1", serial: "IPAD-2026-010",
      purchase: new Date("2026-02-20"), cost: 59900, warranty: new Date("2027-02-19"),
      condition: "EXCELLENT", status: "ASSIGNED", assignedEmpId: IDS.empHR,
    },
  ];

  for (const a of assetDefs) {
    await prisma.asset.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        companyId: IDS.company,
        assetCode: a.code,
        name: a.name,
        category: a.cat as any,
        brand: a.brand,
        model: a.model,
        serialNumber: a.serial,
        purchaseDate: a.purchase,
        purchaseCost: a.cost,
        warrantyExpiry: a.warranty,
        condition: a.condition as any,
        status: a.status as any,
        assignedEmployeeId: a.assignedEmpId ?? undefined,
      },
    });
    console.log(`   ✓ ${a.code}: ${a.name}`);
  }

  // ── 13. Asset Assignments (active) ─────────────────────────────────────────
  console.log("\n1️⃣3️⃣  Creating asset assignment records...");
  const activeAssignments = [
    { assetId: IDS.asset1,  empId: IDS.empMgr1,  date: new Date("2026-01-15"), condition: "EXCELLENT" },
    { assetId: IDS.asset2,  empId: IDS.empSup1,  date: new Date("2026-02-10"), condition: "EXCELLENT" },
    { assetId: IDS.asset3,  empId: IDS.empE1,    date: new Date("2026-01-20"), condition: "GOOD" },
    { assetId: IDS.asset4,  empId: IDS.empMgr2,  date: new Date("2026-03-05"), condition: "EXCELLENT" },
    { assetId: IDS.asset6,  empId: IDS.empE3,    date: new Date("2026-01-10"), condition: "GOOD" },
    { assetId: IDS.asset7,  empId: IDS.empE2,    date: new Date("2026-02-01"), condition: "EXCELLENT" },
    { assetId: IDS.asset10, empId: IDS.empHR,    date: new Date("2026-02-20"), condition: "EXCELLENT" },
  ];
  let aaCreated = 0, aaSkipped = 0;
  for (const aa of activeAssignments) {
    const existing = await prisma.assetAssignment.findFirst({
      where: { assetId: aa.assetId, employeeId: aa.empId, status: "ACTIVE" },
    });
    if (!existing) {
      await prisma.assetAssignment.create({
        data: {
          companyId: IDS.company,
          assetId: aa.assetId,
          employeeId: aa.empId,
          assignedDate: aa.date,
          status: "ACTIVE",
          conditionAtAssignment: aa.condition as any,
          notes: "Initial assignment during onboarding",
        },
      });
      aaCreated++;
    } else { aaSkipped++; }
  }
  console.log(`   ✓ Created: ${aaCreated}, Skipped: ${aaSkipped}`);

  // ── 14. Maintenance Tickets ─────────────────────────────────────────────────
  console.log("\n1️⃣4️⃣  Creating maintenance tickets...");
  const maintenanceDefs = [
    {
      id: "99991111-0000-0000-0000-000000000001", assetId: IDS.asset9,
      ticket: "MNT-2026-001", issue: "Battery drains within 2 hours, keyboard keys sticky after beverage spill.",
      priority: "HIGH", status: "IN_PROGRESS", technician: "Suresh IT Support",
      cost: 4500, reportedDate: new Date("2026-10-20"),
    },
    {
      id: "99991111-0000-0000-0000-000000000002", assetId: IDS.asset3,
      ticket: "MNT-2026-002", issue: "Slow boot time, HDD shows bad sectors in diagnostics.",
      priority: "MEDIUM", status: "OPEN", technician: undefined,
      cost: undefined, reportedDate: new Date("2026-10-28"),
    },
    {
      id: "99991111-0000-0000-0000-000000000003", assetId: IDS.asset8,
      ticket: "MNT-2026-003", issue: "2 ports not working after power fluctuation.",
      priority: "LOW", status: "COMPLETED", technician: "Network Team",
      cost: 1200, reportedDate: new Date("2026-09-15"), completedDate: new Date("2026-09-20"),
      resolution: "Replaced fuse and re-flashed firmware. All ports operational.",
    },
  ];
  let mntCreated = 0, mntSkipped = 0;
  for (const m of maintenanceDefs) {
    const existing = await prisma.assetMaintenance.findUnique({ where: { id: m.id } });
    if (!existing) {
      await prisma.assetMaintenance.create({
        data: {
          id: m.id,
          companyId: IDS.company,
          assetId: m.assetId,
          ticketNumber: m.ticket,
          issueDescription: m.issue,
          priority: m.priority as any,
          status: m.status as any,
          reportedDate: m.reportedDate,
          assignedTechnician: m.technician ?? undefined,
          cost: m.cost ?? undefined,
          completedDate: (m as any).completedDate ?? undefined,
          resolutionNotes: (m as any).resolution ?? undefined,
        },
      });
      mntCreated++;
    } else { mntSkipped++; }
  }
  console.log(`   ✓ Created: ${mntCreated}, Skipped: ${mntSkipped}`);

  // ── 15. Company Attendance Setting ────────────────────────────────────────
  console.log("\n1️⃣5️⃣  Upserting attendance settings...");
  await prisma.companyAttendanceSetting.upsert({
    where: { companyId: IDS.company },
    update: {},
    create: {
      companyId: IDS.company,
      timezone: "Asia/Kolkata",
      gracePeriodMinutes: 10,
      defaultBreakMinutes: 60,
      isBreakPaid: false,
      workingDays: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"],
      weeklyOvertimeThresholdHours: 40,
      halfDayThresholdMinutes: 240,
      fullDayThresholdMinutes: 480,
    },
  });
  console.log("   ✓ Attendance settings configured");

  // ── 16. Holidays ───────────────────────────────────────────────────────────
  console.log("\n1️⃣6️⃣  Upserting holidays...");
  const holidays = [
    { date: "2026-01-26", name: "Republic Day",           type: "PUBLIC" },
    { date: "2026-03-25", name: "Holi",                   type: "PUBLIC" },
    { date: "2026-04-14", name: "Ambedkar Jayanti",       type: "PUBLIC" },
    { date: "2026-08-15", name: "Independence Day",       type: "PUBLIC" },
    { date: "2026-10-02", name: "Gandhi Jayanti",         type: "PUBLIC" },
    { date: "2026-10-20", name: "Diwali",                 type: "PUBLIC" },
    { date: "2026-10-21", name: "Diwali (second day)",   type: "COMPANY" },
    { date: "2026-11-01", name: "Diwali Holiday",         type: "COMPANY" },
    { date: "2026-12-25", name: "Christmas Day",          type: "PUBLIC" },
    { date: "2026-12-31", name: "New Year's Eve",         type: "COMPANY" },
  ];
  let holCreated = 0, holSkipped = 0;
  for (const h of holidays) {
    const existing = await prisma.holiday.findUnique({
      where: { companyId_date: { companyId: IDS.company, date: h.date } },
    });
    if (!existing) {
      await prisma.holiday.create({
        data: { companyId: IDS.company, name: h.name, date: h.date, holidayType: h.type as any, status: "ACTIVE" },
      });
      holCreated++;
    } else { holSkipped++; }
  }
  console.log(`   ✓ Created: ${holCreated}, Skipped: ${holSkipped}`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔑 Demo Login Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   OWNER:      owner@oppidan.in         /  Owner@1234");
  console.log("   HR:         priya.sharma@oppidan.in  /  Demo@1234");
  console.log("   MANAGER:    rahul.verma@oppidan.in   /  Demo@1234");
  console.log("   MANAGER:    anjali.mehta@oppidan.in  /  Demo@1234");
  console.log("   SUPERVISOR: karan.patel@oppidan.in   /  Demo@1234");
  console.log("   EMPLOYEE:   deepika.singh@oppidan.in /  Demo@1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
