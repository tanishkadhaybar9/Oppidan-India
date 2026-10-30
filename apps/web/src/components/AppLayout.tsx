import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Clock,
  Layers,
  FileEdit,
  BarChart2,
  FileText,
  CalendarDays,
  CheckSquare,
  Umbrella,
  Building2,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  UserCircle,
  Briefcase,
  UserPlus,
  UserCheck,
  Settings,
  PlusCircle,
  Package,
  Wrench,
  Monitor,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationBell";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Dashboard",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Employees",
    items: [
      {
        label: "Employee Directory",
        path: "/employees",
        icon: <Users className="w-4 h-4" />,
        roles: ["OWNER", "HR", "MANAGER", "SUPERVISOR"],
      },
      {
        label: "Add Employee",
        path: "/employees/new",
        icon: <UserPlus className="w-4 h-4" />,
        roles: ["OWNER", "HR"],
      },
      {
        label: "Departments",
        path: "/departments",
        icon: <Building2 className="w-4 h-4" />,
        roles: ["OWNER", "HR", "MANAGER"],
      },
      {
        label: "Designations",
        path: "/designations",
        icon: <Briefcase className="w-4 h-4" />,
        roles: ["OWNER", "HR"],
      },
      {
        label: "Supervisors",
        path: "/employees/supervisors",
        icon: <UserCheck className="w-4 h-4" />,
        roles: ["OWNER", "HR", "MANAGER", "SUPERVISOR"],
      },
    ],
  },
  {
    title: "Attendance",
    items: [
      {
        label: "Attendance Dashboard",
        path: "/attendance",
        icon: <CalendarCheck className="w-4 h-4" />,
        roles: ["OWNER", "HR", "MANAGER", "SUPERVISOR"],
      },
      {
        label: "My Attendance",
        path: "/attendance/my",
        icon: <Clock className="w-4 h-4" />,
      },
      {
        label: "Shift Management",
        path: "/attendance/shifts",
        icon: <Layers className="w-4 h-4" />,
        roles: ["OWNER", "HR", "MANAGER"],
      },
      {
        label: "Shift Assignments",
        path: "/attendance/assignments",
        icon: <Users className="w-4 h-4" />,
        roles: ["OWNER", "HR", "MANAGER", "SUPERVISOR"],
      },
      {
        label: "Attendance Corrections",
        path: "/attendance/corrections",
        icon: <FileEdit className="w-4 h-4" />,
        roles: ["OWNER", "HR"],
      },
      {
        label: "Attendance Reports",
        path: "/attendance/reports",
        icon: <BarChart2 className="w-4 h-4" />,
        roles: ["OWNER", "HR", "MANAGER", "SUPERVISOR"],
      },
    ],
  },
  {
    title: "Leave Management",
    items: [
      {
        label: "Leave Dashboard",
        path: "/leave",
        icon: <Umbrella className="w-4 h-4" />,
      },
      {
        label: "Apply Leave",
        path: "/leave/apply",
        icon: <PlusCircle className="w-4 h-4" />,
      },
      {
        label: "My Leave Requests",
        path: "/leave/my-requests",
        icon: <FileText className="w-4 h-4" />,
      },
      {
        label: "Leave Calendar",
        path: "/leave/calendar",
        icon: <CalendarDays className="w-4 h-4" />,
      },
      {
        label: "Leave Approvals",
        path: "/leave/approvals",
        icon: <CheckSquare className="w-4 h-4" />,
        roles: ["OWNER", "HR", "MANAGER", "SUPERVISOR"],
      },
      {
        label: "Leave Types",
        path: "/leave/types",
        icon: <FileText className="w-4 h-4" />,
        roles: ["OWNER", "HR"],
      },
      {
        label: "Leave Balances",
        path: "/leave/balances",
        icon: <Wallet className="w-4 h-4" />,
        roles: ["OWNER", "HR"],
      },
      {
        label: "Holiday Calendar",
        path: "/leave/holidays",
        icon: <Building2 className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Assets & Inventory",
    items: [
      {
        label: "Asset Dashboard",
        path: "/assets",
        icon: <Package className="w-4 h-4" />,
      },
      {
        label: "Asset Inventory",
        path: "/assets/inventory",
        icon: <Monitor className="w-4 h-4" />,
        roles: ["OWNER", "HR", "MANAGER", "SUPERVISOR"],
      },
      {
        label: "My Assets",
        path: "/assets/my",
        icon: <UserCheck className="w-4 h-4" />,
      },
      {
        label: "Maintenance",
        path: "/assets/maintenance",
        icon: <Wrench className="w-4 h-4" />,
        roles: ["OWNER", "HR", "MANAGER", "SUPERVISOR"],
      },
      {
        label: "Add Asset",
        path: "/assets/new",
        icon: <PlusCircle className="w-4 h-4" />,
        roles: ["OWNER", "HR"],
      },
    ],
  },
  {
    title: "Reports",
    items: [
      {
        label: "Reports & Analytics",
        path: "/reports",
        icon: <BarChart2 className="w-4 h-4" />,
        roles: ["OWNER", "HR", "MANAGER", "SUPERVISOR"],
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        label: "Settings",
        path: "/settings",
        icon: <Settings className="w-4 h-4" />,
      },
    ],
  },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const filteredSections = navSections.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.roles || (user?.role && item.roles.includes(user.role))
    ),
  })).filter((s) => s.items.length > 0);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#eadbd2] ${collapsed ? "justify-center px-2" : ""}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f47b5b] to-[#f9a489] flex items-center justify-center text-white font-extrabold text-base shadow-sm flex-shrink-0">
          O
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-[#252525] text-sm leading-tight">Oppidan ERMS</div>
            <div className="text-[11px] text-[#77716e]">{user?.companyName || "Company"}</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {filteredSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#77716e] px-2 mb-1">
                {section.title}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/attendance" || item.path === "/leave" || item.path === "/assets"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
                        isActive
                          ? "bg-[#f47b5b]/10 text-[#f47b5b]"
                          : "text-[#77716e] hover:bg-[#fff0e8] hover:text-[#f47b5b]"
                      } ${collapsed ? "justify-center px-2" : ""}`
                    }
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className={`border-t border-[#eadbd2] p-3 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1 mb-1">
            <UserCircle className="w-8 h-8 text-[#f47b5b] flex-shrink-0" />
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-[#252525] truncate">{user?.name}</div>
              <div className="text-[11px] text-[#77716e] truncate">{user?.email}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-[#77716e] hover:bg-[#fff0e8] hover:text-[#f47b5b] transition-all ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#fff7f2] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-[#eadbd2] transition-all duration-200 flex-shrink-0 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Collapse toggle button (desktop) */}
      <button
        className="hidden md:flex absolute left-0 z-30 mt-[60px] ml-[-1px]"
        style={{ left: collapsed ? "52px" : "228px" }}
        onClick={() => setCollapsed((c) => !c)}
        aria-label="Toggle sidebar"
      >
        <div className="w-6 h-6 rounded-full bg-white border border-[#eadbd2] shadow flex items-center justify-center hover:border-[#f47b5b] transition-colors">
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-[#77716e]" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-[#77716e]" />
          )}
        </div>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed left-0 top-0 h-full w-64 bg-white border-r border-[#eadbd2] z-50 transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-3 right-3">
          <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-[#fff0e8]">
            <X className="w-4 h-4 text-[#77716e]" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-[#eadbd2] sticky top-0 z-20 flex-shrink-0">
          <div className="h-14 px-4 flex items-center justify-between">
            <button
              className="md:hidden p-2 rounded-xl hover:bg-[#fff0e8] text-[#77716e]"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:block" /> {/* spacer */}

            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Role Badge */}
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#fff0e8] text-[#f47b5b] px-2 py-0.5 rounded-full border border-[#eadbd2]">
                {user?.role || "EMPLOYEE"}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
