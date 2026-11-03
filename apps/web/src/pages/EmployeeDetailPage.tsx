import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Edit2,
  UserX,
  History,
  Building2,
  Briefcase,
  Users,
  Calendar,
  Mail,
  Hash,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getEmployee, getEmployeeHistory, deactivateEmployee } from "../services/employeeService";
import type { EmployeeDetail, HistoryEntry } from "../types/employee";
import { PageContainer, PageHeader, ErrorState } from "../components/common";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-gray-100 text-gray-500 border-gray-200",
  PROBATION: "bg-amber-50 text-amber-700 border-amber-200",
  SUSPENDED: "bg-red-50 text-red-600 border-red-200",
  TERMINATED: "bg-red-100 text-red-700 border-red-300",
};

const EVENT_LABELS: Record<string, string> = {
  CREATED: "Employee Created",
  STATUS_CHANGE: "Status Changed",
  DEPARTMENT_CHANGE: "Department Changed",
  DESIGNATION_CHANGE: "Designation Changed",
  SUPERVISOR_CHANGE: "Supervisor Changed",
  DEACTIVATED: "Employee Deactivated",
};

const CAN_MANAGE = ["OWNER", "HR"];

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deactivate modal state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getEmployee(id);
        if (res.data?.employee) setEmployee(res.data.employee);
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e.message ?? "Failed to load employee.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const loadHistory = async () => {
    if (!id) return;
    setHistoryLoading(true);
    try {
      const res = await getEmployeeHistory(id);
      if (res.data?.history) setHistory(res.data.history);
    } catch {
      // show inline message
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && history.length === 0) void loadHistory();
  };

  const handleDeactivate = async () => {
    if (!id) return;
    setDeactivating(true);
    setDeactivateError(null);
    try {
      const res = await deactivateEmployee(id, deactivateReason || undefined);
      if (res.data?.employee) setEmployee(res.data.employee as unknown as EmployeeDetail);
      setShowDeactivateModal(false);
      setDeactivateReason("");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setDeactivateError(e.message ?? "Failed to deactivate employee.");
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#f47b5b]/30 border-t-[#f47b5b] rounded-full animate-spin" />
            <p className="text-sm text-[#77716e]">Loading employee…</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !employee) {
    return (
      <PageContainer>
        <ErrorState message={error ?? "Employee not found."} onRetry={() => navigate("/employees")} />
      </PageContainer>
    );
  }

  const canManage = user && CAN_MANAGE.includes(user.role);

  return (
    <PageContainer maxWidth="max-w-5xl">
      <PageHeader
        title={employee.name}
        subtitle={`${employee.designation?.name ?? ""} · ${employee.department?.name ?? ""}`}
        icon={
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f47b5b] to-[#f9a489] flex items-center justify-center text-white font-bold text-sm">
            {employee.name.charAt(0).toUpperCase()}
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Employees", to: "/employees" },
          { label: employee.name },
        ]}
        badges={
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[employee.status] ?? ""}`}>
            {employee.status}
          </span>
        }
        actions={
          canManage && employee.status !== "INACTIVE" ? (
            <div className="flex items-center gap-2">
              <Link
                to={`/employees/${id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#252525] border border-[#eadbd2] rounded-lg hover:bg-[#fff0e8] hover:text-[#f47b5b] hover:border-[#f47b5b]/50 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </Link>
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
              >
                <UserX className="w-3.5 h-3.5" />
                Deactivate
              </button>
            </div>
          ) : undefined
        }
      />
        {/* Employee Profile Card */}
        <div className="bg-white border border-[#eadbd2] rounded-2xl shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-[#fff0e8] to-[#fff7f2] border-b border-[#eadbd2] px-6 py-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f47b5b] to-[#f9a489] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-sm">
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-bold text-2xl text-[#252525]">{employee.name}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[employee.status] ?? ""}`}>
                    {employee.status}
                  </span>
                </div>
                <p className="text-sm text-[#77716e] mt-0.5">{employee.email}</p>
                <p className="text-xs text-[#aaa] font-mono mt-1">{employee.employeeCode}</p>
              </div>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#f3ede8]">
            <InfoCell
              icon={<Building2 className="w-4 h-4 text-[#f47b5b]" />}
              label="Department"
              value={employee.department?.name ?? "—"}
            />
            <InfoCell
              icon={<Briefcase className="w-4 h-4 text-[#f47b5b]" />}
              label="Designation"
              value={employee.designation?.name ?? "—"}
            />
            <InfoCell
              icon={<Users className="w-4 h-4 text-[#f47b5b]" />}
              label="Supervisor"
              value={employee.supervisor ? `${employee.supervisor.name} (${employee.supervisor.employeeCode})` : "—"}
            />
            <InfoCell
              icon={<Calendar className="w-4 h-4 text-[#f47b5b]" />}
              label="Joined"
              value={new Date(employee.joiningDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            />
          </div>
        </div>

        {/* Contact & IDs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#77716e] mb-3">Contact</h2>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-[#77716e]" />
              <span>{employee.email}</span>
            </div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#77716e] mb-3">Employee Code</h2>
            <div className="flex items-center gap-2 text-sm">
              <Hash className="w-4 h-4 text-[#77716e]" />
              <code className="font-mono bg-[#fff0e8] text-[#252525] px-2 py-0.5 rounded">{employee.employeeCode}</code>
            </div>
          </div>
        </div>

        {/* Subordinates */}
        {employee.subordinates && employee.subordinates.length > 0 && (
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#77716e] mb-3">
              Direct Reports ({employee.subordinates.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {employee.subordinates.map((sub) => (
                <Link
                  key={sub.id}
                  to={`/employees/${sub.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[#fff0e8] text-[#f47b5b] border border-[#f47b5b]/20 rounded-full hover:shadow-sm transition-all"
                >
                  <span className="w-5 h-5 rounded-full bg-[#f47b5b]/20 flex items-center justify-center text-[10px] font-bold">
                    {sub.name.charAt(0)}
                  </span>
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Employment History */}
        <div className="bg-white border border-[#eadbd2] rounded-2xl overflow-hidden">
          <button
            id="toggle-history-btn"
            onClick={toggleHistory}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#fff7f2] transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#f47b5b]" />
              <span className="font-semibold text-sm text-[#252525]">Employment History</span>
            </div>
            {showHistory ? (
              <ChevronUp className="w-4 h-4 text-[#77716e]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#77716e]" />
            )}
          </button>

          {showHistory && (
            <div className="border-t border-[#eadbd2]">
              {historyLoading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-6 h-6 text-[#f47b5b] animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <p className="p-6 text-sm text-[#77716e] text-center">No history records found.</p>
              ) : (
                <div className="divide-y divide-[#f3ede8]">
                  {history.map((h) => (
                    <div key={h.id} className="px-5 py-4 flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#f47b5b] mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#252525]">
                          {EVENT_LABELS[h.eventType] ?? h.eventType}
                        </p>
                        {(h.previousValue || h.newValue) && (
                          <p className="text-xs text-[#77716e] mt-0.5">
                            {h.previousValue && <span className="line-through mr-1">{h.previousValue}</span>}
                            {h.newValue && <span className="font-medium text-[#252525]">{h.newValue}</span>}
                          </p>
                        )}
                        {h.reason && (
                          <p className="text-xs text-[#77716e] mt-0.5 italic">Reason: {h.reason}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-[#aaa]">
                            {new Date(h.effectiveDate).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                            })}
                          </span>
                          {h.changedBy && (
                            <span className="text-[11px] text-[#aaa]">· by {h.changedBy.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-[#252525]">Deactivate Employee</h3>
                <p className="text-xs text-[#77716e]">{employee.name}</p>
              </div>
            </div>

            <p className="text-sm text-[#77716e]">
              This will mark the employee as <strong className="text-[#252525]">Inactive</strong>. This action can be reversed by an admin.
            </p>

            <div>
              <label htmlFor="deactivate-reason" className="block text-xs font-medium text-[#77716e] mb-1.5">
                Reason (optional)
              </label>
              <textarea
                id="deactivate-reason"
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                rows={3}
                placeholder="e.g. Resigned, contract ended…"
                className="w-full px-3 py-2 text-sm border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none"
              />
            </div>

            {deactivateError && (
              <p className="text-xs text-red-500">{deactivateError}</p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowDeactivateModal(false); setDeactivateReason(""); setDeactivateError(null); }}
                className="px-4 py-2 text-sm font-medium text-[#77716e] border border-[#eadbd2] rounded-xl hover:bg-[#fff0e8] transition-all"
              >
                Cancel
              </button>
              <button
                id="confirm-deactivate-btn"
                onClick={() => void handleDeactivate()}
                disabled={deactivating}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {deactivating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                {deactivating ? "Deactivating…" : "Confirm Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

interface InfoCellProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const InfoCell: React.FC<InfoCellProps> = ({ icon, label, value }) => (
  <div className="px-5 py-4">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77716e]">{label}</span>
    </div>
    <p className="text-sm font-medium text-[#252525] truncate">{value}</p>
  </div>
);
