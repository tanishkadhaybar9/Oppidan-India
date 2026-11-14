# Oppidan ERMS — Full Application Test Report & Verification Matrix
## Week 10 Final Product Polish, UX & Release Verification

**Project**: Employee & Resource Management System (ERMS)  
**Date**: November 2026  
**Environment**: Production (Render Backend + Neon PostgreSQL + Vercel Frontend)  
**Result Summary**: **54 / 54 Tests Passed (100% Pass Rate)**

---

## 1. Functional Test Matrix

| ID | Module | Test Scenario | Input / Action | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|:---:|
| TC-01 | Auth | Workspace Registration | Valid company & owner credentials | Company created, owner user created, tokens issued | 201 Created, JWT access token & HttpOnly cookie returned | **PASS** |
| TC-02 | Auth | Duplicate Email Registration | Same email used for second company | Rejected with conflict error | 409 Conflict: "Email already registered" | **PASS** |
| TC-03 | Auth | Valid User Login | Correct email & password | Authenticated, user profile loaded | 200 OK, redirected to /dashboard | **PASS** |
| TC-04 | Auth | Invalid Credentials | Wrong password | Rejected with unauthorized | 401 Unauthorized: "Invalid credentials" | **PASS** |
| TC-05 | Auth | Silent Token Refresh | Expired access token with valid refresh cookie | New access token minted seamlessly | 200 OK, background rotation successful | **PASS** |
| TC-06 | Employees | Create Employee | Unique code & valid department | Employee created, history logged | 201 Created, employee appears in directory | **PASS** |
| TC-07 | Employees | Duplicate Employee Code | Existing code within same tenant | Blocked | 409 Conflict: "Employee code already exists" | **PASS** |
| TC-08 | Employees | Self-Supervisor Assignment | Employee assigned to self | Blocked | 400 Bad Request: "Cannot report to self" | **PASS** |
| TC-09 | Employees | Circular Hierarchy | A reports to B, B tries to report to A | Blocked | 400 Bad Request: "Circular reporting hierarchy detected" | **PASS** |
| TC-10 | Employees | Employee Search & Debounce | Typing search query rapidly | Single request fired after 300ms delay | Debounced API request, results match query | **PASS** |
| TC-11 | Attendance | Clock In | Employee punch at start of shift | Attendance record created with PRESENT/LATE | 200 OK, punch timestamp recorded | **PASS** |
| TC-12 | Attendance | Double Clock In | Clocking in twice without clocking out | Blocked | 400 Bad Request: "Already clocked in" | **PASS** |
| TC-13 | Attendance | Clock Out | Punch out at end of shift | Worked hours & overtime calculated | 200 OK, total hours logged accurately | **PASS** |
| TC-14 | Attendance | Missed Punch Correction Request | Submit correction with reason | Pending approval record generated | Notification sent to HR/Supervisor | **PASS** |
| TC-15 | Attendance | HR Correction Approval | HR approves correction | Attendance times adjusted, immutable audit logged | Status changed to APPROVED | **PASS** |
| TC-16 | Shifts | Shift Assignment | Assign shift template to employee | Schedule mapped with date range | 200 OK, displayed on employee roster | **PASS** |
| TC-17 | Leave | Apply Leave | Valid dates within balance | Request created with PENDING status | Balance reserved, manager notified | **PASS** |
| TC-18 | Leave | Overdraft Application | Request days exceed available balance | Blocked | 400 Bad Request: "Insufficient leave balance" | **PASS** |
| TC-19 | Leave | End Date Before Start Date | Invalid date range (end < start) | Blocked by validation | 400 Bad Request: "Invalid date range" | **PASS** |
| TC-20 | Leave | Multi-Stage Approval | Supervisor -> Manager -> HR approval | Status progresses through workflow | Final status APPROVED, balance deducted | **PASS** |
| TC-21 | Assets | Add Hardware Asset | Serial number & purchase date | Asset saved to inventory | 201 Created, status AVAILABLE | **PASS** |
| TC-22 | Assets | Duplicate Serial Number | Same serial number within company | Blocked | 409 Conflict: "Serial number already registered" | **PASS** |
| TC-23 | Assets | Allocate Asset | Assign to active employee | Status changes to ALLOCATED, history logged | Visible in employee's My Assets view | **PASS** |
| TC-24 | Assets | Maintenance Ticket | Submit repair ticket for damaged device | Status changes to UNDER_MAINTENANCE | Logged in maintenance queue | **PASS** |
| TC-25 | Tasks | Create Task | Title, priority (HIGH), due date | Task created in TO_DO status | Notification delivered to assigned employee | **PASS** |
| TC-26 | Tasks | Status Transition | TO_DO -> IN_PROGRESS -> UNDER_REVIEW | Allowed status progression | Status badges updated in real-time | **PASS** |
| TC-27 | Tasks | Supervisor Review | Approve task submitted for review | Task marked COMPLETED | Notification sent to assignee | **PASS** |
| TC-28 | Tasks | Task Analytics | Filter by department | Dynamic completion velocity calculated | Real chart values rendered from DB | **PASS** |
| TC-29 | Payroll | Create Salary Structure | Base, HRA, Allowances, PF, ESI | Validated positive decimal calculation | 201 Created, formula preserved | **PASS** |
| TC-30 | Payroll | Batch Payroll Processing | Run payroll for selected month | Attendance-based net pay generated | Records generated in PROCESSED status | **PASS** |
| TC-31 | Payroll | Duplicate Batch Run | Running same month twice without rollback | Blocked | 400 Bad Request: "Payroll already processed" | **PASS** |
| TC-32 | Payroll | Payslip Generation | View and print individual payslip | Formatted printable breakdown rendered | Gross, Deductions, Net match calculations | **PASS** |
| TC-33 | Reports | Export Employee CSV | Click Export CSV | RFC-4180 compliant CSV file downloaded | Browser downloads valid CSV | **PASS** |
| TC-34 | Reports | Attendance Summary Report | Filter by date range & department | Dynamic attendance counts aggregated | Matches database punch counts | **PASS** |
| TC-35 | Notifications | Unread Badge Counter | New event occurs | Badge increments in header | Real-time unread count displayed | **PASS** |
| TC-36 | Notifications | Mark All As Read | Click "Mark all as read" | All user notifications marked isRead: true | Badge count resets to 0 | **PASS** |
| TC-37 | Notifications | Delete Notification | Click trash icon | Record deleted from database | Removed from UI immediately | **PASS** |
| TC-38 | Audit | Admin Mutation Logging | Employee updated or role changed | AuditLog record appended with IP & user | Visible in Audit Logs table | **PASS** |
| TC-39 | Audit | Audit Search & Filters | Filter by module: PAYROLL | Only payroll audit records displayed | Table filtered accurately | **PASS** |
| TC-40 | Settings | Update Company Profile | Change phone & address | Company record updated in PostgreSQL | Reflected in sidebar and headers | **PASS** |
| TC-41 | Settings | Update Working Hours | Adjust shift start/end times | Saved to database settings | Settings persisted on page reload | **PASS** |
| TC-42 | Users | Provision New User | Add HR user with temporary password | User created, role permissions assigned | New user can authenticate | **PASS** |
| TC-43 | Users | Deactivate User | Toggle status to INACTIVE | Status updated, access revoked | Deactivated user cannot log in | **PASS** |
| TC-44 | Health | Diagnostic Probes | Open /settings/health | Real-time DB latency (ms) & uptime | Live metrics retrieved from Render & Neon | **PASS** |
| TC-45 | Health | Memory & Error Monitoring | Fetch health endpoint | Heap used, error rate/min, request latency | Diagnostics returned within 50ms | **PASS** |
| TC-46 | RBAC | Unauthorized Route Access | EMPLOYEE accesses /settings/users | Access denied by ProtectedRoute | User redirected or blocked | **PASS** |
| TC-47 | Resilience | Component Crash Handling | Forced component error in tree | ErrorBoundary renders fallback | User shown recovery options, no white screen | **PASS** |
| TC-48 | Performance | Route Code-Splitting | Navigate between pages | Modular route chunks loaded dynamically | Chunks average < 30kB gzip | **PASS** |
| TC-49 | UI/UX | User Status Confirmation | Toggle active/inactive in User Management | ConfirmModal prompts before mutating state | State updated only upon user confirmation | **PASS** |
| TC-50 | UI/UX | Notification Deletion Modal | Click delete on notification card | Danger ConfirmModal requires explicit click | Prevents accidental deletion of unread items | **PASS** |
| TC-51 | A11y | Keyboard Dialog Dismissal | Press Escape key while modal is open | Modal dismisses and focus restores | Accessible for keyboard-only users | **PASS** |
| TC-52 | A11y | Accessible Icon Buttons | Inspect icon-only buttons with screen reader | aria-label and titles announce purpose | Fully passes WCAG 2.1 AA name checks | **PASS** |
| TC-53 | Responsive | Mobile Navigation Drawer | Viewport resized to < 768px | Hamburger opens slide-out drawer with backdrop | Smooth touch target navigation | **PASS** |
| TC-54 | Performance | Vite Bundle Code Splitting | Run production build | Initial entry chunk is under 60 kB gzip | 70+ async chunks loaded on demand | **PASS** |

---

## 2. UI & Responsive Design Checklist

- [x] **Theme Consistency**: Oppidan signature coral (`#f47b5b`), white cards, `#eadbd2` border accents, and light backgrounds preserved across all screens.
- [x] **Responsive Navigation**: Desktop collapsible sidebar and mobile slide-out drawer tested on phone, tablet, and widescreen viewports.
- [x] **Empty States**: Every table and list displays an empty state illustration when 0 records match filters.
- [x] **Loading Indicators**: Route transitions show loading skeletons and action buttons show animated spinners during async operations.
- [x] **Double-Submit Prevention**: All mutation buttons are disabled with spinner feedback during inflight submissions.
- [x] **Security Sanitation**: Passwords and JWT tokens are excluded from all logging and API error responses.
