# Oppidan India Group — ERMS Week 4
# Leave Management & Approval Workflow Specification

## 1. Executive Overview

The Leave Management Module provides a secure, multi-tenant, permissioned workflow for employee time-off requests, entitlement tracking, holiday calendars, multi-tier approvals, and automatic synchronization with the Week 3 Shift and Attendance Engine.

---

## 2. Leave Approval State Machine

### 2.1 State Definitions

| State | Description | Who Can Transition To This State |
|---|---|---|
| `PENDING_SUPERVISOR` | Request submitted by employee; awaiting direct supervisor review | System on employee submission |
| `PENDING_MANAGER` | Approved by supervisor; awaiting department manager concurrence (where applicable) | Direct Supervisor |
| `PENDING_HR` | Approved by manager/supervisor; awaiting HR/Owner policy & balance validation | Department Manager / Direct Supervisor |
| `APPROVED` | Final approval granted; balance deducted; attendance dates reserved | HR / OWNER |
| `REJECTED` | Request denied at any stage; rejection reason mandatory; pending balance released | SUPERVISOR, MANAGER, HR, OWNER |
| `CANCELLED` | Request cancelled by employee prior to leave date, or revoked by HR | Employee (own pending/future), HR, OWNER |

### 2.2 Transition Diagram

```text
       [Employee Submits Request]
                   │
                   ▼
        ┌───────────────────────┐
        │  PENDING_SUPERVISOR   │◄────────────────┐
        └──────────┬────────────┘                 │
                   │                              │
         Supervisor│                              │
          Approves │ (If no Manager stage)        │
                   ├────────────────────────┐     │
                   ▼                        │     │
        ┌───────────────────────┐           │     │
        │    PENDING_MANAGER    │           │     │
        └──────────┬────────────┘           │     │
                   │                        │     │
          Manager  │                        │     │
          Approves │                        │     │
                   ▼                        ▼     │
        ┌───────────────────────────────────────┐ │
        │              PENDING_HR               │ │
        └──────────────────┬────────────────────┘ │
                           │                      │
                   HR/Owner│                      │
                   Approves│                      │
                           ▼                      │
        ┌───────────────────────────────────────┐ │
        │               APPROVED                │ │
        └──────────────────┬────────────────────┘ │
                           │                      │
             (If Cancelled)│                      │
                           ▼                      │
        ┌───────────────────────────────────────┐ │
        │              CANCELLED                │─┘
        └───────────────────────────────────────┘
                           ▲
     At any stage:         │ (On employee / HR cancel)
     Supervisor / Manager / HR Rejects
                           │
        ┌──────────────────┴────────────────────┐
        │               REJECTED                │
        └───────────────────────────────────────┘
```

### 2.3 Approval Stage Rules

1. **Direct Supervisor Stage**:
   - The supervisor assigned to the employee must review and approve or reject.
   - If the employee has no assigned supervisor, the request automatically advances to `PENDING_HR`.
   - Supervisors can only view and act on requests from their assigned direct subordinates.
2. **Department Manager Stage**:
   - Department managers review leaves within their department for operational continuity.
   - If no manager approval is required or department has no assigned manager, workflow advances directly to `PENDING_HR`.
3. **HR / OWNER Final Stage**:
   - HR or Company OWNER performs final regulatory verification and approves the request.
   - Upon transition to `APPROVED`, the reserved pending balance is converted to `usedDays`.
   - Daily attendance records on approved dates are flagged as `ON_LEAVE`.
4. **Rejection & Cancellation**:
   - Rejection requires an explicit `rejectionReason`.
   - Cancellation releases the reserved pending days back to the employee's available balance.
   - Cancellation of an already approved leave restores the used balance and clears `ON_LEAVE` status from future attendance dates.

---

## 3. Leave Types & Entitlements

Configurable by HR and OWNER per company:

- **Leave Types**:
  - `Casual Leave (CL)`: Short planned personal leaves (default 12 days/yr).
  - `Sick Leave (SL)`: Unplanned medical leaves (default 10 days/yr).
  - `Earned Leave (EL)`: Accrued privilege leaves (carry-forward eligible).
  - `Unpaid Leave (LWP)`: Leave without pay (allows negative/unlimited).
- **Configuration Attributes**:
  - `paid`: Boolean (influences payroll deduction).
  - `requiresApproval`: Boolean (default true).
  - `maximumDays`: Annual maximum quota.
  - `minimumNoticeDays`: Minimum advance notice before `startDate`.
  - `allowHalfDay`: Permits first-half / second-half day requests (0.5 day).
  - `allowCarryForward`: Permits carrying forward unused balance to next year.
  - `allowNegativeBalance`: Whether employees can apply beyond quota.
  - `status`: ACTIVE / INACTIVE. Soft-deactivation preserves historical requests.

---

## 4. Leave Balance Formula & Reservation

### 4.1 Balance Equation

$$\text{Available Balance} = \text{Allocated Days} + \text{Carried Forward Days} + \text{Adjustments} - \text{Used Days}$$

$$\text{Remaining Balance (After Pending)} = \text{Available Balance} - \text{Pending Days}$$

### 4.2 Lifecycle of Days

1. **On Submission**:
   - Validation checks if $\text{Requested Days} \le \text{Remaining Balance}$ (unless negative balance allowed).
   - $\text{Pending Days} \mathrel{+}= \text{Requested Days}$.
2. **On Approval**:
   - $\text{Pending Days} \mathrel{-}= \text{Requested Days}$.
   - $\text{Used Days} \mathrel{+}= \text{Requested Days}$.
3. **On Rejection / Pre-approval Cancellation**:
   - $\text{Pending Days} \mathrel{-}= \text{Requested Days}$.
4. **On Post-approval Cancellation**:
   - $\text{Used Days} \mathrel{-}= \text{Requested Days}$.

---

## 5. Working Day & Holiday Calculation

Leave duration does not simply compute `endDate - startDate`. It calculates **Net Working Days**:

$$\text{Leave Duration} = \sum_{d = \text{startDate}}^{\text{endDate}} \text{DayWeight}(d)$$

Where:
- $\text{DayWeight}(d) = 0$ if date $d$ is a configured Weekend for the employee's shift.
- $\text{DayWeight}(d) = 0$ if date $d$ is an active Company Holiday in the Holiday Calendar.
- $\text{DayWeight}(d) = 0.5$ if half-day requested on start or end date.
- $\text{DayWeight}(d) = 1.0$ for regular working days.

---

## 6. Attendance & Shift Integration

1. **Absence Prevention**:
   - If an employee has an `APPROVED` leave request covering a scheduled shift date, the daily attendance generation records the status as `ON_LEAVE`.
   - The employee is **never marked ABSENT** or charged with late arrival or early departure penalties.
2. **Pending Request Safety**:
   - `PENDING_*` requests **do not alter attendance**. The employee is expected to attend unless approved.
3. **Rejected Request Safety**:
   - `REJECTED` leaves have zero impact on attendance or balances.
4. **Cancellation Safety**:
   - Cancelling an approved leave updates the attendance record, allowing normal clock-in.

---

## 7. Role-Based Permission Matrix

| Action | EMPLOYEE | SUPERVISOR | MANAGER | HR | OWNER |
|---|:---:|:---:|:---:|:---:|:---:|
| View Own Leave Balances & Requests | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit Leave Request | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cancel Own Pending Leave | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve Supervisor Stage (Direct Reports) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve Manager Stage (Department) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Approve HR Stage (Company-wide) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Reject Request (Within Scope) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage Leave Types & Policies | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Company Holiday Calendar | ❌ | ❌ | ❌ | ✅ | ✅ |
| Adjust Employee Leave Balances | ❌ | ❌ | ❌ | ✅ | ✅ |
| View Company-Wide Leave Reports | ❌ | ❌ | ❌ | ✅ | ✅ |
