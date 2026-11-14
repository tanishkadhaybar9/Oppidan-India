# Oppidan ERMS — Employee & Resource Management System

A production-grade, multi-tenant Employee and Resource Management System (ERMS) built during the Oppidan India Full-Stack Engineering Internship.

- **Live Frontend**: [https://oppidan-india-xhaa.vercel.app](https://oppidan-india-xhaa.vercel.app)
- **Live API Backend**: [https://erms-api-xp4w.onrender.com](https://erms-api-xp4w.onrender.com)
- **GitHub Repository**: [https://github.com/tanishkadhaybar9/Oppidan-India](https://github.com/tanishkadhaybar9/Oppidan-India)

---

## 🚀 Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, React Router v7 |
| **Frontend Architecture** | Route-level code splitting (`React.lazy`), React `ErrorBoundary`, debounced search |
| **Backend** | Node.js, Express.js, TypeScript, RESTful API architecture |
| **Performance & Logging** | Structured sanitized logger, request latency profiler, error tracking ring buffer |
| **Database & ORM** | PostgreSQL (Neon Serverless with TLS 1.3), Prisma ORM 6.19.3 |
| **Backup & Recovery** | Neon Continuous WAL Archiving, Point-in-Time Recovery (PITR), Copy-on-Write branching |
| **Authentication** | Dual-Token JWT (15-min access token + HttpOnly secure cookie refresh), Argon2/bcrypt |
| **Deployment** | Vercel (SPA Frontend with rewrite routing), Render (API Web Service), Neon (Database) |

---

## 📦 Complete 11-Week Implementation Roadmap

### Week 1 — Foundation & Multi-Tenant Authentication
- Multi-tenant tenant isolation scoped by `companyId` on all database models and routes.
- Dual-token JWT authentication with token rotation and silent background token renewal.
- Role-Based Access Control (RBAC) with 5 distinct permission tiers.

### Week 2 — Employee Management & Organizational Hierarchy
- Comprehensive Employee Directory with employee code generation, filtering, and search.
- Department and Designation structure management.
- Multi-tier supervisor mappings, circular hierarchy prevention, and reporting lines.

### Week 3 — Attendance & Shift Management
- Real-time Clock-In / Clock-Out punch system with IP and location capture.
- Shift management, templates, and employee shift assignments.
- Attendance corrections workflow with manager and HR approval queues.
- Automatic lateness detection, break deduction, and weekly overtime calculation.

### Week 4 — Leave Management System
- Leave types catalog with paid/unpaid classification and accrual limits.
- Employee leave application with document proof and conflict checking.
- Multi-stage leave approval workflow (Supervisor -> Manager -> HR).
- Company holiday calendar and personal leave balance tracking.

### Week 5 — Asset & Inventory Management
- Hardware/Software asset tracking with serial numbers and warranty statuses.
- Employee asset allocation and return workflows with condition logging.
- Asset maintenance tickets, repair status tracking, and cost attribution.

### Week 6 — Task Management, Tracking & Reviews
- End-to-end Task lifecycle (`TO_DO`, `IN_PROGRESS`, `UNDER_REVIEW`, `COMPLETED`, `ON_HOLD`, `CANCELLED`).
- Priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) with visual indicators.
- Supervisor review queue for submitted tasks with approve/request revision workflows.
- Task analytics dashboard with completion velocity and overdue metrics.

### Week 7 — Payroll Management & Reports Hub
- Dynamic salary structure creation with earnings, allowances, EPF, ESI, and tax deductions.
- Monthly payroll batch processing with automated net pay calculation from attendance.
- Printable, professional payslips downloadable per employee.
- Comprehensive Reports Hub with export options (CSV, Excel) for Employees, Attendance, Leaves, Assets, Payroll, and Tasks.

### Week 8 — System Administration, Notifications & Audit Logs
- **Organization Settings**: Company Profile, Working Hours, Attendance Rules, Leave Policies, and System Preferences.
- **Notification Management**: Header notification bell, unread badge counter, notification center, and multi-category event routing.
- **Audit Logs & Activity Tracking**: Append-only security audit trail recording all administrative mutations, approvals, and logins.
- **User & Access Control**: User management interface with role assignment and account activation/deactivation.

### Week 9 — Performance Optimization, Backup, Recovery & Monitoring
- **Frontend Code Splitting**: Converted all 28+ application routes to dynamic `React.lazy` imports, dropping initial bundle size from 1.07 MB down to 59 kB.
- **React Error Boundary**: Implemented global `ErrorBoundary` component preventing blank white screens during unexpected runtime failures.
- **Backend Latency Profiler**: Express middleware measuring request duration, logging slow queries (>500ms), and calculating rolling latency averages.
- **Sanitized Structured Logger**: Sensitive credentials (passwords, tokens, cookies) are automatically redacted from server logs.
- **In-Memory Error Tracker**: Ring buffer tracking the last 50 operational errors and real-time error rates per minute.
- **Live System Health & Monitoring**: Admin UI displaying real-time database roundtrip latency, memory utilization, and Neon backup/PITR status.
- **Disaster Recovery Strategy**: Official [Backup and Recovery Documentation](docs/BACKUP_AND_RECOVERY.md) defining Point-in-Time Recovery and copy-on-write branching protocols.

### Week 10 — Final Product Polish, Advanced UI/UX & Capstone Submission
- **Design System Standardization**: Unified signature coral (`#f47b5b`), white cards, `#eadbd2` border accents, and custom badges across every screen.
- **Destructive Action Guards**: Reusable `ConfirmModal` dialogs preventing accidental state changes across User Management and Notifications.
- **Accessibility & WCAG 2.1 AA**: Keyboard dialog dismissal (`Escape`), visible focus states, and explicit `aria-label` tags on icon-only navigation controls.
- **Mobile Responsive Drawer**: Touch-friendly slide-out drawer navigation with overlay backdrop on viewports `< 768px`.
- **Comprehensive Documentation Suite**: Complete architectural blueprint ([ARCHITECTURE.md](docs/ARCHITECTURE.md)), full endpoint reference ([API_REFERENCE.md](docs/API_REFERENCE.md)), verified testing matrix ([TEST_REPORT.md](docs/TEST_REPORT.md) — 54/54 tests passed), and final internship package ([SUBMISSION_REPORT.md](docs/SUBMISSION_REPORT.md)).

### Week 11 — Advanced ERMS Enhancements, UAT & Real-World Workflow Integration
- **Role-Based UAT Verification**: Automated 75-scenario UAT suite across 5 personas (`OWNER`, `HR`, `MANAGER`, `SUPERVISOR`, `EMPLOYEE`) with **100% pass rate** ([UAT_REPORT.md](docs/UAT_REPORT.md)).
- **RBAC Security Hardening**: Revoked `USER_READ` from `MANAGER` and granted `COMPANY_SETTINGS_MANAGE` to `HR` ([BUG_TRACKING.md](docs/BUG_TRACKING.md)).
- **Complete Employee Lifecycle**: Formalized and verified 10-step lifecycle workflow preserving historical audit data ([EMPLOYEE_LIFECYCLE.md](docs/EMPLOYEE_LIFECYCLE.md)).
- **Cross-Module Integration**: Documented interactions across all 8 modules ([CROSS_MODULE_INTEGRATION.md](docs/CROSS_MODULE_INTEGRATION.md)) and non-negotiable constraints ([BUSINESS_RULES.md](docs/BUSINESS_RULES.md)).
- **Release Package v1.11.0**: Published production release notes ([RELEASE_NOTES_WEEK11.md](docs/RELEASE_NOTES_WEEK11.md)) and operational notes ([KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md)).

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

| Capability | OWNER | HR | MANAGER | SUPERVISOR | EMPLOYEE |
|---|:---:|:---:|:---:|:---:|:---:|
| Organization Settings Edit | ✅ | ✅ | ❌ | ❌ | ❌ |
| User & Role Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Audit Logs Inspection | ✅ | ✅ | ❌ | ❌ | ❌ |
| Monitoring & Diagnostics | ✅ | ✅ | ❌ | ❌ | ❌ |
| Employee Master Management | ✅ | ✅ | View Only | View Only | Self Only |
| Department / Designation Setup | ✅ | ✅ | ❌ | ❌ | ❌ |
| Attendance Correction Approval | ✅ | ✅ | ❌ | ❌ | ❌ |
| Leave Approval Queue | ✅ | ✅ | ✅ | ✅ | ❌ |
| Task Assignment & Reviews | ✅ | ✅ | ✅ | ✅ | Self Only |
| Salary Structure & Payroll Process | ✅ | ✅ | ❌ | ❌ | Self Payslips |
| System Notifications | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🎬 Professional Demonstration Walkthrough

For demonstration purposes, verify workflows using these role-based flows:

### 1. Executive & HR Workflow (`OWNER` or `HR`)
1. **Login**: Navigate to `/login` and sign in.
2. **Dashboard Overview**: Inspect organizational KPI summary cards, employee headcount, and attendance summaries.
3. **Administration & Monitoring**:
   - Navigate to `/settings/health` to view live API latency benchmarks, server uptime, and Neon database connection health.
   - Navigate to `/settings/organization` to inspect company profile, working hours, and attendance policy settings.
   - Navigate to `/settings/audit-logs` to inspect the append-only activity trail with expandable JSON metadata.
4. **Payroll Processing**: Navigate to `/payroll/dashboard` -> `/payroll/process` to review automated salary calculations and batch payroll runs.

### 2. Departmental Management Workflow (`MANAGER` or `SUPERVISOR`)
1. **Attendance Oversight**: Navigate to `/attendance` to review clock-in statuses and approve missed punch corrections.
2. **Leave Approvals**: Navigate to `/leave/approvals` to review subordinate leave requests with multi-stage approval buttons.
3. **Task Reviews**: Navigate to `/tasks/reviews` to inspect completed tasks, request revisions, or grant approvals.

### 3. Employee Self-Service Workflow (`EMPLOYEE`)
1. **Punch In / Out**: Navigate to `/attendance/my` to record live clock-in and clock-out timestamps.
2. **Apply for Leave**: Navigate to `/leave/apply` to submit a leave request with remaining balance verification.
3. **My Tasks & Payslips**: Navigate to `/tasks/my` to update assigned task statuses and `/payroll/my-payslips` to view and print official payslips.

---

## 💻 Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/tanishkadhaybar9/Oppidan-India.git
cd Oppidan-India

# Install backend dependencies
cd apps/api
npm install

# Install frontend dependencies
cd ../web
npm install
```

### 2. Environment Variables Configuration

#### Backend (`apps/api/.env`):
```env
PORT=5000
DATABASE_URL="postgresql://user:password@ep-sample.neon.tech/erms?sslmode=require"
JWT_SECRET="your-super-secret-access-token-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-token-key"
COOKIE_SECRET="your-cookie-secret-key"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

#### Frontend (`apps/web/.env`):
```env
VITE_API_BASE_URL="http://localhost:5000"
```

### 3. Running Locally
```bash
# Terminal 1: Backend
cd apps/api
npm run dev

# Terminal 2: Frontend
cd apps/web
npm run dev
```

Visit `http://localhost:5173` to access the application.

---

## 📄 License & Credits
Developed as part of the Full-Stack Engineering Internship at Oppidan India.
