import "dotenv/config";
import app from "./src/server.js";
import { prisma } from "./src/lib/prisma.js";
import { hashPassword, comparePassword } from "./src/utils/password.js";
import { generateAccessToken } from "./src/utils/jwt.js";
import { UserRole, UserStatus } from "./src/generated/prisma/client.js";
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

  // Extract set-cookie headers
  const setCookie = res.headers.get("set-cookie");

  return {
    status: res.status,
    headers: res.headers,
    setCookie,
    data,
  };
}

async function runTests() {
  console.log("\n==========================================");
  console.log("   ERMS AUTHENTICATION MODULE TEST SUITE  ");
  console.log("==========================================\n");

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

  const testEmail = `test.owner.${Date.now()}@oppidan.example.com`;
  const testPassword = "SecurePassword123!#";
  const testCompany = "Oppidan India Technologies";
  let accessToken = "";
  let refreshCookie = "";
  let userId = "";

  try {
    // 1. Password Hashing Utility Tests
    console.log("\n--- PART 3: Password Utility Tests ---");
    const testHash = await hashPassword(testPassword);
    assert(testHash !== testPassword && testHash.startsWith("$2"), "hashPassword generates bcrypt hash");
    assert(await comparePassword(testPassword, testHash), "comparePassword returns true for correct password");
    assert(!(await comparePassword("WrongPassword123!", testHash)), "comparePassword returns false for wrong password");

    // 2. Health Endpoint Test
    console.log("\n--- Server Health Check ---");
    const healthRes = await request("GET", "/api/health");
    assert(healthRes.status === 200 && healthRes.data.success === true, "Health endpoint responds 200 OK");

    // 3. Register Validation: Weak Password
    console.log("\n--- PART 6 & 8: Registration Tests ---");
    const weakPassRes = await request("POST", "/api/auth/register", {
      name: "Tanishka Dhaybar",
      companyName: testCompany,
      email: testEmail,
      password: "weak",
      confirmPassword: "weak",
    });
    assert(weakPassRes.status === 400 && weakPassRes.data.success === false, "Rejects weak password (<8 characters)", weakPassRes.data);

    // 4. Register Validation: Mismatched Password
    const mismatchRes = await request("POST", "/api/auth/register", {
      name: "Tanishka Dhaybar",
      companyName: testCompany,
      email: testEmail,
      password: testPassword,
      confirmPassword: "DifferentPassword123!",
    });
    assert(mismatchRes.status === 400 && mismatchRes.data.errors?.confirmPassword !== undefined, "Rejects mismatched confirm password", mismatchRes.data);

    // 5. Successful Registration
    const regRes = await request("POST", "/api/auth/register", {
      name: "Tanishka Dhaybar",
      companyName: testCompany,
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    });
    assert(regRes.status === 201 && regRes.data.success === true, "Successfully registers company & initial OWNER user", regRes.data);
    assert(regRes.data.data?.user?.role === "OWNER", "User assigned role OWNER");
    assert(regRes.data.data?.user?.companyName === testCompany, "Company correctly associated with user");
    assert(regRes.data.data?.user?.passwordHash === undefined, "passwordHash is never returned in API response");
    assert(typeof regRes.data.data?.accessToken === "string", "Valid access token issued");
    assert(regRes.setCookie?.includes("refreshToken") === true, "HttpOnly refresh token cookie set");

    accessToken = regRes.data.data.accessToken;
    userId = regRes.data.data.user.id;
    if (regRes.setCookie) {
      refreshCookie = regRes.setCookie.split(";")[0]!;
    }

    // 6. Duplicate Email Registration Rejection
    const dupRes = await request("POST", "/api/auth/register", {
      name: "Another Owner",
      companyName: "Another Company",
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    });
    assert(dupRes.status === 409 && dupRes.data.success === false, "Rejects duplicate email registration with 409 Conflict");

    // 7. Login: Successful
    console.log("\n--- PART 6: Login Tests ---");
    const loginRes = await request("POST", "/api/auth/login", {
      email: testEmail,
      password: testPassword,
    });
    assert(loginRes.status === 200 && loginRes.data.success === true, "Successfully logs in with valid credentials");
    assert(loginRes.data.data?.user?.email === testEmail.toLowerCase(), "Email normalized and matched");
    assert(loginRes.data.data?.user?.passwordHash === undefined, "Login response does not leak password hash");

    // 8. Login: Wrong Password (Generic error message)
    const wrongPassRes = await request("POST", "/api/auth/login", {
      email: testEmail,
      password: "WrongPassword999!",
    });
    assert(
      wrongPassRes.status === 401 && wrongPassRes.data.message === "Invalid email or password",
      "Generic error message for invalid password (no credential leakage)"
    );

    // 9. Login: Non-existent Email (Generic error message)
    const noUserRes = await request("POST", "/api/auth/login", {
      email: "nonexistent.user.test@oppidan.example.com",
      password: testPassword,
    });
    assert(
      noUserRes.status === 401 && noUserRes.data.message === "Invalid email or password",
      "Generic error message for nonexistent email (no user enumeration)"
    );

    // 10. Current User: /api/auth/me (Protected with valid token)
    console.log("\n--- PART 6 & 7: Protected Routes & Middleware ---");
    const meRes = await request("GET", "/api/auth/me", undefined, {
      Authorization: `Bearer ${accessToken}`,
    });
    assert(meRes.status === 200 && meRes.data.data?.user?.id === userId, "GET /api/auth/me returns current user with Bearer token");

    // 11. Current User: Missing Token
    const unauthRes = await request("GET", "/api/auth/me");
    assert(unauthRes.status === 401 && unauthRes.data.success === false, "Rejects request with missing token (401 Unauthorized)");

    // 12. Current User: Invalid Token
    const invalidTokenRes = await request("GET", "/api/auth/me", undefined, {
      Authorization: "Bearer invalid.jwt.token.here",
    });
    assert(invalidTokenRes.status === 401, "Rejects request with invalid JWT (401 Unauthorized)");

    // 13. Refresh Token Session Rotation
    console.log("\n--- PART 4 & 6: Refresh Token Rotation & Session Revocation ---");
    const refreshRes = await request("POST", "/api/auth/refresh", undefined, {
      Cookie: refreshCookie,
    });
    assert(refreshRes.status === 200 && refreshRes.data.success === true, "Successfully rotates session with valid refresh cookie");
    assert(typeof refreshRes.data.data?.accessToken === "string", "Issues fresh access token on refresh");
    const newRefreshCookie = refreshRes.setCookie ? refreshRes.setCookie.split(";")[0]! : "";

    // 14. Old Refresh Token Reuse Detection
    const reuseRes = await request("POST", "/api/auth/refresh", undefined, {
      Cookie: refreshCookie, // Using invalidated old cookie!
    });
    assert(reuseRes.status === 401, "Detects and rejects reused/revoked refresh token");

    // 15. Inactive Account Rejection
    console.log("\n--- Account Inactivity Tests ---");
    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.INACTIVE },
    });

    const inactiveLoginRes = await request("POST", "/api/auth/login", {
      email: testEmail,
      password: testPassword,
    });
    assert(inactiveLoginRes.status === 403, "Rejects login for inactive account with 403 Forbidden");

    const inactiveMeRes = await request("GET", "/api/auth/me", undefined, {
      Authorization: `Bearer ${accessToken}`,
    });
    assert(inactiveMeRes.status === 403, "Middleware rejects inactive account access on protected route");

    // Restore active status
    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
    });

    // 16. Logout & Session Revocation
    console.log("\n--- Logout & Cleanup ---");
    const logoutRes = await request("POST", "/api/auth/logout", undefined, {
      Cookie: newRefreshCookie,
    });
    assert(logoutRes.status === 200 && logoutRes.data.success === true, "Logout succeeds and clears session");

    // Post-logout refresh should fail
    const postLogoutRefresh = await request("POST", "/api/auth/refresh", undefined, {
      Cookie: newRefreshCookie,
    });
    assert(postLogoutRefresh.status === 401, "Revoked refresh token rejected after logout");

    // Clean up test records
    await prisma.company.deleteMany({
      where: { name: testCompany },
    });
    console.log("Cleaned up test database records.");

  } catch (error) {
    console.error("Test execution error:", error);
    failed++;
  } finally {
    server.close();
  }

  console.log("\n==========================================");
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests();
