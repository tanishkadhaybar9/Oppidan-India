import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save,
  User,
  Mail,
  Hash,
  Building2,
  Briefcase,
  Users,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  createEmployee,
  getEmployee,
  updateEmployee,
  listDepartments,
  listDesignations,
  listEmployees,
} from "../services/employeeService";
import type { CreateEmployeePayload, UpdateEmployeePayload, Department, Designation, EmployeeSummary } from "../types/employee";

import { PageContainer, PageHeader } from "../components/common";

type FormMode = "create" | "edit";

interface FormState {
  name: string;
  email: string;
  employeeCode: string;
  departmentId: string;
  designationId: string;
  supervisorId: string;
  joiningDate: string;
}

const INITIAL: FormState = {
  name: "",
  email: "",
  employeeCode: "",
  departmentId: "",
  designationId: "",
  supervisorId: "",
  joiningDate: new Date().toISOString().slice(0, 10),
};

export const EmployeeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const mode: FormMode = id ? "edit" : "create";

  const [form, setForm] = useState<FormState>(INITIAL);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [supervisors, setSupervisors] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Load supporting data
  useEffect(() => {
    const loadSupport = async () => {
      try {
        const [deptRes, desgRes, empRes] = await Promise.all([
          listDepartments(),
          listDesignations(),
          listEmployees({ status: "ACTIVE", limit: 100 }),
        ]);
        if (deptRes.data) setDepartments(deptRes.data.departments);
        if (desgRes.data) setDesignations(desgRes.data.designations);
        if (empRes.data) setSupervisors(empRes.data.employees);
      } catch {
        // non-fatal — selects will just be empty
      }
    };
    void loadSupport();
  }, []);

  // Load existing employee for edit mode
  useEffect(() => {
    if (mode !== "edit" || !id) return;
    const loadEmployee = async () => {
      setLoading(true);
      try {
        const res = await getEmployee(id);
        if (res.data?.employee) {
          const e = res.data.employee;
          setForm({
            name: e.name,
            email: e.email,
            employeeCode: e.employeeCode,
            departmentId: e.department?.id ?? "",
            designationId: e.designation?.id ?? "",
            supervisorId: e.supervisor?.id ?? "",
            joiningDate: e.joiningDate.slice(0, 10),
          });
        }
      } catch (err: unknown) {
        const e = err as { message?: string };
        setServerError(e.message ?? "Failed to load employee.");
      } finally {
        setLoading(false);
      }
    };
    void loadEmployee();
  }, [id, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.email.trim()) newErrors.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Enter a valid email.";
    if (mode === "create" && !form.employeeCode.trim()) newErrors.employeeCode = "Employee code is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError(null);

    try {
      if (mode === "create") {
        const payload: CreateEmployeePayload = {
          name: form.name,
          email: form.email,
          employeeCode: form.employeeCode,
          ...(form.departmentId && { departmentId: form.departmentId }),
          ...(form.designationId && { designationId: form.designationId }),
          ...(form.supervisorId && { supervisorId: form.supervisorId }),
          joiningDate: new Date(form.joiningDate).toISOString(),
        };
        const res = await createEmployee(payload);
        navigate(`/employees/${res.data!.employee.id}`);
      } else {
        const payload: UpdateEmployeePayload = {
          name: form.name,
          email: form.email,
          departmentId: form.departmentId || null,
          designationId: form.designationId || null,
          supervisorId: form.supervisorId || null,
        };
        await updateEmployee(id!, payload);
        navigate(`/employees/${id}`);
      }
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: Record<string, string[]> };
      if (e.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(e.errors)) {
          fieldErrors[key] = msgs[0];
        }
        setErrors(fieldErrors);
      } else {
        setServerError(e.message ?? "Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7f2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#f47b5b]/30 border-t-[#f47b5b] rounded-full animate-spin" />
          <p className="text-sm text-[#77716e]">Loading employee data…</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer maxWidth="max-w-4xl">
      <PageHeader
        title={mode === "create" ? "Add New Employee" : "Edit Employee Details"}
        subtitle={
          mode === "create"
            ? "Fill in the details below to add a new employee to your organization."
            : "Update organizational assignment, job title, and reporting lines."
        }
        icon={<User className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Employees", to: "/employees" },
          { label: mode === "create" ? "Add New Employee" : "Edit Employee" },
        ]}
      />

      <div className="bg-white border border-[#eadbd2] rounded-2xl shadow-xs overflow-hidden">


          <form id="employee-form" onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-6">
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
                {serverError}
              </div>
            )}

            {/* Basic Info */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold text-[#77716e] uppercase tracking-wider mb-3">
                Basic Information
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label htmlFor="emp-name" className="block text-xs font-medium text-[#77716e] mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77716e]" />
                    <input
                      id="emp-name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                      placeholder="e.g. Priya Sharma"
                      className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] ${errors.name ? "border-red-400" : "border-[#eadbd2]"}`}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="emp-email" className="block text-xs font-medium text-[#77716e] mb-1.5">
                    Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77716e]" />
                    <input
                      id="emp-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      placeholder="priya@company.com"
                      className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] ${errors.email ? "border-red-400" : "border-[#eadbd2]"}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                {/* Employee Code */}
                <div>
                  <label htmlFor="emp-code" className="block text-xs font-medium text-[#77716e] mb-1.5">
                    Employee Code {mode === "create" ? "*" : ""}
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77716e]" />
                    <input
                      id="emp-code"
                      name="employeeCode"
                      type="text"
                      value={form.employeeCode}
                      onChange={handleChange}
                      disabled={mode === "edit"}
                      placeholder="e.g. EMP001"
                      className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] disabled:bg-[#f9f5f3] disabled:cursor-not-allowed ${errors.employeeCode ? "border-red-400" : "border-[#eadbd2]"}`}
                    />
                  </div>
                  {errors.employeeCode && <p className="text-xs text-red-500 mt-1">{errors.employeeCode}</p>}
                </div>

                {/* Joining Date */}
                <div>
                  <label htmlFor="emp-joining" className="block text-xs font-medium text-[#77716e] mb-1.5">
                    Joining Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77716e]" />
                    <input
                      id="emp-joining"
                      name="joiningDate"
                      type="date"
                      value={form.joiningDate}
                      onChange={handleChange}
                      disabled={mode === "edit"}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] disabled:bg-[#f9f5f3] disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Organizational Info */}
            <fieldset className="space-y-4 pt-4 border-t border-[#eadbd2]">
              <legend className="text-xs font-semibold text-[#77716e] uppercase tracking-wider mb-3">
                Organizational Details
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Department */}
                <div>
                  <label htmlFor="emp-dept" className="block text-xs font-medium text-[#77716e] mb-1.5">
                    Department
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77716e] pointer-events-none" />
                    <select
                      id="emp-dept"
                      name="departmentId"
                      value={form.departmentId}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] bg-white appearance-none"
                    >
                      <option value="">None</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label htmlFor="emp-designation" className="block text-xs font-medium text-[#77716e] mb-1.5">
                    Designation
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77716e] pointer-events-none" />
                    <select
                      id="emp-designation"
                      name="designationId"
                      value={form.designationId}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] bg-white appearance-none"
                    >
                      <option value="">None</option>
                      {designations.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Supervisor */}
                <div>
                  <label htmlFor="emp-supervisor" className="block text-xs font-medium text-[#77716e] mb-1.5">
                    Supervisor
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77716e] pointer-events-none" />
                    <select
                      id="emp-supervisor"
                      name="supervisorId"
                      value={form.supervisorId}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#eadbd2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] bg-white appearance-none"
                    >
                      <option value="">None</option>
                      {supervisors
                        .filter((s) => s.id !== id)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.employeeCode})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eadbd2]">
              <button
                type="button"
                onClick={() => navigate(mode === "edit" && id ? `/employees/${id}` : "/employees")}
                className="px-5 py-2.5 text-sm font-medium text-[#77716e] border border-[#eadbd2] rounded-xl hover:bg-[#fff0e8] hover:text-[#f47b5b] hover:border-[#f47b5b]/50 transition-all"
              >
                Cancel
              </button>
              <button
                id="employee-form-submit"
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving…" : mode === "create" ? "Create Employee" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
    </PageContainer>
  );
};

