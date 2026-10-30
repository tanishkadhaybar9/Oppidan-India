import React from "react";
import {
  Settings,
  Shield,
  Building2,
  KeyRound,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { PageContainer, PageHeader } from "../components/common";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: [
    "Complete company workspace administration",
    "Employee creation, editing, and status management",
    "Department and designation structure configuration",
    "Company shift templates and shift assignment rules",
    "Attendance records oversight and HR corrections",
    "Leave policies, types, balances, and executive approvals",
    "Cross-department analytics and RFC-4180 audit exports",
  ],
  HR: [
    "Full employee lifecycle and onboarding master",
    "Department and designation management",
    "Direct attendance clock-in/out corrections with immutable audits",
    "Leave type setup, balance allocations, and final HR approvals",
    "Weekly and monthly company compliance reporting",
  ],
  MANAGER: [
    "Departmental employee oversight",
    "Department attendance monitoring and shift assignments",
    "Multi-stage department leave approvals",
    "Departmental productivity and attendance reporting",
  ],
  SUPERVISOR: [
    "Supervised team attendance tracking",
    "Team member shift assignment verification",
    "First-stage subordinate leave request reviews",
    "Direct reporting line oversight",
  ],
  EMPLOYEE: [
    "Personal profile and employment history verification",
    "Real-time clock-in and clock-out with worked hour calculation",
    "Correction request submissions for missed punches",
    "Personal leave balance tracking and new leave submissions",
    "Personal calendar and company holiday inspection",
    "In-app notifications for request status updates",
  ],
};

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const currentRole = user?.role || "EMPLOYEE";
  const permissions = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.EMPLOYEE;

  return (
    <PageContainer>
      <PageHeader
        title="Workspace & Account Settings"
        subtitle="Review your profile credentials, authorized permissions, and multi-tenant security scope."
        icon={<Settings className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Settings" },
        ]}
        badges={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fff0e8] text-[#f47b5b] border border-[#eadbd2]">
            <Shield className="w-3.5 h-3.5" />
            {currentRole}
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white border border-[#eadbd2] rounded-[22px] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f47b5b] to-[#f9a489] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-[#252525]">{user?.name}</h2>
              <span className="text-xs text-[#77716e]">{user?.email}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#eadbd2] space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-[#77716e]">User ID:</span>
              <code className="bg-[#fff7f2] border border-[#eadbd2] text-[#252525] px-2 py-0.5 rounded text-[11px] font-mono">
                {user?.id?.slice(0, 12)}...
              </code>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#77716e]">Account Status:</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                <CheckCircle className="w-3 h-3" />
                {user?.status || "ACTIVE"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#77716e]">Assigned Role:</span>
              <span className="font-semibold text-[#f47b5b]">{currentRole}</span>
            </div>
          </div>
        </div>

        {/* Company Workspace Card */}
        <div className="bg-white border border-[#eadbd2] rounded-[22px] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fff0e8] text-[#f47b5b] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-[#252525]">Company Scope</h2>
              <span className="text-xs text-[#77716e]">Multi-tenant isolation</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#eadbd2] space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-[#77716e]">Workspace:</span>
              <span className="font-semibold text-[#252525]">{user?.companyName || "Oppidan India"}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#77716e]">Tenant ID:</span>
              <code className="bg-[#fff7f2] border border-[#eadbd2] text-[#252525] px-2 py-0.5 rounded text-[11px] font-mono">
                {user?.companyId?.slice(0, 12)}...
              </code>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#77716e]">Isolation Policy:</span>
              <span className="text-[#23855b] font-medium">Tenant Enforced</span>
            </div>
          </div>
        </div>

        {/* Security & Token Info */}
        <div className="bg-white border border-[#eadbd2] rounded-[22px] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fff0e8] text-[#f47b5b] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-[#252525]">Session Security</h2>
              <span className="text-xs text-[#77716e]">JWT + Refresh Cookie</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#eadbd2] space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-[#77716e]">Token Lifetime:</span>
              <span className="font-medium text-[#252525]">15 min rotated JWT</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#77716e]">Refresh Storage:</span>
              <span className="font-medium text-[#252525]">HttpOnly Cookie</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#77716e]">Hash Protocol:</span>
              <span className="font-medium text-emerald-600">SHA-256 Server Hash</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Permissions Matrix */}
      <div className="bg-white border border-[#eadbd2] rounded-[24px] p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#fff0e8] text-[#f47b5b] flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-base text-[#252525]">
              Active Role Capabilities — {currentRole}
            </h2>
            <p className="text-xs text-[#77716e]">
              Based on Oppidan India Group RBAC security matrix, your account is permitted to perform the following:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {permissions.map((perm, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-[#fff7f2] border border-[#eadbd2]/80 text-xs text-[#252525]"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{perm}</span>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};
