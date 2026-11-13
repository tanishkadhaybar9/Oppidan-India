import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Printer,
  Package,
  Loader2,
  Search,
  Filter,
  Tag,
} from "lucide-react";
import { PageContainer, PageHeader } from "../components/common";
import { getAssetReport } from "../services/reportsService";
import { listDepartments } from "../services/employeeService";
import type { AssetReportData } from "../types/reports";
import type { Department } from "../types/employee";

function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function AssetReportPage() {
  const [data, setData] = useState<AssetReportData | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [departmentId, setDepartmentId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, deptRes] = await Promise.all([
        getAssetReport({
          departmentId: departmentId || undefined,
          status: status || undefined,
        }),
        listDepartments().catch(() => ({ data: { departments: [] } })),
      ]);

      if (res.data) {
        setData(res.data);
      }
      if (deptRes.data?.departments) {
        setDepartments(deptRes.data.departments);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to load asset report.");
    } finally {
      setLoading(false);
    }
  }, [departmentId, status]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const filteredRecords = (data?.records || []).filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.assetCode.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      (r.serialNumber || "").toLowerCase().includes(q) ||
      (r.assignedTo || "").toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (!data || !filteredRecords.length) return;
    const headers = [
      "Asset Code",
      "Asset Name",
      "Category",
      "Serial Number",
      "Cost (INR)",
      "Purchase Date",
      "Status",
      "Assigned To",
      "Department",
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.assetCode}"`,
      `"${r.name}"`,
      `"${r.category}"`,
      `"${r.serialNumber || ""}"`,
      `"${r.purchaseCost}"`,
      `"${r.purchaseDate ? new Date(r.purchaseDate).toLocaleDateString() : ""}"`,
      `"${r.status}"`,
      `"${r.assignedTo || "—"}"`,
      `"${r.department || "—"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `asset-inventory-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageContainer>
      <PageHeader
        title="Asset Inventory & Valuation Audit Report"
        subtitle="Hardware allocations, asset lifecycle tracking, maintenance audits, and depreciation metrics"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#eadbd2] hover:bg-[#f8f4f1] text-[#77716e] text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!filteredRecords.length}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#f47b5b] hover:bg-[#e06847] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Total Assets
            </span>
            <div className="text-2xl font-bold text-[#252525]">{data.summary.total}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              In Use / Assigned
            </span>
            <div className="text-2xl font-bold text-blue-600">{data.summary.assigned}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Available in Stock
            </span>
            <div className="text-2xl font-bold text-emerald-700">{data.summary.available}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              In Maintenance
            </span>
            <div className="text-2xl font-bold text-amber-600">{data.summary.maintenance}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Retired / Disposed
            </span>
            <div className="text-2xl font-bold text-gray-500">{data.summary.retired}</div>
          </div>
          <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-[#77716e] uppercase tracking-wider block mb-1">
              Total Book Value
            </span>
            <div className="text-xl font-bold text-purple-700 truncate">
              {formatINR(data.summary.totalValue)}
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown Bar Chart */}
      {data?.summary && data.summary.byCategory.length > 0 && (
        <div className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs mb-6">
          <h4 className="text-xs font-bold text-[#252525] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#f47b5b]" />
            <span>Category Distribution</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.summary.byCategory.map((cat) => {
              const pct =
                data.summary.total > 0 ? (cat.count / data.summary.total) * 100 : 0;
              return (
                <div key={cat.category} className="bg-[#f8f4f1] p-3.5 rounded-xl border border-[#eadbd2]">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold text-[#252525] truncate">{cat.category}</span>
                    <span className="text-[#77716e] font-semibold">
                      {cat.count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl p-4 mb-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, name, serial, assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-[#77716e] absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b] appearance-none"
            >
              <option value="">All Asset Statuses</option>
              <option value="AVAILABLE">AVAILABLE (In Stock)</option>
              <option value="ASSIGNED">ASSIGNED (In Use)</option>
              <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
              <option value="RETIRED">RETIRED</option>
              <option value="DISPOSED">DISPOSED</option>
            </select>
          </div>

          <div>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8f4f1] border border-[#eadbd2] rounded-xl text-sm focus:outline-none focus:border-[#f47b5b]"
            >
              <option value="">All Assignee Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white border border-[#eadbd2] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-[#77716e]">
            <Loader2 className="w-8 h-8 animate-spin text-[#f47b5b] mb-2" />
            <span className="text-sm">Retrieving asset registry...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-[#77716e]">
            <Package className="w-12 h-12 text-[#eadbd2] mb-3" />
            <h3 className="text-base font-semibold text-[#252525] mb-1">No Assets Found</h3>
            <p className="text-sm text-[#77716e] max-w-sm text-center">
              No equipment matching the filter specifications was found in the inventory.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f4f1] border-b border-[#eadbd2] text-[11px] font-semibold text-[#77716e] uppercase tracking-wider">
                  <th className="py-3 px-4">Asset Code</th>
                  <th className="py-3 px-4">Equipment Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4 text-right">Purchase Cost</th>
                  <th className="py-3 px-4">Assigned Custodian</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadbd2] text-sm">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#fff9f6] transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-purple-700">
                      {r.assetCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#252525]">{r.name}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-[#77716e]">
                      {r.serialNumber || "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[#252525]">
                      {formatINR(r.purchaseCost)}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {r.assignedTo ? (
                        <div>
                          <div className="font-medium text-[#252525]">{r.assignedTo}</div>
                          <div className="text-[#77716e] text-[11px]">{r.department || "—"}</div>
                        </div>
                      ) : (
                        <span className="text-[#77716e] italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          r.status === "AVAILABLE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : r.status === "ASSIGNED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : r.status === "UNDER_MAINTENANCE"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

