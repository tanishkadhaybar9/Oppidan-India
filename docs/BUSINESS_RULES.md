# Oppidan ERMS — Core Business Rules & Validation Constraints

## 1. Multi-Tenancy & Data Isolation Rules
- **Rule BR-01**: Every database entity must belong to a valid `Company`. Cross-tenant queries are blocked by tenant isolation scoping.
- **Rule BR-02**: Tenant IDs cannot be altered once assigned.

---

## 2. Workforce & Hierarchy Rules
- **Rule BR-03 (Unique Employee Codes)**: Employee codes (`employeeCode`) must be unique within each tenant workspace.
- **Rule BR-04 (No Self-Supervision)**: An employee cannot be assigned as their own supervisor (`supervisorId != id`).
- **Rule BR-05 (Acyclic Hierarchy)**: Reporting lines must form a Directed Acyclic Graph (DAG). Any circular supervisor assignments (e.g., A -> B -> A) are rejected with `400 Bad Request`.
- **Rule BR-06 (Safe Deactivation)**: Deactivating an employee sets status to `INACTIVE`. Hard deletion of employee records is strictly prohibited to preserve historical attendance and payroll integrity.

---

## 3. Attendance & Shift Rules
- **Rule BR-07 (Single Active Punch)**: An employee cannot clock in if they have an active punch without clocking out first.
- **Rule BR-08 (Shift Punctuality Tolerance)**: Punch arrival within the designated `graceMinutes` is marked `PRESENT`. Arrivals beyond the grace period are marked `LATE`.
- **Rule BR-09 (Overtime Computation)**: Worked hours beyond the scheduled shift duration are classified as overtime only if approved by the shift policy.
- **Rule BR-10 (Punch Correction)**: Attendance corrections require supervisor or HR review and approval before mutating attendance times.

---

## 4. Leave Management Rules
- **Rule BR-11 (Balance Solvency)**: Employees cannot submit leave requests that exceed their accrued balance for the requested category.
- **Rule BR-12 (Chronological Consistency)**: Leave `endDate` must be on or after `startDate`.
- **Rule BR-13 (Calendar Working Days)**: Leave day calculation excludes organizational weekly rest days (e.g. Saturdays & Sundays) and public holidays.
- **Rule BR-14 (Two-Tier Sign-Off)**: Requests require Direct Supervisor endorsement followed by HR approval before entitlement deduction occurs.

---

## 5. Hardware Asset Rules
- **Rule BR-15 (Unique Serial Constraints)**: Asset serial numbers must be unique within the tenant catalog.
- **Rule BR-16 (Single Allocation Invariant)**: An asset can only be allocated to one employee at a time (`status == AVAILABLE` required for allocation).
- **Rule BR-17 (Maintenance Quarantine)**: Assets flagged as `UNDER_MAINTENANCE` cannot be allocated to staff until certified as `AVAILABLE`.

---

## 6. Payroll Rules
- **Rule BR-18 (Non-Negative Salary Components)**: Base pay, HRA, and allowances must be positive decimal figures.
- **Rule BR-19 (Batch Run Idempotency)**: A payroll batch for a given month cannot be executed twice without explicitly rolling back the prior run.
- **Rule BR-20 (Statutory Deduction Limits)**: EPF and ESI percentages must adhere to statutory government ceilings.
