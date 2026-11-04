/**
 * migrate-user.ts
 * Moves the real OWNER user (tanishkadhaybar97@gmail.com) from the "zoom" company
 * to the seed company "Oppidan India Pvt. Ltd." (11111111-0000-0000-0000-000000000001)
 * so the demo data becomes visible when they log in.
 *
 * Run: npx tsx --tsconfig apps/api/tsconfig.json apps/api/prisma/migrate-user.ts
 * Safe to re-run — idempotent checks in place.
 */

import { PrismaClient } from "../src/generated/prisma/client.js";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, "../.env") });

const DATABASE_URL_WITH_POOL =
  (process.env.DATABASE_URL ?? "") +
  "&pool_timeout=30&connection_limit=1";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL_WITH_POOL } },
});

const REAL_USER_EMAIL = "tanishkadhaybar97@gmail.com";
const SEED_COMPANY_ID = "11111111-0000-0000-0000-000000000001";
const ZOOM_COMPANY_ID = "5d7170b3-174e-49f7-ad8a-4f9a78eb45ea";

async function connectWithRetry(retries = 5): Promise<void> {
  for (let i = 1; i <= retries; i++) {
    try {
      await prisma.$connect();
      console.log("✅ Connected to Neon DB");
      return;
    } catch (err) {
      console.warn(`⚠️  Connection attempt ${i}/${retries} failed. Retrying…`);
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

async function main() {
  await connectWithRetry();

  // ── 1. Find the real user ─────────────────────────────────────────────────
  const realUser = await prisma.user.findUnique({
    where: { email: REAL_USER_EMAIL },
    include: { employee: true },
  });

  if (!realUser) {
    console.error(`❌ User ${REAL_USER_EMAIL} not found in DB. Exiting.`);
    return;
  }

  console.log(`Found user: ${realUser.id} | companyId: ${realUser.companyId}`);

  // ── 2. Already in seed company? ───────────────────────────────────────────
  if (realUser.companyId === SEED_COMPANY_ID) {
    console.log("✅ Real user is already in the seed company. Nothing to do.");
    return;
  }

  if (realUser.companyId !== ZOOM_COMPANY_ID) {
    console.warn(
      `⚠️  Real user is in unexpected company ${realUser.companyId}. Proceeding anyway.`
    );
  }

  // ── 3. Move the User record to seed company ───────────────────────────────
  await prisma.user.update({
    where: { id: realUser.id },
    data: { companyId: SEED_COMPANY_ID },
  });
  console.log(`✅ Moved User to seed company (${SEED_COMPANY_ID})`);

  // ── 4. Move / rename the linked Employee record ───────────────────────────
  if (realUser.employee) {
    const emp = realUser.employee;
    console.log(
      `Found linked employee: ${emp.id} | code: ${emp.employeeCode} | companyId: ${emp.companyId}`
    );

    // Check for employeeCode conflict in seed company
    const conflicting = await prisma.employee.findFirst({
      where: {
        companyId: SEED_COMPANY_ID,
        employeeCode: emp.employeeCode,
        id: { not: emp.id },
      },
    });

    const newCode = conflicting ? "EMP-OWNER" : emp.employeeCode;
    if (conflicting) {
      console.log(
        `⚠️  employeeCode "${emp.employeeCode}" already taken in seed company → renaming to "${newCode}"`
      );
    }

    await prisma.employee.update({
      where: { id: emp.id },
      data: {
        companyId: SEED_COMPANY_ID,
        employeeCode: newCode,
      },
    });
    console.log(
      `✅ Moved Employee ${emp.id} to seed company (code: ${newCode})`
    );
  } else {
    console.log("ℹ️  No linked employee record found for real user.");
  }

  // ── 5. Optionally clean up "zoom" company if now empty ────────────────────
  const remainingUsers = await prisma.user.count({
    where: { companyId: ZOOM_COMPANY_ID },
  });
  const remainingEmployees = await prisma.employee.count({
    where: { companyId: ZOOM_COMPANY_ID },
  });

  if (remainingUsers === 0 && remainingEmployees === 0) {
    await prisma.company.delete({ where: { id: ZOOM_COMPANY_ID } });
    console.log(`🗑️  Deleted empty "zoom" company (${ZOOM_COMPANY_ID})`);
  } else {
    console.log(
      `ℹ️  "zoom" company still has ${remainingUsers} user(s) and ${remainingEmployees} employee(s) — skipping deletion.`
    );
  }

  // ── 6. Verify ─────────────────────────────────────────────────────────────
  const updated = await prisma.user.findUnique({
    where: { email: REAL_USER_EMAIL },
    include: { employee: true },
  });
  console.log("\n── Verification ──────────────────────────────────────────");
  console.log(`User companyId   : ${updated?.companyId}`);
  console.log(`Employee companyId: ${updated?.employee?.companyId}`);
  console.log(`Employee code     : ${updated?.employee?.employeeCode}`);

  const empCount = await prisma.employee.count({ where: { companyId: SEED_COMPANY_ID } });
  const deptCount = await prisma.department.count({ where: { companyId: SEED_COMPANY_ID } });
  const assetCount = await prisma.asset.count({ where: { companyId: SEED_COMPANY_ID } });
  console.log(`Seed company employees : ${empCount}`);
  console.log(`Seed company departments: ${deptCount}`);
  console.log(`Seed company assets    : ${assetCount}`);
  console.log("\n✅ Migration complete! Log in with tanishkadhaybar97@gmail.com to see the demo data.");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

