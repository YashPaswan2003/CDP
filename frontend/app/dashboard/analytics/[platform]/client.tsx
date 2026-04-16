"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { ChartContainer } from "@/components";
import KPISummaryBar from "@/components/analytics/KPISummaryBar";
import PeriodSelector from "@/components/analytics/PeriodSelector";
import { ColumnFilter, QuickFilters } from "@/components/analytics/ColumnFilter";
import ChartTableToggle from "@/components/analytics/ChartTableToggle";
import DrilldownPanel from "@/components/analytics/DrilldownPanel";
import { ConditionalCell, RowHealthDot } from "@/components/analytics/ConditionalCell";
import { PacingBar } from "@/components/analytics/PacingBar";
import { DiagnosisTag } from "@/components/analytics/DiagnosisTag";

// ============ SAVED VIEW TYPES ============

type SavedView = {
  name: string;
  tab: string;
  filters: Record<string, { min?: number; max?: number }>;
  sortField: string;
  sortDirection: string;
  quickFilter: string | null;
};

const DEFAULT_PRESETS: SavedView[] = [
  {
    name: "Media Buyer",
    tab: "Campaign",
    filters: {},
    sortField: "spend",
    sortDirection: "desc",
    quickFilter: null,
  },
  {
    name: "Performance Analyst",
    tab: "Campaign",
    filters: {},
    sortField: "roas",
    sortDirection: "desc",
    quickFilter: null,
  },
  {
    name: "Client View",
    tab: "Campaign Type",
    filters: {},
    sortField: "roas",
    sortDirection: "desc",
    quickFilter: null,
  },
];

const SAVED_VIEWS_KEY = "analytics_saved_views";

// ============ TYPES ============

type BreakdownRow = {
  name: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cvr: number;
  conversions: number;
  spend: number;
  revenue: number;
  roas: number;
  budget: number;
};

type SortKey = "impressions" | "clicks" | "ctr" | "cpc" | "cvr" | "conversions" | "spend" | "roas";

// Budget multipliers per row index — spend * multiplier = budget
const BUDGET_MULTIPLIERS = [1.4, 1.6, 1.3, 1.8, 1.5, 1.7, 1.2, 1.9, 2.0, 1.35];

function withBudget(rows: Omit<BreakdownRow, "budget">[]): BreakdownRow[] {
  return rows.map((row, i) => ({
    ...row,
    budget: Math.round(row.spend * BUDGET_MULTIPLIERS[i % BUDGET_MULTIPLIERS.length]),
  }));
}

const MOCK_BREAKDOWN_DATA: Record<string, BreakdownRow[]> = {
  "Campaign Type": withBudget([
    { name: "Search", impressions: 125400, clicks: 8320, ctr: 6.64, cpc: 22.1, cvr: 0.41, conversions: 520, spend: 1840000, revenue: 8280000, roas: 4.5 },
    { name: "PMax", impressions: 98600, clicks: 5240, ctr: 5.31, cpc: 29.0, cvr: 0.40, conversions: 420, spend: 1520000, revenue: 6380000, roas: 4.2 },
    { name: "VVC", impressions: 76200, clicks: 3450, ctr: 4.53, cpc: 33.6, cvr: 0.41, conversions: 310, spend: 1160000, revenue: 4060000, roas: 3.5 },
  ]),
  "Campaign": withBudget([
    { name: "Campaign A", impressions: 85600, clicks: 5480, ctr: 6.40, cpc: 22.6, cvr: 0.40, conversions: 340, spend: 1240000, revenue: 5210000, roas: 4.2 },
    { name: "Campaign B", impressions: 52300, clicks: 2980, ctr: 5.70, cpc: 28.8, cvr: 0.38, conversions: 280, spend: 860000, revenue: 3260000, roas: 3.8 },
    { name: "Campaign C", impressions: 98600, clicks: 6240, ctr: 6.33, cpc: 24.4, cvr: 0.41, conversions: 420, spend: 1520000, revenue: 6840000, roas: 4.5 },
    { name: "Campaign D", impressions: 64200, clicks: 3580, ctr: 5.57, cpc: 25.1, cvr: 0.39, conversions: 210, spend: 900000, revenue: 2880000, roas: 3.2 },
  ]),
  "Ad Group": withBudget([
    { name: "Brand Keywords", impressions: 48200, clicks: 3640, ctr: 7.55, cpc: 22.5, cvr: 0.45, conversions: 290, spend: 820000, revenue: 4180000, roas: 5.1 },
    { name: "Competitor Terms", impressions: 35800, clicks: 2180, ctr: 6.09, cpc: 29.4, cvr: 0.42, conversions: 185, spend: 640000, revenue: 2430000, roas: 3.8 },
    { name: "Generic Search", impressions: 42600, clicks: 2280, ctr: 5.35, cpc: 25.4, cvr: 0.39, conversions: 140, spend: 580000, revenue: 1860000, roas: 3.2 },
    { name: "Long Tail", impressions: 28400, clicks: 1280, ctr: 4.51, cpc: 32.8, cvr: 0.38, conversions: 98, spend: 420000, revenue: 1220000, roas: 2.9 },
  ]),
  "Keyword": withBudget([
    { name: "kotak mutual fund", impressions: 18200, clicks: 1480, ctr: 8.13, cpc: 20.9, cvr: 0.48, conversions: 110, spend: 310000, revenue: 1680000, roas: 5.4 },
    { name: "sip investment", impressions: 16400, clicks: 1280, ctr: 7.80, cpc: 21.9, cvr: 0.46, conversions: 90, spend: 280000, revenue: 1370000, roas: 4.9 },
    { name: "tax saving fd", impressions: 12600, clicks: 760, ctr: 6.03, cpc: 25.0, cvr: 0.47, conversions: 62, spend: 190000, revenue: 780000, roas: 4.1 },
    { name: "best mutual fund", impressions: 14200, clicks: 820, ctr: 5.77, cpc: 29.3, cvr: 0.45, conversions: 55, spend: 240000, revenue: 770000, roas: 3.2 },
  ]),
  "Geo": withBudget([
    { name: "Mumbai", impressions: 82400, clicks: 5840, ctr: 7.09, cpc: 24.3, cvr: 0.42, conversions: 390, spend: 1420000, revenue: 6260000, roas: 4.4 },
    { name: "Delhi", impressions: 68900, clicks: 4180, ctr: 6.07, cpc: 28.2, cvr: 0.43, conversions: 320, spend: 1180000, revenue: 4850000, roas: 4.1 },
    { name: "Bangalore", impressions: 55800, clicks: 3240, ctr: 5.80, cpc: 29.6, cvr: 0.44, conversions: 285, spend: 960000, revenue: 3740000, roas: 3.9 },
    { name: "Chennai", impressions: 42100, clicks: 2350, ctr: 5.58, cpc: 30.6, cvr: 0.43, conversions: 180, spend: 720000, revenue: 2520000, roas: 3.5 },
  ]),
  "Device": withBudget([
    { name: "Mobile", impressions: 145800, clicks: 10520, ctr: 7.22, cpc: 23.5, cvr: 0.41, conversions: 680, spend: 2480000, revenue: 10440000, roas: 4.2 },
    { name: "Desktop", impressions: 95600, clicks: 5820, ctr: 6.09, cpc: 28.2, cvr: 0.42, conversions: 480, spend: 1640000, revenue: 6390000, roas: 3.9 },
    { name: "Tablet", impressions: 24200, clicks: 1070, ctr: 4.42, cpc: 37.4, cvr: 0.39, conversions: 90, spend: 400000, revenue: 1240000, roas: 3.1 },
  ]),
  "Ad Set": withBudget([
    { name: "Prospecting 25-35", impressions: 58400, clicks: 3420, ctr: 5.86, cpc: 29.8, cvr: 0.43, conversions: 280, spend: 1020000, revenue: 4180000, roas: 4.1 },
    { name: "Retargeting", impressions: 48200, clicks: 3680, ctr: 7.63, cpc: 22.8, cvr: 0.47, conversions: 310, spend: 840000, revenue: 4030000, roas: 4.8 },
    { name: "Lookalike 1%", impressions: 36800, clicks: 2160, ctr: 5.87, cpc: 31.5, cvr: 0.42, conversions: 190, spend: 680000, revenue: 2520000, roas: 3.7 },
  ]),
  "Ad": withBudget([
    { name: "Video Ad v1", impressions: 42600, clicks: 2840, ctr: 6.67, cpc: 25.4, cvr: 0.44, conversions: 210, spend: 720000, revenue: 3100000, roas: 4.3 },
    { name: "Carousel Ad", impressions: 34200, clicks: 1980, ctr: 5.79, cpc: 29.3, cvr: 0.43, conversions: 175, spend: 580000, revenue: 2260000, roas: 3.9 },
    { name: "Static Banner", impressions: 26200, clicks: 1440, ctr: 5.50, cpc: 30.6, cvr: 0.42, conversions: 120, spend: 440000, revenue: 1450000, roas: 3.3 },
  ]),
  "Placement": withBudget([
    { name: "YouTube In-Stream", impressions: 68400, clicks: 3240, ctr: 4.74, cpc: 37.0, cvr: 0.36, conversions: 245, spend: 1200000, revenue: 4560000, roas: 3.8 },
    { name: "Display Network", impressions: 52200, clicks: 2480, ctr: 4.75, cpc: 34.7, cvr: 0.38, conversions: 180, spend: 860000, revenue: 2750000, roas: 3.2 },
    { name: "Gmail", impressions: 28600, clicks: 1420, ctr: 4.97, cpc: 29.6, cvr: 0.40, conversions: 95, spend: 420000, revenue: 1470000, roas: 3.5 },
  ]),
  "Insertion Order": withBudget([
    { name: "IO — Brand Awareness", impressions: 108400, clicks: 4280, ctr: 3.95, cpc: 43.0, cvr: 0.35, conversions: 380, spend: 1840000, revenue: 6620000, roas: 3.6 },
    { name: "IO — Retargeting", impressions: 72600, clicks: 3680, ctr: 5.07, cpc: 33.2, cvr: 0.39, conversions: 290, spend: 1220000, revenue: 5140000, roas: 4.2 },
    { name: "IO — Prospecting", impressions: 58200, clicks: 2840, ctr: 4.88, cpc: 34.5, cvr: 0.38, conversions: 220, spend: 980000, revenue: 3720000, roas: 3.8 },
  ]),
  "Line Item": withBudget([
    { name: "LI — YouTube TrueView", impressions: 48600, clicks: 2180, ctr: 4.48, cpc: 38.5, cvr: 0.37, conversions: 180, spend: 840000, revenue: 3280000, roas: 3.9 },
    { name: "LI — Display Responsive", impressions: 36200, clicks: 1680, ctr: 4.64, cpc: 36.9, cvr: 0.39, conversions: 145, spend: 620000, revenue: 2110000, roas: 3.4 },
    { name: "LI — Connected TV", impressions: 28400, clicks: 1200, ctr: 4.23, cpc: 48.3, cvr: 0.36, conversions: 95, spend: 580000, revenue: 1790000, roas: 3.1 },
  ]),
  "Channel": withBudget([
    { name: "YouTube", impressions: 95600, clicks: 4240, ctr: 4.44, cpc: 38.2, cvr: 0.35, conversions: 340, spend: 1620000, revenue: 6160000, roas: 3.8 },
    { name: "Display", impressions: 62400, clicks: 2840, ctr: 4.55, cpc: 36.6, cvr: 0.38, conversions: 220, spend: 1040000, revenue: 3530000, roas: 3.4 },
    { name: "Connected TV", impressions: 28600, clicks: 1200, ctr: 4.20, cpc: 48.3, cvr: 0.36, conversions: 95, spend: 580000, revenue: 1790000, roas: 3.1 },
  ]),
  "Age/Gender": withBudget([
    { name: "F 25-34", impressions: 54200, clicks: 3840, ctr: 7.08, cpc: 23.9, cvr: 0.43, conversions: 280, spend: 920000, revenue: 4150000, roas: 4.5 },
    { name: "M 25-34", impressions: 49600, clicks: 3280, ctr: 6.61, cpc: 25.6, cvr: 0.44, conversions: 240, spend: 840000, revenue: 3450000, roas: 4.1 },
    { name: "F 35-44", impressions: 40200, clicks: 2480, ctr: 6.17, cpc: 27.4, cvr: 0.43, conversions: 195, spend: 680000, revenue: 2650000, roas: 3.9 },
    { name: "M 35-44", impressions: 33400, clicks: 1920, ctr: 5.75, cpc: 29.2, cvr: 0.41, conversions: 160, spend: 560000, revenue: 1960000, roas: 3.5 },
  ]),
};

// ============ HEADER FORMAT / INVERT TYPES ============

type HeaderConfig = {
  key: SortKey;
  label: string;
  format: "number" | "percent" | "currency" | "roas";
  invertColor?: boolean;
};

// ============ HEADER CONFIG ============

const headerConfigs: HeaderConfig[] = [
  { key: "impressions", label: "Impressions", format: "number" },
  { key: "clicks", label: "Clicks", format: "number" },
  { key: "ctr", label: "CTR", format: "percent" },
  { key: "cpc", label: "CPC", format: "currency", invertColor: true },
  { key: "cvr", label: "CVR", format: "percent" },
  { key: "conversions", label: "Conversions", format: "number" },
  { key: "spend", label: "Spend", format: "currency" },
  { key: "roas", label: "ROAS", format: "roas" },
];

// Thresholds for conditional cell coloring
const METRIC_THRESHOLDS: Record<string, { green?: number; red?: number }> = {
  roas: { green: 4.0, red: 2.5 },
  ctr: { green: 6.0, red: 4.0 },
  cvr: { green: 0.42, red: 0.35 },
  cpc: { green: 25, red: 40 },
};

// Targets for health dot and diagnosis
const HEALTH_TARGETS = {
  roasTarget: 3.5,
  ctrTarget: 5.5,
  cvrTarget: 0.40,
  cpcTarget: 30,
};

// ============ TAB GROUPS ============

const TAB_GROUPS = [
  { label: "Campaign", tabs: ["Campaign Type", "Campaign", "Ad Group", "Keyword"] },
  { label: "Audience", tabs: ["Geo", "Device", "Age/Gender"] },
  { label: "Creatives", tabs: ["Ad", "Ad Set", "Placement", "Channel"] },
  { label: "DV360", tabs: ["Insertion Order", "Line Item"] },
];

// Available metrics for chart metric selector
const AVAILABLE_METRICS = ["spend", "impressions", "clicks", "conversions", "roas", "ctr", "cpc", "cvr"];

// ============ COMPARISON DATA GENERATOR ============

/** Generate previous-period data by applying random variation to current data */
function generatePreviousData(rows: BreakdownRow[]): BreakdownRow[] {
  // Use a deterministic seed based on row names so data is stable across re-renders
  return rows.map((row) => {
    let hash = 0;
    for (let i = 0; i < row.name.length; i++) {
      hash = ((hash << 5) - hash + row.name.charCodeAt(i)) | 0;
    }
    const seed = Math.abs(hash);
    // Multiplier between 0.8 and 1.2 based on seed
    const factor = (key: string) => {
      const keyHash = key.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      return 0.8 + ((seed + keyHash) % 40) / 100;
    };

    return {
      ...row,
      impressions: Math.round(row.impressions * factor("impressions")),
      clicks: Math.round(row.clicks * factor("clicks")),
      ctr: +(row.ctr * factor("ctr")).toFixed(2),
      cpc: +(row.cpc * factor("cpc")).toFixed(2),
      cvr: +(row.cvr * factor("cvr")).toFixed(2),
      conversions: Math.round(row.conversions * factor("conversions")),
      spend: Math.round(row.spend * factor("spend")),
      revenue: Math.round(row.revenue * factor("revenue")),
      roas: +(row.roas * factor("roas")).toFixed(1),
      budget: row.budget,
    };
  });
}

// ============ MAIN COMPONENT ============

export function AnalyticsBuilder() {
  // --- Existing state ---
  const [activeTab, setActiveTab] = useState<keyof typeof MOCK_BREAKDOWN_DATA>("Campaign Type");
  const [sortKey, setSortKey] = useState<SortKey>("conversions");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // --- New state: Period ---
  const [periodDays, setPeriodDays] = useState(7);
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [compareEnabled, setCompareEnabled] = useState(false);

  // --- New state: View mode ---
  const [viewMode, setViewMode] = useState<"chart" | "table" | "both">("both");
  const [chartMetric, setChartMetric] = useState("spend");

  // --- New state: Drilldown ---
  const [drilldownEntity, setDrilldownEntity] = useState<string | null>(null);

  // --- New state: Filters ---
  const [columnFilters, setColumnFilters] = useState<Record<string, { min?: number; max?: number }>>({});
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  // --- Saved Views state ---
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadDropdown, setShowLoadDropdown] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const loadDropdownRef = useRef<HTMLDivElement>(null);

  // Load saved views from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_VIEWS_KEY);
      if (saved) setSavedViews(JSON.parse(saved));
    } catch {
      // ignore parse errors
    }
  }, []);

  // Close load dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (loadDropdownRef.current && !loadDropdownRef.current.contains(e.target as Node)) {
        setShowLoadDropdown(false);
      }
    };
    if (showLoadDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showLoadDropdown]);

  // --- Save View handler ---
  const handleSaveView = useCallback(() => {
    if (!newViewName.trim()) return;
    const view: SavedView = {
      name: newViewName.trim(),
      tab: activeTab,
      filters: { ...columnFilters },
      sortField: sortKey,
      sortDirection: sortDir,
      quickFilter,
    };
    const updated = [...savedViews.filter((v) => v.name !== view.name), view];
    setSavedViews(updated);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(updated));
    setNewViewName("");
    setShowSaveModal(false);
  }, [newViewName, activeTab, columnFilters, sortKey, sortDir, quickFilter, savedViews]);

  // --- Load View handler ---
  const handleLoadView = useCallback((view: SavedView) => {
    if (view.tab in MOCK_BREAKDOWN_DATA) {
      setActiveTab(view.tab as keyof typeof MOCK_BREAKDOWN_DATA);
    }
    setColumnFilters(view.filters || {});
    setSortKey((view.sortField || "conversions") as SortKey);
    setSortDir((view.sortDirection || "desc") as "asc" | "desc");
    setQuickFilter(view.quickFilter ?? null);
    setShowLoadDropdown(false);
  }, []);

  // --- Delete saved view ---
  const handleDeleteView = useCallback((name: string) => {
    const updated = savedViews.filter((v) => v.name !== name);
    setSavedViews(updated);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(updated));
  }, [savedViews]);

  // --- Sort handler ---
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // --- Column filter handlers ---
  const handleColumnFilterChange = (column: string, filter: { min?: number; max?: number } | null) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (filter === null) {
        delete next[column];
      } else {
        next[column] = filter;
      }
      return next;
    });
  };

  const handleClearColumnFilter = (column: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[column];
      return next;
    });
  };

  const handleQuickFilter = (type: "underperformers" | "top" | "clear") => {
    if (type === "clear") {
      setQuickFilter(null);
    } else {
      setQuickFilter((prev) => (prev === type ? null : type));
    }
  };

  // --- Raw data for active tab ---
  const rawRows = MOCK_BREAKDOWN_DATA[activeTab] || MOCK_BREAKDOWN_DATA["Campaign Type"];

  // --- Comparison data ---
  const previousData = useMemo(
    () => (compareEnabled ? generatePreviousData(rawRows) : undefined),
    [rawRows, compareEnabled]
  );

  // --- Filtered data (column filters + quick filter) ---
  const filteredData = useMemo(() => {
    let rows = [...rawRows];

    // Apply column filters (min/max per column)
    for (const [col, filter] of Object.entries(columnFilters)) {
      rows = rows.filter((row) => {
        const val = row[col as keyof BreakdownRow];
        if (typeof val !== "number") return true;
        if (filter.min != null && val < filter.min) return false;
        if (filter.max != null && val > filter.max) return false;
        return true;
      });
    }

    // Apply quick filters
    if (quickFilter === "underperformers") {
      rows = rows.filter((row) => row.roas < HEALTH_TARGETS.roasTarget);
    } else if (quickFilter === "top") {
      // Top 20% by ROAS
      const sorted = [...rows].sort((a, b) => b.roas - a.roas);
      const topCount = Math.max(1, Math.ceil(sorted.length * 0.2));
      const threshold = sorted[topCount - 1]?.roas ?? 0;
      rows = rows.filter((row) => row.roas >= threshold);
    }

    return rows;
  }, [rawRows, columnFilters, quickFilter]);

  // --- Sorted rows for table ---
  const tableRows = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey] as number;
      const bVal = b[sortKey] as number;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [filteredData, sortKey, sortDir]);

  // --- CSV Export ---
  const handleExportCSV = useCallback(() => {
    const headers = ["Name", "Impressions", "Clicks", "CTR", "CPC", "CVR", "Conversions", "Spend", "ROAS", "Budget", "Pacing"];
    const csvRows = [headers.join(",")];
    for (const row of tableRows) {
      const pacing = row.budget > 0 ? +((row.spend / row.budget) * 100).toFixed(1) : 0;
      csvRows.push([
        `"${row.name}"`,
        row.impressions,
        row.clicks,
        row.ctr,
        row.cpc,
        row.cvr,
        row.conversions,
        row.spend,
        row.roas,
        row.budget,
        pacing,
      ].join(","));
    }
    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const today = new Date().toISOString().slice(0, 10);
    a.download = `analytics_breakdown_${activeTab.replace(/\s+/g, "_").toLowerCase()}_${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [tableRows, activeTab]);

  // --- Previous data lookup map (for change badges) ---
  const previousMap = useMemo(() => {
    if (!previousData) return null;
    const map = new Map<string, BreakdownRow>();
    for (const row of previousData) {
      map.set(row.name, row);
    }
    return map;
  }, [previousData]);

  // --- Chart data for ChartTableToggle ---
  const chartData = useMemo(
    () => filteredData.map((row) => ({ ...row })),
    [filteredData]
  );

  // --- All data for DrilldownPanel (cast to expected shape) ---
  const allDataForDrilldown = useMemo(() => {
    const result: Record<string, Array<{ name: string; [key: string]: number | string }>> = {};
    for (const [tab, rows] of Object.entries(MOCK_BREAKDOWN_DATA)) {
      result[tab] = rows.map((r) => ({ ...r }));
    }
    return result;
  }, []);

  return (
    <div className="space-y-6">

      {/* ── 1. Period Selector ── */}
      <PeriodSelector
        periodDays={periodDays}
        onPeriodChange={setPeriodDays}
        showCustom
        customDateFrom={customDateFrom}
        customDateTo={customDateTo}
        onCustomDateChange={(from, to) => {
          setCustomDateFrom(from);
          setCustomDateTo(to);
        }}
        compareEnabled={compareEnabled}
        onCompareToggle={setCompareEnabled}
      />

      {/* ── 2. KPI Summary Bar ── */}
      <KPISummaryBar
        data={filteredData}
        previousData={previousData}
        currency="INR"
        showComparison={compareEnabled}
      />

      {/* ── 3. Tab Groups ── */}
      <div className="border-b border-gray-800">
        <div className="flex gap-0 overflow-x-auto">
          {TAB_GROUPS.map((group) => (
            <div key={group.label} className="flex items-center">
              {/* Group label */}
              <span className="px-2 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 select-none">
                {group.label}
              </span>
              {/* Tabs within group */}
              {group.tabs
                .filter((tab) => tab in MOCK_BREAKDOWN_DATA)
                .map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as keyof typeof MOCK_BREAKDOWN_DATA)}
                    className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab
                        ? "border-indigo-500 text-indigo-400"
                        : "border-transparent text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              {/* Separator between groups */}
              <div className="w-px h-6 bg-gray-700 mx-1 self-center" />
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Quick Filters + Export ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <QuickFilters
          onQuickFilter={handleQuickFilter}
          activeFilter={quickFilter}
          activeColumnFilters={columnFilters}
          onClearColumnFilter={handleClearColumnFilter}
        />
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 hover:text-white transition-colors shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* ── 5. Chart / Table Toggle + Saved Views ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <ChartTableToggle
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          data={chartData}
          chartMetric={chartMetric}
          onChartMetricChange={setChartMetric}
          availableMetrics={AVAILABLE_METRICS}
          currency="INR"
        />

        {/* Save / Load Views */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Save View */}
          <div className="relative">
            <button
              onClick={() => setShowSaveModal((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              Save View
            </button>
            {showSaveModal && (
              <div className="absolute right-0 top-full mt-1 z-50 w-60 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
                <label className="block text-[11px] text-gray-400 mb-1">View name</label>
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveView()}
                  placeholder="e.g. My Q4 view"
                  className="w-full px-2 py-1.5 text-xs bg-gray-900 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSaveView}
                    className="flex-1 px-2 py-1 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setShowSaveModal(false); setNewViewName(""); }}
                    className="flex-1 px-2 py-1 text-xs font-medium text-gray-400 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Load View */}
          <div className="relative" ref={loadDropdownRef}>
            <button
              onClick={() => setShowLoadDropdown((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              Load View
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {showLoadDropdown && (
              <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                {/* Default presets */}
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-700">
                  Presets
                </div>
                {DEFAULT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleLoadView(preset)}
                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    {preset.name}
                    <span className="ml-auto text-[10px] text-gray-500">{preset.tab}</span>
                  </button>
                ))}

                {/* User saved views */}
                {savedViews.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 border-t border-b border-gray-700">
                      Saved
                    </div>
                    {savedViews.map((view) => (
                      <div
                        key={view.name}
                        className="flex items-center px-3 py-2 hover:bg-gray-700 transition-colors group"
                      >
                        <button
                          onClick={() => handleLoadView(view)}
                          className="flex-1 text-left text-xs text-gray-300 hover:text-white flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          {view.name}
                          <span className="ml-auto text-[10px] text-gray-500">{view.tab}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteView(view.name); }}
                          className="ml-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete view"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {savedViews.length === 0 && (
                  <div className="px-3 py-2 text-[11px] text-gray-500 border-t border-gray-700">
                    No saved views yet. Use &quot;Save View&quot; to create one.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 6. Data Table ── */}
      {viewMode !== "chart" && (
        <ChartContainer title={`${activeTab} Breakdown`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr>
                  {/* Health dot column */}
                  <th className="px-2 py-3 text-center text-gray-500 font-medium w-8" title="Row Health">
                    <span className="sr-only">Health</span>
                  </th>
                  {/* Entity name column */}
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">{activeTab}</th>
                  {/* Metric columns with inline column filters */}
                  {headerConfigs.map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-3 py-3 text-right text-gray-500 font-medium select-none"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span
                          className="cursor-pointer hover:text-gray-300"
                          onClick={() => handleSort(key)}
                        >
                          {label}{" "}
                          {sortKey === key
                            ? sortDir === "desc"
                              ? "\u2193"
                              : "\u2191"
                            : <span className="opacity-40">{"\u2195"}</span>}
                        </span>
                        <ColumnFilter
                          columnName={label}
                          currentFilter={columnFilters[key] ?? null}
                          onFilterChange={(filter) => handleColumnFilterChange(key, filter)}
                        />
                      </div>
                    </th>
                  ))}
                  {/* Pacing column */}
                  <th className="px-3 py-3 text-center text-gray-500 font-medium">Pacing</th>
                  {/* Diagnosis column */}
                  <th className="px-3 py-3 text-left text-gray-500 font-medium">Diagnosis</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => {
                  const prev = previousMap?.get(row.name);
                  return (
                    <tr
                      key={i}
                      onClick={() => setDrilldownEntity(row.name)}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      {/* Health dot */}
                      <td className="px-2 py-2 text-center">
                        <RowHealthDot
                          roas={row.roas}
                          ctr={row.ctr}
                          cvr={row.cvr}
                          cpc={row.cpc}
                          targets={HEALTH_TARGETS}
                        />
                      </td>
                      {/* Entity name */}
                      <td className="px-4 py-2 text-gray-200 font-medium">{row.name}</td>
                      {/* Metric cells with conditional coloring */}
                      {headerConfigs.map(({ key, format, invertColor }) => {
                        const thresholds = METRIC_THRESHOLDS[key];
                        return (
                          <ConditionalCell
                            key={key}
                            value={row[key]}
                            format={format}
                            currency="INR"
                            greenThreshold={thresholds?.green}
                            redThreshold={thresholds?.red}
                            invertColor={invertColor}
                            previousValue={prev ? prev[key] : undefined}
                            showChange={compareEnabled}
                          />
                        );
                      })}
                      {/* Pacing bar */}
                      <td className="px-3 py-2">
                        <PacingBar
                          spent={row.spend}
                          budget={row.budget}
                          currency="INR"
                        />
                      </td>
                      {/* Diagnosis tag */}
                      <td className="px-3 py-2">
                        <DiagnosisTag
                          metrics={{
                            cpc: row.cpc,
                            ctr: row.ctr / 100, // convert from display % to decimal
                            cvr: row.cvr / 100, // convert from display % to decimal
                            roas: row.roas,
                            spend: row.spend,
                            budget: row.budget,
                          }}
                          targets={{
                            cpcTarget: HEALTH_TARGETS.cpcTarget,
                            ctrTarget: HEALTH_TARGETS.ctrTarget,
                            cvrTarget: HEALTH_TARGETS.cvrTarget,
                            roasTarget: HEALTH_TARGETS.roasTarget,
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartContainer>
      )}

      {/* ── 7. Drilldown Panel ── */}
      <DrilldownPanel
        isOpen={!!drilldownEntity}
        onClose={() => setDrilldownEntity(null)}
        entityName={drilldownEntity || ""}
        entityTab={activeTab}
        allData={allDataForDrilldown}
        currency="INR"
      />
    </div>
  );
}
