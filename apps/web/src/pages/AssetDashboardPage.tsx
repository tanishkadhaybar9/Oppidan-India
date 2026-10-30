import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Monitor,
  Package,
  UserCheck,
  Wrench,
  Archive,
  AlertCircle,
  Plus,
  ArrowRight,
  Loader2,
  TrendingUp,
  Activity,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getAssetSummary, listAssets, listMaintenance } from "../services/assetService";
import type { Asset, AssetMaintenance, AssetSummaryStats } from "../types/asset";
import { PageContainer, PageHeader } from "../components/common";

const CATEGORY_ICONS: Record<string, string> = {
  LAPTOP: "💻",
  DESKTOP: "🖥️",
  MOBILE: "📱",
  TABLET: "📟",
  PERIPHERAL: "⌨️",
  FURNITURE: "🪑",
  NETWORKING: "🌐",
  VEHICLE: "🚗",
  OTHER: "📦",
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ASSIGNED: "bg-blue-50 text-blue-700 border-blue-200",
    UNDER_MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-200",
    RETIRED: "bg-gray-100 text-gray-500 border-gray-200",
    DISPOSED: "bg-red-50 text-red-600 border-red-200",
  };
  const labels: Record<string, string> = {
    AVAILABLE: "Available",
    ASSIGNED: "Assigned",
    UNDER_MAINTENANCE: "Maintenance",
    RETIRED: "Retired",
    DISPOSED: "Disposed",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  link,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  link?: string;
}) {
  const card = (
    <div className={`bg-white rounded-2xl border border-[#eadbd2] p-5 flex items-center gap-4 hover:shadow-md transition-shadow ${link ? "cursor-pointer" : ""}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-[#252525]">{value.toLocaleString()}</div>
        <div className="text-sm text-[#77716e] mt-0.5">{label}</div>
      </div>
    </div>
  );
  return link ? <Link to={link}>{card}</Link> : card;
}

export function AssetDashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? "EMPLOYEE";
  const isManager = ["OWNER", "HR", "MANAGER", "SUPERVISOR"].includes(role);

  const [stats, setStats] = useState<AssetSummaryStats>({
    total: 0,
    available: 0,
    assigned: 0,
    underMaintenance: 0,
    retired: 0,
    disposed: 0,
  });
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [openTickets, setOpenTickets] = useState<AssetMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const promises: Promise<any>[] = [getAssetSummary()];
      if (isManager) {
        promises.push(
          listAssets({ limit: 5 }),
          listMaintenance({ status: "OPEN", limit: 5 })
        );
      }
      const results = await Promise.allSettled(promises);

      if (results[0]?.status === "fulfilled") {
        const d = (results[0] as PromiseFulfilledResult<any>).value?.data;
        if (d) setStats(d);
      }
      if (isManager && results[1]?.status === "fulfilled") {
        const d = (results[1] as PromiseFulfilledResult<any>).value?.data;
        if (d?.assets) setRecentAssets(d.assets);
      }
      if (isManager && results[2]?.status === "fulfilled") {
        const d = (results[2] as PromiseFulfilledResult<any>).value?.data;
        if (d?.tickets) setOpenTickets(d.tickets);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load asset dashboard");
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b]" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Asset Management"
        subtitle="Track and manage company assets and equipment"
        icon={<Package className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Assets" },
        ]}
        actions={
          ["OWNER", "HR"].includes(role) ? (
            <Link
              to="/assets/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Asset
            </Link>
          ) : undefined
        }
      />

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Assets"
          value={stats.total}
          icon={<Package className="w-6 h-6 text-[#f47b5b]" />}
          color="bg-[#fff0e8]"
          link="/assets/inventory"
        />
        <StatCard
          label="Available"
          value={stats.available}
          icon={<Activity className="w-6 h-6 text-emerald-600" />}
          color="bg-emerald-50"
          link="/assets/inventory?status=AVAILABLE"
        />
        <StatCard
          label="Assigned"
          value={stats.assigned}
          icon={<UserCheck className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          link="/assets/inventory?status=ASSIGNED"
        />
        <StatCard
          label="Maintenance"
          value={stats.underMaintenance}
          icon={<Wrench className="w-6 h-6 text-amber-600" />}
          color="bg-amber-50"
          link="/assets/maintenance"
        />
        <StatCard
          label="Retired"
          value={stats.retired}
          icon={<Archive className="w-6 h-6 text-gray-500" />}
          color="bg-gray-100"
          link="/assets/inventory?status=RETIRED"
        />
        <StatCard
          label="Disposed"
          value={stats.disposed}
          icon={<TrendingUp className="w-6 h-6 text-red-500" />}
          color="bg-red-50"
        />
      </div>

      {isManager ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Assets */}
          <div className="bg-white rounded-2xl border border-[#eadbd2] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#eadbd2]">
              <div className="font-semibold text-[#252525] text-sm">Recent Assets</div>
              <Link to="/assets/inventory" className="text-[#f47b5b] text-xs font-medium flex items-center gap-1 hover:underline">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {recentAssets.length === 0 ? (
              <div className="px-5 py-10 text-center text-[#77716e] text-sm">No assets found</div>
            ) : (
              <ul className="divide-y divide-[#eadbd2]">
                {recentAssets.map((asset) => (
                  <li key={asset.id}>
                    <Link
                      to={`/assets/${asset.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#fff7f2] transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#fff0e8] flex items-center justify-center text-lg flex-shrink-0">
                        {CATEGORY_ICONS[asset.category] ?? "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#252525] truncate">{asset.name}</div>
                        <div className="text-xs text-[#77716e] truncate">{asset.assetCode}</div>
                      </div>
                      <StatusBadge status={asset.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Open Maintenance Tickets */}
          <div className="bg-white rounded-2xl border border-[#eadbd2] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#eadbd2]">
              <div className="font-semibold text-[#252525] text-sm">Open Maintenance Tickets</div>
              <Link to="/assets/maintenance" className="text-[#f47b5b] text-xs font-medium flex items-center gap-1 hover:underline">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {openTickets.length === 0 ? (
              <div className="px-5 py-10 text-center text-[#77716e] text-sm">No open maintenance tickets</div>
            ) : (
              <ul className="divide-y divide-[#eadbd2]">
                {openTickets.map((ticket) => (
                  <li key={ticket.id}>
                    <Link
                      to={`/assets/maintenance`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#fff7f2] transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#252525] truncate">{ticket.ticketNumber}</div>
                        <div className="text-xs text-[#77716e] truncate">{ticket.asset?.name}</div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        ticket.priority === "CRITICAL" ? "bg-red-50 text-red-700 border-red-200" :
                        ticket.priority === "HIGH" ? "bg-orange-50 text-orange-700 border-orange-200" :
                        ticket.priority === "MEDIUM" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-gray-100 text-gray-600 border-gray-200"
                      }`}>
                        {ticket.priority}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        /* Employee view — quick links */
        <div className="bg-white rounded-2xl border border-[#eadbd2] p-6">
          <h2 className="font-semibold text-[#252525] mb-4">My Assets</h2>
          <p className="text-sm text-[#77716e] mb-5">View the equipment and assets assigned to you.</p>
          <Link
            to="/assets/my"
            className="inline-flex items-center gap-2 bg-[#f47b5b] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#e06b4b] transition-colors"
          >
            View My Assets
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      {["OWNER", "HR"].includes(role) && (
        <div className="bg-white rounded-2xl border border-[#eadbd2] p-5">
          <h2 className="font-semibold text-[#252525] text-sm mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/assets/new"
              className="flex items-center gap-2 bg-[#fff0e8] text-[#f47b5b] border border-[#f47b5b]/20 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#ffe4d4] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Asset
            </Link>
            <Link
              to="/assets/inventory"
              className="flex items-center gap-2 bg-[#fff0e8] text-[#f47b5b] border border-[#f47b5b]/20 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#ffe4d4] transition-colors"
            >
              <Monitor className="w-4 h-4" /> Asset Directory
            </Link>
            <Link
              to="/assets/maintenance"
              className="flex items-center gap-2 bg-[#fff0e8] text-[#f47b5b] border border-[#f47b5b]/20 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#ffe4d4] transition-colors"
            >
              <Wrench className="w-4 h-4" /> Maintenance
            </Link>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
