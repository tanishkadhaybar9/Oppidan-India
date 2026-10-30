import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  X,
  Filter,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  listDesignations,
  getDesignation,
  createDesignation,
  updateDesignation,
} from "../services/employeeService";
import type { Designation } from "../types/employee";
import { PageContainer, PageHeader } from "../components/common";

export const DesignationsPage: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER" || user?.role === "HR";

  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDesg, setEditingDesg] = useState<Designation | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDesgDetail, setSelectedDesgDetail] = useState<Designation | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchDesignations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listDesignations();
      if (res.data?.designations) {
        setDesignations(res.data.designations);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to load designations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDesignations();
  }, [fetchDesignations]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError("Designation title is required.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      await createDesignation(newName.trim(), newDescription.trim() || undefined);
      setNewName("");
      setNewDescription("");
      setCreateModalOpen(false);
      await fetchDesignations();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setCreateError(e.message || "Failed to create designation.");
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (desg: Designation) => {
    setEditingDesg(desg);
    setEditName(desg.name);
    setEditDescription(desg.description || "");
    setEditStatus(desg.status);
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDesg) return;
    if (!editName.trim()) {
      setEditError("Designation title is required.");
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      await updateDesignation(editingDesg.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        status: editStatus,
      });
      setEditModalOpen(false);
      await fetchDesignations();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setEditError(e.message || "Failed to update designation.");
    } finally {
      setEditLoading(false);
    }
  };

  const viewDetails = async (desg: Designation) => {
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    try {
      const res = await getDesignation(desg.id);
      if (res.data?.designation) {
        setSelectedDesgDetail(res.data.designation);
      }
    } catch {
      setSelectedDesgDetail(desg);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredDesignations = designations.filter((desg) => {
    const matchesSearch =
      desg.name.toLowerCase().includes(search.toLowerCase()) ||
      (desg.description && desg.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      statusFilter === "ALL" || desg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Designations & Job Roles"
        subtitle="Define corporate job titles, responsibilities, and assign position hierarchies."
        icon={<Briefcase className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Employees", to: "/employees" },
          { label: "Designations" },
        ]}
        actions={
          canManage ? (
            <button
              onClick={() => {
                setNewName("");
                setNewDescription("");
                setCreateError(null);
                setCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-sm font-semibold shadow-xs hover:opacity-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Designation</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white border border-[#eadbd2] rounded-[20px] p-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#77716e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search designations by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-[#fff7f2] border border-[#eadbd2] focus:outline-none focus:border-[#f47b5b] text-[#252525]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#77716e]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-[#fff7f2] border border-[#eadbd2] text-[#252525] focus:outline-none focus:border-[#f47b5b]"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-[#eadbd2] rounded-[20px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b] mb-2" />
          <p className="text-sm text-[#77716e]">Loading designations...</p>
        </div>
      ) : filteredDesignations.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#eadbd2] rounded-[20px] p-6">
          <Briefcase className="w-12 h-12 text-[#eadbd2] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#252525]">No designations found</h3>
          <p className="text-xs text-[#77716e] mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "ALL"
              ? "No designations matched your current filter criteria."
              : "Create job positions to categorize your company workforce."}
          </p>
          {canManage && !search && statusFilter === "ALL" && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#fff0e8] text-[#f47b5b] text-xs font-semibold hover:bg-[#f47b5b] hover:text-white transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Designation</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDesignations.map((desg) => {
            const empCount = desg._count?.employees ?? 0;
            return (
              <div
                key={desg.id}
                className="bg-white border border-[#eadbd2] rounded-[22px] p-5 shadow-xs hover:border-[#f47b5b]/50 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#fff0e8] text-[#f47b5b] flex items-center justify-center font-bold text-sm">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-base text-[#252525] leading-tight">
                          {desg.name}
                        </h3>
                        <span className="text-[11px] text-[#77716e] block mt-0.5 font-mono">
                          ID: {desg.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        desg.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      {desg.status === "ACTIVE" ? (
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-gray-400" />
                      )}
                      {desg.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#77716e] line-clamp-2 mt-2">
                    {desg.description || "No specific job description provided."}
                  </p>

                  <div className="bg-[#fff7f2] rounded-xl p-3 border border-[#eadbd2]/60 mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#77716e]">
                      <Users className="w-3.5 h-3.5 text-[#f47b5b]" />
                      <span>Assigned Staff</span>
                    </div>
                    <span className="text-xs font-bold text-[#252525] bg-white px-2 py-0.5 rounded-lg border border-[#eadbd2]">
                      {empCount} {empCount === 1 ? "Employee" : "Employees"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#eadbd2]/70 flex items-center justify-between gap-2">
                  <button
                    onClick={() => void viewDetails(desg)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#f47b5b] hover:text-[#d96243] transition-colors cursor-pointer"
                  >
                    <span>View Members</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  {canManage && (
                    <button
                      onClick={() => openEditModal(desg)}
                      className="inline-flex items-center gap-1 text-xs text-[#77716e] hover:text-[#252525] bg-[#fff7f2] hover:bg-[#fff0e8] px-2.5 py-1 rounded-lg border border-[#eadbd2] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] border border-[#eadbd2] max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-[#fff0e8] text-[#77716e] hover:text-[#252525] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#fff0e8] text-[#f47b5b] flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#252525]">Create Designation</h2>
                <p className="text-xs text-[#77716e]">Add a new corporate title</p>
              </div>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                  Designation Title <span className="text-[#f47b5b]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Software Engineer, HR Specialist, Account Lead"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#eadbd2] bg-[#fff7f2] focus:outline-none focus:border-[#f47b5b] text-[#252525]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                  Job Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Responsibilities, expectations, or team role..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-[#eadbd2] bg-[#fff7f2] focus:outline-none focus:border-[#f47b5b] text-[#252525]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#eadbd2] text-xs font-semibold text-[#77716e] hover:bg-[#fff7f2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Designation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && editingDesg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] border border-[#eadbd2] max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-[#fff0e8] text-[#77716e] hover:text-[#252525] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#fff0e8] text-[#f47b5b] flex items-center justify-center">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#252525]">Edit Designation</h2>
                <p className="text-xs text-[#77716e]">Modify title, description and status</p>
              </div>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                  Designation Title <span className="text-[#f47b5b]">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#eadbd2] bg-[#fff7f2] focus:outline-none focus:border-[#f47b5b] text-[#252525]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                  Job Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-[#eadbd2] bg-[#fff7f2] focus:outline-none focus:border-[#f47b5b] text-[#252525]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#eadbd2] bg-[#fff7f2] focus:outline-none focus:border-[#f47b5b] text-[#252525]"
                >
                  <option value="ACTIVE">ACTIVE (Operational)</option>
                  <option value="INACTIVE">INACTIVE (Disabled)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#eadbd2] text-xs font-semibold text-[#77716e] hover:bg-[#fff7f2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {editLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Designation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {detailsModalOpen && selectedDesgDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] border border-[#eadbd2] max-w-2xl w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setDetailsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-[#fff0e8] text-[#77716e] hover:text-[#252525] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-[#fff0e8] text-[#f47b5b] flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#252525]">{selectedDesgDetail.name}</h2>
                <div className="flex items-center gap-2 text-xs text-[#77716e]">
                  <span>Status:</span>
                  <span
                    className={`font-semibold px-2 py-0.2 rounded-full text-[10px] ${
                      selectedDesgDetail.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {selectedDesgDetail.status}
                  </span>
                </div>
              </div>
            </div>

            {selectedDesgDetail.description && (
              <p className="text-xs text-[#77716e] bg-[#fff7f2] p-3 rounded-xl border border-[#eadbd2] mb-3">
                {selectedDesgDetail.description}
              </p>
            )}

            <div className="flex-1 overflow-y-auto pr-1">
              <h3 className="text-xs font-bold text-[#77716e] uppercase tracking-wider mb-2">
                Employees in this Role ({selectedDesgDetail.employees?.length ?? 0})
              </h3>

              {detailsLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#f47b5b]" />
                </div>
              ) : !selectedDesgDetail.employees || selectedDesgDetail.employees.length === 0 ? (
                <div className="text-center py-8 bg-[#fff7f2] rounded-xl border border-[#eadbd2]">
                  <Users className="w-8 h-8 text-[#eadbd2] mx-auto mb-2" />
                  <p className="text-xs text-[#77716e]">No staff currently holding this designation.</p>
                  <Link
                    to="/employees/new"
                    className="inline-flex items-center gap-1 text-xs text-[#f47b5b] font-semibold mt-2 hover:underline"
                  >
                    <span>Assign an employee</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDesgDetail.employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="p-3 bg-[#fff7f2] border border-[#eadbd2] rounded-xl flex items-center justify-between gap-3 hover:bg-[#fff0e8]/50 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-xs text-[#252525]">{emp.name}</div>
                        <div className="text-[11px] text-[#77716e] flex items-center gap-2">
                          <span className="font-mono">{emp.employeeCode}</span>
                          <span>•</span>
                          <span>{emp.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {emp.status}
                        </span>
                        <Link
                          to={`/employees/${emp.id}`}
                          className="text-[#f47b5b] hover:text-[#d96243] text-xs font-semibold inline-flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 mt-3 border-t border-[#eadbd2] flex justify-end flex-shrink-0">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#fff7f2] hover:bg-[#fff0e8] text-xs font-semibold text-[#252525] border border-[#eadbd2] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
