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
| **Backend** | Node.js, Express.js, TypeScript, RESTful API architecture |
| **Database & ORM** | PostgreSQL (Neon Serverless with TLS 1.3), Prisma ORM 6.19.3 |
| **Authentication** | Dual-Token JWT (15-min access token + HttpOnly secure cookie refresh), Argon2/bcrypt |
| **Deployment** | Vercel (SPA Frontend with rewrite routing), Render (API Web Service), Neon (Database) |

---

## 📦 Complete 8-Week Implementation Roadmap

### Week 1 — Foundation & Multi-Tenant Authentication
- Multi-tenant tenant isolation scoped by `companyId` on all database models and routes.
- Dual-token JWT authentication with token rotation and silent background token renewal.
- Role-Based Access Control (RBAC) with 5 distinct permission tiers.

### Week 2 — Employee Management & Organizational Hierarchy
- Comprehensive Employee Directory with employee code generation, filtering, and search.
- Department and Designation structure management.
- Multi-tier supervisor mappings and reporting lines.

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

### Week 8 — System Administration, Notifications, Audit Logs & System Health
- **Organization Settings**:
  - Company Profile (Name, logo, email, phone, website, street address, postal code).
  - Working Hours (Standard operating days, shift start/end times).
  - Attendance Policy (Grace period, break allowance, overtime thresholds, remote punch policy, GPS requirements).
  - Leave Policy (Fiscal year start, carry-forward rollover rules, medical proof thresholds).
  - System Preferences (Timezone, date format, time format, default currency).
- **Notification Management**:
  - Notification bell in top header with real-time unread badge counter.
  - Quick notification dropdown and comprehensive `/notifications` page.
  - Multi-category event routing (`EMPLOYEE`, `LEAVE`, `ATTENDANCE`, `TASK`, `PAYROLL`, `ASSET`, `SYSTEM`).
  - Read/unread filtering, mark all as read, and delete actions.
- **Audit Logs & Activity Tracking**:
  - Append-only security audit trail recording all administrative mutations, approvals, and logins.
  - Search and filter by module, action, date range, and actor.
  - Expandable JSON metadata inspector for detailed request payloads and IP addresses.
  - Summary KPI cards with 24-hour activity velocities and active modules.
- **User & Access Control**:
  - User management interface with role assignment and account activation/deactivation.
  - User creation modal with optional linkage to Employee records.
  - Password reset capabilities and account protection safeguards.
  - Interactive RBAC Permission Matrix inspector.
- **Security & System Health**:
  - Real-time diagnostic probes (`/api/health/diagnostics`).
  - Database roundtrip latency measurement (ms) via Prisma on Neon.
  - Continuous server uptime counter and V8 memory heap utilization gauges.
  - Security checklist verification for tenant isolation, JWT rotation, and TLS encryption.

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

| Capability | OWNER | HR | MANAGER | SUPERVISOR | EMPLOYEE |
|---|:---:|:---:|:---:|:---:|:---:|
| Organization Settings Edit | ✅ | ✅ | ❌ | ❌ | ❌ |
| User & Role Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Audit Logs Inspection | ✅ | ✅ | ❌ | ❌ | ❌ |
| System Health Diagnostics | ✅ | ✅ | ❌ | ❌ | ❌ |
| Employee Master Management | ✅ | ✅ | View Only | View Only | Self Only |
| Department / Designation Setup | ✅ | ✅ | ❌ | ❌ | ❌ |
| Attendance Correction Approval | ✅ | ✅ | ❌ | ❌ | ❌ |
| Leave Approval Queue | ✅ | ✅ | ✅ | ✅ | ❌ |
| Task Assignment & Reviews | ✅ | ✅ | ✅ | ✅ | Self Only |
| Salary Structure & Payroll Process | ✅ | ✅ | ❌ | ❌ | Self Payslips |
| System Notifications | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🔌 API Endpoints Summary

### Authentication & Users
- `POST /api/auth/register` — Register new company workspace and owner account
- `POST /api/auth/login` — Authenticate and receive access token + refresh cookie
- `POST /api/auth/refresh` — Rotate access token via HttpOnly refresh cookie
- `GET /api/auth/me` — Current authenticated user profile
- `GET /api/users` — List company users with search and role filters
- `POST /api/users` — Provision new user account
- `PATCH /api/users/:id` — Update user details or role
- `PATCH /api/users/:id/status` — Toggle active / inactive status
- `GET /api/users/roles/matrix` — Fetch RBAC permissions matrix

### Organization Settings (Week 8)
- `GET /api/settings` — Get complete organization settings
- `PATCH /api/settings/organization` — Update company profile & contact info
- `PATCH /api/settings/working-hours` — Configure working days and shift times
- `PATCH /api/settings/attendance` — Update attendance rules, grace period, and thresholds
- `PATCH /api/settings/leave` — Update leave rollover policies and rules
- `PATCH /api/settings/preferences` — Update timezone, currency, and date formats

### Notifications (Week 8)
- `GET /api/notifications` — List paginated notifications with filters
- `GET /api/notifications/unread-count` — Quick count of unread items
- `PATCH /api/notifications/:id/read` — Mark notification as read
- `PATCH /api/notifications/mark-all-read` — Mark all notifications as read
- `DELETE /api/notifications/:id` — Remove notification

### Audit Logs (Week 8)
- `GET /api/audit-logs` — List immutable audit trail with filters and pagination
- `GET /api/audit-logs/stats` — Summary metrics for audit dashboard

### System Health (Week 8)
- `GET /api/health` — Public health probe for uptime monitors
- `GET /api/health/diagnostics` — Comprehensive diagnostic metrics (DB latency, memory, uptime, entity volumes)

---

## 💻 Local Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database (or Neon connection string)

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

### 3. Database Migration & Push
```bash
cd apps/api
npx prisma generate
npx prisma db push
```

### 4. Running Locally
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

## 📄 License
This project was developed as part of the Full-Stack Engineering Internship at Oppidan India.
