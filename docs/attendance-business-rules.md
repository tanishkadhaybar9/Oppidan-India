# ERMS Week 3 — Attendance & Shift Management Business Rules Specification

## Oppidan India Group — Employee & Resource Management System (ERMS)
**Document Version:** 1.0.0  
**Effective Date:** October 2026  
**Status:** Architecture & Business Rules Specification

---

## 1. Executive Summary & Policy Philosophy

This document defines the technical and business rules for the Attendance and Shift Management module of the Oppidan India Group ERMS. 

> **Important Notice on Configurable Defaults:**  
> The initial values documented herein (e.g., 10-minute grace period, 60-minute break, Monday–Friday work week, 40-hour weekly overtime threshold) represent **proposed configurable defaults** designed for general corporate and operational setups. These are **not rigid company policies** and are fully configurable per company tenant via the `CompanyAttendanceSetting` model. Calculations dynamically pull parameters from the applicable Shift and Company Settings rather than using hardcoded values.

---

## 2. Shift Structure & Scheduling Rules

### 2.1 Shift Schema & Attributes
Each shift belongs strictly to a single Company tenant (`companyId`) and includes:
- **Shift Name & Code**: Unique identifier within the company (e.g., `Code: "MS-0918"`, `Name: "General Morning Shift"`).
- **Start Time & End Time**: 24-hour format string `"HH:mm"` in local company time (e.g., `"09:00"`, `"18:00"`).
- **Break Duration**: Default 60 minutes (configurable per shift).
- **Grace Period**: Default 10 minutes (configurable per shift).
- **Working Days**: Array of scheduled active days: `["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]`.
- **Timezone**: IANA timezone identifier (default: `"Asia/Kolkata"`).
- **Overnight Shift Indicator (`isOvernight`)**: Boolean flag indicating that the shift crosses midnight.

### 2.2 Overnight Shift Handling
A shift is marked as overnight when `startTime > endTime` (or explicitly flagged `isOvernight = true`).
- **Example**: Night Shift from `22:00` to `06:00` next day.
- **Attendance Date Assignment**: The attendance record's `attendanceDate` (e.g., `2026-10-15`) is pegged to the calendar date on which the shift **began**.
- **Duration**: Duration in minutes is computed as:
  $$\text{Duration} = (24 \times 60 - \text{startMinutes}) + \text{endMinutes}$$
  For `22:00` to `06:00`: $(1440 - 1320) + 360 = 120 + 360 = 480\text{ minutes (8 hours)}$.
- Clock-out occurring on the following calendar day (e.g., at `06:05` on `2026-10-16`) attaches cleanly to the overnight attendance record of `2026-10-15`.

### 2.3 Shift Assignment & Conflict Validation
Employees must be assigned to an active shift via `ShiftAssignment`:
- **Effective Range**: Defined by `effectiveFrom` (inclusive) and optional `effectiveTo` (inclusive).
- **Conflict Prevention**: An employee cannot have overlapping active assignments for the same date window within the company.
- **Multi-Tenant Scoping**: Shifts, assignments, and employees must share the same `companyId`. Cross-tenant assignments are strictly rejected.
- **Historic Preservation**: Modifying an employee's shift closes out the prior assignment's `effectiveTo` date and starts a new assignment; historical attendance records remain immutable.

---

## 3. Clock-In, Clock-Out & Duplicate Prevention Rules

### 3.1 Clock-In Rules
1. **Authenticated Actor**: An employee clocks in only as themselves (`req.user.employeeId`). Normal employees cannot supply an arbitrary `employeeId`.
2. **Current Active Shift**: The system resolves the employee's assigned shift for the current localized date.
3. **Earliest Allowed Clock-In**: Configurable window (e.g., up to 2 hours before scheduled shift start).
4. **Duplicate Prevention**:
   - The database enforces a composite unique constraint `@@unique([companyId, employeeId, attendanceDate])`.
   - If an attendance record for today already has `clockIn != null`, subsequent clock-in requests are rejected with `409 Conflict`.
   - Concurrency protection: Atomic transactions verify state before creation.
5. **Open Record Validation**: If an employee has an unclosed attendance record from a prior overnight shift that has not reached cutoff, they are prompted to clock out first.

### 3.2 Clock-Out Rules
1. **Active Record Required**: Clock-out requires an existing attendance record for the active shift day where `clockIn != null` and `clockOut == null`.
2. **Duplicate Clock-Out Prevention**: If `clockOut` is already set, subsequent clock-out attempts return `409 Conflict`.
3. **Timestamp Integrity**: Server-side UTC time (`new Date()`) is always used as the authoritative clock-out timestamp. Client-provided clock-out timestamps are disallowed for regular employees.
4. **Automatic Calculation Trigger**: When `clockOut` is recorded, the centralized `attendanceCalculation.service` immediately computes:
   - `workedMinutes`
   - `lateMinutes`
   - `earlyDepartureMinutes`
   - `breakMinutes`
   - `overtimeMinutes`
   - Final `status` (`PRESENT`, `LATE`, or `HALF_DAY`).

---

## 4. Attendance Calculation Engine (Day 17)

### 4.1 Late Arrival & Grace Period
- **Shift Scheduled Start**: $T_{\text{start}}$
- **Grace Period**: $G$ (default: 10 minutes)
- **Actual Clock-In**: $T_{\text{in}}$
- **Formula**:
  $$\text{Arrival Delta} = T_{\text{in}} - T_{\text{start}}$$
  - If $\text{Arrival Delta} \le G$: Employee is on time. $\text{lateMinutes} = 0$, Status = `PRESENT`.
  - If $\text{Arrival Delta} > G$: Employee is late. $\text{lateMinutes} = \text{Arrival Delta} - G$ (or total delta depending on company setting; default counts minutes beyond scheduled start). Status = `LATE`.

### 4.2 Early Departure
- **Shift Scheduled End**: $T_{\text{end}}$
- **Actual Clock-Out**: $T_{\text{out}}$
- If $T_{\text{out}} < T_{\text{end}}$:
  $$\text{earlyDepartureMinutes} = T_{\text{end}} - T_{\text{out}}$$
- If early departure exceeds half-day threshold, status is marked `HALF_DAY`.

### 4.3 Worked Hours & Break Deductions
$$\text{Gross Worked Minutes} = T_{\text{out}} - T_{\text{in}}$$
- **Unpaid Break Policy (Default)**: Deduct configured shift break duration (e.g., 60 minutes) if gross worked time exceeds 4 hours.
  $$\text{workedMinutes} = \max(0, \text{Gross Worked Minutes} - \text{breakMinutes})$$
- **Paid Break Policy**: Break is not deducted from worked time.
- **Negative Duration Guard**: If clock-out is somehow before clock-in due to corrupted manual input, system rejects with `400 Bad Request`.

### 4.4 Overtime Calculations
1. **Daily Shift Overtime**:
   $$\text{Daily Overtime Minutes} = \max(0, \text{workedMinutes} - \text{Scheduled Shift Working Minutes})$$
2. **Weekly Overtime Threshold**:
   - Proposed default: 40 hours (2400 minutes) per standard Monday–Friday work week.
   - Aggregate sum of weekly `workedMinutes` exceeding 2400 minutes is categorized as weekly overtime.
   - Shift overtime and weekly overtime are categorized independently to prevent double-billing in payroll.

### 4.5 Absence & Half-Day Rules
- **Full-Day Absence (`ABSENT`)**: Scheduled working day with an active shift assignment where no clock-in occurred by the end of the shift cut-off time.
- **Exclusions**:
  - Non-working days (e.g., Saturday & Sunday for standard 5-day shifts).
  - Configured company public holidays.
  - Approved leave days (`ON_LEAVE`).
  - Employees with no active shift assignment.
- **Half-Day (`HALF_DAY`)**: Recorded when `workedMinutes` is between the half-day threshold (e.g., 240 minutes) and full-day threshold (e.g., 480 minutes).

---

## 5. Attendance Correction & Audit Trail (Day 16)

### 5.1 Correction Workflow
1. **Employee Correction Request**:
   - An employee can submit a request (`POST /api/attendance/:id/correction-request`) for their own record if they forgot to clock in/out or had a discrepancy.
   - Must provide `correctedClockIn`, `correctedClockOut`, and a mandatory `reason`.
   - Initial status: `PENDING`.
2. **HR / Owner Review**:
   - HR or OWNER can review pending requests (`PATCH /api/attendance/correction-requests/:id/approve` or `:id/reject`).
   - Upon approval:
     - The Attendance record is updated inside an atomic database transaction.
     - Calculations (late, worked hours, overtime) are automatically re-run.
     - An immutable `AttendanceAudit` log entry is generated recording `previousValues`, `newValues`, `changedById`, and `reason`.
3. **Direct HR Administrative Correction**:
   - HR / OWNER can directly adjust an attendance record (`PATCH /api/attendance/:id/correct`), which also generates an audit trail entry.

---

## 6. Timezone Handling Strategy

- **Storage**: All database `DateTime` columns (`clockIn`, `clockOut`, `createdAt`, `updatedAt`) store UTC timestamps (`timestamptz`).
- **Date Partitioning**: The `attendanceDate` string (e.g., `"2026-10-15"`) is calculated based on the Company's configured timezone (e.g., `"Asia/Kolkata"`), ensuring day boundaries match local business days regardless of UTC midnight crossing.
- **Reporting & API Responses**: Timestamps are returned in ISO 8601 strings, formatted into the company timezone for CSV export and UI displays.

---

## 7. Role-Based Access Control (RBAC) Matrix

| Action | OWNER | HR | MANAGER | SUPERVISOR | EMPLOYEE |
|---|:---:|:---:|:---:|:---:|:---:|
| **Create / Edit / Deactivate Shifts** | ✅ Full Company | ✅ Full Company | ❌ | ❌ | ❌ |
| **Assign Shifts to Employees** | ✅ Full Company | ✅ Full Company | ✅ Dept Only | ❌ | ❌ |
| **Clock-In / Clock-Out** | ✅ Own | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| **View Daily Attendance Log** | ✅ Full Company | ✅ Full Company | ✅ Dept Only | ✅ Supervised Only | ❌ |
| **View Own Attendance & History** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Request Correction (Own)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Approve / Reject Corrections** | ✅ Full Company | ✅ Full Company | ❌ | ❌ | ❌ |
| **Direct HR Attendance Correction** | ✅ Full Company | ✅ Full Company | ❌ | ❌ | ❌ |
| **Weekly Attendance Reporting** | ✅ Full Company | ✅ Full Company | ✅ Dept Only | ✅ Supervised Only | ✅ Own Only |
| **Export Attendance CSV** | ✅ Full Company | ✅ Full Company | ❌ | ❌ | ❌ |

---

## 8. Summary of Proposed Configurable Defaults

| Setting | Default Value | Configuration Scope |
|---|---|---|
| Company Timezone | `Asia/Kolkata` (UTC+5:30) | `CompanyAttendanceSetting` |
| Shift Grace Period | 10 minutes | `Shift` & `CompanyAttendanceSetting` |
| Default Break Duration | 60 minutes | `Shift` & `CompanyAttendanceSetting` |
| Break Type | Unpaid (deducted from gross worked time) | `CompanyAttendanceSetting` |
| Standard Working Days | Monday through Friday | `Shift` & `CompanyAttendanceSetting` |
| Half-Day Threshold | 240 minutes (4 hours) | `CompanyAttendanceSetting` |
| Full-Day Shift Target | 480 minutes (8 hours net) | `Shift` |
| Weekly Overtime Threshold | 40 hours (2400 minutes) | `CompanyAttendanceSetting` |
