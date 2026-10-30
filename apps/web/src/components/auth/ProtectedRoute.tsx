import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { UserRole } from "../../types/auth";
import { ShieldAlert, Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff7f2] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f47b5b] to-[#f9a489] flex items-center justify-center text-white shadow-lg shadow-[#f47b5b]/30 mb-4 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-medium text-[#77716e]">Verifying session credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.status !== "ACTIVE") {
    return (
      <div className="min-h-screen bg-[#fff7f2] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[24px] border border-[#eadbd2] p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-[#fff2f2] text-[#c74747] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-xl font-bold text-[#252525] mb-2">
            Account Inactive
          </h2>
          <p className="text-sm text-[#77716e] mb-6">
            Your user account is currently deactivated. Please contact your company administrator.
          </p>
          <button
            onClick={() => logout()}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#f47b5b] hover:bg-[#e96849] transition-colors cursor-pointer"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#fff7f2] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[24px] border border-[#eadbd2] p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-[#fff2f2] text-[#c74747] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-xl font-bold text-[#252525] mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-[#77716e] mb-6">
            Your role (<span className="font-semibold text-[#252525]">{user.role}</span>) does not have sufficient permission to view this section.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#f47b5b] hover:bg-[#e96849] transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
