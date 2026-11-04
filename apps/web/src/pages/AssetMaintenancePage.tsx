import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  listMaintenance,
  updateMaintenance,
  createMaintenance,
  listAssets,
} from "../services/assetService";
import { PageContainer, PageHeader } from "../components/common";
import type {
  AssetMaintenance,
  MaintenanceStatus,
  MaintenancePriority,
  Asset,
} from "../types/asset";

const STATUSES: Array<{ value: MaintenanceStatus; label: string }> = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "WAITING_PARTS", label: "Waiting for Parts" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITIES: Array<{ value: MaintenancePriority; label: string }> = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

function PriorityBadge({ priority }: { priority: MaintenancePriority }) {
  const cls: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-700 border-gray-200",
    MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
    HIGH: "bg-amber-50 text-amber-700 border-amber-200",
    CRITICAL: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls[priority] ?? ""}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: MaintenanceStatus }) {
  const cls: Record<string, string> = {
    OPEN: "bg-amber-50 text-amber-700 border-amber-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    WAITING_PARTS: "bg-purple-50 text-purple-700 border-purple-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const labels: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    WAITING_PARTS: "Waiting Parts",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {labels[status] ?? status}
    </span>
  );
}

export const AssetMaintenancePage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role ?? "EMPLOYEE";
  const canManage = ["OWNER", "HR", "MANAGER", "SUPERVISOR"].includes(role);

  const [tickets, setTickets] = useState<AssetMaintenance[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | "">("");
  const [filterPriority, setFilterPriority] = useState<MaintenancePriority | "">("");
  const [page, setPage] = useState(1);

  // Update Ticket Modal
  const [selectedTicket, setSelectedTicket] = useState<AssetMaintenance | null>(null);
  const [updateStatus, setUpdateStatus] = useState<MaintenanceStatus>("IN_PROGRESS");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [technician, setTechnician] = useState("");
  const [cost, setCost] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // New Ticket Modal
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [newAssetId, setNewAssetId] = useState("");
  const [newIssue, setNewIssue] = useState("");
  const [newPriority, setNewPriority] = useState<MaintenancePriority>("MEDIUM");
  const [newTech, setNewTech] = useState("");
  const [newCost, setNewCost] = useState("");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listMaintenance({
        search: search || undefined,
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        page,
        limit: 15,
      });
      if (res.data) {
        setTickets(res.data.tickets);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load maintenance tickets");
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterPriority, page]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const handleOpenUpdate = (ticket: AssetMaintenance) => {
    setSelectedTicket(ticket);
    setUpdateStatus(ticket.status);
    setResolutionNotes(ticket.resolutionNotes || "");
    setTechnician(ticket.assignedTechnician || "");
    setCost(ticket.cost ? String(ticket.cost) : "");
    setModalError(null);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setModalSubmitting(true);
    setModalError(null);

    const ticketIdToUse = selectedTicket.id || selectedTicket.ticketNumber;

    try {
      const res = await updateMaintenance(ticketIdToUse, {
        status: updateStatus,
        resolutionNotes: resolutionNotes.trim() || undefined,
        assignedTechnician: technician.trim() || undefined,
        cost: cost ? Number(cost) : undefined,
      });
      setSelectedTicket(null);
      setSuccess(`Ticket ${selectedTicket.ticketNumber} updated successfully!`);

      // Update state in real-time immediately
      if (res.data) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id || t.ticketNumber === selectedTicket.ticketNumber
              ? { ...t, ...res.data }
              : t
          )
        );
      }
      await loadTickets();
    } catch (err: any) {
      setModalError(err?.message || "Failed to update ticket.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleOpenNewTicket = async () => {
    setIsNewTicketOpen(true);
    setModalError(null);
    setNewAssetId("");
    setNewIssue("");
    setNewPriority("MEDIUM");
    setNewTech("");
    setNewCost("");

    if (availableAssets.length === 0) {
      setLoadingAssets(true);
      try {
        const res = await listAssets({ limit: 100 });
        if (res.data?.assets) {
          // Exclude assets already in maintenance or retired
          setAvailableAssets(
            res.data.assets.filter((a) => a.status !== "UNDER_MAINTENANCE" && a.status !== "DISPOSED")
          );
        }
      } catch (err) {
        console.error("Failed to load assets for maintenance", err);
      } finally {
        setLoadingAssets(false);
      }
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetId || !newIssue.trim()) {
      setModalError("Please select an asset and describe the issue.");
      return;
    }
    setModalSubmitting(true);
    setModalError(null);
    try {
      await createMaintenance({
        assetId: newAssetId,
        issueDescription: newIssue.trim(),
        priority: newPriority,
        assignedTechnician: newTech.trim() || undefined,
        cost: newCost ? Number(newCost) : undefined,
      });
      setIsNewTicketOpen(false);
      setSuccess("Maintenance ticket opened successfully!");
      loadTickets();
    } catch (err: any) {
      setModalError(err?.message || "Failed to create ticket.");
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Maintenance Tickets"
        subtitle="Track equipment repairs, scheduled servicing, and technician resolutions"
        icon={<Wrench className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Assets", to: "/assets" },
          { label: "Maintenance" },
        ]}
        actions={
          canManage ? (
            <button
              onClick={handleOpenNewTicket}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-sm font-semibold shadow-xs hover:opacity-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log Ticket
            </button>
          ) : undefined
        }
      />

      {success && (
        <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
          <button onClick={() => setSuccess(null)}>
            <X className="w-4 h-4 opacity-70 hover:opacity-100" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#eadbd2] p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="text-xs font-medium text-[#77716e] mb-1 block">Search Tickets</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77716e]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ticket number, issue description, technician..."
              className="w-full pl-9 pr-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b]"
            />
          </div>
        </div>

        <div className="min-w-36">
          <label className="text-xs font-medium text-[#77716e] mb-1 block">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as MaintenanceStatus | ""); setPage(1); }}
            className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="min-w-36">
          <label className="text-xs font-medium text-[#77716e] mb-1 block">Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => { setFilterPriority(e.target.value as MaintenancePriority | ""); setPage(1); }}
            className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {(search || filterStatus || filterPriority) && (
          <button
            type="button"
            onClick={() => { setSearch(""); setFilterStatus(""); setFilterPriority(""); setPage(1); }}
            className="text-xs text-[#77716e] hover:text-[#f47b5b] transition-colors py-2 px-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-[#eadbd2] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-7 h-7 animate-spin text-[#f47b5b]" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#77716e]">
            <Wrench className="w-10 h-10 mb-3 opacity-40" />
            <div className="font-medium text-sm">No maintenance tickets found</div>
            <div className="text-xs mt-1">
              All equipment is operational, or no tickets match your search.
            </div>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[1.5fr,2fr,1fr,1.5fr,1fr,1fr,auto] gap-3 px-5 py-3 border-b border-[#eadbd2] text-xs font-semibold text-[#77716e] uppercase tracking-wide">
              <div>Ticket / Date</div>
              <div>Asset & Issue</div>
              <div>Priority</div>
              <div>Technician</div>
              <div>Cost</div>
              <div>Status</div>
              <div />
            </div>

            <ul className="divide-y divide-[#eadbd2]">
              {tickets.map((t) => (
                <li key={t.id} className="hover:bg-[#fff7f2] transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-[1.5fr,2fr,1fr,1.5fr,1fr,1fr,auto] gap-3 items-center px-5 py-4">
                    <div>
                      <div className="font-mono text-xs font-bold text-[#252525]">{t.ticketNumber}</div>
                      <div className="text-xs text-[#77716e]">
                        {new Date(t.reportedDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="min-w-0">
                      {t.asset && (
                        <Link
                          to={`/assets/${t.asset.id}`}
                          className="text-xs font-bold text-[#f47b5b] hover:underline truncate block"
                        >
                          {t.asset.name} ({t.asset.assetCode})
                        </Link>
                      )}
                      <p className="text-xs text-[#252525] truncate">{t.issueDescription}</p>
                    </div>

                    <div>
                      <PriorityBadge priority={t.priority} />
                    </div>

                    <div className="text-xs text-[#77716e] truncate">
                      {t.assignedTechnician || "—"}
                    </div>

                    <div className="text-xs font-semibold text-[#252525]">
                      {t.cost ? `₹${t.cost.toLocaleString()}` : "—"}
                    </div>

                    <div>
                      <StatusBadge status={t.status} />
                    </div>

                    <div>
                      {canManage && (
                        <button
                          onClick={() => handleOpenUpdate(t)}
                          className="flex items-center gap-1 text-xs font-semibold text-[#f47b5b] hover:bg-[#fff0e8] px-2.5 py-1.5 rounded-lg border border-[#eadbd2] transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> Manage
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-[#77716e]">
            Showing {(page - 1) * pagination.limit + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total} tickets
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-[#eadbd2] hover:bg-[#fff0e8] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#77716e]" />
            </button>
            <span className="flex items-center text-sm font-medium px-3">
              {page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="p-2 rounded-xl border border-[#eadbd2] hover:bg-[#fff0e8] disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#77716e]" />
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: UPDATE TICKET ───────────────────────────────────── */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
              <div>
                <h3 className="font-bold text-[#252525]">Update Maintenance Ticket</h3>
                <p className="text-xs font-mono text-[#77716e]">{selectedTicket.ticketNumber}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)}>
                <X className="w-5 h-5 text-[#77716e]" />
              </button>
            </div>

            {modalError && (
              <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as MaintenanceStatus)}
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {updateStatus === "COMPLETED" && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                    ✓ Marking completed will automatically reinstate the asset back to <strong>AVAILABLE</strong>!
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#77716e] mb-1 block">Technician / Vendor</label>
                  <input
                    type="text"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    placeholder="e.g. Dell Service Engineer"
                    className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#77716e] mb-1 block">Actual Cost (₹)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">Resolution Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe parts replaced, diagnostics done, or resolution details..."
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#eadbd2]">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 border border-[#eadbd2] rounded-xl text-xs font-semibold hover:bg-[#fff0e8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 bg-[#f47b5b] text-white rounded-xl text-xs font-semibold hover:bg-[#e06b4b] disabled:opacity-50 flex items-center gap-2"
                >
                  {modalSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE NEW TICKET ───────────────────────────────── */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#eadbd2] pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-[#252525]">Log Maintenance Ticket</h3>
              </div>
              <button onClick={() => setIsNewTicketOpen(false)}>
                <X className="w-5 h-5 text-[#77716e]" />
              </button>
            </div>

            {modalError && (
              <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Select Asset <span className="text-red-500">*</span>
                </label>
                {loadingAssets ? (
                  <div className="flex items-center gap-2 text-xs text-[#77716e] py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#f47b5b]" /> Loading equipment...
                  </div>
                ) : (
                  <select
                    value={newAssetId}
                    onChange={(e) => setNewAssetId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                  >
                    <option value="">-- Choose Equipment --</option>
                    {availableAssets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.assetCode}) - [{a.status}]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">
                  Issue Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  placeholder="Detail the failure, issue, or reason for maintenance..."
                  required
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#77716e] mb-1 block">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as MaintenancePriority)}
                    className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#77716e] mb-1 block">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    placeholder="e.g. 2000"
                    className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77716e] mb-1 block">Assigned Technician</label>
                <input
                  type="text"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  placeholder="e.g. Internal IT Support"
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#eadbd2]">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2 border border-[#eadbd2] rounded-xl text-xs font-semibold hover:bg-[#fff0e8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting || !newAssetId || !newIssue.trim()}
                  className="px-5 py-2 bg-[#f47b5b] text-white rounded-xl text-xs font-semibold hover:bg-[#e06b4b] disabled:opacity-50 flex items-center gap-2"
                >
                  {modalSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Open Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
