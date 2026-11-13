import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { useAuth } from "../hooks/useAuth";
import {
  listUsers,
  createUser,
  updateUser,
  updateUserStatus,
  getRolesMatrix,
} from "../services/usersService";
import { listEmployees } from "../services/employeeService";
import type { UserItem, UserRole, UserStatus, CreateUserPayload } from "../types/users";
import type { EmployeeSummary } from "../types/employee";

const ROLES: UserRole[] = ["OWNER", "HR", "MANAGER", "SUPERVISOR", "EMPLOYEE"];

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [matrixData, setMatrixData] = useState<Record<string, string[]> | null>(null);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    employeeId: "",
  });

  // Edit form state
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    password?: string;
  }>({
    name: "",
    email: "",
    role: "EMPLOYEE",
    status: "ACTIVE",
    password: "",
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listUsers({
        page,
        limit: 15,
        search: search.trim() || undefined,
        role: selectedRole !== "ALL" ? (selectedRole as UserRole) : undefined,
        status: selectedStatus !== "ALL" ? (selectedStatus as UserStatus) : undefined,
      });
      if (res.data) {
        setUsers(res.data.users);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedRole, selectedStatus]);

  const loadInitialData = async () => {
    try {
      const [empRes, matRes] = await Promise.all([
        listEmployees({ limit: 100 }),
        getRolesMatrix(),
      ]);
      if (empRes.data) {
        setEmployees(empRes.data.employees || []);
      }
      if (matRes.data?.matrix) {
        setMatrixData(matRes.data.matrix);
      }
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await createUser({
        ...createForm,
        employeeId: createForm.employeeId || undefined,
      });
      showSuccess(`User account created for ${createForm.name}.`);
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "EMPLOYEE",
        employeeId: "",
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (u: UserItem) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      password: "",
    });
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setSubmitting(true);
      setError(null);
      await updateUser(editingUser.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        status: editForm.status,
        password: editForm.password ? editForm.password : undefined,
      });
      showSuccess(`User ${editForm.name} updated successfully.`);
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userItem: UserItem) => {
    const newStatus: UserStatus = userItem.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateUserStatus(userItem.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userItem.id ? { ...u, status: newStatus } : u))
      );
      showSuccess(`User marked as ${newStatus}.`);
    } catch (err: any) {
      setError(err.message || "Failed to update user status.");
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "OWNER":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "HR":
        return "bg-[#fff0e8] text-[#f47b5b] border-[#eadbd2]";
      case "MANAGER":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "SUPERVISOR":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "EMPLOYEE":
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="User & Access Control"
        subtitle="Provision employee accounts, assign role permissions, and maintain tenant user credentials."
        icon={<Users className="w-5 h-5 text-[#f47b5b]" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Settings", to: "/settings" },
          { label: "Users" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMatrixModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#eadbd2] bg-white text-xs font-semibold text-[#77716e] hover:text-[#252525] hover:border-[#f47b5b] transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              Role Matrix
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f47b5b] text-white text-xs font-semibold hover:bg-[#d95d3d] transition-all shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              Create User
            </button>
          </div>
        }
      />

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#77716e] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
          >
            <option value="ALL">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="text-xs text-[#77716e] font-semibold">
          Total Users: <span className="text-[#252525]">{total}</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[#77716e]">
            <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b] mx-auto mb-3" />
            <p className="text-xs font-medium">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-[#77716e]">
            <Users className="w-12 h-12 text-[#eadbd2] mx-auto mb-3" />
            <h4 className="text-sm font-bold text-[#252525] mb-1">No user accounts found</h4>
            <p className="text-xs">Try adjusting your filters or click Create User to add a new account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fff7f2] border-b border-[#eadbd2] text-[#77716e] uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Linked Employee</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadbd2]/60 text-[#252525]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#fff7f2]/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#f47b5b] to-[#f9a489] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[#252525]">{u.name}</div>
                          <div className="text-[11px] text-[#77716e]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 text-[10px]">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.employee ? (
                        <div>
                          <div className="font-medium text-[#252525]">{u.employee.name}</div>
                          <div className="text-[10px] text-[#77716e] font-mono">{u.employee.employeeCode}</div>
                        </div>
                      ) : (
                        <span className="text-[#77716e] italic">Unlinked</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-[#77716e]">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Never"}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-[#77716e]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 rounded-lg border border-[#eadbd2] text-[#77716e] hover:text-[#f47b5b] hover:border-[#f47b5b] hover:bg-[#fff0e8] transition-all"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                            u.status === "ACTIVE"
                              ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                              : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={u.status === "ACTIVE" ? "Deactivate User" : "Activate User"}
                        >
                          {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#eadbd2] flex items-center justify-between text-xs text-[#77716e]">
            <span>
              Showing {users.length} of {total} users
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-[#eadbd2] hover:bg-[#fff7f2] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-semibold text-[#252525]">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-[#eadbd2] hover:bg-[#fff7f2] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-[#eadbd2] shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-[#252525] mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#f47b5b]" />
              Create New User Account
            </h3>
            <p className="text-xs text-[#77716e] mb-4">
              Provision an authenticated account with appropriate role permissions.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Aditi Sharma"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="aditi@oppidan.in"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Assigned Role *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Link with Employee Profile (Optional)
                </label>
                <select
                  value={createForm.employeeId || ""}
                  onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
                >
                  <option value="">No Employee Link (Admin Account)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eadbd2]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#eadbd2] text-xs font-semibold text-[#77716e] hover:bg-[#fff7f2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f47b5b] text-white text-xs font-semibold hover:bg-[#d95d3d] disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-[#eadbd2] shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-[#252525] mb-1 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-[#f47b5b]" />
              Edit User Account
            </h3>
            <p className="text-xs text-[#77716e] mb-4">Update credentials and permission tier for {editingUser.name}.</p>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Reset Password (Leave blank to keep existing)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="New password (optional)"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">Role *</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">Account Status *</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as UserStatus })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#eadbd2] text-xs text-[#252525] bg-[#fffcfb] focus:outline-none focus:border-[#f47b5b]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eadbd2]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#eadbd2] text-xs font-semibold text-[#77716e] hover:bg-[#fff7f2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f47b5b] text-white text-xs font-semibold hover:bg-[#d95d3d] disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Matrix Modal */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-[#eadbd2] shadow-xl w-full max-w-2xl p-6 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#eadbd2]">
              <div>
                <h3 className="text-base font-bold text-[#252525] flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#f47b5b]" />
                  Oppidan ERMS RBAC Permission Matrix
                </h3>
                <p className="text-xs text-[#77716e]">
                  Authorized capabilities per role tier across the multi-tenant architecture.
                </p>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-[#77716e] hover:bg-[#fff0e8]"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {ROLES.map((role) => (
                <div key={role} className="border border-[#eadbd2] rounded-xl p-3.5 bg-[#fffcfb]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadge(role)}`}>
                      {role}
                    </span>
                    <span className="text-xs font-bold text-[#252525]">Authorized Scope</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#77716e]">
                    {(matrixData?.[role] || []).map((perm, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="font-mono text-[#252525]">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
