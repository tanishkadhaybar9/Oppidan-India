# Oppidan ERMS — API Reference Documentation

**Base Production URL**: `https://erms-api-xp4w.onrender.com`  
**Authentication**: Bearer JWT (`Authorization: Bearer <token>`) & HttpOnly Cookie (`refreshToken`)  
**Standard Response Envelope**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

---

## 1. Authentication & Tenant Management (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new company workspace and owner account |
| `POST` | `/api/auth/login` | Public | Authenticate user with email and password |
| `POST` | `/api/auth/refresh` | Public | Rotate refresh token and mint fresh access token |
| `POST` | `/api/auth/logout` | Authenticated | Revoke refresh token and clear session cookies |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile, role, and permissions |

---

## 2. Organization & System Settings (`/api/settings`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/settings/organization` | OWNER, HR | Fetch organization profile and operational configurations |
| `PUT` | `/api/settings/organization` | OWNER, HR | Update organization name, contact details, and address |
| `GET` | `/api/settings/working-hours` | Authenticated | Retrieve weekly working days and standard shift hours |
| `PUT` | `/api/settings/working-hours` | OWNER, HR | Configure organizational working hours and timezone |

---

## 3. User Management (`/api/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | OWNER, HR | List workspace users with role and status filters |
| `POST` | `/api/users` | OWNER, HR | Provision new user account and assign system role |
| `PATCH` | `/api/users/:id/status` | OWNER | Toggle user status (ACTIVE / INACTIVE) |
| `PUT` | `/api/users/:id/role` | OWNER | Update role assignment (OWNER, HR, MANAGER, SUPERVISOR, EMPLOYEE) |

---

## 4. Employees & Organizational Hierarchy (`/api/employees`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/employees` | Authenticated | Paginated employee directory with search and department filters |
| `POST` | `/api/employees` | OWNER, HR | Onboard new employee record |
| `GET` | `/api/employees/:id` | Authenticated | Get detailed employee profile, reporting hierarchy, and equipment |
| `PUT` | `/api/employees/:id` | OWNER, HR | Update employee information and department assignments |
| `POST` | `/api/employees/:id/deactivate` | OWNER, HR | Deactivate employee with audit trail and optional reason |
| `GET` | `/api/employees/:id/history` | OWNER, HR | Retrieve timeline of department, supervisor, and role changes |
| `GET` | `/api/employees/supervisors` | Authenticated | List all designated supervisors and their direct reports |

---

## 5. Attendance & Shifts (`/api/attendance`, `/api/shifts`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/attendance/clock-in` | Authenticated | Record arrival punch; evaluates shift rules (PRESENT / LATE) |
| `POST` | `/api/attendance/clock-out` | Authenticated | Record departure punch; calculates total hours and overtime |
| `GET` | `/api/attendance/today` | Authenticated | Retrieve today's punch state for the logged-in user |
| `GET` | `/api/attendance/daily` | OWNER, HR, MGR | Daily attendance roster across all workspace employees |
| `POST` | `/api/attendance/corrections` | Authenticated | Submit attendance adjustment request for missed punches |
| `GET` | `/api/attendance/corrections` | Authenticated | List pending/approved attendance correction requests |
| `PATCH`| `/api/attendance/corrections/:id/approve` | OWNER, HR | Approve correction and adjust attendance timestamps |
| `PATCH`| `/api/attendance/corrections/:id/reject` | OWNER, HR | Reject correction with explanation note |
| `GET` | `/api/shifts` | Authenticated | List configured shift templates and working windows |
| `POST` | `/api/shifts` | OWNER, HR | Create shift template with start, end, and grace minutes |
| `POST` | `/api/shifts/assign` | OWNER, HR, MGR | Assign employee to a shift schedule |

---

## 6. Leave Management (`/api/leave`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/leave/types` | Authenticated | List configured leave types (Annual, Sick, Casual, Unpaid) |
| `POST` | `/api/leave/types` | OWNER, HR | Create new leave entitlement type |
| `GET` | `/api/leave/balances` | Authenticated | Retrieve leave balance entitlements for current user |
| `POST` | `/api/leave/requests` | Authenticated | Submit new leave application with date validation |
| `GET` | `/api/leave/requests` | Authenticated | List leave applications with status filters |
| `POST` | `/api/leave/requests/:id/cancel` | Authenticated | Cancel own pending leave request |
| `PATCH`| `/api/leave/requests/:id/approve` | MGR, HR, OWNER | Multi-stage approval (Supervisor -> HR) |
| `PATCH`| `/api/leave/requests/:id/reject` | MGR, HR, OWNER | Reject leave request with mandatory feedback |
| `GET` | `/api/leave/holidays` | Authenticated | List organizational holidays for calendar visualization |

---

## 7. Hardware & Assets (`/api/assets`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/assets` | Authenticated | List company assets with category and status filters |
| `POST` | `/api/assets` | OWNER, HR | Register new hardware asset (Laptop, Monitor, Peripheral) |
| `GET` | `/api/assets/:id` | Authenticated | Get asset details, allocation history, and maintenance logs |
| `POST` | `/api/assets/:id/allocate` | OWNER, HR | Assign asset to an active employee |
| `POST` | `/api/assets/:id/return` | OWNER, HR | Record return of asset to company stock |
| `POST` | `/api/assets/:id/maintenance` | OWNER, HR | Create maintenance work order for repairs |
| `GET` | `/api/assets/my-assets` | Authenticated | List hardware currently allocated to logged-in employee |

---

## 8. Tasks & Productivity (`/api/tasks`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | Authenticated | List tasks with filters (status, priority, department, assignee) |
| `POST` | `/api/tasks` | OWNER, HR, MGR | Create task and assign to employee |
| `GET` | `/api/tasks/:id` | Authenticated | Task details with review comments and attachment references |
| `PATCH`| `/api/tasks/:id/status` | Authenticated | Progress status (TO_DO -> IN_PROGRESS -> UNDER_REVIEW) |
| `POST` | `/api/tasks/:id/review` | MGR, HR, OWNER | Approve completed task or return for revisions |
| `GET` | `/api/tasks/analytics` | Authenticated | Aggregated completion velocity and department task distribution |

---

## 9. Payroll & Payslips (`/api/payroll`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/payroll/structures` | OWNER, HR | List employee salary structures and components |
| `POST` | `/api/payroll/structures` | OWNER, HR | Define base salary, allowances, and statutory deductions |
| `POST` | `/api/payroll/process` | OWNER, HR | Batch process monthly payroll against attendance records |
| `GET` | `/api/payroll/history` | OWNER, HR | Historical payroll batches and disbursement statuses |
| `GET` | `/api/payroll/payslips/:id` | Authenticated | Detailed payslip breakdown for employee or HR viewing |

---

## 10. Notifications & Audit Logs (`/api/notifications`, `/api/audit-logs`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authenticated | Paginated notifications with unread filter and unread count |
| `GET` | `/api/notifications/unread-count`| Authenticated | Fast header polling endpoint for notification badge |
| `PATCH`| `/api/notifications/:id/read` | Authenticated | Mark individual notification as read |
| `POST` | `/api/notifications/mark-all-read`| Authenticated | Mark all notifications for current user as read |
| `DELETE`| `/api/notifications/:id` | Authenticated | Permanently delete notification from user feed |
| `GET` | `/api/audit-logs` | OWNER, HR | Searchable audit trail of administrative events and data mutations |

---

## 11. System Health & Diagnostics (`/api/health`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Liveness probe returning status, uptime, and database latency |
| `GET` | `/api/health/diagnostics` | OWNER, HR | Comprehensive performance telemetry, memory, and error statistics |
