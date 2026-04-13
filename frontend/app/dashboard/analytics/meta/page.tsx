"use client";

import { useAccount } from "@/lib/accountContext";
import { usePathname, useSearchParams } from "next/navigation";
import { ChartContainer, LineChart } from "@/components";
import { fetchDailyMetrics, fetchCampaigns } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Users,
  Radio,
  X as XIcon,
  Filter,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cvr: number;
  roas: number;
  reach?: number;
  frequency?: number;
  ad_set_count?: number;
}

type SortField = "name" | "status" | "budget" | "spent" | "impressions" | "clicks" | "ctr" | "cpc" | "conversions" | "cvr" | "revenue" | "roas" | "reach" | "frequency";

export default function MetaAnalytics() {
  const { selectedAccount } = useAccount();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState(["spend", "clicks"]);
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
      const [metrics, camps] = await Promise.all([
        fetchDailyMetrics({ account_id: selectedAccount?.id, platform: "meta" }),
        fetchCampaigns({ account_id: selectedAccount?.id, platform: "meta" }),
      ]);
      setDailyMetrics(metrics);
      setCampaigns(camps);

      if (metrics.length > 0 && !dateFrom && !dateTo) {
        const dates = metrics.map((m: any) => m.date).sort();
        setDateFrom(dates[0]);
        setDateTo(dates[dates.length - 1]);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount?.id]);

  const metaMetrics = dailyMetrics.filter((m) => {
    if (m.platform !== "meta") return false;
    if (!dateFrom || !dateTo) return true;
    return m.date >= dateFrom && m.date <= dateTo;
  });

  // Period comparison
  const periodStats = useMemo(() => {
    if (metaMetrics.length < 2) return null;
    const midpoint = Math.floor(metaMetrics.length / 2);
    const prev = metaMetrics.slice(0, midpoint);
    const curr = metaMetrics.slice(midpoint);
    const sum = (arr: any[], key: string) => arr.reduce((s, m) => s + (m[key] || 0), 0);
    const avg = (arr: any[], key: string) => arr.length > 0 ? sum(arr, key) / arr.length : 0;

    return {
      spend: { current: sum(curr, "spend"), previous: sum(prev, "spend"), isCurrency: true, isRate: false, label: "Spend" },
      impressions: { current: sum(curr, "impressions"), previous: sum(prev, "impressions"), isCurrency: false, isRate: false, label: "Impressions" },
      reach: { current: sum(curr, "reach"), previous: sum(prev, "reach"), isCurrency: false, isRate: false, label: "Reach" },
      frequency: { current: avg(curr, "frequency"), previous: avg(prev, "frequency"), isCurrency: false, isRate: false, label: "Frequency" },
      clicks: { current: sum(curr, "clicks"), previous: sum(prev, "clicks"), isCurrency: false, isRate: false, label: "Clicks" },
      conversions: { current: sum(curr, "conversions"), previous: sum(prev, "conversions"), isCurrency: false, isRate: false, label: "Conversions" },
      revenue: { current: sum(curr, "revenue"), previous: sum(prev, "revenue"), isCurrency: true, isRate: false, label: "Revenue" },
      roas: {
        current: sum(curr, "revenue") / (sum(curr, "spend") || 1),
        previous: sum(prev, "revenue") / (sum(prev, "spend") || 1),
        isCurrency: false, isRate: false, label: "ROAS"
      },
    } as Record<string, { current: number; previous: number; isCurrency: boolean; isRate: boolean; label: string }>;
  }, [metaMetrics]);

  // Audience fatigue: check if any campaign has frequency > 5
  const fatigueCampaigns = campaigns.filter((c) => (c.frequency || 0) > 5);

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const allMetricsOptions = [
    { value: "spend", label: "Spend" },
    { value: "impressions", label: "Impressions" },
    { value: "clicks", label: "Clicks" },
    { value: "conversions", label: "Conversions" },
    { value: "revenue", label: "Revenue" },
  ];

  const trendDataKeys = selectedMetrics
    .map((metric) => {
      const colors: Record<string, string> = {
        spend: "#3B82F6", impressions: "#F59E0B", clicks: "#8B5CF6",
        conversions: "#EC4899", revenue: "#10B981",
      };
      return { key: metric, name: allMetricsOptions.find((o) => o.value === metric)?.label || metric, color: colors[metric] || "#3B82F6" };
    })
    .filter((item) => metaMetrics.some((d: any) => d[item.key] !== undefined));

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      const aVal = a[sortField as keyof Campaign];
      const bVal = b[sortField as keyof Campaign];
      if (typeof aVal === "string" && typeof bVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [campaigns, sortField, sortDir]);

  const totalPages = Math.ceil(sortedCampaigns.length / rowsPerPage);
  const paginatedCampaigns = sortedCampaigns.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
    { label: "Overview", href: "/dashboard/analytics/meta" },
    { label: "Campaigns", href: "/dashboard/analytics/meta/campaigns" },
    { label: "Ad Sets", href: "/dashboard/analytics/meta/ad-sets" },
    { label: "Ads", href: "/dashboard/analytics/meta/ads" },
    { label: "Placement", href: "/dashboard/analytics/meta/placement" },
    { label: "Geo", href: "/dashboard/analytics/meta/geo" },
    { label: "Demographics", href: "/dashboard/analytics/meta/demographics" },
    { label: "Funnel", href: "/dashboard/analytics/meta/funnel" },
    { label: "Comparison", href: "/dashboard/analytics/meta/comparison" },
    { label: "Reports", href: "/dashboard/analytics/meta/reports" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-1">Meta Analytics</h1>
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

      {/* Audience Fatigue Warning */}
      {fatigueCampaigns.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-300">Audience Fatigue Alert</p>
            <p className="text-xs text-amber-400/80 mt-1">
              {fatigueCampaigns.length} campaign{fatigueCampaigns.length > 1 ? "s" : ""} with frequency above 5x threshold:{" "}
              {fatigueCampaigns.map((c) => `${c.name} (${(c.frequency || 0).toFixed(1)}x)`).join(", ")}
            </p>
          </div>
        </div>
      )}

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
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      {periodStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(periodStats).map(([key, stat]) => {
            const change = pctChange(stat.current, stat.previous);
            const lowerIsBetter = key === "spend" || key === "frequency";
            const isPositiveChange = lowerIsBetter ? change < 0 : change > 0;
            let displayValue: string;
            if (stat.isCurrency) displayValue = formatCurrency(stat.current, selectedAccount?.currency);
            else if (key === "roas") displayValue = stat.current.toFixed(2) + "x";
            else if (key === "frequency") displayValue = stat.current.toFixed(1) + "x";
            else if (key === "reach") displayValue = stat.current.toLocaleString("en-IN", { maximumFractionDigits: 0 });
            else displayValue = stat.current.toLocaleString("en-IN", { maximumFractionDigits: 0 });

            const isReachFreq = key === "reach" || key === "frequency";
            const isFreqHigh = key === "frequency" && stat.current > 5;
            return (
              <div key={key} className={`card p-3 ${isReachFreq ? "border border-blue-500/20" : ""} ${isFreqHigh ? "border-amber-500/30 bg-amber-500/5" : ""}`}>
                <div className="flex items-center gap-1 mb-1">
                  {key === "reach" && <Users className="w-3 h-3 text-blue-400" />}
                  {key === "frequency" && <Radio className="w-3 h-3 text-blue-400" />}
                  <p className="text-text-secondary text-xs">{stat.label}</p>
                  {isFreqHigh && <AlertTriangle className="w-3 h-3 text-amber-400 ml-auto" />}
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
          {metaMetrics.length > 0 && trendDataKeys.length > 0 && (
            <LineChart data={metaMetrics} dataKeys={trendDataKeys} height={300} />
          )}
        </div>
      </ChartContainer>

      {/* Campaign Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <h3 className="text-base font-semibold text-text-primary">Campaigns ({campaigns.length})</h3>
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
                  { field: "reach" as SortField, label: "Reach", align: "right" },
                  { field: "frequency" as SortField, label: "Freq.", align: "right" },
                  { field: "impressions" as SortField, label: "Impr.", align: "right" },
                  { field: "clicks" as SortField, label: "Clicks", align: "right" },
                  { field: "ctr" as SortField, label: "CTR", align: "right" },
                  { field: "cpc" as SortField, label: "CPC", align: "right" },
                  { field: "cvr" as SortField, label: "CVR", align: "right" },
                  { field: "conversions" as SortField, label: "Conv.", align: "right" },
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
              {paginatedCampaigns.map((c) => {
                const isFreqHigh = (c.frequency || 0) > 5;
                return (
                  <tr key={c.id} className={`border-b border-border-primary/50 hover:bg-surface-elevated/50 transition-colors ${isFreqHigh ? "bg-amber-500/5" : ""}`}>
                    <td className="px-3 py-3 text-text-primary font-medium max-w-[200px] truncate">{c.name}</td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${c.status === "active" ? "bg-emerald-400" : c.status === "paused" ? "bg-red-400" : "bg-gray-400"}`} />
                        <span className="text-text-secondary capitalize text-xs">{c.status}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-text-primary">{formatCurrency(c.budget, selectedAccount?.currency)}</td>
                    <td className="px-3 py-3 text-right text-text-primary">{formatCurrency(c.spent, selectedAccount?.currency)}</td>
                    <td className="px-3 py-3 text-right text-text-primary">{(c.reach || 0).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`font-medium ${isFreqHigh ? "text-amber-400" : "text-text-primary"}`}>
                        {(c.frequency || 0).toFixed(1)}x
                      </span>
                      {isFreqHigh && <AlertTriangle className="w-3 h-3 text-amber-400 inline ml-1" />}
                    </td>
                    <td className="px-3 py-3 text-right text-text-primary">{c.impressions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-text-primary">{c.clicks.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-text-primary">{(c.ctr * 100).toFixed(2)}%</td>
                    <td className="px-3 py-3 text-right text-text-primary">{formatCurrency(c.clicks > 0 ? c.spent / c.clicks : 0, selectedAccount?.currency)}</td>
                    <td className="px-3 py-3 text-right text-text-primary">{c.clicks > 0 ? ((c.conversions / c.clicks) * 100).toFixed(2) : "0.00"}%</td>
                    <td className="px-3 py-3 text-right text-text-primary">{c.conversions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-text-primary">{formatCurrency(c.revenue, selectedAccount?.currency)}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`font-semibold ${c.roas >= 3 ? "text-emerald-400" : c.roas >= 1.5 ? "text-amber-400" : "text-red-400"}`}>
                        {c.roas.toFixed(2)}x
                      </span>
                    </td>
                  </tr>
                );
              })}
              {paginatedCampaigns.length === 0 && (
                <tr><td colSpan={14} className="px-3 py-8 text-center text-text-secondary">No campaigns found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border-primary">
            <p className="text-xs text-text-secondary">
              Showing {(currentPage - 1) * rowsPerPage + 1}&ndash;{Math.min(currentPage * rowsPerPage, sortedCampaigns.length)} of {sortedCampaigns.length}
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
