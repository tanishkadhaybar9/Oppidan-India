import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  UserX,
  Building2,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { listEmployees, listDepartments } from "../services/employeeService";
import type { EmployeeSummary, Department } from "../types/employee";
import {
  PageContainer,
  PageHeader,
  StatCard,
  SearchBar,
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "../components/common";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-gray-100 text-gray-500 border-gray-200",
  PROBATION: "bg-amber-50 text-amber-700 border-amber-200",
  SUSPENDED: "bg-red-50 text-red-600 border-red-200",
  TERMINATED: "bg-red-100 text-red-700 border-red-300",
};

const CAN_CREATE = ["OWNER", "HR"];

export const EmployeeListPage: React.FC = () => {
  const { user } = useAuth();
  const canCreate = user && CAN_CREATE.includes(user.role);

  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | undefined>(undefined);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Load departments once on mount
  useEffect(() => {
    listDepartments()
      .then((res) => {
        if (res.data?.departments) setDepartments(res.data.departments);
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRetryAfter(undefined);
    try {
      const empRes = await listEmployees({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        departmentId: deptFilter || undefined,
        page,
        limit: 15,
      });

      if (empRes.data) {
        setEmployees(empRes.data.employees);
        setTotalPages(empRes.data.pagination.totalPages);
        setTotal(empRes.data.pagination.total);
      }
    } catch (err: unknown) {
      const e = err as { message?: string; retryAfter?: number };
      setError(e.message || "Failed to load employees.");
      if (e.retryAfter) setRetryAfter(e.retryAfter);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, deptFilter, page]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Handle search with debounce
  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Employee Directory"
        subtitle="Manage and view all employee profiles, roles, departments, and reporting structures."
        icon={<Users className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Employees" },
        ]}
        actions={
          canCreate ? (
            <Link
              to="/employees/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </Link>
          ) : undefined
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Records"
          value={total}
          icon={<Users className="w-5 h-5" />}
          subtitle="All registered staff"
          variant="highlight"
        />
        <StatCard
          label="Departments"
          value={departments.length}
          icon={<Building2 className="w-5 h-5" />}
          subtitle="Active organizational units"
          variant="default"
        />
        <StatCard
          label="Filtered Results"
          value={employees.length}
          icon={<UserCheck className="w-5 h-5" />}
          subtitle={`Page ${page} of ${totalPages || 1}`}
          variant="success"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <SearchBar
          placeholder="Search by name, email, or employee code..."
          onSearch={handleSearch}
          initialValue={search}
        />

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Department Filter */}
          <div className="flex-1 sm:w-44">
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-white border border-[#eadbd2] text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] transition-all"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1 sm:w-36">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-white border border-[#eadbd2] text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] transition-all"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PROBATION">Probation</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {error ? (
        <ErrorState
          title="Unable to load employee directory"
          message={error}
          retryAfter={retryAfter}
          onRetry={fetchData}
        />
      ) : loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={<UserX className="w-7 h-7 text-[#f47b5b]" />}
          title="No employees found"
          description={
            search || statusFilter || deptFilter
              ? "No employee records match your active search filters. Try clearing filters."
              : "No employees have been registered yet. Add your first employee to get started."
          }
          action={
            canCreate && !search && !statusFilter && !deptFilter
              ? {
                  label: "Add First Employee",
                  onClick: () => (window.location.href = "/employees/new"),
                  icon: <Plus className="w-4 h-4" />,
                }
              : undefined
          }
        />
      ) : (
        <div className="bg-white border border-[#eadbd2] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#eadbd2] bg-[#fff7f2]">
                  <th className="text-left px-5 py-3.5 text-[#77716e] font-semibold text-xs uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="text-left px-5 py-3.5 text-[#77716e] font-semibold text-xs uppercase tracking-wider">
                    Department
                  </th>
                  <th className="text-left px-5 py-3.5 text-[#77716e] font-semibold text-xs uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="text-left px-5 py-3.5 text-[#77716e] font-semibold text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3.5 text-[#77716e] font-semibold text-xs uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-5 py-3.5 text-right text-[#77716e] font-semibold text-xs uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadbd2]/60">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-[#fff7f2]/60 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f47b5b] to-[#f9a489] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-2xs">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-[#252525] truncate">
                            {emp.name}
                          </p>
                          <p className="text-xs text-[#77716e] truncate">{emp.email}</p>
                          <p className="text-[11px] text-[#77716e]/80 font-mono">{emp.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {emp.department ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#252525] font-medium">
                          <Building2 className="w-3.5 h-3.5 text-[#77716e]" />
                          {emp.department.name}
                        </span>
                      ) : (
                        <span className="text-xs text-[#77716e]/60">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {emp.designation ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#252525] font-medium">
                          <Briefcase className="w-3.5 h-3.5 text-[#77716e]" />
                          {emp.designation.name}
                        </span>
                      ) : (
                        <span className="text-xs text-[#77716e]/60">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          STATUS_COLORS[emp.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-[#77716e]">
                      {new Date(emp.joiningDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/employees/${emp.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#f47b5b] bg-[#fff0e8] border border-[#eadbd2] rounded-xl hover:bg-[#f47b5b] hover:text-white transition-all shadow-2xs"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-[#eadbd2] px-5 py-3.5 flex items-center justify-between bg-[#fff7f2]/30">
              <p className="text-xs text-[#77716e]">
                Showing page <span className="font-semibold text-[#252525]">{page}</span> of{" "}
                <span className="font-semibold text-[#252525]">{totalPages}</span> ({total} total records)
              </p>
              <div className="flex items-center gap-2">
                <button
                  id="prev-page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-xl border border-[#eadbd2] bg-white text-[#77716e] text-xs font-semibold disabled:opacity-40 hover:bg-[#fff0e8] hover:text-[#f47b5b] transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button
                  id="next-page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-[#eadbd2] bg-white text-[#77716e] text-xs font-semibold disabled:opacity-40 hover:bg-[#fff0e8] hover:text-[#f47b5b] transition-all flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};
