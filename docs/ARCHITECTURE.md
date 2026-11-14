# Oppidan ERMS — System Architecture & Design Specification

## 1. Executive Architecture Overview

The **Oppidan Employee & Resource Management System (ERMS)** is an enterprise HRMS designed for multi-tenant workforce management, shift scheduling, leave approval hierarchies, hardware asset lifecycle tracking, task management, and payroll processing.

The platform follows a decoupled, cloud-native architecture:
- **Frontend SPA**: React 19 + TypeScript + Vite 8.3.3 + Tailwind CSS v4 deployed on Vercel Edge.
- **Backend API**: Node.js + Express + TypeScript deployed on Render Web Services.
- **Relational Database**: PostgreSQL hosted on Neon Serverless (TLS 1.3 encrypted, automated WAL archives and Point-In-Time-Recovery).
- **ORM**: Prisma 6.19.3 with strictly typed schema definitions and migration tracking.

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Client (Vercel Edge)"]
        Browser["Web Browser (Desktop / Tablet / Mobile)"]
        ViteApp["React 19 SPA (Vite 8.3.3)"]
        Router["React Router v7 (Lazy Loaded Chunks)"]
        AuthCtx["Auth Context (JWT + Memory Cache)"]
        Browser --> ViteApp
        ViteApp --> Router
        ViteApp --> AuthCtx
    end

    subgraph ApiGateway["Backend API (Render Web Service)"]
        Express["Express Server (Node.js + TS)"]
        CorsMW["CORS & Cookie Parser"]
        ProfilerMW["Request Profiler & Latency Tracker"]
        AuthMW["JWT Authentication & RBAC Guard"]
        SanitizeLogger["Sanitizing Logger & Error Tracker"]
        
        Express --> CorsMW
        CorsMW --> ProfilerMW
        ProfilerMW --> AuthMW
        AuthMW --> SanitizeLogger
    end

    subgraph DomainModules["Core Business Services"]
        AuthSvc["Auth & Tenant Service"]
        EmpSvc["Employee & Hierarchy Service"]
        AttSvc["Attendance & Shift Service"]
        LeaveSvc["Leave Rules & Multi-Stage Approvals"]
        AssetSvc["Asset Lifecycle & Maintenance"]
        TaskSvc["Task Management & Review"]
        PayrollSvc["Payroll & Salary Calculator"]
        AuditSvc["Audit Logger & Notifications"]
        DiagSvc["Health & System Diagnostics"]
    end

    subgraph DataLayer["Persistence Layer (Neon PostgreSQL)"]
        PrismaORM["Prisma Client 6.19.3"]
        NeonDB[("PostgreSQL Serverless (Neon TLS 1.3)")]
        WAL["Continuous WAL Archiving & PITR"]
        
        PrismaORM --> NeonDB
        NeonDB --> WAL
    end

    AuthCtx -->|HTTPS / REST API| Express
    SanitizeLogger --> DomainModules
    DomainModules --> PrismaORM
```

---

## 2. Security & Multi-Tenancy Architecture

### 2.1 Workspace Isolation
Every primary domain model in the database (`Employee`, `Department`, `Designation`, `AttendanceRecord`, `LeaveRequest`, `Asset`, `Task`, `PayrollRecord`, `AuditLog`, `Notification`) is partitioned by `companyId`.
- Queries are automatically scoped to the authenticated tenant's `companyId`.
- Cross-company data leaks are prevented at the service and query layer.

### 2.2 Authentication & Token Rotation
1. **Access Tokens**: Short-lived JSON Web Tokens (JWT) containing `userId`, `companyId`, and `role`.
2. **Refresh Tokens**: Cryptographically secure, rotating refresh tokens stored as `HttpOnly`, `SameSite=Lax/None`, `Secure` cookies.
3. **Password Security**: Passwords salted and hashed with `bcryptjs` (work factor 10).
4. **Data Sanitization**: Passwords, refresh tokens, and payment secrets are automatically redacted in the structured logging pipeline.

### 2.3 Role-Based Access Control (RBAC) Matrix

| Module | OWNER | HR | MANAGER | SUPERVISOR | EMPLOYEE |
|---|:---:|:---:|:---:|:---:|:---:|
| **Workspace Settings** | Full Access | View / Edit | Denied | Denied | Denied |
| **User Management** | Full Access | View / Edit | Denied | Denied | Denied |
| **System Diagnostics** | Full Access | Full Access | Denied | Denied | Denied |
| **Employee Directory** | Full Access | Full Access | View / Team | View / Team | View Self |
| **Attendance Punch** | Yes | Yes | Yes | Yes | Yes |
| **Attendance Corrections**| Full Access | Approve / Reject | Review Team | Review Team | Submit Self |
| **Leave Management** | Override | Final Sign-Off | Approve Team | Endorse Team | Apply / View Self |
| **Hardware Assets** | Full Access | Allocate / Manage | View Allocated | View Allocated | View My Assets |
| **Tasks & Reviews** | Full Access | Full Access | Assign / Review | Review / Assign | Update Assigned |
| **Payroll Processing** | Full Access | Full Access | Denied | Denied | View Payslips |
| **Audit Logs** | Full Access | View | Denied | Denied | Denied |

---

## 3. Data Flow Architecture

### 3.1 Attendance Clock-In & Verification
```mermaid
sequenceDiagram
    autonumber
    actor Emp as Employee
    participant UI as Web Frontend (AppLayout)
    participant API as Express API (/attendance/clock-in)
    participant Shift as Shift & Rules Engine
    participant DB as Neon PostgreSQL

    Emp->>UI: Click "Clock In"
    UI->>API: POST /api/attendance/clock-in { notes }
    API->>DB: Query today's existing punch for employee
    alt Already Clocked In
        DB-->>API: Active record exists
        API-->>UI: 400 Bad Request ("Already clocked in")
    else Valid Punch
        API->>Shift: Compare punch time against assigned Shift
        Shift-->>API: Determine status (PRESENT vs LATE)
        API->>DB: Insert AttendanceRecord & write AuditLog
        DB-->>API: Saved record
        API-->>UI: 200 OK { attendanceRecord }
        UI-->>Emp: Update dashboard status indicator
    end
```

### 3.2 Multi-Stage Leave Approval
```mermaid
sequenceDiagram
    autonumber
    actor Emp as Employee
    actor Sup as Direct Supervisor
    actor HR as HR Administrator
    participant API as Express API
    participant DB as Neon PostgreSQL

    Emp->>API: POST /api/leave/requests (startDate, endDate, reason)
    API->>DB: Check leave balance & active holidays
    API->>DB: Create LeaveRequest (status: PENDING_SUPERVISOR)
    API->>DB: Emit Notification to Supervisor
    
    Sup->>API: PATCH /api/leave/requests/:id/approve
    API->>DB: Update status -> PENDING_HR
    API->>DB: Emit Notification to HR Team
    
    HR->>API: PATCH /api/leave/requests/:id/approve
    API->>DB: Update status -> APPROVED
    API->>DB: Deduct allocated balance & sync Attendance
    API->>DB: Emit Notification to Employee ("Leave Approved")
```

---

## 4. Performance, Resiliency & Monitoring

### 4.1 Frontend Code Splitting
- All 28+ application pages are split using `React.lazy()` and dynamic imports.
- Reusable libraries (`react`, `react-dom`, `react-router-dom`) are bundled into an independent `vendor-react` chunk.
- Icons are bundled into an isolated `vendor-icons` chunk.
- Initial bundle payload is reduced to **59.77 kB** (from >1,050 kB).

### 4.2 Backend Diagnostics & Telemetry
- **Latency Profiler**: Tracks median and peak response times per route.
- **Ring-Buffer Error Tracker**: In-memory ring buffer capturing the 50 most recent operational exceptions.
- **Neon Health Probes**: Real-time roundtrip query latency monitoring exposed on `/settings/health`.
- **Global Error Boundary**: Client-side React error boundary preventing white-screen cascades on unexpected runtime errors.
