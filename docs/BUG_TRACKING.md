# Oppidan ERMS — Bug Tracking & Defect Resolution Report
## Week 11 Quality Assurance & Security Hardening

**Project**: Employee & Resource Management System (ERMS)  
**Date**: November 2026  
**Status**: All Identified Defects Resolved & Verified  

---

## 1. Defect Summary Log

| Defect ID | Severity | Module | Description | Root Cause | Status | Resolution |
|---|:---:|---|---|---|:---:|---|
| **BUG-001** | High | Organization Settings | HR users received `403 Forbidden` when updating organization profile or working hours. | `Permission.COMPANY_SETTINGS_MANAGE` was defined for `OWNER` but omitted from `ROLE_PERMISSIONS[UserRole.HR]`. | **FIXED** | Added `Permission.COMPANY_SETTINGS_MANAGE` to `ROLE_PERMISSIONS[UserRole.HR]` in `permissions.ts`. |
| **BUG-002** | High (Security) | User Management | `MANAGER` role was able to invoke `GET /api/users` and view other system users. | `Permission.USER_READ` was mistakenly included in `ROLE_PERMISSIONS[UserRole.MANAGER]`. | **FIXED** | Revoked `Permission.USER_READ` from `[UserRole.MANAGER]`. Only `OWNER` and `HR` can view the user management registry. |
| **BUG-003** | Medium | Shift Assignment | Shift assignment API requests were returning `400 Bad Request` during integration tests. | Payload passed `startDate` while the Zod validator strictly required `effectiveFrom`. | **FIXED** | Verified validator schema requirements and updated API integration contract documentation. |
| **BUG-004** | Low | Auth Integration | Client profile parsing error during role identity checks. | `GET /api/auth/me` returns `{ data: { user: { role } } }`, whereas tests anticipated flat `{ data: { role } }`. | **FIXED** | Updated consumer parsing to read `data.user.role`. |

---

## 2. Regression Testing & Verification

Following the application of the above fixes:
1. Re-ran the complete 75-scenario UAT suite (`npm run test:uat`).
2. Confirmed that HR can now successfully patch company settings.
3. Confirmed that Managers receive `403 Forbidden` on `/api/users`.
4. All 75 / 75 scenarios passed with 100% pass rate.
