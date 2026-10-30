import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  Filter,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Package,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listAssets } from "../services/assetService";
import type { Asset, AssetCategory, AssetCondition, AssetStatus } from "../types/asset";
import { PageContainer, PageHeader, ErrorState } from "../components/common";

const CATEGORY_ICONS: Record<string, string> = {
  LAPTOP: "💻", DESKTOP: "🖥️", MOBILE: "📱", TABLET: "📟",
  PERIPHERAL: "⌨️", FURNITURE: "🪑", NETWORKING: "🌐", VEHICLE: "🚗", OTHER: "📦",
};

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
    UNDER_MAINTENANCE: "Maintenance", RETIRED: "Retired", DISPOSED: "Disposed",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function ConditionDot({ condition }: { condition: AssetCondition }) {
  const colors: Record<string, string> = {
    NEW: "bg-emerald-500", EXCELLENT: "bg-green-400", GOOD: "bg-blue-400",
    FAIR: "bg-yellow-400", POOR: "bg-orange-400", DAMAGED: "bg-red-500",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[condition] ?? "bg-gray-300"}`} title={condition} />;
}

const CATEGORIES: Array<{ value: AssetCategory; label: string }> = [
  { value: "LAPTOP", label: "Laptop" },
  { value: "DESKTOP", label: "Desktop" },
  { value: "MOBILE", label: "Mobile" },
  { value: "TABLET", label: "Tablet" },
  { value: "PERIPHERAL", label: "Peripheral" },
  { value: "FURNITURE", label: "Furniture" },
  { value: "NETWORKING", label: "Networking" },
  { value: "VEHICLE", label: "Vehicle" },
  { value: "OTHER", label: "Other" },
];

const STATUSES: Array<{ value: AssetStatus; label: string }> = [
  { value: "AVAILABLE", label: "Available" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "UNDER_MAINTENANCE", label: "Under Maintenance" },
  { value: "RETIRED", label: "Retired" },
  { value: "DISPOSED", label: "Disposed" },
];

export function AssetListPage() {
  const { user } = useAuth();
  const role = user?.role ?? "EMPLOYEE";
  const canCreate = ["OWNER", "HR"].includes(role);
  const canViewAll = ["OWNER", "HR", "MANAGER", "SUPERVISOR"].includes(role);

  const [searchParams] = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [filterCategory, setFilterCategory] = useState<AssetCategory | "">(
    (searchParams.get("category") as AssetCategory) ?? ""
  );
  const [filterStatus, setFilterStatus] = useState<AssetStatus | "">(
    (searchParams.get("status") as AssetStatus) ?? ""
  );
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "1"));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAssets({
        search: search || undefined,
        category: filterCategory || undefined,
        status: filterStatus || undefined,
        page,
        limit: 15,
      });
      if (res.data) {
        setAssets(res.data.assets);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterStatus, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setFilterCategory("");
    setFilterStatus("");
    setPage(1);
  };

  const hasFilters = search || filterCategory || filterStatus;

  if (error && assets.length === 0) {
    return (
      <PageContainer>
        <ErrorState message={error} onRetry={load} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Asset Directory"
        subtitle={canViewAll ? "All company assets and equipment" : "Your allocated assets"}
        icon={<Package className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Assets", to: "/assets" },
          { label: "Inventory" },
        ]}
        actions={
          canCreate ? (
            <Link
              to="/assets/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Asset
            </Link>
          ) : undefined
        }
      />

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-[#eadbd2] p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="text-xs font-medium text-[#77716e] mb-1 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77716e]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Code, name, serial, employee..."
                className="w-full pl-9 pr-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b]"
              />
            </div>
          </div>
          {canViewAll && (
            <>
              <div className="min-w-36">
                <label className="text-xs font-medium text-[#77716e] mb-1 block">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value as AssetCategory | ""); setPage(1); }}
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] bg-white"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="min-w-36">
                <label className="text-xs font-medium text-[#77716e] mb-1 block">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value as AssetStatus | ""); setPage(1); }}
                  className="w-full px-3 py-2 border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] bg-white"
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </>
          )}
          <button type="submit" className="flex items-center gap-2 bg-[#f47b5b] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#e06b4b] transition-colors">
            <Filter className="w-4 h-4" /> Apply
          </button>
          {hasFilters && (
            <button type="button" onClick={handleClearFilters} className="text-sm text-[#77716e] hover:text-[#f47b5b] transition-colors py-2 px-2">
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Assets Table */}
      <div className="bg-white rounded-2xl border border-[#eadbd2] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-7 h-7 animate-spin text-[#f47b5b]" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#77716e]">
            <Package className="w-10 h-10 mb-3 opacity-40" />
            <div className="font-medium text-sm">No assets found</div>
            <div className="text-xs mt-1">
              {hasFilters ? "Try adjusting your filters" : canCreate ? "Add the first asset to get started" : "No assets have been assigned to you"}
            </div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[2fr,1fr,1fr,1.5fr,1fr,auto] gap-4 px-5 py-3 border-b border-[#eadbd2] text-xs font-semibold text-[#77716e] uppercase tracking-wide">
              <div>Asset</div>
              <div>Category</div>
              <div>Condition</div>
              <div>Assigned To</div>
              <div>Status</div>
              <div />
            </div>
            {/* Rows */}
            <ul className="divide-y divide-[#eadbd2]">
              {assets.map((asset) => (
                <li key={asset.id} className="hover:bg-[#fff7f2] transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,1.5fr,1fr,auto] gap-4 items-center px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#fff0e8] flex items-center justify-center text-base flex-shrink-0">
                        {CATEGORY_ICONS[asset.category] ?? "📦"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#252525] truncate">{asset.name}</div>
                        <div className="text-xs text-[#77716e]">{asset.assetCode}</div>
                      </div>
                    </div>
                    <div className="text-sm text-[#77716e]">{asset.category}</div>
                    <div className="flex items-center gap-1.5">
                      <ConditionDot condition={asset.condition} />
                      <span className="text-sm text-[#77716e]">{asset.condition}</span>
                    </div>
                    <div className="min-w-0">
                      {asset.assignedEmployee ? (
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <span className="text-sm text-[#252525] truncate">{asset.assignedEmployee.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#77716e]">—</span>
                      )}
                    </div>
                    <div><StatusBadge status={asset.status} /></div>
                    <div>
                      <Link
                        to={`/assets/${asset.id}`}
                        className="text-xs font-semibold text-[#f47b5b] hover:underline whitespace-nowrap"
                      >
                        View →
                      </Link>
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
            Showing {(page - 1) * pagination.limit + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total} assets
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-[#eadbd2] hover:bg-[#fff0e8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#77716e]" />
            </button>
            <span className="flex items-center gap-1 text-sm text-[#252525] font-medium px-3">
              {page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="p-2 rounded-xl border border-[#eadbd2] hover:bg-[#fff0e8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#77716e]" />
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
