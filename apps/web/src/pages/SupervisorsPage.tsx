import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  ChevronRight,
  ExternalLink,
  UserCheck,
  UserPlus,
  X,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import {
  getSupervisorsHierarchy,
  listDepartments,
  updateEmployee,
  type SupervisorHierarchyResponse,
} from "../services/employeeService";
import type { Department, EmployeeSummary } from "../types/employee";
import { useAuth } from "../hooks/useAuth";
import {
  PageContainer,
  PageHeader,
  StatCard,
  SearchBar,
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "../components/common";

export const SupervisorsPage: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER" || user?.role === "HR" || user?.role === "MANAGER";

  const [hierarchyData, setHierarchyData] = useState<SupervisorHierarchyResponse | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | undefined>(undefined);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  // Modal State for Supervisor Assignment / Editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch departments once
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
      const res = await getSupervisorsHierarchy();
      if (res.data) {
        setHierarchyData(res.data);
      }
    } catch (err: unknown) {
      const e = err as { message?: string; retryAfter?: number };
      setError(e.message || "Failed to load hierarchy data.");
      if (e.retryAfter) setRetryAfter(e.retryAfter);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Open modal to assign or change supervisor
  const openAssignModal = (empId?: string, currentSupId?: string) => {
    setSelectedEmployeeId(empId || (hierarchyData?.allEmployees[0]?.id ?? ""));
    setSelectedSupervisorId(currentSupId || "");
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setModalError("Please select an employee.");
      return;
    }

    if (selectedEmployeeId === selectedSupervisorId) {
      setModalError("An employee cannot be their own supervisor.");
      return;
    }

    setModalSaving(true);
    setModalError(null);

    try {
      await updateEmployee(selectedEmployeeId, {
        supervisorId: selectedSupervisorId ? selectedSupervisorId : null,
      });

      setSuccessMsg("Supervisor mapping updated successfully!");
      setIsModalOpen(false);
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setModalError(e.message || "Failed to update supervisor assignment.");
    } finally {
      setModalSaving(false);
    }
  };

  // Filter supervisors based on department and debounced search
  const filteredSupervisors = (hierarchyData?.supervisors || []).filter((group) => {
    const matchesDept = !deptFilter || group.department?.id === deptFilter;
    const term = search.toLowerCase().trim();
    if (!term) return matchesDept;

    const matchesSupervisor =
      group.name.toLowerCase().includes(term) ||
      group.employeeCode.toLowerCase().includes(term);

    const matchesSubordinate = group.subordinates.some(
      (sub) =>
        sub.name.toLowerCase().includes(term) ||
        sub.employeeCode.toLowerCase().includes(term)
    );

    return matchesDept && (matchesSupervisor || matchesSubordinate);
  });

  const unassignedEmployees = (hierarchyData?.allEmployees || []).filter((e) => !e.supervisor);

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Supervisory Hierarchy & Teams"
        subtitle="Manage reporting lines, team structures, and supervisor-subordinate relationships."
        icon={<UserCheck className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Employees", to: "/employees" },
          { label: "Supervisors" },
        ]}
        actions={
          canManage && (
            <button
              onClick={() => openAssignModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Assign Supervisor
            </button>
          )
        }
      />

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Supervisors"
          value={hierarchyData?.totalSupervisors ?? 0}
          icon={<UserCheck className="w-5 h-5" />}
          subtitle="Employees with direct reports"
          variant="highlight"
        />
        <StatCard
          label="Mapped Direct Reports"
          value={
            (hierarchyData?.totalEmployees ?? 0) - (hierarchyData?.unassignedCount ?? 0)
          }
          icon={<Users className="w-5 h-5" />}
          subtitle="Staff assigned to a team leader"
          variant="success"
        />
        <StatCard
          label="Unassigned Employees"
          value={hierarchyData?.unassignedCount ?? 0}
          icon={<ShieldAlert className="w-5 h-5" />}
          subtitle="Staff without a designated supervisor"
          variant={hierarchyData?.unassignedCount ? "warning" : "default"}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <SearchBar
          placeholder="Search by supervisor or team member name, code..."
          onSearch={setSearch}
          initialValue={search}
        />

        <div className="flex items-center gap-2 min-w-[200px]">
          <Building2 className="w-4 h-4 text-[#77716e] flex-shrink-0" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
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
      </div>

      {/* Main Content Area */}
      {error ? (
        <ErrorState
          title="Unable to load supervisor hierarchy"
          message={error}
          retryAfter={retryAfter}
          onRetry={fetchData}
        />
      ) : loading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : filteredSupervisors.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7 text-[#f47b5b]" />}
          title="No supervisory teams found"
          description={
            search || deptFilter
              ? "No supervisors or direct reports match your current filter criteria."
              : "No employees currently have direct reports assigned to them. Assign a supervisor to start organizing your reporting hierarchy."
          }
          action={
            canManage
              ? {
                  label: "Assign First Supervisor",
                  onClick: () => openAssignModal(),
                  icon: <UserPlus className="w-4 h-4" />,
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {filteredSupervisors.map((group) => (
            <div
              key={group.id}
              className="bg-white border border-[#eadbd2] rounded-2xl p-5 sm:p-6 shadow-xs hover:border-[#f47b5b]/40 transition-all duration-200"
            >
              {/* Supervisor Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eadbd2]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f47b5b] to-[#f9a489] text-white flex items-center justify-center font-bold text-lg shadow-xs flex-shrink-0">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-heading font-bold text-base sm:text-lg text-[#252525]">
                        {group.name}
                      </h2>
                      <span className="text-[10px] font-semibold bg-[#fff0e8] text-[#f47b5b] px-2 py-0.5 rounded-full border border-[#eadbd2]">
                        Supervisor
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#77716e] mt-1">
                      <span className="font-mono bg-[#fff7f2] px-1.5 py-0.5 rounded border border-[#eadbd2]/60">
                        {group.employeeCode}
                      </span>
                      {group.department && (
                        <>
                          <span>•</span>
                          <span>{group.department.name}</span>
                        </>
                      )}
                      {group.designation && (
                        <>
                          <span>•</span>
                          <span>{group.designation.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#fff7f2] border border-[#eadbd2] text-[#252525]">
                    {group.subordinates.length} Direct {group.subordinates.length === 1 ? "Report" : "Reports"}
                  </span>
                  <Link
                    to={`/employees/${group.id}`}
                    className="inline-flex items-center gap-1 text-xs text-[#f47b5b] font-semibold hover:underline"
                  >
                    View Profile <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Subordinates Grid */}
              <div className="mt-4">
                <h3 className="text-xs font-bold text-[#77716e] uppercase tracking-wider mb-3">
                  Direct Reports ({group.subordinates.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.subordinates.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-xl bg-[#fff7f2]/60 border border-[#eadbd2] hover:bg-[#fff0e8]/50 hover:border-[#f47b5b]/30 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="overflow-hidden min-w-0">
                        <div className="font-semibold text-xs text-[#252525] truncate">
                          {sub.name}
                        </div>
                        <div className="text-[11px] text-[#77716e] flex items-center gap-1.5 mt-0.5 truncate">
                          <span className="font-mono">{sub.employeeCode}</span>
                          {sub.designation && (
                            <>
                              <span>•</span>
                              <span className="truncate">{sub.designation.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {canManage && (
                          <button
                            onClick={() => openAssignModal(sub.id, group.id)}
                            className="p-1.5 rounded-lg bg-white border border-[#eadbd2] text-[#77716e] hover:text-[#f47b5b] hover:border-[#f47b5b] transition-colors text-xs"
                            title="Reassign supervisor"
                          >
                            Reassign
                          </button>
                        )}
                        <Link
                          to={`/employees/${sub.id}`}
                          className="p-1.5 rounded-lg bg-white border border-[#eadbd2] text-[#77716e] hover:text-[#f47b5b] hover:border-[#f47b5b] transition-colors"
                          title="View Employee Detail"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Unassigned Staff Quick View (if any exist) */}
          {unassignedEmployees.length > 0 && !search && !deptFilter && (
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm text-[#252525]">
                      Unassigned Team Members ({unassignedEmployees.length})
                    </h3>
                    <p className="text-xs text-[#77716e] mt-0.5">
                      These active employees do not have an assigned supervisor yet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {unassignedEmployees.slice(0, 9).map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3 bg-white border border-amber-200/60 rounded-xl flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="overflow-hidden min-w-0">
                      <div className="font-semibold text-xs text-[#252525] truncate">
                        {emp.name}
                      </div>
                      <div className="text-[11px] text-[#77716e] truncate">
                        {emp.employeeCode} {emp.department ? `• ${emp.department.name}` : ""}
                      </div>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => openAssignModal(emp.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#fff0e8] text-[#f47b5b] border border-[#eadbd2] hover:bg-[#f47b5b] hover:text-white transition-all flex-shrink-0"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Supervisor Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#eadbd2] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#fff7f2] border-b border-[#eadbd2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#f47b5b]" />
                <h3 className="font-bold text-base text-[#252525]">
                  Assign or Change Supervisor
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#77716e] hover:text-[#252525] rounded-lg hover:bg-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs">
                  {modalError}
                </div>
              )}

              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#77716e] uppercase tracking-wider mb-1.5">
                  Select Employee *
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => {
                    setSelectedEmployeeId(e.target.value);
                    const found = hierarchyData?.allEmployees.find((x) => x.id === e.target.value);
                    if (found?.supervisor) {
                      setSelectedSupervisorId(found.supervisor.id);
                    } else {
                      setSelectedSupervisorId("");
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-white border border-[#eadbd2] focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] text-[#252525]"
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {(hierarchyData?.allEmployees || []).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode}) {emp.department ? `- ${emp.department.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supervisor Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#77716e] uppercase tracking-wider mb-1.5">
                  Reporting Supervisor *
                </label>
                <select
                  value={selectedSupervisorId}
                  onChange={(e) => setSelectedSupervisorId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-white border border-[#eadbd2] focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] text-[#252525]"
                >
                  <option value="">None (Unassigned / Top-level)</option>
                  {(hierarchyData?.allEmployees || [])
                    .filter((s) => s.id !== selectedEmployeeId)
                    .map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.employeeCode}) {sup.designation ? `- ${sup.designation.name}` : ""}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-[#77716e] mt-1">
                  Employees cannot report to themselves. Choose None to remove reporting lines.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eadbd2]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#77716e] border border-[#eadbd2] hover:bg-[#fff0e8] hover:text-[#f47b5b] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-sm font-semibold shadow-xs hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {modalSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Save Mapping
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
