import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeeListPage } from "./pages/EmployeeListPage";
import { EmployeeDetailPage } from "./pages/EmployeeDetailPage";
import { EmployeeFormPage } from "./pages/EmployeeFormPage";
import { AttendanceDashboardPage } from "./pages/AttendanceDashboardPage";
import { ShiftManagementPage } from "./pages/ShiftManagementPage";
import { ShiftAssignmentsPage } from "./pages/ShiftAssignmentsPage";
import { AttendanceCorrectionsPage } from "./pages/AttendanceCorrectionsPage";
import { EmployeeAttendancePage } from "./pages/EmployeeAttendancePage";
import { WeeklyReportPage } from "./pages/WeeklyReportPage";
import { LeaveDashboardPage } from "./pages/LeaveDashboardPage";
import { ApplyLeavePage } from "./pages/ApplyLeavePage";
import { MyLeaveRequestsPage } from "./pages/MyLeaveRequestsPage";
import { LeaveCalendarPage } from "./pages/LeaveCalendarPage";
import { LeaveApprovalsPage } from "./pages/LeaveApprovalsPage";
import { LeaveTypesPage } from "./pages/LeaveTypesPage";
import { LeaveBalancesPage } from "./pages/LeaveBalancesPage";
import { HolidayCalendarPage } from "./pages/HolidayCalendarPage";
import { DepartmentsPage } from "./pages/DepartmentsPage";
import { DesignationsPage } from "./pages/DesignationsPage";
import { SupervisorsPage } from "./pages/SupervisorsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AssetDashboardPage } from "./pages/AssetDashboardPage";
import { AssetListPage } from "./pages/AssetListPage";
import { AssetDetailPage } from "./pages/AssetDetailPage";
import { AssetFormPage } from "./pages/AssetFormPage";
import { AssetMaintenancePage } from "./pages/AssetMaintenancePage";
import { MyAssetsPage } from "./pages/MyAssetsPage";
import { TaskDashboardPage } from "./pages/TaskDashboardPage";
import { AllTasksPage } from "./pages/AllTasksPage";
import { CreateTaskPage } from "./pages/CreateTaskPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { EditTaskPage } from "./pages/EditTaskPage";
import { MyTasksPage } from "./pages/MyTasksPage";
import { TaskAssignmentsPage } from "./pages/TaskAssignmentsPage";
import { TaskReviewsPage } from "./pages/TaskReviewsPage";
import { TaskAnalyticsPage } from "./pages/TaskAnalyticsPage";
import { PayrollDashboardPage } from "./pages/PayrollDashboardPage";
import { SalaryStructuresPage } from "./pages/SalaryStructuresPage";
import { CreateSalaryStructurePage } from "./pages/CreateSalaryStructurePage";
import { ProcessPayrollPage } from "./pages/ProcessPayrollPage";
import { PayrollHistoryPage } from "./pages/PayrollHistoryPage";
import { PayslipPage } from "./pages/PayslipPage";
import { ReportsDashboardPage } from "./pages/ReportsDashboardPage";
import { EmployeeReportPage } from "./pages/EmployeeReportPage";
import { AttendanceReportPage } from "./pages/AttendanceReportPage";
import { LeaveReportPage } from "./pages/LeaveReportPage";
import { AssetReportPage } from "./pages/AssetReportPage";
import { PayrollReportPage } from "./pages/PayrollReportPage";
import { TaskReportPage } from "./pages/TaskReportPage";
import { OrganizationSettingsPage } from "./pages/OrganizationSettingsPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { SystemHealthPage } from "./pages/SystemHealthPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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

          {/* System Administration & Settings (Week 8) */}
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

          {/* Settings & Permissions */}
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
