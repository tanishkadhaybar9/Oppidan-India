import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { getMyAssets } from "../services/assetService";
import type { Asset, AssetAssignment } from "../types/asset";
import { PageContainer, PageHeader } from "../components/common";

const CATEGORY_ICONS: Record<string, string> = {
  LAPTOP: "💻", DESKTOP: "🖥️", MOBILE: "📱", TABLET: "📟",
  PERIPHERAL: "⌨️", FURNITURE: "🪑", NETWORKING: "🌐", VEHICLE: "🚗", OTHER: "📦",
};

export const MyAssetsPage: React.FC = () => {
  const [currentAssets, setCurrentAssets] = useState<Asset[]>([]);
  const [history, setHistory] = useState<AssetAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyAssets();
      if (res.data) {
        setCurrentAssets(res.data.currentAssets || []);
        setHistory(res.data.history || []);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load assigned assets.");
    } finally {
      setLoading(false);
    }
  }, []);

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
        title="My Assigned Assets"
        subtitle="Equipment, laptops, and resources currently in your possession"
        icon={<Package className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Assets", to: "/assets" },
          { label: "My Assets" },
        ]}
      />

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Currently Assigned Equipment Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#252525] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#f47b5b]" />
            Active Equipment ({currentAssets.length})
          </h2>
        </div>

        {currentAssets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#eadbd2] p-8 text-center text-[#77716e]">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <div className="font-semibold text-sm text-[#252525]">No equipment currently assigned</div>
            <p className="text-xs mt-1">
              Any laptop or device allocated to you by IT/HR will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white rounded-2xl border border-[#eadbd2] p-5 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#fff0e8] flex items-center justify-center text-xl flex-shrink-0">
                      {CATEGORY_ICONS[asset.category] ?? "📦"}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#252525]">{asset.name}</h3>
                      <p className="text-xs font-mono text-[#77716e]">{asset.assetCode}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    Assigned
                  </span>
                </div>

                <div className="space-y-2 text-xs pt-2 border-t border-[#eadbd2]/60">
                  <div className="flex justify-between">
                    <span className="text-[#77716e]">Category</span>
                    <span className="font-semibold text-[#252525]">{asset.category}</span>
                  </div>
                  {asset.brand && (
                    <div className="flex justify-between">
                      <span className="text-[#77716e]">Brand / Model</span>
                      <span className="font-semibold text-[#252525]">
                        {asset.brand} {asset.model ? `• ${asset.model}` : ""}
                      </span>
                    </div>
                  )}
                  {asset.serialNumber && (
                    <div className="flex justify-between">
                      <span className="text-[#77716e]">Serial Number</span>
                      <span className="font-mono font-medium text-[#252525]">{asset.serialNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#77716e]">Condition</span>
                    <span className="font-semibold text-[#252525]">{asset.condition}</span>
                  </div>
                </div>

                {asset.description && (
                  <p className="text-xs text-[#77716e] bg-[#fff7f2] p-2.5 rounded-xl">
                    {asset.description}
                  </p>
                )}

                <div className="pt-2 border-t border-[#eadbd2] flex items-center justify-between">
                  <Link
                    to={`/assets/${asset.id}`}
                    className="text-xs font-semibold text-[#f47b5b] hover:underline flex items-center gap-1"
                  >
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-[11px] text-[#77716e]">
                    In your possession
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Allocation History */}
      <div className="bg-white rounded-2xl border border-[#eadbd2] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#eadbd2]">
          <h2 className="font-bold text-[#252525] text-base">Past Custody & History</h2>
          <p className="text-xs text-[#77716e] mt-0.5">
            Previous assets returned or transferred throughout your employment
          </p>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-[#77716e] text-xs">
            No past asset history recorded.
          </div>
        ) : (
          <ul className="divide-y divide-[#eadbd2]">
            {history.map((item) => (
              <li key={item.id} className="p-5 hover:bg-[#fff7f2] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                      <Clock className="w-4 h-4 text-[#77716e]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#252525]">
                        Status: {item.status}
                      </div>
                      <div className="text-xs text-[#77716e]">
                        Assigned on {new Date(item.assignedDate).toLocaleDateString()}
                        {item.returnDate && ` • Returned on ${new Date(item.returnDate).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      item.status === "ACTIVE"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : item.status === "TRANSFERRED"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {(item.notes || item.returnNotes) && (
                  <div className="mt-3 text-xs bg-gray-50 rounded-xl p-3 text-[#555] space-y-1">
                    {item.notes && <div><strong>Assignment Note:</strong> {item.notes}</div>}
                    {item.returnNotes && <div><strong>Return Note:</strong> {item.returnNotes}</div>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
};
