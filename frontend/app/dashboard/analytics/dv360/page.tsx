"use client";

import { useAccount } from "@/lib/accountContext";
import { usePathname, useSearchParams } from "next/navigation";
import { ChartContainer, LineChart } from "@/components";
import { fetchDailyMetrics, fetchCampaigns, fetchInsertionOrders } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Play,
  Eye,
  X,
  Filter,
} from "lucide-react";

interface IOData {
  id: string;
  name: string;
  campaignId?: string;
  campaignName?: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  views?: number;
  vtr?: number;
  cpv?: number;
  ctr: number;
  cpc: number;
  cvr: number;
  revenue: number;
  roas: number;
}

type SortField = "name" | "status" | "budget" | "spent" | "impressions" | "clicks" | "ctr" | "cpc" | "conversions" | "cvr" | "revenue" | "roas" | "views" | "vtr" | "cpv";

export default function DV360Analytics() {
  const { selectedAccount } = useAccount();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [insertionOrders, setInsertionOrders] = useState<IOData[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState(["spend", "impressions"]);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("spent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [campaignFilter, setCampaignFilter] = useState<string | null>(null);

  // Parse deep-link query params
  useEffect(() => {
    const campaignParam = searchParams.get("campaign");
    const highlightParam = searchParams.get("highlight");
    const dateFromParam = searchParams.get("date_from");
    const dateToParam = searchParams.get("date_to");
    if (campaignParam) setCampaignFilter(campaignParam);
    if (highlightParam) {
      setSelectedMetrics((prev) =>
        prev.includes(highlightParam) ? prev : [...prev, highlightParam]
      );
    }
    if (dateFromParam) setDateFrom(dateFromParam);
    if (dateToParam) setDateTo(dateToParam);
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      const [metrics, camps, ios] = await Promise.all([
        fetchDailyMetrics({ account_id: selectedAccount?.id, platform: "dv360" }),
        fetchCampaigns({ account_id: selectedAccount?.id, platform: "dv360" }),
        fetchInsertionOrders({ account_id: selectedAccount?.id }),
      ]);
      setDailyMetrics(metrics);
      setCampaigns(camps);
      setInsertionOrders(ios);

      if (metrics.length > 0 && !dateFrom && !dateTo) {
        const dates = metrics.map((m: any) => m.date).sort();
        setDateFrom(dates[0]);
        setDateTo(dates[dates.length - 1]);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount?.id]);

  const dv360Metrics = dailyMetrics.filter((m) => {
    if (m.platform !== "dv360") return false;
    if (!dateFrom || !dateTo) return true;
    return m.date >= dateFrom && m.date <= dateTo;
  });

  // Period comparison
  const periodStats = useMemo(() => {
    if (dv360Metrics.length < 2) return null;
    const midpoint = Math.floor(dv360Metrics.length / 2);
    const prev = dv360Metrics.slice(0, midpoint);
    const curr = dv360Metrics.slice(midpoint);
    const sum = (arr: any[], key: string) => arr.reduce((s, m) => s + (m[key] || 0), 0);

    return {
      spend: { current: sum(curr, "spend"), previous: sum(prev, "spend"), isCurrency: true, isRate: false, label: "Spend" },
      impressions: { current: sum(curr, "impressions"), previous: sum(prev, "impressions"), isCurrency: false, isRate: false, label: "Impressions" },
      clicks: { current: sum(curr, "clicks"), previous: sum(prev, "clicks"), isCurrency: false, isRate: false, label: "Clicks" },
      conversions: { current: sum(curr, "conversions"), previous: sum(prev, "conversions"), isCurrency: false, isRate: false, label: "Conversions" },
      views: { current: sum(curr, "views"), previous: sum(prev, "views"), isCurrency: false, isRate: false, label: "Views" },
      vtr: {
        current: sum(curr, "views") / (sum(curr, "impressions") || 1),
        previous: sum(prev, "views") / (sum(prev, "impressions") || 1),
        isCurrency: false, isRate: true, label: "VTR"
      },
      cpv: {
        current: sum(curr, "spend") / (sum(curr, "views") || 1),
        previous: sum(prev, "spend") / (sum(prev, "views") || 1),
        isCurrency: true, isRate: false, label: "CPV"
      },
      ctr: {
        current: sum(curr, "clicks") / (sum(curr, "impressions") || 1),
        previous: sum(prev, "clicks") / (sum(prev, "impressions") || 1),
        isCurrency: false, isRate: true, label: "CTR"
      },
    } as Record<string, { current: number; previous: number; isCurrency: boolean; isRate: boolean; label: string }>;
  }, [dv360Metrics]);

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const allMetricsOptions = [
    { value: "spend", label: "Spend" },
    { value: "impressions", label: "Impressions" },
    { value: "clicks", label: "Clicks" },
    { value: "conversions", label: "Conversions" },
    { value: "views", label: "Views" },
  ];

  const trendDataKeys = selectedMetrics
    .map((metric) => {
      const colors: Record<string, string> = {
        spend: "#3B82F6", impressions: "#F59E0B", clicks: "#8B5CF6",
        conversions: "#EC4899", views: "#10B981",
      };
      return { key: metric, name: allMetricsOptions.find((o) => o.value === metric)?.label || metric, color: colors[metric] || "#3B82F6" };
    })
    .filter((item) => dv360Metrics.some((d: any) => d[item.key] !== undefined));

  // Use IOs if available, fall back to campaigns
  const tableData: IOData[] = useMemo(() => {
    if (insertionOrders.length > 0) return insertionOrders;
    return campaigns.map((c: any) => ({
      id: c.id,
      name: c.name,
      status: c.status || "active",
      budget: c.budget || 0,
      spent: c.spent || 0,
      impressions: c.impressions || 0,
      clicks: c.clicks || 0,
      conversions: c.conversions || 0,
      views: c.views || 0,
      vtr: c.views && c.impressions ? c.views / c.impressions : 0,
      cpv: c.views ? c.spent / c.views : 0,
      ctr: c.ctr || 0,
      cpc: c.cpc || 0,
      cvr: c.cvr || 0,
      revenue: c.revenue || 0,
      roas: c.revenue && c.spent ? c.revenue / c.spent : 0,
    }));
  }, [insertionOrders, campaigns]);

  const sortedData = useMemo(() => {
    return [...tableData].sort((a, b) => {
      const aVal = a[sortField as keyof IOData];
      const bVal = b[sortField as keyof IOData];
      if (typeof aVal === "string" && typeof bVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [tableData, sortField, sortDir]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-primary-400" /> : <ChevronDown className="w-3 h-3 text-primary-400" />;
  };

  const subNavItems = [
    { label: "Overview", href: "/dashboard/analytics/dv360" },
    { label: "Insertion Orders", href: "/dashboard/analytics/dv360/insertion-orders" },
    { label: "Line Items", href: "/dashboard/analytics/dv360/line-items" },
    { label: "Channels", href: "/dashboard/analytics/dv360/channels" },
    { label: "Placement", href: "/dashboard/analytics/dv360/placement" },
    { label: "Geo", href: "/dashboard/analytics/dv360/geo" },
    { label: "Demographics", href: "/dashboard/analytics/dv360/demographics" },
    { label: "Creatives", href: "/dashboard/analytics/dv360/creatives" },
    { label: "Funnel", href: "/dashboard/analytics/dv360/funnel" },
    { label: "Comparison", href: "/dashboard/analytics/dv360/comparison" },
    { label: "Reports", href: "/dashboard/analytics/dv360/reports" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-1">DV360 Analytics</h1>
        <p className="text-text-secondary">Account: {selectedAccount?.name}</p>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2 border-b border-border-primary overflow-x-auto">
        {subNavItems.map((item) => (
          <a key={item.href} href={item.href}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              pathname === item.href ? "border-primary-500 text-primary-400" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >{item.label}</a>
        ))}
      </div>

      {/* Date Range */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 bg-surface-elevated border border-border-primary rounded text-text-primary text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 bg-surface-elevated border border-border-primary rounded text-text-primary text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20" />
        </div>
      </div>

      {/* Campaign Filter Banner (from deep-link) */}
      {campaignFilter && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
          <Filter className="w-4 h-4 text-primary-400 flex-shrink-0" />
          <span className="text-sm text-primary-300">
            Filtered to campaign: <strong className="text-primary-200">{campaignFilter}</strong>
          </span>
          <button
            onClick={() => setCampaignFilter(null)}
            className="ml-auto p-1 rounded hover:bg-primary-500/20 text-primary-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      {periodStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(periodStats).map(([key, stat]) => {
            const change = pctChange(stat.current, stat.previous);
            const lowerIsBetter = key === "spend" || key === "cpv";
            const isPositiveChange = lowerIsBetter ? change < 0 : change > 0;
            let displayValue: string;
            if (stat.isCurrency) displayValue = formatCurrency(stat.current, selectedAccount?.currency);
            else if (stat.isRate) displayValue = (stat.current * 100).toFixed(2) + "%";
            else displayValue = stat.current.toLocaleString("en-IN", { maximumFractionDigits: 0 });

            const isVideoMetric = key === "views" || key === "vtr" || key === "cpv";
            return (
              <div key={key} className={`card p-3 ${isVideoMetric ? "border border-purple-500/20" : ""}`}>
                <div className="flex items-center gap-1 mb-1">
                  {isVideoMetric && (key === "views" ? <Eye className="w-3 h-3 text-purple-400" /> : <Play className="w-3 h-3 text-purple-400" />)}
                  <p className="text-text-secondary text-xs">{stat.label}</p>
                </div>
                <p className="text-lg font-bold text-text-primary leading-tight">{displayValue}</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositiveChange ? "text-emerald-400" : "text-red-400"}`}>
                    {isPositiveChange ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {change > 0 ? "+" : ""}{change.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <ChartContainer title="Performance Trend">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Metrics</label>
            <div className="flex flex-wrap gap-2">
              {allMetricsOptions.map((option) => (
                <button key={option.value}
                  onClick={() => setSelectedMetrics((prev) => prev.includes(option.value) ? prev.filter((m) => m !== option.value) : [...prev, option.value])}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedMetrics.includes(option.value)
                      ? "bg-primary-500/20 text-primary-400 border border-primary-500"
                      : "bg-surface-elevated text-text-secondary border border-border-primary hover:border-primary-500"
                  }`}
                >{option.label}</button>
              ))}
            </div>
          </div>
          {dv360Metrics.length > 0 && trendDataKeys.length > 0 && (
            <LineChart data={dv360Metrics} dataKeys={trendDataKeys} height={300} />
          )}
        </div>
      </ChartContainer>

      {/* IO / Campaign Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <h3 className="text-base font-semibold text-text-primary">
            {insertionOrders.length > 0 ? "Insertion Orders" : "Campaigns"} ({tableData.length})
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Rows:</span>
            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-surface-elevated border border-border-primary rounded px-2 py-1 text-sm text-text-primary">
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-primary bg-surface-base/50">
                {([
                  { field: "name" as SortField, label: "Name", align: "left" },
                  { field: "status" as SortField, label: "Status", align: "left" },
                  { field: "budget" as SortField, label: "Budget", align: "right" },
                  { field: "spent" as SortField, label: "Spend", align: "right" },
                  { field: "impressions" as SortField, label: "Impr.", align: "right" },
                  { field: "clicks" as SortField, label: "Clicks", align: "right" },
                  { field: "ctr" as SortField, label: "CTR", align: "right" },
                  { field: "views" as SortField, label: "Views", align: "right" },
                  { field: "vtr" as SortField, label: "VTR", align: "right" },
                  { field: "cpv" as SortField, label: "CPV", align: "right" },
                  { field: "conversions" as SortField, label: "Conv.", align: "right" },
                  { field: "cpc" as SortField, label: "CPC", align: "right" },
                  { field: "cvr" as SortField, label: "CVR", align: "right" },
                  { field: "revenue" as SortField, label: "Revenue", align: "right" },
                  { field: "roas" as SortField, label: "ROAS", align: "right" },
                ] as const).map((col) => (
                  <th key={col.field} onClick={() => handleSort(col.field)}
                    className={`px-3 py-3 font-medium text-text-secondary cursor-pointer hover:text-text-primary select-none whitespace-nowrap ${col.align === "right" ? "text-right" : "text-left"}`}>
                    <span className="inline-flex items-center gap-1">{col.label}<SortIcon field={col.field} /></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row) => {
                const budgetPacing = row.budget > 0 ? (row.spent / row.budget) * 100 : 0;
                return (
                  <tr key={row.id} className="border-b border-border-primary/50 hover:bg-surface-elevated/50 transition-colors">
                    <td className="px-3 py-3 text-text-primary font-medium max-w-[200px] truncate">{row.name}</td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${row.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
                        <span className="text-text-secondary capitalize text-xs">{row.status}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="text-text-primary">{formatCurrency(row.budget, selectedAccount?.currency)}</div>
                      {/* Budget pacing bar */}
                      <div className="w-full bg-surface-base rounded-full h-1 mt-1">
                        <div
                          className={`h-1 rounded-full ${budgetPacing > 95 ? "bg-red-400" : budgetPacing > 80 ? "bg-amber-400" : "bg-emerald-400"}`}
                          style={{ width: `${Math.min(budgetPacing, 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-text-secondary mt-0.5">{budgetPacing.toFixed(0)}% paced</p>
                    </td>
                    <td className="px-3 py-3 text-right text-text-primary">{formatCurrency(row.spent, selectedAccount?.currency)}</td>
                    <td className="px-3 py-3 text-right text-text-primary">{row.impressions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-text-primary">{row.clicks.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-text-primary">{(row.ctr * 100).toFixed(2)}%</td>
                    <td className="px-3 py-3 text-right text-text-primary">{(row.views || 0).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-text-primary">{((row.vtr || 0) * 100).toFixed(2)}%</td>
                    <td className="px-3 py-3 text-right text-text-primary">{formatCurrency(row.cpv || 0, selectedAccount?.currency)}</td>
                    <td className="px-3 py-3 text-right text-text-primary">{row.conversions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-text-primary">{formatCurrency(row.clicks > 0 ? row.spent / row.clicks : 0, selectedAccount?.currency)}</td>
                    <td className="px-3 py-3 text-right text-text-primary">{row.clicks > 0 ? ((row.conversions / row.clicks) * 100).toFixed(2) : "0.00"}%</td>
                    <td className="px-3 py-3 text-right text-text-primary">{formatCurrency(row.revenue, selectedAccount?.currency)}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`font-semibold ${row.roas >= 3 ? "text-emerald-400" : row.roas >= 1.5 ? "text-amber-400" : "text-red-400"}`}>
                        {row.roas.toFixed(2)}x
                      </span>
                    </td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (
                <tr><td colSpan={15} className="px-3 py-8 text-center text-text-secondary">No data found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border-primary">
            <p className="text-xs text-text-secondary">
              Showing {(currentPage - 1) * rowsPerPage + 1}&ndash;{Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 py-1 bg-surface-elevated border border-border-primary rounded text-sm text-text-primary disabled:opacity-40 hover:bg-surface-base transition-colors">Prev</button>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-3 py-1 bg-surface-elevated border border-border-primary rounded text-sm text-text-primary disabled:opacity-40 hover:bg-surface-base transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
