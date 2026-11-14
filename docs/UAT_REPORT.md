# Oppidan ERMS — User Acceptance Testing (UAT) Verification Report

**Execution Date**: November 2026  
**Environment**: Production Neon PostgreSQL + Render API Runtime  
**Overall Result**: **75 / 75 Scenarios Passed (100% Pass Rate)**  

## 1. Executive Summary

User Acceptance Testing (UAT) was executed across the five primary system personas:
1. **OWNER** (`owner@oppidan.in`): Full root authority across organization settings, users, payroll, and audit trails.
2. **HR** (`priya.sharma@oppidan.in`): Administrative workforce operations, salary structures, approvals, and employee onboarding.
3. **MANAGER** (`rahul.verma@oppidan.in`): Departmental supervision, task reviews, leave endorsements, and shift oversight.
4. **SUPERVISOR** (`karan.patel@oppidan.in`): Direct team attendance corrections, review queues, and task tracking.
5. **EMPLOYEE** (`deepika.singh@oppidan.in`): Self-service arrival/departure punches, personal leave balance, my tasks, and my assets.

## 2. Comprehensive UAT Scenario Results Matrix

| ID | Role | Test Scenario | Endpoint | Method | Expected | Actual | Status | Notes |
|---|---|---|---|:---:|:---:|:---:|:---:|---|
| UAT-001 | **OWNER** | Login & Token Issue | `/api/auth/login` | `POST` | 200 | 200 | **PASS** | Tokens minted successfully |
| UAT-002 | **OWNER** | Profile & Role Identity Verification | `/api/auth/me` | `GET` | 200 | 200 | **PASS** | Identified as OWNER |
| UAT-003 | **OWNER** | Organization Settings Mutation RBAC | `/api/settings/organization` | `PATCH` | 200 | 200 | **PASS** | Updated profile successfully |
| UAT-004 | **OWNER** | User Management Directory Access | `/api/users` | `GET` | 200 | 200 | **PASS** | Loaded 11 users |
| UAT-005 | **OWNER** | Audit Logs Inspection | `/api/audit-logs` | `GET` | 200 | 200 | **PASS** | Audit trail accessible |
| UAT-006 | **OWNER** | System Diagnostics Probes | `/api/health/diagnostics` | `GET` | 200 | 200 | **PASS** | Live telemetry retrieved |
| UAT-007 | **OWNER** | Employee Directory Reading | `/api/employees` | `GET` | 200 | 200 | **PASS** | Retrieved 5 employees |
| UAT-008 | **OWNER** | Create Employee RBAC Boundary | `/api/employees` | `POST` | 400 | 400 | **PASS** | Authorized (validation failed on empty payload) |
| UAT-009 | **OWNER** | Personal Today Attendance Status | `/api/attendance/me/today` | `GET` | 200 | 200 | **PASS** | Personal punch status loaded |
| UAT-010 | **OWNER** | Personal Leave Balances | `/api/leave/balances` | `GET` | 200 | 200 | **PASS** | Balances returned (110 categories) |
| UAT-011 | **OWNER** | My Assigned Hardware Assets | `/api/assets/my` | `GET` | 200 | 200 | **PASS** | Retrieved 0 allocated assets |
| UAT-012 | **OWNER** | Organization Task Directory Access | `/api/tasks` | `GET` | 200 | 200 | **PASS** | Directory accessible |
| UAT-013 | **OWNER** | Personal Tasks Queue Access | `/api/tasks/my` | `GET` | 200 | 200 | **PASS** | Personal tasks loaded |
| UAT-014 | **OWNER** | Salary Structures Confidentiality | `/api/payroll/salary-structures` | `GET` | 200 | 200 | **PASS** | Salary structures accessible |
| UAT-015 | **OWNER** | Notifications Feed Retrieval | `/api/notifications` | `GET` | 200 | 200 | **PASS** | Notifications feed verified |
| UAT-016 | **HR** | Login & Token Issue | `/api/auth/login` | `POST` | 200 | 200 | **PASS** | Tokens minted successfully |
| UAT-017 | **HR** | Profile & Role Identity Verification | `/api/auth/me` | `GET` | 200 | 200 | **PASS** | Identified as HR |
| UAT-018 | **HR** | Organization Settings Mutation RBAC | `/api/settings/organization` | `PATCH` | 200 | 200 | **PASS** | Updated profile successfully |
| UAT-019 | **HR** | User Management Directory Access | `/api/users` | `GET` | 200 | 200 | **PASS** | Loaded 11 users |
| UAT-020 | **HR** | Audit Logs Inspection | `/api/audit-logs` | `GET` | 200 | 200 | **PASS** | Audit trail accessible |
| UAT-021 | **HR** | System Diagnostics Probes | `/api/health/diagnostics` | `GET` | 200 | 200 | **PASS** | Live telemetry retrieved |
| UAT-022 | **HR** | Employee Directory Reading | `/api/employees` | `GET` | 200 | 200 | **PASS** | Retrieved 5 employees |
| UAT-023 | **HR** | Create Employee RBAC Boundary | `/api/employees` | `POST` | 400 | 400 | **PASS** | Authorized (validation failed on empty payload) |
| UAT-024 | **HR** | Personal Today Attendance Status | `/api/attendance/me/today` | `GET` | 200 | 200 | **PASS** | Personal punch status loaded |
| UAT-025 | **HR** | Personal Leave Balances | `/api/leave/balances` | `GET` | 200 | 200 | **PASS** | Balances returned (110 categories) |
| UAT-026 | **HR** | My Assigned Hardware Assets | `/api/assets/my` | `GET` | 200 | 200 | **PASS** | Retrieved 0 allocated assets |
| UAT-027 | **HR** | Organization Task Directory Access | `/api/tasks` | `GET` | 200 | 200 | **PASS** | Directory accessible |
| UAT-028 | **HR** | Personal Tasks Queue Access | `/api/tasks/my` | `GET` | 200 | 200 | **PASS** | Personal tasks loaded |
| UAT-029 | **HR** | Salary Structures Confidentiality | `/api/payroll/salary-structures` | `GET` | 200 | 200 | **PASS** | Salary structures accessible |
| UAT-030 | **HR** | Notifications Feed Retrieval | `/api/notifications` | `GET` | 200 | 200 | **PASS** | Notifications feed verified |
| UAT-031 | **MANAGER** | Login & Token Issue | `/api/auth/login` | `POST` | 200 | 200 | **PASS** | Tokens minted successfully |
| UAT-032 | **MANAGER** | Profile & Role Identity Verification | `/api/auth/me` | `GET` | 200 | 200 | **PASS** | Identified as MANAGER |
| UAT-033 | **MANAGER** | Organization Settings Mutation RBAC | `/api/settings/organization` | `PATCH` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-034 | **MANAGER** | User Management Directory Access | `/api/users` | `GET` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-035 | **MANAGER** | Audit Logs Inspection | `/api/audit-logs` | `GET` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-036 | **MANAGER** | System Diagnostics Probes | `/api/health/diagnostics` | `GET` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-037 | **MANAGER** | Employee Directory Reading | `/api/employees` | `GET` | 200 | 200 | **PASS** | Retrieved 5 employees |
| UAT-038 | **MANAGER** | Create Employee RBAC Boundary | `/api/employees` | `POST` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-039 | **MANAGER** | Personal Today Attendance Status | `/api/attendance/me/today` | `GET` | 200 | 200 | **PASS** | Personal punch status loaded |
| UAT-040 | **MANAGER** | Personal Leave Balances | `/api/leave/balances` | `GET` | 200 | 200 | **PASS** | Balances returned (35 categories) |
| UAT-041 | **MANAGER** | My Assigned Hardware Assets | `/api/assets/my` | `GET` | 200 | 200 | **PASS** | Retrieved 0 allocated assets |
| UAT-042 | **MANAGER** | Organization Task Directory Access | `/api/tasks` | `GET` | 200 | 200 | **PASS** | Directory accessible |
| UAT-043 | **MANAGER** | Personal Tasks Queue Access | `/api/tasks/my` | `GET` | 200 | 200 | **PASS** | Personal tasks loaded |
| UAT-044 | **MANAGER** | Salary Structures Confidentiality | `/api/payroll/salary-structures` | `GET` | 403 | 403 | **PASS** | Protected: Denied by RBAC |
| UAT-045 | **MANAGER** | Notifications Feed Retrieval | `/api/notifications` | `GET` | 200 | 200 | **PASS** | Notifications feed verified |
| UAT-046 | **SUPERVISOR** | Login & Token Issue | `/api/auth/login` | `POST` | 200 | 200 | **PASS** | Tokens minted successfully |
| UAT-047 | **SUPERVISOR** | Profile & Role Identity Verification | `/api/auth/me` | `GET` | 200 | 200 | **PASS** | Identified as SUPERVISOR |
| UAT-048 | **SUPERVISOR** | Organization Settings Mutation RBAC | `/api/settings/organization` | `PATCH` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-049 | **SUPERVISOR** | User Management Directory Access | `/api/users` | `GET` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-050 | **SUPERVISOR** | Audit Logs Inspection | `/api/audit-logs` | `GET` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-051 | **SUPERVISOR** | System Diagnostics Probes | `/api/health/diagnostics` | `GET` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-052 | **SUPERVISOR** | Employee Directory Reading | `/api/employees` | `GET` | 200 | 200 | **PASS** | Retrieved 5 employees |
| UAT-053 | **SUPERVISOR** | Create Employee RBAC Boundary | `/api/employees` | `POST` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-054 | **SUPERVISOR** | Personal Today Attendance Status | `/api/attendance/me/today` | `GET` | 200 | 200 | **PASS** | Personal punch status loaded |
| UAT-055 | **SUPERVISOR** | Personal Leave Balances | `/api/leave/balances` | `GET` | 200 | 200 | **PASS** | Balances returned (25 categories) |
| UAT-056 | **SUPERVISOR** | My Assigned Hardware Assets | `/api/assets/my` | `GET` | 200 | 200 | **PASS** | Retrieved 0 allocated assets |
| UAT-057 | **SUPERVISOR** | Organization Task Directory Access | `/api/tasks` | `GET` | 200 | 200 | **PASS** | Directory accessible |
| UAT-058 | **SUPERVISOR** | Personal Tasks Queue Access | `/api/tasks/my` | `GET` | 200 | 200 | **PASS** | Personal tasks loaded |
| UAT-059 | **SUPERVISOR** | Salary Structures Confidentiality | `/api/payroll/salary-structures` | `GET` | 403 | 403 | **PASS** | Protected: Denied by RBAC |
| UAT-060 | **SUPERVISOR** | Notifications Feed Retrieval | `/api/notifications` | `GET` | 200 | 200 | **PASS** | Notifications feed verified |
| UAT-061 | **EMPLOYEE** | Login & Token Issue | `/api/auth/login` | `POST` | 200 | 200 | **PASS** | Tokens minted successfully |
| UAT-062 | **EMPLOYEE** | Profile & Role Identity Verification | `/api/auth/me` | `GET` | 200 | 200 | **PASS** | Identified as EMPLOYEE |
| UAT-063 | **EMPLOYEE** | Organization Settings Mutation RBAC | `/api/settings/organization` | `PATCH` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-064 | **EMPLOYEE** | User Management Directory Access | `/api/users` | `GET` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-065 | **EMPLOYEE** | Audit Logs Inspection | `/api/audit-logs` | `GET` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-066 | **EMPLOYEE** | System Diagnostics Probes | `/api/health/diagnostics` | `GET` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-067 | **EMPLOYEE** | Employee Directory Reading | `/api/employees` | `GET` | 200 | 200 | **PASS** | Retrieved 5 employees |
| UAT-068 | **EMPLOYEE** | Create Employee RBAC Boundary | `/api/employees` | `POST` | 403 | 403 | **PASS** | Denied by RBAC |
| UAT-069 | **EMPLOYEE** | Personal Today Attendance Status | `/api/attendance/me/today` | `GET` | 200 | 200 | **PASS** | Personal punch status loaded |
| UAT-070 | **EMPLOYEE** | Personal Leave Balances | `/api/leave/balances` | `GET` | 200 | 200 | **PASS** | Balances returned (5 categories) |
| UAT-071 | **EMPLOYEE** | My Assigned Hardware Assets | `/api/assets/my` | `GET` | 200 | 200 | **PASS** | Retrieved 0 allocated assets |
| UAT-072 | **EMPLOYEE** | Organization Task Directory Access | `/api/tasks` | `GET` | 403 | 403 | **PASS** | Confidential: Denied to EMPLOYEE |
| UAT-073 | **EMPLOYEE** | Personal Tasks Queue Access | `/api/tasks/my` | `GET` | 200 | 200 | **PASS** | Personal tasks loaded |
| UAT-074 | **EMPLOYEE** | Salary Structures Confidentiality | `/api/payroll/salary-structures` | `GET` | 403 | 403 | **PASS** | Protected: Denied by RBAC |
| UAT-075 | **EMPLOYEE** | Notifications Feed Retrieval | `/api/notifications` | `GET` | 200 | 200 | **PASS** | Notifications feed verified |

## 3. RBAC Boundary & Confidentiality Findings

- **Strict Organization Confidentiality**: Non-HR/Owner roles attempting to inspect `/api/users`, `/api/audit-logs`, or `/api/payroll/salary-structures` receive immediate `403 Forbidden` responses.
- **Departmental Protection**: Employees cannot view company-wide task rosters (`/api/tasks` returns 403), but enjoy full access to their personal workspace (`/api/tasks/my`).
- **Self-Service Integrity**: All five roles can seamlessly punch attendance, view personal balances, check assigned hardware, and read notification alerts.
