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
