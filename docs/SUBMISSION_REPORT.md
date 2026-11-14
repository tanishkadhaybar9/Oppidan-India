# Oppidan ERMS — Final Internship Submission Report
## 10-Week Engineering Capstone Project

**Project**: Employee & Resource Management System (ERMS)  
**Author / Intern**: Tanishka Dhaybar  
**Organization**: Oppidan India  
**Date**: November 2026  
**Live Application**: [https://oppidan-india-xhaa.vercel.app](https://oppidan-india-xhaa.vercel.app)  
**Live Production API**: [https://erms-api-xp4w.onrender.com](https://erms-api-xp4w.onrender.com)  
**GitHub Repository**: [https://github.com/tanishkadhaybar9/Oppidan-India](https://github.com/tanishkadhaybar9/Oppidan-India)  

---

## 1. Executive Summary

Over a 10-week development cycle, the **Oppidan Employee & Resource Management System (ERMS)** was designed, implemented, tested, and deployed to production. The platform serves as a modern, unified Human Resource Management System (HRMS) catering to multi-tenant business workspaces.

The platform provides end-to-end management of workforce lifecycles, real-time attendance punching, multi-tiered leave approvals, corporate hardware tracking, task delegation and review, attendance-integrated payroll processing, notification feeds, tamper-resistant audit logs, and system diagnostics.

---

## 2. Technology Stack & Production Topology

| Tier | Technologies | Production Platform |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite 8.3.3, Tailwind CSS v4, Lucide React, React Router v7 | **Vercel Edge Network** (Continuous Deployment) |
| **Backend** | Node.js, Express, TypeScript, bcryptjs, jsonwebtoken, cookie-parser | **Render Web Services** (Zero-Downtime Deploys) |
| **Database** | PostgreSQL Serverless with TLS 1.3 & connection pooling | **Neon Database** (Automated WAL & PITR) |
| **ORM** | Prisma ORM 6.19.3 | Type-safe migrations and client generation |
| **Testing** | Comprehensive Functional Test Matrix (54 Verified Test Cases) | 100% Pass Rate across all modules |

---

## 3. Week-by-Week Milestone Breakdown

### Week 1 — Multi-Tenant Authentication & Session Security
- Company workspace onboarding and root tenant provisioning.
- Dual-token authentication: short-lived access JWTs with rotating, `HttpOnly`, `SameSite=Lax` refresh cookies.
- Role-based authorization guard supporting 5 distinct roles (`OWNER`, `HR`, `MANAGER`, `SUPERVISOR`, `EMPLOYEE`).
- Password salting and hashing with `bcryptjs` (work factor 10).

### Week 2 — Employee Directory & Reporting Hierarchies
- Complete employee master data (personal, contact, emergency, employment profiles).
- Department and Designation master registries with active counts.
- Strict supervisor-subordinate relationship mapping with circular hierarchy detection.
- Searchable, paginated employee directory with debounced queries.

### Week 3 — Attendance Engine & Shift Scheduling
- Single-click arrival and departure punch interface on the main dashboard.
- Configurable shift definitions with tolerance grace periods and late arrival flags.
- Real-time work duration and overtime tracking.
- Attendance correction workflow allowing employees to submit missed punch requests for HR review.

### Week 4 — Leave Management & Multi-Stage Approvals
- Granular leave entitlement engine (Annual, Sick, Casual, Unpaid).
- Calendar-aware working day calculator excluding weekends and configured public holidays.
- Two-stage approval hierarchy (Direct Supervisor endorsement followed by HR final sign-off).
- Real-time leave balance ledger with automatic accrual deductions upon approval.

### Week 5 — Hardware Asset & Inventory Lifecycle
- Centralized hardware asset cataloging with category and serial number constraints.
- Complete lifecycle tracking: `AVAILABLE` -> `ALLOCATED` -> `UNDER_MAINTENANCE` -> `RETIRED`.
- Employee assignment and return receipts with asset condition notes.
- Maintenance ticket dispatch queue for defective devices.

### Week 6 — Task Delegation & Performance Analytics
- Goal and task assignment with priority tiers, due date tracking, and file notes.
- Multi-state progression: `TO_DO` -> `IN_PROGRESS` -> `UNDER_REVIEW` -> `COMPLETED`.
- Supervisor review workflow allowing task sign-off or return for revisions with feedback.
- Interactive completion analytics and department task distribution metrics.

### Week 7 — Attendance-Integrated Payroll & Payslips
- Flexible compensation structures with base salary, HRA, statutory PF, and ESI deductions.
- Automated monthly payroll batch calculation factoring present days, approved paid leaves, and unpaid leaves.
- Duplicate batch run prevention and rollback capabilities.
- Printable, pixel-perfect digital payslips with full salary component breakdowns.

### Week 8 — System Administration, Notifications & Audit Logs
- Organization profile configuration (branding, timezone, working hours, official contact).
- User management module for credential provisioning and access status toggling.
- Event-driven in-app notifications with unread badge polling and quick action navigation.
- Comprehensive audit trail recording user logins, employee mutations, role updates, and payroll runs.

### Week 9 — Performance Optimization, Backups & Reliability
- Full frontend code splitting via `React.lazy()` reducing initial bundle payload from >1,050 kB to **59.77 kB**.
- In-memory ring buffer error tracking logging the 50 most recent operational exceptions.
- Real-time system diagnostics dashboard monitoring database query latencies and server uptime.
- Documented Neon Point-In-Time-Recovery (PITR) strategy and pg_dump procedures.

### Week 10 — Final Polish, Advanced UI/UX & Submission Readiness
- Unified signature design system (Oppidan coral `#f47b5b`, white cards, clean borders, custom badges).
- Reusable `ConfirmModal` dialogs preventing accidental state mutations across User Management and Notifications.
- Responsive mobile drawer navigation and touch-optimized controls for mobile and tablet form factors.
- Screen-reader accessible icon controls with explicit `aria-label` attributes (WCAG 2.1 AA compliant).
- Comprehensive project documentation suite (`ARCHITECTURE.md`, `API_REFERENCE.md`, `BACKUP_AND_RECOVERY.md`, `TEST_REPORT.md`).

---

## 4. Quality Assurance & Verification Highlights

- **Test Suite Results**: **54 / 54 test cases verified and passing** (documented in [TEST_REPORT.md](file:///c:/Users/DELL/Oppidan-India/docs/TEST_REPORT.md)).
- **Zero Schema Regressions**: All 10 weeks of database tables, constraints, and migrations verified intact on Neon PostgreSQL.
- **Security Compliance**: Zero sensitive credentials, JWT secrets, or connection strings committed to source control.
- **Production Health**: Render backend and Neon PostgreSQL database report healthy status with sub-50ms database roundtrips.

---

## 5. Conclusion

The Oppidan ERMS project successfully fulfills all enterprise HRMS requirements outlined across the 10-week curriculum. The codebase is fully modular, type-safe, thoroughly documented, and running live in production.
