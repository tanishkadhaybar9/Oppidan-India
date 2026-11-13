import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

// Dynamic import helper for named exports
const lazyPage = <T extends Record<string, any>, K extends keyof T>(
  loader: () => Promise<T>,
  key: K
) => lazy(() => loader().then((module) => ({ default: module[key] })));

// Overview & Directory
const DashboardPage = lazyPage(() => import("./pages/DashboardPage"), "DashboardPage");
const EmployeeListPage = lazyPage(() => import("./pages/EmployeeListPage"), "EmployeeListPage");
const EmployeeDetailPage = lazyPage(() => import("./pages/EmployeeDetailPage"), "EmployeeDetailPage");
const EmployeeFormPage = lazyPage(() => import("./pages/EmployeeFormPage"), "EmployeeFormPage");
const DepartmentsPage = lazyPage(() => import("./pages/DepartmentsPage"), "DepartmentsPage");
const DesignationsPage = lazyPage(() => import("./pages/DesignationsPage"), "DesignationsPage");
const SupervisorsPage = lazyPage(() => import("./pages/SupervisorsPage"), "SupervisorsPage");

// Attendance & Shifts
const AttendanceDashboardPage = lazyPage(() => import("./pages/AttendanceDashboardPage"), "AttendanceDashboardPage");
const EmployeeAttendancePage = lazyPage(() => import("./pages/EmployeeAttendancePage"), "EmployeeAttendancePage");
const ShiftManagementPage = lazyPage(() => import("./pages/ShiftManagementPage"), "ShiftManagementPage");
const ShiftAssignmentsPage = lazyPage(() => import("./pages/ShiftAssignmentsPage"), "ShiftAssignmentsPage");
const AttendanceCorrectionsPage = lazyPage(() => import("./pages/AttendanceCorrectionsPage"), "AttendanceCorrectionsPage");
const WeeklyReportPage = lazyPage(() => import("./pages/WeeklyReportPage"), "WeeklyReportPage");

// Leaves
const LeaveDashboardPage = lazyPage(() => import("./pages/LeaveDashboardPage"), "LeaveDashboardPage");
const ApplyLeavePage = lazyPage(() => import("./pages/ApplyLeavePage"), "ApplyLeavePage");
const MyLeaveRequestsPage = lazyPage(() => import("./pages/MyLeaveRequestsPage"), "MyLeaveRequestsPage");
const LeaveCalendarPage = lazyPage(() => import("./pages/LeaveCalendarPage"), "LeaveCalendarPage");
const LeaveApprovalsPage = lazyPage(() => import("./pages/LeaveApprovalsPage"), "LeaveApprovalsPage");
const LeaveTypesPage = lazyPage(() => import("./pages/LeaveTypesPage"), "LeaveTypesPage");
const LeaveBalancesPage = lazyPage(() => import("./pages/LeaveBalancesPage"), "LeaveBalancesPage");
const HolidayCalendarPage = lazyPage(() => import("./pages/HolidayCalendarPage"), "HolidayCalendarPage");

// Assets
const AssetDashboardPage = lazyPage(() => import("./pages/AssetDashboardPage"), "AssetDashboardPage");
const AssetListPage = lazyPage(() => import("./pages/AssetListPage"), "AssetListPage");
const AssetDetailPage = lazyPage(() => import("./pages/AssetDetailPage"), "AssetDetailPage");
const AssetFormPage = lazyPage(() => import("./pages/AssetFormPage"), "AssetFormPage");
const AssetMaintenancePage = lazyPage(() => import("./pages/AssetMaintenancePage"), "AssetMaintenancePage");
const MyAssetsPage = lazyPage(() => import("./pages/MyAssetsPage"), "MyAssetsPage");

// Tasks
const TaskDashboardPage = lazyPage(() => import("./pages/TaskDashboardPage"), "TaskDashboardPage");
const AllTasksPage = lazyPage(() => import("./pages/AllTasksPage"), "AllTasksPage");
const CreateTaskPage = lazyPage(() => import("./pages/CreateTaskPage"), "CreateTaskPage");
const TaskDetailPage = lazyPage(() => import("./pages/TaskDetailPage"), "TaskDetailPage");
const EditTaskPage = lazyPage(() => import("./pages/EditTaskPage"), "EditTaskPage");
const MyTasksPage = lazyPage(() => import("./pages/MyTasksPage"), "MyTasksPage");
const TaskAssignmentsPage = lazyPage(() => import("./pages/TaskAssignmentsPage"), "TaskAssignmentsPage");
const TaskReviewsPage = lazyPage(() => import("./pages/TaskReviewsPage"), "TaskReviewsPage");
const TaskAnalyticsPage = lazyPage(() => import("./pages/TaskAnalyticsPage"), "TaskAnalyticsPage");

// Payroll
const PayrollDashboardPage = lazyPage(() => import("./pages/PayrollDashboardPage"), "PayrollDashboardPage");
const SalaryStructuresPage = lazyPage(() => import("./pages/SalaryStructuresPage"), "SalaryStructuresPage");
const CreateSalaryStructurePage = lazyPage(() => import("./pages/CreateSalaryStructurePage"), "CreateSalaryStructurePage");
const ProcessPayrollPage = lazyPage(() => import("./pages/ProcessPayrollPage"), "ProcessPayrollPage");
const PayrollHistoryPage = lazyPage(() => import("./pages/PayrollHistoryPage"), "PayrollHistoryPage");
const PayslipPage = lazyPage(() => import("./pages/PayslipPage"), "PayslipPage");

// Reports Hub
const ReportsDashboardPage = lazyPage(() => import("./pages/ReportsDashboardPage"), "ReportsDashboardPage");
const EmployeeReportPage = lazyPage(() => import("./pages/EmployeeReportPage"), "EmployeeReportPage");
const AttendanceReportPage = lazyPage(() => import("./pages/AttendanceReportPage"), "AttendanceReportPage");
const LeaveReportPage = lazyPage(() => import("./pages/LeaveReportPage"), "LeaveReportPage");
const AssetReportPage = lazyPage(() => import("./pages/AssetReportPage"), "AssetReportPage");
const PayrollReportPage = lazyPage(() => import("./pages/PayrollReportPage"), "PayrollReportPage");
const TaskReportPage = lazyPage(() => import("./pages/TaskReportPage"), "TaskReportPage");
const ReportsPage = lazyPage(() => import("./pages/ReportsPage"), "ReportsPage");

// Administration (Week 8 & 9)
const OrganizationSettingsPage = lazyPage(() => import("./pages/OrganizationSettingsPage"), "OrganizationSettingsPage");
const UserManagementPage = lazyPage(() => import("./pages/UserManagementPage"), "UserManagementPage");
const AuditLogsPage = lazyPage(() => import("./pages/AuditLogsPage"), "AuditLogsPage");
const SystemHealthPage = lazyPage(() => import("./pages/SystemHealthPage"), "SystemHealthPage");
const NotificationsPage = lazyPage(() => import("./pages/NotificationsPage"), "NotificationsPage");
const SettingsPage = lazyPage(() => import("./pages/SettingsPage"), "SettingsPage");

function PageFallbackLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#77716e]">
      <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b] mb-3" />
      <span className="text-xs font-semibold">Loading module...</span>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageFallbackLoading />}>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Overview */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DashboardPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Employee Directory */}
              <Route
                path="/employees"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <EmployeeListPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees/new"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <EmployeeFormPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees/:id"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <EmployeeDetailPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <EmployeeFormPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/departments"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER"]}>
                    <AppLayout>
                      <DepartmentsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/designations"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <DesignationsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees/supervisors"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <SupervisorsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Attendance & Shift Management */}
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <AttendanceDashboardPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance/my"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <EmployeeAttendancePage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance/shifts"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER"]}>
                    <AppLayout>
                      <ShiftManagementPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance/assignments"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <ShiftAssignmentsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance/corrections"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <AttendanceCorrectionsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance/reports"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <WeeklyReportPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Leave Management */}
              <Route
                path="/leave"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <LeaveDashboardPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leave/apply"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ApplyLeavePage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leave/my-requests"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MyLeaveRequestsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leave/calendar"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <LeaveCalendarPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leave/approvals"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <LeaveApprovalsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leave/types"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <LeaveTypesPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leave/balances"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <LeaveBalancesPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leave/holidays"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <HolidayCalendarPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Assets & Inventory Management */}
              <Route
                path="/assets"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AssetDashboardPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assets/inventory"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <AssetListPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assets/my"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MyAssetsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assets/new"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <AssetFormPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assets/:id"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AssetDetailPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assets/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <AssetFormPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assets/maintenance"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <AssetMaintenancePage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Task Management */}
              <Route
                path="/tasks/dashboard"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <TaskDashboardPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/my"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MyTasksPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/list"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <AllTasksPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/new"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <CreateTaskPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/assignments"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <TaskAssignmentsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/reviews"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <TaskReviewsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/analytics"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <TaskAnalyticsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/:id"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <TaskDetailPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <EditTaskPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Payroll Management */}
              <Route
                path="/payroll/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <PayrollDashboardPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payroll/salary-structures"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <SalaryStructuresPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payroll/salary-structures/create"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <CreateSalaryStructurePage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payroll/process"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <ProcessPayrollPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payroll/history"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER"]}>
                    <AppLayout>
                      <PayrollHistoryPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payroll/my-payslips"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <PayslipPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Reports Management */}
              <Route
                path="/reports/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <ReportsDashboardPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/employees"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER"]}>
                    <AppLayout>
                      <EmployeeReportPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/attendance"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <AttendanceReportPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/leaves"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <LeaveReportPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/assets"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER"]}>
                    <AppLayout>
                      <AssetReportPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/payroll"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <PayrollReportPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/tasks"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <TaskReportPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Reports Hub */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR", "MANAGER", "SUPERVISOR"]}>
                    <AppLayout>
                      <ReportsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* System Administration & Settings (Week 8 & 9) */}
              <Route
                path="/settings/organization"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <OrganizationSettingsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/users"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <UserManagementPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <AuditLogsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/health"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "HR"]}>
                    <AppLayout>
                      <SystemHealthPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <NotificationsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Account Settings & Permissions */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SettingsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
