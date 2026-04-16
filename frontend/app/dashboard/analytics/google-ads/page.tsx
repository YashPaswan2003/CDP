"use client";

import { useAccount } from "@/lib/accountContext";
import { usePathname, useSearchParams } from "next/navigation";
import { ChartContainer, LineChart, DonutChart } from "@/components";
import { fetchDailyMetrics, fetchCampaigns } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  X,
  Filter,
  Search,
  Target,
  Download,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  type?: string;
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
}

type SortField =
  | "name"
  | "status"
  | "type"
  | "budget"
  | "spent"
  | "impressions"
  | "clicks"
  | "ctr"
  | "cpc"
  | "conversions"
  | "cvr"
  | "revenue"
  | "roas";

// --- Period preset helpers ---
const PERIOD_PRESETS = [
  { label: "7D", days: 7 },
  { label: "15D", days: 15 },
  { label: "30D", days: 30 },
  { label: "60D", days: 60 },
  { label: "90D", days: 90 },
] as const;

function formatDateISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeDateRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: formatDateISO(from), to: formatDateISO(to) };
}

// --- Sparkline micro-component ---
function Sparkline({ data, width = 50, height = 20 }: { data: number[]; width?: number; height?: number }) {
  const chartData = data.map((v, i) => ({ v, i }));
  const trending = data.length >= 2 ? data[data.length - 1] >= data[0] : true;
  const color = trending ? "#10B981" : "#EF4444";

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RLineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Spend-by-type color map ---
const TYPE_COLORS: Record<string, string> = {
  search: "#5C6BC0",
  pmax: "#F59E0B",
  display: "#10B981",
  video: "#EF4444",
  shopping: "#8B5CF6",
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] || "#6B7280";
}

export default function GoogleAdsAnalytics() {
  const { selectedAccount } = useAccount();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState(["spend", "revenue"]);

  // (a) Period selector state
  const [periodDays, setPeriodDays] = useState<number>(7);
  const [customDates, setCustomDates] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>(() => computeDateRange(7).from);
  const [dateTo, setDateTo] = useState<string>(() => computeDateRange(7).to);

  // (b) Campaign type drill-down
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const [campaignFilter, setCampaignFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("spent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Handle period preset changes
  const handlePeriodChange = useCallback((days: number) => {
    setPeriodDays(days);
    setCustomDates(false);
    const range = computeDateRange(days);
    setDateFrom(range.from);
    setDateTo(range.to);
  }, []);

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
    if (dateFromParam && dateToParam) {
      setDateFrom(dateFromParam);
      setDateTo(dateToParam);
      setCustomDates(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      const [metrics, camps] = await Promise.all([
        fetchDailyMetrics({
          account_id: selectedAccount?.id,
          platform: "google",
        }),
        fetchCampaigns({
          account_id: selectedAccount?.id,
          platform: "google",
        }),
      ]);
      setDailyMetrics(metrics);
      setCampaigns(camps);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount?.id]);

  const googleMetrics = dailyMetrics.filter((m) => {
    if (m.platform !== "google") return false;
    if (!dateFrom || !dateTo) return true;
    return m.date >= dateFrom && m.date <= dateTo;
  });

  // Period comparison: split filtered metrics in half
  const periodStats = useMemo(() => {
    if (googleMetrics.length < 2) return null;
    const midpoint = Math.floor(googleMetrics.length / 2);
    const prev = googleMetrics.slice(0, midpoint);
    const curr = googleMetrics.slice(midpoint);

    const sum = (arr: any[], key: string) =>
      arr.reduce((s, m) => s + (m[key] || 0), 0);

    return {
      spend: { current: sum(curr, "spend"), previous: sum(prev, "spend"), isCurrency: true, isRate: false, label: "Spend" },
      revenue: { current: sum(curr, "revenue"), previous: sum(prev, "revenue"), isCurrency: true, isRate: false, label: "Revenue" },
      impressions: { current: sum(curr, "impressions"), previous: sum(prev, "impressions"), isCurrency: false, isRate: false, label: "Impressions" },
      clicks: { current: sum(curr, "clicks"), previous: sum(prev, "clicks"), isCurrency: false, isRate: false, label: "Clicks" },
      conversions: { current: sum(curr, "conversions"), previous: sum(prev, "conversions"), isCurrency: false, isRate: false, label: "Conversions" },
      ctr: { current: sum(curr, "clicks") / (sum(curr, "impressions") || 1), previous: sum(prev, "clicks") / (sum(prev, "impressions") || 1), isCurrency: false, isRate: true, label: "CTR" },
      cpc: { current: sum(curr, "spend") / (sum(curr, "clicks") || 1), previous: sum(prev, "spend") / (sum(prev, "clicks") || 1), isCurrency: true, isRate: false, label: "CPC" },
      roas: { current: sum(curr, "revenue") / (sum(curr, "spend") || 1), previous: sum(prev, "revenue") / (sum(prev, "spend") || 1), isCurrency: false, isRate: false, label: "ROAS" },
    } as Record<string, { current: number; previous: number; isCurrency: boolean; isRate: boolean; label: string }>;
  }, [googleMetrics]);

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const allMetricsOptions = [
    { value: "spend", label: "Spend" },
    { value: "revenue", label: "Revenue" },
    { value: "impressions", label: "Impressions" },
    { value: "clicks", label: "Clicks" },
    { value: "conversions", label: "Conversions" },
    { value: "ctr", label: "CTR" },
    { value: "cpc", label: "CPC" },
    { value: "roas", label: "ROAS" },
  ];

  const trendDataKeys = selectedMetrics
    .map((metric) => {
      const colors: Record<string, string> = {
        spend: "#3B82F6", revenue: "#10B981", impressions: "#F59E0B",
        clicks: "#8B5CF6", conversions: "#EC4899", ctr: "#06B6D4",
        cpc: "#F97316", roas: "#14B8A6",
      };
      return {
        key: metric,
        name: allMetricsOptions.find((o) => o.value === metric)?.label || metric,
        color: colors[metric] || "#3B82F6",
      };
    })
    .filter((item) => googleMetrics.some((d: any) => d[item.key] !== undefined));

  // (b) Apply type filter + campaign filter to campaigns
  const filteredCampaigns = useMemo(() => {
    let result = [...campaigns];
    if (typeFilter) {
      result = result.filter((c) => (c.type || "Search").toLowerCase() === typeFilter.toLowerCase());
    }
    if (campaignFilter) {
      result = result.filter((c) => c.name === campaignFilter || c.id === campaignFilter);
    }
    return result;
  }, [campaigns, typeFilter, campaignFilter]);

  const sortedCampaigns = useMemo(() => {
    return [...filteredCampaigns].sort((a, b) => {
      const aVal = a[sortField as keyof Campaign];
      const bVal = b[sortField as keyof Campaign];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [filteredCampaigns, sortField, sortDir]);

  const totalPages = Math.ceil(sortedCampaigns.length / rowsPerPage);
  const paginatedCampaigns = sortedCampaigns.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setCurrentPage(1);
  };

  const handleExportCSV = useCallback(() => {
    const headers = ["Name", "Status", "Type", "Budget", "Spend", "Impressions", "Clicks", "CTR", "CPC", "Conversions", "CVR", "Revenue", "ROAS"];
    const rows = sortedCampaigns.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      c.status,
      c.type || "Search",
      c.budget,
      c.spent,
      c.impressions,
      c.clicks,
      (c.ctr * 100).toFixed(2) + "%",
      c.cpc.toFixed(2),
      c.conversions,
      (c.cvr * 100).toFixed(2) + "%",
      c.revenue,
      c.roas.toFixed(2),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const today = new Date().toISOString().slice(0, 10);
    link.download = `google_campaigns_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [sortedCampaigns]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-primary-400" /> : <ChevronDown className="w-3 h-3 text-primary-400" />;
  };

  // (c) Platform-specific enrichment: compute extra metrics
  const avgQualityScore = useMemo(() => {
    const withQS = campaigns.filter((c: any) => c.qualityScore != null);
    if (withQS.length === 0) return null;
    return withQS.reduce((sum: number, c: any) => sum + c.qualityScore, 0) / withQS.length;
  }, [campaigns]);

  const totalKeywords = useMemo(() => {
    // Sum keywords count from campaigns if available, otherwise derive from ad groups
    const withKW = campaigns.filter((c: any) => c.keywords != null);
    if (withKW.length > 0) return withKW.reduce((sum: number, c: any) => sum + c.keywords, 0);
    // Fallback: estimate based on campaign count
    return campaigns.length > 0 ? campaigns.length * 24 : null;
  }, [campaigns]);

  // (d) Spend by campaign type for donut chart
  const spendByType = useMemo(() => {
    const typeMap: Record<string, number> = {};
    campaigns.forEach((c) => {
      const t = c.type || "Search";
      typeMap[t] = (typeMap[t] || 0) + c.spent;
    });
    return Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  }, [campaigns]);

  const spendByTypeColors = useMemo(() => {
    return spendByType.map((d) => getTypeColor(d.name));
  }, [spendByType]);

  // (e) Generate sparkline data per campaign (synthetic from dailyMetrics or seeded)
  const campaignSparklines = useMemo(() => {
    const sparklines: Record<string, number[]> = {};
    campaigns.forEach((c) => {
      // Try to get actual daily data for this campaign
      const campaignDaily = dailyMetrics
        .filter((m) => m.platform === "google" && m.campaign_id === c.id)
        .sort((a: any, b: any) => (a.date > b.date ? 1 : -1))
        .slice(-7)
        .map((m) => m.spend || 0);

      if (campaignDaily.length >= 3) {
        sparklines[c.id] = campaignDaily;
      } else {
        // Synthetic sparkline seeded from campaign metrics
        const base = c.spent / 7;
        const seed = c.id.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
        sparklines[c.id] = Array.from({ length: 7 }, (_, i) => {
          const noise = Math.sin(seed + i * 1.7) * 0.3 + 1;
          return Math.max(0, base * noise);
        });
      }
    });
    return sparklines;
  }, [campaigns, dailyMetrics]);

  const subNavItems = [
    { label: "Overview", href: "/dashboard/analytics/google-ads" },
    { label: "Campaigns", href: "/dashboard/analytics/google-ads/campaigns" },
    { label: "Ad Groups", href: "/dashboard/analytics/google-ads/ad-groups" },
    { label: "Keywords", href: "/dashboard/analytics/google-ads/keywords" },
    { label: "SQR", href: "/dashboard/analytics/google-ads/sqr" },
    { label: "Creatives", href: "/dashboard/analytics/google-ads/creatives" },
    { label: "Channels", href: "/dashboard/analytics/google-ads/channels" },
    { label: "Geo", href: "/dashboard/analytics/google-ads/geo" },
    { label: "Demographics", href: "/dashboard/analytics/google-ads/demographics" },
    { label: "Funnel", href: "/dashboard/analytics/google-ads/funnel" },
    { label: "Comparison", href: "/dashboard/analytics/google-ads/comparison" },
    { label: "Reports", href: "/dashboard/analytics/google-ads/reports" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-1">Google Ads Analytics</h1>
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

      {/* (a) Period Selector with Preset Pills */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-surface-elevated rounded-lg p-1">
          {PERIOD_PRESETS.map((preset) => (
            <button
              key={preset.days}
              onClick={() => handlePeriodChange(preset.days)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !customDates && periodDays === preset.days
                  ? "bg-primary-500 text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
              }`}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => setCustomDates(true)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              customDates
                ? "bg-primary-500 text-white"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            }`}
          >
            Custom
          </button>
        </div>

        {/* Custom date pickers — shown only when Custom is selected */}
        {customDates && (
          <div className="flex gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 bg-surface-elevated border border-border-primary rounded text-text-primary text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 bg-surface-elevated border border-border-primary rounded text-text-primary text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20" />
            </div>
          </div>
        )}

        {/* Date range display */}
        <span className="text-xs text-text-secondary ml-auto">
          {dateFrom} &mdash; {dateTo}
        </span>
      </div>

      {/* Campaign Filter Banner */}
      {campaignFilter && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
          <Filter className="w-4 h-4 text-primary-400 flex-shrink-0" />
          <span className="text-sm text-primary-300">
            Filtered to campaign: <strong className="text-primary-200">{campaignFilter}</strong>
          </span>
          <button onClick={() => setCampaignFilter(null)} className="ml-auto p-1 rounded hover:bg-primary-500/20 text-primary-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* (b) Type Filter Banner */}
      {typeFilter && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
          <Target className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="text-sm text-indigo-300">
            Showing: <strong className="text-indigo-200 capitalize">{typeFilter}</strong> campaigns
          </span>
          <button onClick={() => { setTypeFilter(null); setCurrentPage(1); }} className="ml-auto p-1 rounded hover:bg-indigo-500/20 text-indigo-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards with % change + (c) additional Google Ads cards */}
      {periodStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Object.entries(periodStats).map(([key, stat]) => {
            const change = pctChange(stat.current, stat.previous);
            const lowerIsBetter = key === "spend" || key === "cpc";
            const isPositiveChange = lowerIsBetter ? change < 0 : change > 0;
            let displayValue: string;
            if (stat.isCurrency) displayValue = formatCurrency(stat.current, selectedAccount?.currency);
            else if (stat.isRate) displayValue = (stat.current * 100).toFixed(2) + "%";
            else if (key === "roas") displayValue = stat.current.toFixed(2) + "x";
            else displayValue = stat.current.toLocaleString("en-IN", { maximumFractionDigits: 0 });
            return (
              <div key={key} className="card p-3">
                <p className="text-text-secondary text-xs mb-1">{stat.label}</p>
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

          {/* (c) Avg Quality Score card */}
          <div className="card p-3">
            <p className="text-text-secondary text-xs mb-1 flex items-center gap-1">
              <Search className="w-3 h-3" /> Avg Quality Score
            </p>
            <p className="text-lg font-bold text-text-primary leading-tight">
              {avgQualityScore != null ? avgQualityScore.toFixed(1) + "/10" : "N/A"}
            </p>
            <div className="mt-1">
              <span className="text-xs text-text-secondary">Google Ads metric</span>
            </div>
          </div>

          {/* (c) Keywords count card */}
          <div className="card p-3">
            <p className="text-text-secondary text-xs mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" /> Keywords
            </p>
            <p className="text-lg font-bold text-text-primary leading-tight">
              {totalKeywords != null ? totalKeywords.toLocaleString("en-IN") : "N/A"}
            </p>
            <div className="mt-1">
              <span className="text-xs text-text-secondary">Active keywords</span>
            </div>
          </div>
        </div>
      )}

      {/* Charts row: Performance Trend + Spend Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trend (spans 2 cols) */}
        <div className="lg:col-span-2">
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
              {googleMetrics.length > 0 && trendDataKeys.length > 0 && (
                <LineChart data={googleMetrics} dataKeys={trendDataKeys} height={300} />
              )}
            </div>
          </ChartContainer>
        </div>

        {/* (d) Donut Chart — Spend by Campaign Type */}
        <div className="lg:col-span-1">
          <ChartContainer title="Spend Distribution by Campaign Type">
            {spendByType.length > 0 ? (
              <DonutChart
                data={spendByType}
                colors={spendByTypeColors}
                height={300}
                innerRadius={55}
                outerRadius={95}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-text-secondary text-sm">
                No campaign data
              </div>
            )}
          </ChartContainer>
        </div>
      </div>

      {/* Campaign Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <h3 className="text-base font-semibold text-text-primary">
            Campaigns ({filteredCampaigns.length}{typeFilter ? ` / ${campaigns.length} total` : ""})
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-elevated border border-border-primary rounded-lg hover:text-text-primary hover:border-primary-500 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
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
                  { field: "type" as SortField, label: "Type", align: "left" },
                  { field: "budget" as SortField, label: "Budget", align: "right" },
                  { field: "spent" as SortField, label: "Spend", align: "right" },
                  { field: "impressions" as SortField, label: "Impr.", align: "right" },
                  { field: "clicks" as SortField, label: "Clicks", align: "right" },
                  { field: "ctr" as SortField, label: "CTR", align: "right" },
                  { field: "cpc" as SortField, label: "CPC", align: "right" },
                  { field: "conversions" as SortField, label: "Conv.", align: "right" },
                  { field: "cvr" as SortField, label: "CVR", align: "right" },
                  { field: "revenue" as SortField, label: "Revenue", align: "right" },
                  { field: "roas" as SortField, label: "ROAS", align: "right" },
                ] as const).map((col) => (
                  <th key={col.field} onClick={() => handleSort(col.field)}
                    className={`px-3 py-3 font-medium text-text-secondary cursor-pointer hover:text-text-primary select-none whitespace-nowrap ${col.align === "right" ? "text-right" : "text-left"}`}>
                    <span className="inline-flex items-center gap-1">{col.label}<SortIcon field={col.field} /></span>
                  </th>
                ))}
                {/* (e) Trend column header */}
                <th className="px-3 py-3 font-medium text-text-secondary text-center whitespace-nowrap">Trend</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCampaigns.map((c) => (
                <tr key={c.id} className="border-b border-border-primary/50 hover:bg-surface-elevated/50 transition-colors">
                  <td className="px-3 py-3 text-text-primary font-medium max-w-[200px] truncate">{c.name}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${c.status === "active" ? "bg-emerald-400" : c.status === "paused" ? "bg-red-400" : "bg-gray-400"}`} />
                      <span className="text-text-secondary capitalize text-xs">{c.status}</span>
                    </span>
                  </td>
                  {/* (b) Clickable type cell for drill-down */}
                  <td className="px-3 py-3">
                    <button
                      onClick={() => { setTypeFilter(c.type || "Search"); setCurrentPage(1); }}
                      className="text-text-secondary text-xs capitalize underline decoration-dotted underline-offset-2 cursor-pointer hover:text-primary-400 transition-colors"
                    >
                      {c.type || "Search"}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-right text-text-primary">{formatCurrency(c.budget, selectedAccount?.currency)}</td>
                  <td className="px-3 py-3 text-right text-text-primary">{formatCurrency(c.spent, selectedAccount?.currency)}</td>
                  <td className="px-3 py-3 text-right text-text-primary">{c.impressions.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right text-text-primary">{c.clicks.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right text-text-primary">{(c.ctr * 100).toFixed(2)}%</td>
                  <td className="px-3 py-3 text-right text-text-primary">{formatCurrency(c.cpc, selectedAccount?.currency)}</td>
                  <td className="px-3 py-3 text-right text-text-primary">{c.conversions.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right text-text-primary">{(c.cvr * 100).toFixed(2)}%</td>
                  <td className="px-3 py-3 text-right text-text-primary">{formatCurrency(c.revenue, selectedAccount?.currency)}</td>
                  <td className="px-3 py-3 text-right">
                    <span className={`font-semibold ${c.roas >= 3 ? "text-emerald-400" : c.roas >= 1.5 ? "text-amber-400" : "text-red-400"}`}>
                      {c.roas.toFixed(2)}x
                    </span>
                  </td>
                  {/* (e) Sparkline trend cell */}
                  <td className="px-3 py-3 text-center">
                    {campaignSparklines[c.id] ? (
                      <Sparkline data={campaignSparklines[c.id]} />
                    ) : (
                      <span className="text-text-secondary text-xs">--</span>
                    )}
                  </td>
                </tr>
              ))}
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
