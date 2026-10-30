import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Save,
  Package,
  Tag,
  Building,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { createAsset, getAsset, updateAsset } from "../services/assetService";
import { PageContainer, PageHeader } from "../components/common";
import type {
  AssetCategory,
  AssetCondition,
  AssetStatus,
  CreateAssetPayload,
} from "../types/asset";

const CATEGORIES: Array<{ value: AssetCategory; label: string }> = [
  { value: "LAPTOP", label: "Laptop" },
  { value: "DESKTOP", label: "Desktop" },
  { value: "MOBILE", label: "Mobile" },
  { value: "TABLET", label: "Tablet" },
  { value: "PERIPHERAL", label: "Peripheral" },
  { value: "FURNITURE", label: "Furniture" },
  { value: "NETWORKING", label: "Networking Equipment" },
  { value: "VEHICLE", label: "Vehicle" },
  { value: "OTHER", label: "Other" },
];

const CONDITIONS: Array<{ value: AssetCondition; label: string }> = [
  { value: "NEW", label: "New" },
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
  { value: "DAMAGED", label: "Damaged" },
];

const STATUSES: Array<{ value: AssetStatus; label: string }> = [
  { value: "AVAILABLE", label: "Available" },
  { value: "UNDER_MAINTENANCE", label: "Under Maintenance" },
  { value: "RETIRED", label: "Retired" },
  { value: "DISPOSED", label: "Disposed" },
];

interface FormState {
  assetCode: string;
  name: string;
  description: string;
  category: AssetCategory;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: string;
  warrantyExpiry: string;
  warrantyDetails: string;
  vendor: string;
  condition: AssetCondition;
  status: AssetStatus;
}

const INITIAL: FormState = {
  assetCode: "",
  name: "",
  description: "",
  category: "LAPTOP",
  brand: "",
  model: "",
  serialNumber: "",
  purchaseDate: "",
  purchaseCost: "",
  warrantyExpiry: "",
  warrantyDetails: "",
  vendor: "",
  condition: "NEW",
  status: "AVAILABLE",
};

export const AssetFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getAsset(id);
        if (res.data?.asset) {
          const a = res.data.asset;
          setForm({
            assetCode: a.assetCode,
            name: a.name,
            description: a.description || "",
            category: a.category,
            brand: a.brand || "",
            model: a.model || "",
            serialNumber: a.serialNumber || "",
            purchaseDate: a.purchaseDate ? a.purchaseDate.slice(0, 10) : "",
            purchaseCost: a.purchaseCost ? String(a.purchaseCost) : "",
            warrantyExpiry: a.warrantyExpiry ? a.warrantyExpiry.slice(0, 10) : "",
            warrantyDetails: a.warrantyDetails || "",
            vendor: a.vendor || "",
            condition: a.condition,
            status: a.status,
          });
        }
      } catch (err: any) {
        setServerError(err?.message || "Failed to load asset details.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.assetCode.trim()) errs.assetCode = "Asset code is required.";
    if (!form.name.trim()) errs.name = "Asset name is required.";
    if (form.purchaseCost && isNaN(Number(form.purchaseCost))) {
      errs.purchaseCost = "Purchase cost must be a valid number.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setServerError(null);

    const payload: CreateAssetPayload = {
      assetCode: form.assetCode.trim(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      brand: form.brand.trim() || undefined,
      model: form.model.trim() || undefined,
      serialNumber: form.serialNumber.trim() || undefined,
      purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : undefined,
      purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : undefined,
      warrantyExpiry: form.warrantyExpiry ? new Date(form.warrantyExpiry).toISOString() : undefined,
      warrantyDetails: form.warrantyDetails.trim() || undefined,
      vendor: form.vendor.trim() || undefined,
      condition: form.condition,
      status: form.status,
    };

    try {
      if (isEdit && id) {
        await updateAsset(id, payload);
        navigate(`/assets/${id}`);
      } else {
        const res = await createAsset(payload);
        const newId = res.data?.id;
        navigate(newId ? `/assets/${newId}` : "/assets/inventory");
      }
    } catch (err: any) {
      setServerError(err?.message || "Failed to save asset. Please check the values.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b]" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="max-w-5xl">
      <PageHeader
        title={isEdit ? "Edit Asset" : "Add New Asset"}
        subtitle={
          isEdit
            ? "Update asset specifications, warranty, and status"
            : "Register a new piece of equipment or asset into inventory"
        }
        icon={<Package className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Assets", to: "/assets" },
          { label: "Inventory", to: "/assets/inventory" },
          { label: isEdit ? "Edit Asset" : "New Asset" },
        ]}
      />

      {serverError && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {serverError}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl border border-[#eadbd2] p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#eadbd2]">
            <Package className="w-5 h-5 text-[#f47b5b]" />
            <h2 className="font-semibold text-[#252525] text-base">Basic Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">
                Asset Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.assetCode}
                onChange={(e) => setForm({ ...form, assetCode: e.target.value })}
                placeholder="e.g. LAP-001 or IT-EQUIP-102"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] ${
                  errors.assetCode ? "border-red-400 bg-red-50" : "border-[#eadbd2]"
                }`}
              />
              {errors.assetCode && (
                <p className="text-xs text-red-500 mt-1">{errors.assetCode}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">
                Asset Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dell Latitude 5420"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] ${
                  errors.name ? "border-red-400 bg-red-50" : "border-[#eadbd2]"
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as AssetCategory })}
                className="w-full px-3.5 py-2.5 border border-[#eadbd2] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">
                Serial Number
              </label>
              <input
                type="text"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                placeholder="e.g. SN-892183921"
                className="w-full px-3.5 py-2.5 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. Dell, Apple, Lenovo, Herman Miller"
                className="w-full px-3.5 py-2.5 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">
                Model Number
              </label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="e.g. Latitude 5420 i7 16GB"
                className="w-full px-3.5 py-2.5 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">
                Description / Specifications
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter technical specifications, accessories included, or notes..."
                className="w-full px-3.5 py-2.5 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b]"
              />
            </div>
          </div>
        </div>

        {/* Condition & Status */}
        <div className="bg-white rounded-2xl border border-[#eadbd2] p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#eadbd2]">
            <Tag className="w-5 h-5 text-[#f47b5b]" />
            <h2 className="font-semibold text-[#252525] text-base">Condition & Status</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">
                Physical Condition
              </label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value as AssetCondition })}
                className="w-full px-3.5 py-2.5 border border-[#eadbd2] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b]"
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">
                Asset Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AssetStatus })}
                className="w-full px-3.5 py-2.5 border border-[#eadbd2] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b]"
              >
                {STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Procurement & Warranty */}
        <div className="bg-white rounded-2xl border border-[#eadbd2] p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#eadbd2]">
            <Building className="w-5 h-5 text-[#f47b5b]" />
            <h2 className="font-semibold text-[#252525] text-base">Procurement & Warranty</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">
                Vendor / Supplier
              </label>
              <input
                type="text"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="e.g. Dell India / Reliance Digital"
                className="w-full px-3.5 py-2.5 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">
                Purchase Cost (₹)
              </label>
              <input
                type="number"
                step="any"
                value={form.purchaseCost}
                onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })}
                placeholder="e.g. 75000"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] ${
                  errors.purchaseCost ? "border-red-400 bg-red-50" : "border-[#eadbd2]"
                }`}
              />
              {errors.purchaseCost && (
                <p className="text-xs text-red-500 mt-1">{errors.purchaseCost}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">
                Purchase Date
              </label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">
                Warranty Expiry Date
              </label>
              <input
                type="date"
                value={form.warrantyExpiry}
                onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-[#77716e] mb-1.5 block">
                Warranty Details
              </label>
              <input
                type="text"
                value={form.warrantyDetails}
                onChange={(e) => setForm({ ...form, warrantyDetails: e.target.value })}
                placeholder="e.g. 3-year on-site comprehensive warranty with accidental protection"
                className="w-full px-3.5 py-2.5 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b]"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to={isEdit && id ? `/assets/${id}` : "/assets/inventory"}
            className="px-5 py-2.5 rounded-xl border border-[#eadbd2] text-sm font-semibold text-[#77716e] hover:bg-[#fff0e8] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#f47b5b] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e06b4b] disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {isEdit ? "Update Asset" : "Save Asset"}
              </>
            )}
          </button>
        </div>
      </form>
    </PageContainer>
  );
};
