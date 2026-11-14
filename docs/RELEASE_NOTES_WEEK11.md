# Oppidan ERMS — Release Notes (Week 11)
## Version 1.11.0 — Advanced ERMS Enhancements, UAT & Workflow Integration

**Release Date**: November 2026  
**Status**: Production Ready  
**Environments**: Vercel (Frontend) + Render (Backend API) + Neon PostgreSQL  

---

## 🚀 Highlights & New Features

### 1. Comprehensive Role-Based UAT Verification
- Designed and executed a 75-scenario automated User Acceptance Test (UAT) suite covering all five system roles:
  - `OWNER`, `HR`, `MANAGER`, `SUPERVISOR`, `EMPLOYEE`
- Verified access permissions, confidential boundaries, and operational workflows across 15 distinct functional scenarios per persona.
- **Pass Rate: 75 / 75 Scenarios Passed (100%)**. Detailed results published in [UAT_REPORT.md](UAT_REPORT.md).

### 2. RBAC Boundary & Security Hardening
- **HR Settings Authority**: Granted `Permission.COMPANY_SETTINGS_MANAGE` to `UserRole.HR` so HR administrators can configure organization profiles, working hours, and holiday schedules without requiring root Owner credentials.
- **Credential Protection**: Revoked `Permission.USER_READ` from `UserRole.MANAGER`. Manager accounts are now strictly prevented from accessing system user tables or inspecting peer credentials metadata.

### 3. Employee Lifecycle & Historical Integrity Verification
- Verified end-to-end 10-step lifecycle:
  1. Onboarding & Employee Code Assignment
  2. Department & Designation Mapping
  3. Acyclic Supervisor Relationship Enforcement
  4. Shift Schedule Allocation
  5. Live Punching & Punctuality Engine
  6. Personal Leave Balances & Accruals
  7. Hardware Allocation & Maintenance Work Orders
  8. Task Delegation & Supervisor Reviews
  9. Attendance-Integrated Payroll Calculation
  10. Safe Deactivation with Immutable Employment History
- Verified zero data loss: deactivation transitions status to `INACTIVE` while preserving all historical records for auditing and payroll.

---

## 🛠️ Defect Fixes

- **BUG-001**: Resolved `403 Forbidden` response when HR users attempted to update company profile settings.
- **BUG-002**: Fixed credential leak vulnerability where `MANAGER` role was permitted to read user list.
- **BUG-003**: Updated shift assignment API request contract requiring `effectiveFrom` date.
- **BUG-004**: Corrected nested user profile response parsing in client authentication helper.

---

## 📚 Updated Documentation Suite

- [UAT_REPORT.md](UAT_REPORT.md) — Complete 75-scenario test matrix with status codes.
- [BUG_TRACKING.md](BUG_TRACKING.md) — Bug resolution log with root causes and verification steps.
- [EMPLOYEE_LIFECYCLE.md](EMPLOYEE_LIFECYCLE.md) — 10-step employee journey specification.
- [CROSS_MODULE_INTEGRATION.md](CROSS_MODULE_INTEGRATION.md) — Cross-module interactions and event flow.
- [BUSINESS_RULES.md](BUSINESS_RULES.md) — Complete constraints, invariant rules, and formulas.
- [KNOWN_ISSUES.md](KNOWN_ISSUES.md) — Known operational notes and planned enhancements.
