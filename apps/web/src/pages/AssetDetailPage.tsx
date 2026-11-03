import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Edit2,
  Trash2,
  UserCheck,
  UserPlus,
  ArrowRightLeft,
  RotateCcw,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  X,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getAsset,
  deleteAsset,
  assignAsset,
  returnAsset,
  transferAsset,
  createMaintenance,
} from "../services/assetService";
import { PageContainer, PageHeader, ErrorState } from "../components/common";
import { listEmployees } from "../services/employeeService";
import type {
  Asset,
  AssetCondition,
  AssetStatus,
  MaintenancePriority,
} from "../types/asset";
import type { EmployeeSummary } from "../types/employee";

const CATEGORY_ICONS: Record<string, string> = {
  LAPTOP: "💻", DESKTOP: "🖥️", MOBILE: "📱", TABLET: "📟",
  PERIPHERAL: "⌨️", FURNITURE: "🪑", NETWORKING: "🌐", VEHICLE: "🚗", OTHER: "📦",
};

const CONDITIONS: AssetCondition[] = ["NEW", "EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"];

function StatusBadge({ status }: { status: AssetStatus }) {
  const cls: Record<string, string> = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ASSIGNED: "bg-blue-50 text-blue-700 border-blue-200",
    UNDER_MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-200",
    RETIRED: "bg-gray-100 text-gray-500 border-gray-200",
    DISPOSED: "bg-red-50 text-red-600 border-red-200",
  };
  const labels: Record<string, string> = {
    AVAILABLE: "Available", ASSIGNED: "Assigned",
    UNDER_MAINTENANCE: "Under Maintenance", RETIRED: "Retired", DISPOSED: "Disposed",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cls[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: MaintenancePriority }) {
  const cls: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-700 border-gray-200",
    MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
    HIGH: "bg-amber-50 text-amber-700 border-amber-200",
    CRITICAL: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cls[priority] ?? ""}`}>
      {priority}
    </span>
  );
}

export const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? "EMPLOYEE";

  const canManage = ["OWNER", "HR"].includes(role);
  const canAssign = ["OWNER", "HR", "MANAGER"].includes(role);
  const canMaintenance = ["OWNER", "HR", "MANAGER", "SUPERVISOR"].includes(role);

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Active employees list for modals
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Modals state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Assign Form
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [assignCondition, setAssignCondition] = useState<AssetCondition>("GOOD");
  const [assignNotes, setAssignNotes] = useState("");

  // Return Form
  const [returnCondition, setReturnCondition] = useState<AssetCondition>("GOOD");
  const [returnNotes, setReturnNotes] = useState("");
  const [markMaintenance, setMarkMaintenance] = useState(false);
  const [maintenanceDesc, setMaintenanceDesc] = useState("");

  // Transfer Form
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferCondition, setTransferCondition] = useState<AssetCondition>("GOOD");
  const [transferNotes, setTransferNotes] = useState("");

  // Log Maintenance Form
  const [issueDescription, setIssueDescription] = useState("");
  const [maintenancePriority, setMaintenancePriority] = useState<MaintenancePriority>("MEDIUM");
  const [assignedTechnician, setAssignedTechnician] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAsset(id);
      if (res.data?.asset) {
        setAsset(res.data.asset);
        setAssignCondition(res.data.asset.condition);
        setReturnCondition(res.data.asset.condition);
        setTransferCondition(res.data.asset.condition);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load asset details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Load employees lazily when allocation modals are opened
  const loadActiveEmployees = async () => {
    if (employees.length > 0) return;
    setLoadingEmployees(true);
    try {
      const res = await listEmployees({ status: "ACTIVE", limit: 100 });
      if (res.data?.employees) {
        setEmployees(res.data.employees);
      }
    } catch (err) {
      console.error("Failed to load employees for asset assignment", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleOpenAssign = () => {
    setModalError(null);
    setSelectedEmpId("");
    setAssignNotes("");
    if (asset) setAssignCondition(asset.condition);
    loadActiveEmployees();
    setIsAssignOpen(true);
  };

  const handleOpenReturn = () => {
    setModalError(null);
    setReturnNotes("");
    setMarkMaintenance(false);
    setMaintenanceDesc("");
    if (asset) setReturnCondition(asset.condition);
    setIsReturnOpen(true);
  };

  const handleOpenTransfer = () => {
    setModalError(null);
    setTransferTargetId("");
    setTransferNotes("");
    if (asset) setTransferCondition(asset.condition);
    loadActiveEmployees();
    setIsTransferOpen(true);
  };

  const handleOpenMaintenance = () => {
    setModalError(null);
    setIssueDescription("");
    setMaintenancePriority("MEDIUM");
    setAssignedTechnician("");
    setEstimatedCost("");
    setIsMaintenanceOpen(true);
  };

  // Submit Handlers
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedEmpId) {
      setModalError("Please select an employee.");
      return;
    }
    setModalSubmitting(true);
    setModalError(null);
    try {
      await assignAsset(id, {
        employeeId: selectedEmpId,
        conditionAtAssignment: assignCondition,
        notes: assignNotes || undefined,
      });
      setIsAssignOpen(false);
      setActionSuccess("Asset assigned successfully!");
      loadData();
    } catch (err: any) {
      setModalError(err?.message || "Failed to assign asset.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setModalSubmitting(true);
    setModalError(null);
    try {
      await returnAsset(id, {
        conditionAtReturn: returnCondition,
        returnNotes: returnNotes || undefined,
        markMaintenance,
        maintenanceDescription: markMaintenance ? maintenanceDesc : undefined,
      });
      setIsReturnOpen(false);
      setActionSuccess("Asset returned successfully!");
      loadData();
    } catch (err: any) {
      setModalError(err?.message || "Failed to return asset.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !transferTargetId) {
      setModalError("Please select the target employee.");
      return;
    }
    setModalSubmitting(true);
    setModalError(null);
    try {
      await transferAsset(id, {
        targetEmployeeId: transferTargetId,
        conditionAtTransfer: transferCondition,
        notes: transferNotes || undefined,
      });
      setIsTransferOpen(false);
      setActionSuccess("Asset transferred successfully!");
      loadData();
    } catch (err: any) {
      setModalError(err?.message || "Failed to transfer asset.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !issueDescription.trim()) {
      setModalError("Please describe the maintenance issue.");
      return;
    }
    setModalSubmitting(true);
    setModalError(null);
    try {
      await createMaintenance({
        assetId: id,
        issueDescription: issueDescription.trim(),
        priority: maintenancePriority,
        assignedTechnician: assignedTechnician.trim() || undefined,
        cost: estimatedCost ? Number(estimatedCost) : undefined,
      });
      setIsMaintenanceOpen(false);
      setActionSuccess("Maintenance ticket created!");
      loadData();
    } catch (err: any) {
      setModalError(err?.message || "Failed to log maintenance.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setModalSubmitting(true);
    try {
      await deleteAsset(id);
      navigate("/assets/inventory");
    } catch (err: any) {
      setModalError(err?.message || "Failed to delete asset.");
      setModalSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b]" />
        </div>
      </PageContainer>
    );
  }

  if (error || !asset) {
    return (
      <PageContainer>
        <ErrorState message={error || "Asset not found"} onRetry={loadData} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={asset.name}
        subtitle={`Asset Code: ${asset.assetCode} • ${asset.brand ? asset.brand + " " : ""}${asset.model || ""}`}
        icon={<span className="text-lg">{CATEGORY_ICONS[asset.category] ?? "📦"}</span>}
        badges={<StatusBadge status={asset.status} />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Assets", to: "/assets" },
          { label: "Inventory", to: "/assets/inventory" },
          { label: asset.name },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canAssign && asset.status === "AVAILABLE" && (
              <button
                onClick={handleOpenAssign}
                className="flex items-center gap-1.5 bg-[#f47b5b] text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-[#e06b4b] transition-colors shadow-sm"
              >
                <UserPlus className="w-4 h-4" /> Assign
              </button>
            )}

            {canAssign && asset.status === "ASSIGNED" && (
              <>
                <button
                  onClick={handleOpenReturn}
                  className="flex items-center gap-1.5 bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" /> Return
                </button>
                <button
                  onClick={handleOpenTransfer}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <ArrowRightLeft className="w-4 h-4" /> Transfer
                </button>
              </>
            )}

            {canMaintenance && asset.status !== "UNDER_MAINTENANCE" && asset.status !== "DISPOSED" && (
              <button
                onClick={handleOpenMaintenance}
                className="flex items-center gap-1.5 bg-amber-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-amber-700 transition-colors shadow-sm"
              >
                <Wrench className="w-4 h-4" /> Log Maintenance
              </button>
            )}

            {canManage && (
              <>
                <Link
                  to={`/assets/${asset.id}/edit`}
                  className="flex items-center gap-1.5 border border-[#eadbd2] text-[#252525] px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-[#fff0e8] transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-[#77716e]" /> Edit
                </Link>
                <button
                  onClick={() => setIsDeleteOpen(true)}
                  className="flex items-center gap-1.5 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            )}
          </div>
        }
      />

      {actionSuccess && (
        <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {actionSuccess}
          </div>
          <button onClick={() => setActionSuccess(null)}>
            <X className="w-4 h-4 opacity-70 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Grid: Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Primary Details & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Currently Assigned Banner */}
          {asset.assignedEmployee && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Currently Assigned To
                </div>
                <div className="text-base font-bold text-[#252525] mt-0.5">
                  {asset.assignedEmployee.name}
                </div>
                <div className="text-xs text-[#77716e] mt-0.5">
                  {asset.assignedEmployee.employeeCode} • {asset.assignedEmployee.email}
                  {asset.assignedEmployee.department && ` • ${asset.assignedEmployee.department.name}`}
                </div>
              </div>
            </div>
          )}

          {/* Under Maintenance Banner */}
          {asset.status === "UNDER_MAINTENANCE" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  Under Active Maintenance
                </div>
                <div className="text-sm text-[#252525] mt-1">
                  This asset is undergoing repair or servicing. New assignments are blocked until the maintenance ticket is marked completed.
                </div>
              </div>
            </div>
          )}

          {/* Asset Specifications & Details */}
          <div className="bg-white rounded-2xl border border-[#eadbd2] p-6 space-y-5">
            <h2 className="font-semibold text-[#252525] text-base border-b border-[#eadbd2] pb-3">
              Specifications & Attributes
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-[#77716e] block">Category</span>
                <span className="font-medium text-[#252525]">{asset.category}</span>
              </div>
              <div>
                <span className="text-xs text-[#77716e] block">Condition</span>
                <span className="font-medium text-[#252525]">{asset.condition}</span>
              </div>
              <div>
                <span className="text-xs text-[#77716e] block">Brand</span>
                <span className="font-medium text-[#252525]">{asset.brand || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-[#77716e] block">Model</span>
                <span className="font-medium text-[#252525]">{asset.model || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-[#77716e] block">Serial Number</span>
                <span className="font-mono text-xs font-semibold text-[#252525]">
                  {asset.serialNumber || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#77716e] block">Vendor</span>
                <span className="font-medium text-[#252525]">{asset.vendor || "—"}</span>
              </div>
            </div>

            {asset.description && (
              <div className="pt-2 border-t border-[#eadbd2]">
                <span className="text-xs text-[#77716e] block mb-1">Description</span>
                <p className="text-sm text-[#252525] whitespace-pre-wrap">{asset.description}</p>
              </div>
            )}
          </div>

          {/* Allocation History (Day 28) */}
          <div className="bg-white rounded-2xl border border-[#eadbd2] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#eadbd2] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[#252525] text-base">Assignment History</h2>
                <p className="text-xs text-[#77716e] mt-0.5">
                  Complete custody and audit trail for this equipment
                </p>
              </div>
              <span className="text-xs font-semibold bg-[#fff0e8] text-[#f47b5b] px-2.5 py-1 rounded-full">
                {asset.assignments?.length || 0} Records
              </span>
            </div>

            {(!asset.assignments || asset.assignments.length === 0) ? (
              <div className="p-8 text-center text-[#77716e] text-sm">
                No assignment history found for this asset.
              </div>
            ) : (
              <ul className="divide-y divide-[#eadbd2]">
                {asset.assignments.map((asgn) => (
                  <li key={asgn.id} className="p-5 hover:bg-[#fff7f2] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#252525]">
                            {asgn.employee?.name || "Unknown Employee"}
                          </div>
                          <div className="text-xs text-[#77716e]">
                            {asgn.employee?.employeeCode} • {asgn.employee?.department?.name || "No Dept"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            asgn.status === "ACTIVE"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : asgn.status === "TRANSFERRED"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {asgn.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-[#eadbd2]/60 text-xs text-[#77716e]">
                      <div>
                        <span className="block font-medium text-[#252525]">Assigned:</span>
                        {new Date(asgn.assignedDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="block font-medium text-[#252525]">Returned:</span>
                        {asgn.returnDate ? new Date(asgn.returnDate).toLocaleDateString() : "Present"}
                      </div>
                      <div>
                        <span className="block font-medium text-[#252525]">Condition:</span>
                        {asgn.conditionAtAssignment || "—"}
                        {asgn.conditionAtReturn && ` → ${asgn.conditionAtReturn}`}
                      </div>
                    </div>

                    {(asgn.notes || asgn.returnNotes) && (
                      <div className="mt-2 text-xs bg-gray-50 rounded-xl p-2.5 text-[#555] space-y-1">
                        {asgn.notes && <div><strong>Assignment Note:</strong> {asgn.notes}</div>}
                        {asgn.returnNotes && <div><strong>Return Note:</strong> {asgn.returnNotes}</div>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column (1 span): Financials, Warranty & Maintenance Tickets */}
        <div className="space-y-6">
          {/* Procurement & Warranty Box */}
          <div className="bg-white rounded-2xl border border-[#eadbd2] p-6 space-y-4">
            <h3 className="font-semibold text-[#252525] text-sm pb-2 border-b border-[#eadbd2] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#f47b5b]" />
              Procurement & Warranty
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-[#77716e] block">Purchase Cost</span>
                <span className="text-base font-bold text-[#252525]">
                  {asset.purchaseCost ? `₹${asset.purchaseCost.toLocaleString()}` : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#77716e] block">Purchase Date</span>
                <span className="font-medium text-[#252525]">
                  {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#77716e] block">Warranty Expiry</span>
                <span className="font-medium text-[#252525]">
                  {asset.warrantyExpiry ? (
                    <span
                      className={
                        new Date(asset.warrantyExpiry) < new Date()
                          ? "text-red-500 font-semibold"
                          : "text-emerald-600 font-semibold"
                      }
                    >
                      {new Date(asset.warrantyExpiry).toLocaleDateString()}
                    </span>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              {asset.warrantyDetails && (
                <div>
                  <span className="text-xs text-[#77716e] block">Warranty Terms</span>
                  <span className="text-xs text-[#252525]">{asset.warrantyDetails}</span>
                </div>
              )}
            </div>
          </div>

          {/* Maintenance Tickets Section (Day 29) */}
          <div className="bg-white rounded-2xl border border-[#eadbd2] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#eadbd2] flex items-center justify-between">
              <h3 className="font-semibold text-[#252525] text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#f47b5b]" />
                Maintenance ({asset.maintenanceTickets?.length || 0})
              </h3>
              <Link
                to="/assets/maintenance"
                className="text-xs font-semibold text-[#f47b5b] hover:underline"
              >
                All Tickets →
              </Link>
            </div>

            {(!asset.maintenanceTickets || asset.maintenanceTickets.length === 0) ? (
              <div className="p-6 text-center text-[#77716e] text-xs">
                No maintenance tickets logged.
              </div>
            ) : (
              <ul className="divide-y divide-[#eadbd2]">
                {asset.maintenanceTickets.map((ticket) => (
                  <li key={ticket.id} className="p-4 space-y-2 hover:bg-[#fff7f2] transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#252525]">
                        {ticket.ticketNumber}
                      </span>
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <p className="text-xs text-[#252525] font-medium line-clamp-2">
                      {ticket.issueDescription}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-[#77716e]">
                      <span>{new Date(ticket.reportedDate).toLocaleDateString()}</span>
                      <span
                        className={`font-semibold ${
                          ticket.status === "COMPLETED"
                            ? "text-emerald-600"
                            : ticket.status === "OPEN"
                            ? "text-amber-600"
                            : "text-blue-600"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL: ASSIGN ASSET ────────────────────────────────────── */}
      {isAssignOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#f47b5b]" />
                <h3 className="font-bold text-[#252525]">Assign Asset</h3>
              </div>
              <button onClick={() => setIsAssignOpen(false)}>
                <X className="w-5 h-5 text-[#77716e]" />
              </button>
            </div>

            {modalError && (
              <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Select Employee <span className="text-red-500">*</span>
                </label>
                {loadingEmployees ? (
                  <div className="flex items-center gap-2 text-xs text-[#77716e] py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#f47b5b]" /> Loading active employees...
                  </div>
                ) : (
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode}) {emp.department ? `- ${emp.department.name}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Condition at Handover
                </label>
                <select
                  value={assignCondition}
                  onChange={(e) => setAssignCondition(e.target.value as AssetCondition)}
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Assignment Notes
                </label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Handed over with charger and laptop bag"
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#eadbd2]">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-4 py-2 border border-[#eadbd2] rounded-xl text-xs font-semibold hover:bg-[#fff0e8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting || !selectedEmpId}
                  className="px-5 py-2 bg-[#f47b5b] text-white rounded-xl text-xs font-semibold hover:bg-[#e06b4b] disabled:opacity-50 flex items-center gap-2"
                >
                  {modalSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RETURN ASSET ────────────────────────────────────── */}
      {isReturnOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-[#252525]">Return Asset to Inventory</h3>
              </div>
              <button onClick={() => setIsReturnOpen(false)}>
                <X className="w-5 h-5 text-[#77716e]" />
              </button>
            </div>

            {modalError && (
              <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Condition at Return
                </label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as AssetCondition)}
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Return Notes
                </label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Returned upon project completion, accessories verified"
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                />
              </div>

              {/* Maintenance toggle */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-amber-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markMaintenance}
                    onChange={(e) => setMarkMaintenance(e.target.checked)}
                    className="rounded text-[#f47b5b] focus:ring-[#f47b5b]"
                  />
                  Asset requires maintenance or repairs before re-assignment
                </label>
                {markMaintenance && (
                  <input
                    type="text"
                    value={maintenanceDesc}
                    onChange={(e) => setMaintenanceDesc(e.target.value)}
                    placeholder="Describe issue (e.g. Damaged screen, fan noise)..."
                    required
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#eadbd2]">
                <button
                  type="button"
                  onClick={() => setIsReturnOpen(false)}
                  className="px-4 py-2 border border-[#eadbd2] rounded-xl text-xs font-semibold hover:bg-[#fff0e8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {modalSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: TRANSFER ASSET ──────────────────────────────────── */}
      {isTransferOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-[#252525]">Transfer Asset</h3>
              </div>
              <button onClick={() => setIsTransferOpen(false)}>
                <X className="w-5 h-5 text-[#77716e]" />
              </button>
            </div>

            {modalError && (
              <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="text-xs text-[#77716e]">
                Currently assigned to: <strong>{asset.assignedEmployee?.name}</strong>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  New Assignee <span className="text-red-500">*</span>
                </label>
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                >
                  <option value="">-- Choose New Employee --</option>
                  {employees
                    .filter((emp) => emp.id !== asset.assignedEmployeeId)
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode}) {emp.department ? `- ${emp.department.name}` : ""}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Condition at Transfer
                </label>
                <select
                  value={transferCondition}
                  onChange={(e) => setTransferCondition(e.target.value as AssetCondition)}
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Transfer Reason / Notes
                </label>
                <textarea
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Handed over due to department reallocation"
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#eadbd2]">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 border border-[#eadbd2] rounded-xl text-xs font-semibold hover:bg-[#fff0e8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting || !transferTargetId}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {modalSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: LOG MAINTENANCE TICKET ──────────────────────────── */}
      {isMaintenanceOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-[#252525]">Create Maintenance Ticket</h3>
              </div>
              <button onClick={() => setIsMaintenanceOpen(false)}>
                <X className="w-5 h-5 text-[#77716e]" />
              </button>
            </div>

            {modalError && (
              <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Issue Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe the issue, malfunction, or servicing needed..."
                  required
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                    Priority
                  </label>
                  <select
                    value={maintenancePriority}
                    onChange={(e) => setMaintenancePriority(e.target.value as MaintenancePriority)}
                    className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                    Estimated Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder="e.g. 2500"
                    className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Assigned Technician / Vendor
                </label>
                <input
                  type="text"
                  value={assignedTechnician}
                  onChange={(e) => setAssignedTechnician(e.target.value)}
                  placeholder="e.g. Tech Services Team / Rajesh"
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#eadbd2]">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceOpen(false)}
                  className="px-4 py-2 border border-[#eadbd2] rounded-xl text-xs font-semibold hover:bg-[#fff0e8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting || !issueDescription.trim()}
                  className="px-5 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {modalSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Open Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE ASSET ────────────────────────────────────── */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-[#252525] text-lg">Delete Asset</h3>
            <p className="text-sm text-[#77716e]">
              Are you sure you want to delete <strong>{asset.name}</strong> ({asset.assetCode})?
              This action cannot be undone.
            </p>
            {modalError && (
              <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                {modalError}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 border border-[#eadbd2] rounded-xl text-xs font-semibold hover:bg-[#fff0e8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={modalSubmitting}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {modalSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
